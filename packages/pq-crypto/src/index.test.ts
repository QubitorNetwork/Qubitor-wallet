import {
  deriveMLDSA65PublicKey,
  decryptStringWithPasscode,
  encryptStringWithPasscode,
  generateMLDSA65KeyPair,
  hexToBytes,
  ML_DSA_65_PUBLIC_KEY_BYTES,
  ML_DSA_65_SECRET_KEY_BYTES,
  ML_DSA_65_SIGNATURE_BYTES,
  signMLDSA65,
  verifyMLDSA65,
} from "./index.js";

function assertEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
}

async function assertRejects(action: () => Promise<unknown>) {
  let rejected = false;
  try {
    await action();
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("expected promise to reject");
}

const seed = new Uint8Array(32).fill(11);
const keypair = generateMLDSA65KeyPair(seed);
const message = "0x71756269746f722d70612d61757468" as const;
const signature = signMLDSA65(message, keypair.privateKey);

assertEqual(hexToBytes(keypair.publicKey).length, ML_DSA_65_PUBLIC_KEY_BYTES);
assertEqual(hexToBytes(keypair.privateKey).length, ML_DSA_65_SECRET_KEY_BYTES);
assertEqual(hexToBytes(signature).length, ML_DSA_65_SIGNATURE_BYTES);
assertEqual(deriveMLDSA65PublicKey(keypair.privateKey), keypair.publicKey);
assertEqual(verifyMLDSA65(signature, message, keypair.publicKey), true);
assertEqual(verifyMLDSA65(signature, "0x00", keypair.publicKey), false);
assertEqual(ML_DSA_65_PUBLIC_KEY_BYTES, 1952);
assertEqual(ML_DSA_65_SIGNATURE_BYTES, 3309);

const encrypted = await encryptStringWithPasscode(
  JSON.stringify({ account: "0x71a9", keyVersion: 2 }),
  "correct horse battery staple",
  {
    salt: new Uint8Array(16).fill(1),
    nonce: new Uint8Array(12).fill(2),
    aad: "qubitor-devnet-backup",
    kdf: { N: 2 ** 10, r: 8, p: 1, dkLen: 32 },
  },
);
const decrypted = await decryptStringWithPasscode(encrypted, "correct horse battery staple", {
  aad: "qubitor-devnet-backup",
});
assertEqual(decrypted, JSON.stringify({ account: "0x71a9", keyVersion: 2 }));
assertEqual(encrypted.algorithm, "AES-256-GCM");
assertEqual(encrypted.kdf.name, "scrypt");
assertEqual(hexToBytes(encrypted.kdf.salt).length, 16);
assertEqual(hexToBytes(encrypted.nonce).length, 12);
await assertRejects(() => decryptStringWithPasscode(encrypted, "wrong passcode", { aad: "qubitor-devnet-backup" }));
await assertRejects(() => decryptStringWithPasscode(encrypted, "correct horse battery staple", { aad: "wrong-aad" }));

console.log("@qubitor/pq-crypto tests passed");
