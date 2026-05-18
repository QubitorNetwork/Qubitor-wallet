import {
  decryptStringWithPasscode,
  encryptStringWithPasscode,
  generateMLDSA65KeyPair,
  ML_DSA_65_PUBLIC_KEY_BYTES,
  ML_DSA_65_SECRET_KEY_BYTES,
  ML_DSA_65_SIGNATURE_BYTES,
  signMLDSA65,
  verifyMLDSA65,
  type Hex,
} from "./index.js";

declare const process: {
  argv: string[];
  stderr: { write(message: string): void };
  exit(code?: number): never;
  stdin: {
    setEncoding(encoding: string): void;
    on(event: "data", callback: (chunk: string) => void): void;
    on(event: "end", callback: () => void): void;
  };
};
declare const globalThis: {
  crypto?: {
    getRandomValues<T extends Uint8Array>(array: T): T;
  };
};

const BACKUP_FORMAT = "qubitor.devnet.pq-wallet-backup.encrypted.v1";
const BACKUP_CHAIN_ID = 91337;

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requireArg(name: string): string {
  const value = argValue(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function command() {
  return process.argv[2];
}

function printJson(value: unknown) {
  console.log(JSON.stringify(value));
}

function randomBytes(length: number) {
  const out = new Uint8Array(length);
  if (!globalThis.crypto?.getRandomValues) throw new Error("Web Crypto random source is unavailable");
  globalThis.crypto.getRandomValues(out);
  return out;
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
    });
    process.stdin.on("end", () => {
      resolve(input);
    });
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function backupAad() {
  return `${BACKUP_FORMAT}:${BACKUP_CHAIN_ID}:pq-wallet-profile`;
}

function backupPreview(profile: Record<string, unknown>) {
  return {
    encrypted: true,
    format: BACKUP_FORMAT,
    chainId: BACKUP_CHAIN_ID,
    accountAddress: profile.accountAddress,
    deploymentPublicKey: profile.deploymentPublicKey,
    currentPublicKeyCommitment: profile.currentPublicKeyCommitment,
    keyVersion: profile.keyVersion,
    lastRotationAt: profile.lastRotationAt,
  };
}

async function main() {
  switch (command()) {
    case "info":
      printJson({
        algorithm: "ML-DSA-65",
        publicKeyBytes: ML_DSA_65_PUBLIC_KEY_BYTES,
        privateKeyBytes: ML_DSA_65_SECRET_KEY_BYTES,
        signatureBytes: ML_DSA_65_SIGNATURE_BYTES,
      });
      break;
    case "keygen":
      printJson(generateMLDSA65KeyPair(argValue("--seed") as Hex | undefined));
      break;
    case "sign":
      console.log(signMLDSA65(requireArg("--message") as Hex, requireArg("--private-key") as Hex));
      break;
    case "verify":
      console.log(
        verifyMLDSA65(
          requireArg("--signature") as Hex,
          requireArg("--message") as Hex,
          requireArg("--public-key") as Hex,
        ),
      );
      break;
    case "backup-encrypt": {
      const passcode = requireArg("--passcode");
      const profileJson = (await readStdin()).trim();
      const profile = JSON.parse(profileJson) as Record<string, unknown>;
      const encrypted = await encryptStringWithPasscode(profileJson, passcode, {
        salt: randomBytes(16),
        nonce: randomBytes(12),
        aad: backupAad(),
      });
      printJson({
        format: BACKUP_FORMAT,
        chainId: BACKUP_CHAIN_ID,
        exportedAt: new Date().toISOString(),
        warning: "PASSCODE-ENCRYPTED DEVNET BACKUP. The passcode cannot be recovered if forgotten.",
        preview: backupPreview(profile),
        encryption: encrypted,
      });
      break;
    }
    case "backup-decrypt": {
      const passcode = requireArg("--passcode");
      const backup = JSON.parse((await readStdin()).trim()) as unknown;
      if (!isRecord(backup) || backup.format !== BACKUP_FORMAT || backup.chainId !== BACKUP_CHAIN_ID) {
        throw new Error("unsupported encrypted backup");
      }
      const profileJson = await decryptStringWithPasscode(
        backup.encryption as Parameters<typeof decryptStringWithPasscode>[0],
        passcode,
        { aad: backupAad() },
      );
      const profile = JSON.parse(profileJson) as { currentKey?: { privateKey?: Hex; publicKey?: Hex } };
      if (!profile.currentKey?.privateKey) throw new Error("backup profile missing current private key");
      const signature = signMLDSA65("0x71756269746f722d6465766e65742d726573746f72652d636865636b", profile.currentKey.privateKey);
      if (!profile.currentKey.publicKey || !verifyMLDSA65(signature, "0x71756269746f722d6465766e65742d726573746f72652d636865636b", profile.currentKey.publicKey)) {
        throw new Error("restored key failed ML-DSA validation");
      }
      console.log(JSON.stringify(profile));
      break;
    }
    default:
      throw new Error("usage: pq-crypto <info|keygen|sign|verify|backup-encrypt|backup-decrypt>");
  }
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : "pq-crypto command failed"}\n`);
  process.exit(1);
}
