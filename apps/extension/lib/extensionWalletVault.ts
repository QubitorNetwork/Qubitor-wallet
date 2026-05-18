import { keccak256, type Hex } from "viem";
import {
  decryptStringWithPasscode,
  encryptStringWithPasscode,
  verifyMLDSA65,
  type PasscodeEncryptedPayload,
} from "@qubitor/pq-crypto";
import {
  generateMLDSA65KeyPair,
  QUBITOR_TESTNET_CHAIN_ID,
  QUBITOR_ZERO_HASH,
  readQubitorDevPQAccount,
  signQubitorPQAccountAuthorization,
  type MLDSA65KeyPair,
  type QubitorDevPQAccount,
} from "@qubitor/evm";

export const EXTENSION_WALLET_STORAGE_KEY = "qubitor.extension.pq-wallet.encrypted.v1";
const EXTENSION_WALLET_HISTORY_KEY = "qubitor.extension.activity.v1";
const EXTENSION_BACKUP_FORMAT = "qubitor.extension.pq-wallet-backup.encrypted.v1";
const RESTORE_VALIDATION_MESSAGE = "0x71756269746f722d657874656e73696f6e2d726573746f72652d636865636b" as const;

export interface ExtensionPQWalletProfile {
  version: 1;
  chainId: number;
  currentKey: MLDSA65KeyPair;
  deploymentKey: MLDSA65KeyPair;
  deploymentPublicKey: Hex;
  deploymentSalt: Hex;
  accountAddress?: Hex;
  currentPublicKeyCommitment?: Hex;
  keyVersion: number;
  lastRotationAt?: string;
  lastRotationTransactionHash?: Hex;
}

export interface ExtensionPQWalletPreview {
  chainId: number;
  accountAddress?: Hex;
  deploymentPublicKey: Hex;
  currentPublicKeyCommitment?: Hex;
  keyVersion: number;
  lastRotationAt?: string;
  updatedAt: string;
}

export interface ExtensionEncryptedWalletRecord {
  format: typeof EXTENSION_BACKUP_FORMAT;
  createdAt: string;
  updatedAt: string;
  warning: string;
  preview: ExtensionPQWalletPreview;
  encryption: PasscodeEncryptedPayload;
}

export interface ExtensionActivityItem {
  id: string;
  type: "receive" | "send" | "security";
  title: string;
  detail: string;
  hash?: Hex;
  status: "pending" | "success" | "failed";
  occurredAt: string;
}

function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function storageGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (items) => resolve(items[key] as T | undefined));
  });
}

function storageSet(key: string, value: unknown): Promise<void> {
  return chrome.storage.local.set({ [key]: value });
}

function storageDelete(key: string): Promise<void> {
  return chrome.storage.local.remove(key);
}

function backupAad(chainId: number) {
  return `${EXTENSION_BACKUP_FORMAT}:${chainId}:pq-extension-wallet`;
}

function previewFromProfile(profile: ExtensionPQWalletProfile): ExtensionPQWalletPreview {
  return {
    chainId: profile.chainId,
    accountAddress: profile.accountAddress,
    deploymentPublicKey: profile.deploymentPublicKey,
    currentPublicKeyCommitment: profile.currentPublicKeyCommitment,
    keyVersion: profile.keyVersion,
    lastRotationAt: profile.lastRotationAt,
    updatedAt: new Date().toISOString(),
  };
}

async function encryptedRecordFromProfile(
  profile: ExtensionPQWalletProfile,
  passcode: string,
  existing?: ExtensionEncryptedWalletRecord,
): Promise<ExtensionEncryptedWalletRecord> {
  const now = new Date().toISOString();
  return {
    format: EXTENSION_BACKUP_FORMAT,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    warning: "PASSCODE-ENCRYPTED QUANTA WALLET BACKUP. The passcode cannot be recovered if forgotten.",
    preview: previewFromProfile(profile),
    encryption: await encryptStringWithPasscode(JSON.stringify(profile), passcode, {
      salt: randomBytes(16),
      nonce: randomBytes(12),
      aad: backupAad(profile.chainId),
    }),
  };
}

function normalizeProfile(value: unknown): ExtensionPQWalletProfile {
  const profile = value as Partial<ExtensionPQWalletProfile>;
  if (!profile.currentKey?.privateKey || !profile.currentKey.publicKey) {
    throw new Error("Recovery Kit is missing the active ML-DSA key.");
  }
  if (!profile.deploymentKey?.privateKey || !profile.deploymentKey.publicKey) {
    throw new Error("Recovery Kit is missing the deployment ML-DSA key.");
  }
  const signature = signQubitorPQAccountAuthorization(RESTORE_VALIDATION_MESSAGE, profile.currentKey.privateKey);
  if (!verifyMLDSA65(signature, RESTORE_VALIDATION_MESSAGE, profile.currentKey.publicKey)) {
    throw new Error("ML-DSA key verification failed.");
  }
  return {
    version: 1,
    chainId: profile.chainId ?? QUBITOR_TESTNET_CHAIN_ID,
    currentKey: profile.currentKey,
    deploymentKey: profile.deploymentKey,
    deploymentPublicKey: profile.deploymentPublicKey ?? profile.deploymentKey.publicKey,
    deploymentSalt: profile.deploymentSalt ?? QUBITOR_ZERO_HASH,
    accountAddress: profile.accountAddress,
    currentPublicKeyCommitment: profile.currentPublicKeyCommitment,
    keyVersion: profile.keyVersion && profile.keyVersion > 0 ? profile.keyVersion : 1,
    lastRotationAt: profile.lastRotationAt,
    lastRotationTransactionHash: profile.lastRotationTransactionHash,
  };
}

export async function getStoredExtensionWalletRecord(): Promise<ExtensionEncryptedWalletRecord | undefined> {
  return storageGet<ExtensionEncryptedWalletRecord>(EXTENSION_WALLET_STORAGE_KEY);
}

export async function getStoredExtensionWalletPreview(): Promise<ExtensionPQWalletPreview | undefined> {
  return (await getStoredExtensionWalletRecord())?.preview;
}

export async function createExtensionWalletProfile(passcode: string): Promise<ExtensionPQWalletProfile> {
  if (passcode.length < 8) throw new Error("Use at least 8 characters for the wallet passcode.");
  const key = generateMLDSA65KeyPair(randomBytes(32));
  const profile: ExtensionPQWalletProfile = {
    version: 1,
    chainId: QUBITOR_TESTNET_CHAIN_ID,
    currentKey: key,
    deploymentKey: key,
    deploymentPublicKey: key.publicKey,
    deploymentSalt: QUBITOR_ZERO_HASH,
    currentPublicKeyCommitment: keccak256(key.publicKey),
    keyVersion: 1,
  };
  await saveExtensionWalletProfile(profile, passcode);
  return profile;
}

export async function unlockExtensionWalletProfile(passcode: string): Promise<ExtensionPQWalletProfile> {
  const record = await getStoredExtensionWalletRecord();
  if (!record) throw new Error("No Quanta Wallet profile exists yet.");
  const plaintext = await decryptStringWithPasscode(record.encryption, passcode, {
    aad: backupAad(record.preview.chainId),
  });
  return normalizeProfile(JSON.parse(plaintext));
}

export async function saveExtensionWalletProfile(
  profile: ExtensionPQWalletProfile,
  passcode: string,
): Promise<ExtensionEncryptedWalletRecord> {
  if (passcode.length < 8) throw new Error("Use at least 8 characters for the wallet passcode.");
  const existing = await getStoredExtensionWalletRecord();
  const record = await encryptedRecordFromProfile(normalizeProfile(profile), passcode, existing);
  await storageSet(EXTENSION_WALLET_STORAGE_KEY, record);
  return record;
}

export async function exportExtensionRecoveryKit(): Promise<string> {
  const record = await getStoredExtensionWalletRecord();
  if (!record) throw new Error("No Recovery Kit is available yet.");
  return JSON.stringify(record, null, 2);
}

export async function restoreExtensionWalletProfile(encoded: string, passcode: string): Promise<ExtensionPQWalletProfile> {
  const record = JSON.parse(encoded) as ExtensionEncryptedWalletRecord;
  if (record.format !== EXTENSION_BACKUP_FORMAT) throw new Error("Unsupported Recovery Kit format.");
  const plaintext = await decryptStringWithPasscode(record.encryption, passcode, {
    aad: backupAad(record.preview.chainId),
  });
  const profile = normalizeProfile(JSON.parse(plaintext));
  await storageSet(EXTENSION_WALLET_STORAGE_KEY, await encryptedRecordFromProfile(profile, passcode, record));
  return profile;
}

export async function wipeExtensionWallet(): Promise<void> {
  await Promise.all([storageDelete(EXTENSION_WALLET_STORAGE_KEY), storageDelete(EXTENSION_WALLET_HISTORY_KEY)]);
}

export async function rememberExtensionAccount(
  profile: ExtensionPQWalletProfile,
  account: QubitorDevPQAccount,
  passcode: string,
): Promise<ExtensionPQWalletProfile> {
  const next = normalizeProfile({
    ...profile,
    chainId: account.chainId,
    accountAddress: account.accountAddress,
    deploymentSalt: account.salt,
    currentPublicKeyCommitment: profile.currentPublicKeyCommitment ?? account.publicKeyCommitment,
  });
  await saveExtensionWalletProfile(next, passcode);
  return next;
}

export async function readExtensionPQAccount(profile: ExtensionPQWalletProfile): Promise<QubitorDevPQAccount> {
  return readQubitorDevPQAccount({
    publicKey: profile.deploymentPublicKey,
    salt: profile.deploymentSalt,
  }, { chainId: profile.chainId });
}

export async function readExtensionActivity(): Promise<ExtensionActivityItem[]> {
  return (await storageGet<ExtensionActivityItem[]>(EXTENSION_WALLET_HISTORY_KEY)) ?? [];
}

export async function recordExtensionActivity(item: Omit<ExtensionActivityItem, "id" | "occurredAt">): Promise<void> {
  const occurredAt = new Date().toISOString();
  const current = await readExtensionActivity();
  const next: ExtensionActivityItem = {
    ...item,
    id: item.hash ?? `${item.type}-${occurredAt}`,
    occurredAt,
  };
  await storageSet(EXTENSION_WALLET_HISTORY_KEY, [next, ...current].slice(0, 40));
}
