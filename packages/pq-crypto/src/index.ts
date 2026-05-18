import { gcm } from "@noble/ciphers/aes.js";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";

export type Hex = `0x${string}`;

export const QUBITOR_ML_DSA_CONTEXT = "QUBITOR_ACCOUNT_V1";
export const ML_DSA_65_PUBLIC_KEY_BYTES = ml_dsa65.lengths.publicKey;
export const ML_DSA_65_SECRET_KEY_BYTES = ml_dsa65.lengths.secretKey;
export const ML_DSA_65_SIGNATURE_BYTES = ml_dsa65.lengths.signature;

export interface MLDSA65KeyPair {
  publicKey: Hex;
  privateKey: Hex;
}

export interface MLDSA65SignOptions {
  context?: string | Uint8Array;
  deterministic?: boolean;
}

export interface MLDSA65VerifyOptions {
  context?: string | Uint8Array;
}

export interface PasscodeScryptParams {
  name: "scrypt";
  N: number;
  r: number;
  p: number;
  dkLen: 32;
  salt: Hex;
}

export interface PasscodeEncryptedPayload {
  algorithm: "AES-256-GCM";
  kdf: PasscodeScryptParams;
  nonce: Hex;
  ciphertext: Hex;
}

export interface PasscodeEncryptionOptions {
  salt: Hex | Uint8Array;
  nonce: Hex | Uint8Array;
  aad?: string | Uint8Array;
  kdf?: Omit<PasscodeScryptParams, "name" | "salt">;
}

export interface PasscodeDecryptionOptions {
  aad?: string | Uint8Array;
}

export const DEFAULT_PASSCODE_SCRYPT_PARAMS = {
  N: 2 ** 15,
  r: 8,
  p: 1,
  dkLen: 32,
} as const;

function assertByteLength(value: Uint8Array, expected: number | undefined, label: string) {
  if (expected !== undefined && value.length !== expected) {
    throw new Error(`${label} must be ${expected} bytes, got ${value.length}`);
  }
}

function asciiBytes(value: string): Uint8Array {
  const out = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 0x7f) throw new Error("ML-DSA context must be ASCII");
    out[i] = code;
  }
  return out;
}

function contextBytes(context: string | Uint8Array = QUBITOR_ML_DSA_CONTEXT): Uint8Array {
  return typeof context === "string" ? asciiBytes(context) : context;
}

function utf8Bytes(value: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < value.length; i++) {
    let code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++i);
      if (next < 0xdc00 || next > 0xdfff) throw new Error("Invalid UTF-16 surrogate pair.");
      code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
    }

    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}

function utf8String(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; ) {
    const first = bytes[i++]!;
    let code = first;
    if (first >= 0xc0 && first < 0xe0) {
      code = ((first & 0x1f) << 6) | (bytes[i++]! & 0x3f);
    } else if (first >= 0xe0 && first < 0xf0) {
      code = ((first & 0x0f) << 12) | ((bytes[i++]! & 0x3f) << 6) | (bytes[i++]! & 0x3f);
    } else if (first >= 0xf0) {
      code =
        ((first & 0x07) << 18) |
        ((bytes[i++]! & 0x3f) << 12) |
        ((bytes[i++]! & 0x3f) << 6) |
        (bytes[i++]! & 0x3f);
    }

    if (code <= 0xffff) {
      out += String.fromCharCode(code);
    } else {
      code -= 0x10000;
      out += String.fromCharCode(0xd800 + (code >> 10), 0xdc00 + (code & 0x3ff));
    }
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): Hex {
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function hexToBytes(hex: Hex, label = "hex"): Uint8Array {
  if (!hex.startsWith("0x")) throw new Error(`${label} must start with 0x`);
  const value = hex.slice(2);
  if (value.length % 2 !== 0) throw new Error(`${label} must have an even number of hex characters`);
  if (!/^[0-9a-fA-F]*$/.test(value)) throw new Error(`${label} contains non-hex characters`);

  const out = new Uint8Array(value.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function messageBytes(message: Hex | Uint8Array): Uint8Array {
  return typeof message === "string" ? hexToBytes(message, "message") : message;
}

function byteInput(value: Hex | Uint8Array, label: string): Uint8Array {
  return typeof value === "string" ? hexToBytes(value, label) : value;
}

function aadBytes(aad?: string | Uint8Array): Uint8Array | undefined {
  if (aad === undefined) return undefined;
  return typeof aad === "string" ? utf8Bytes(aad) : aad;
}

function assertPasscode(passcode: string) {
  if (passcode.length < 8) {
    throw new Error("Backup passcode must be at least 8 characters.");
  }
}

async function derivePasscodeKey(passcode: string, kdf: PasscodeScryptParams): Promise<Uint8Array> {
  assertPasscode(passcode);
  return scryptAsync(utf8Bytes(passcode), hexToBytes(kdf.salt, "salt"), {
    N: kdf.N,
    r: kdf.r,
    p: kdf.p,
    dkLen: kdf.dkLen,
  });
}

export async function encryptStringWithPasscode(
  plaintext: string,
  passcode: string,
  options: PasscodeEncryptionOptions,
): Promise<PasscodeEncryptedPayload> {
  const salt = byteInput(options.salt, "salt");
  const nonce = byteInput(options.nonce, "nonce");
  assertByteLength(salt, 16, "salt");
  assertByteLength(nonce, 12, "nonce");

  const kdf: PasscodeScryptParams = {
    name: "scrypt",
    salt: bytesToHex(salt),
    ...(options.kdf ?? DEFAULT_PASSCODE_SCRYPT_PARAMS),
  };
  const key = await derivePasscodeKey(passcode, kdf);
  const ciphertext = gcm(key, nonce, aadBytes(options.aad)).encrypt(utf8Bytes(plaintext));

  return {
    algorithm: "AES-256-GCM",
    kdf,
    nonce: bytesToHex(nonce),
    ciphertext: bytesToHex(ciphertext),
  };
}

export async function decryptStringWithPasscode(
  payload: PasscodeEncryptedPayload,
  passcode: string,
  options: PasscodeDecryptionOptions = {},
): Promise<string> {
  if (payload.algorithm !== "AES-256-GCM") throw new Error("Unsupported backup cipher.");
  if (payload.kdf.name !== "scrypt") throw new Error("Unsupported backup KDF.");

  const key = await derivePasscodeKey(passcode, payload.kdf);
  const plaintext = gcm(key, hexToBytes(payload.nonce, "nonce"), aadBytes(options.aad)).decrypt(
    hexToBytes(payload.ciphertext, "ciphertext"),
  );
  return utf8String(plaintext);
}

export function generateMLDSA65KeyPair(seed?: Uint8Array | Hex): MLDSA65KeyPair {
  const seedBytes = typeof seed === "string" ? hexToBytes(seed, "seed") : seed;
  if (seedBytes) assertByteLength(seedBytes, ml_dsa65.lengths.seed, "seed");

  const keypair = ml_dsa65.keygen(seedBytes);
  return {
    publicKey: bytesToHex(keypair.publicKey),
    privateKey: bytesToHex(keypair.secretKey),
  };
}

export function deriveMLDSA65PublicKey(privateKey: Hex | Uint8Array): Hex {
  const secretKey = typeof privateKey === "string" ? hexToBytes(privateKey, "privateKey") : privateKey;
  assertByteLength(secretKey, ML_DSA_65_SECRET_KEY_BYTES, "privateKey");
  return bytesToHex(ml_dsa65.getPublicKey(secretKey));
}

export function signMLDSA65(
  message: Hex | Uint8Array,
  privateKey: Hex | Uint8Array,
  options: MLDSA65SignOptions = {},
): Hex {
  const secretKey = typeof privateKey === "string" ? hexToBytes(privateKey, "privateKey") : privateKey;
  assertByteLength(secretKey, ML_DSA_65_SECRET_KEY_BYTES, "privateKey");

  const signature = ml_dsa65.sign(messageBytes(message), secretKey, {
    context: contextBytes(options.context),
    extraEntropy: options.deterministic === false ? undefined : false,
  });
  return bytesToHex(signature);
}

export function verifyMLDSA65(
  signature: Hex | Uint8Array,
  message: Hex | Uint8Array,
  publicKey: Hex | Uint8Array,
  options: MLDSA65VerifyOptions = {},
): boolean {
  const signatureBytes = typeof signature === "string" ? hexToBytes(signature, "signature") : signature;
  const publicKeyBytes = typeof publicKey === "string" ? hexToBytes(publicKey, "publicKey") : publicKey;
  assertByteLength(signatureBytes, ML_DSA_65_SIGNATURE_BYTES, "signature");
  assertByteLength(publicKeyBytes, ML_DSA_65_PUBLIC_KEY_BYTES, "publicKey");

  return ml_dsa65.verify(signatureBytes, messageBytes(message), publicKeyBytes, {
    context: contextBytes(options.context),
  });
}
