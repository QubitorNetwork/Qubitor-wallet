import * as Crypto from "expo-crypto";
import { getKeyVault } from "@qubitor/keystore";
import { generateMLDSA65KeyPair, signQubitorPQAccountAuthorization, type MLDSA65KeyPair } from "@qubitor/evm";
import {
  deriveMLDSA65PublicKey,
  decryptStringWithPasscode,
  encryptStringWithPasscode,
  type Hex,
  type PasscodeEncryptedPayload,
  verifyMLDSA65,
} from "@qubitor/pq-crypto";

const LEGACY_DEV_PQ_KEY_STORAGE_KEY = "qubitor.devnet.mldsa65.key.v1";
const WALLET_PQ_KEY_STORAGE_PREFIX = "quanta.wallet.mldsa65.profile.v2";
const DEV_PQ_BACKUP_FORMAT = "quanta.wallet.pq-wallet-backup.v1";
const DEV_PQ_ENCRYPTED_BACKUP_FORMAT = "quanta.wallet.pq-wallet-backup.encrypted.v1";
const LEGACY_DEV_PQ_BACKUP_FORMAT = "qubitor.devnet.pq-wallet-backup.v1";
const LEGACY_DEV_PQ_ENCRYPTED_BACKUP_FORMAT = "qubitor.devnet.pq-wallet-backup.encrypted.v1";
const DEV_PQ_RESTORE_VALIDATION_MESSAGE = "0x71756269746f722d6465766e65742d726573746f72652d636865636b";
const QUBITOR_DEVNET_CHAIN_ID = 91337;
const QUBITOR_TESTNET_CHAIN_ID = 91338;
const SUPPORTED_QUBITOR_CHAIN_IDS = [QUBITOR_DEVNET_CHAIN_ID, QUBITOR_TESTNET_CHAIN_ID] as const;

export interface QubitorDevPQWalletProfile {
  version: 2;
  chainId?: number;
  currentKey: MLDSA65KeyPair;
  deploymentKey?: MLDSA65KeyPair;
  deploymentPublicKey: Hex;
  deploymentSalt?: Hex;
  accountAddress?: Hex;
  currentPublicKeyCommitment?: Hex;
  keyVersion: number;
  lastRotationAt?: string;
  lastRotationTransactionHash?: Hex;
}

export interface QubitorDevPQWalletBackup {
  format: typeof DEV_PQ_BACKUP_FORMAT;
  chainId: number;
  exportedAt: string;
  warning: string;
  profile: QubitorDevPQWalletProfile;
}

export interface QubitorDevPQWalletEncryptedBackup {
  format: typeof DEV_PQ_ENCRYPTED_BACKUP_FORMAT;
  chainId: number;
  exportedAt: string;
  warning: string;
  preview: QubitorDevPQWalletBackupPreview;
  encryption: PasscodeEncryptedPayload;
}

export interface QubitorDevPQWalletBackupPreview {
  encrypted: boolean;
  format: string;
  chainId: number;
  accountAddress?: Hex;
  deploymentPublicKey: Hex;
  currentPublicKeyCommitment?: Hex;
  keyVersion: number;
  lastRotationAt?: string;
}

interface StoredProfileV2 extends Partial<Omit<QubitorDevPQWalletProfile, "version" | "currentKey">> {
  version?: number;
  currentKey?: Partial<MLDSA65KeyPair>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeChainId(chainId = QUBITOR_DEVNET_CHAIN_ID): number {
  return SUPPORTED_QUBITOR_CHAIN_IDS.includes(chainId as (typeof SUPPORTED_QUBITOR_CHAIN_IDS)[number])
    ? chainId
    : QUBITOR_DEVNET_CHAIN_ID;
}

function storageKey(chainId = QUBITOR_DEVNET_CHAIN_ID) {
  return `${WALLET_PQ_KEY_STORAGE_PREFIX}.${normalizeChainId(chainId)}`;
}


function parseKey(value: Partial<MLDSA65KeyPair> | undefined): MLDSA65KeyPair | undefined {
  if (!value?.privateKey?.startsWith("0x")) return undefined;
  const derivedPublicKey = deriveMLDSA65PublicKey(value.privateKey as Hex);
  if (value.publicKey?.startsWith("0x") && value.publicKey.toLowerCase() !== derivedPublicKey.toLowerCase()) {
    throw new Error("Stored PQ public key does not match the private key.");
  }
  return {
    publicKey: derivedPublicKey,
    privateKey: value.privateKey as Hex,
  };
}

function normalizeProfile(
  value: StoredProfileV2,
  currentKey: MLDSA65KeyPair,
  chainId = QUBITOR_DEVNET_CHAIN_ID,
): QubitorDevPQWalletProfile {
  const parsedDeploymentKey = parseKey(value.deploymentKey);
  const deploymentPublicKey = value.deploymentPublicKey?.startsWith("0x")
    ? (value.deploymentPublicKey as Hex)
    : parsedDeploymentKey?.publicKey ?? currentKey.publicKey;
  const deploymentKey =
    parsedDeploymentKey ??
    (deploymentPublicKey.toLowerCase() === currentKey.publicKey.toLowerCase() ? currentKey : undefined);
  if (deploymentKey && deploymentKey.publicKey.toLowerCase() !== deploymentPublicKey.toLowerCase()) {
    throw new Error("Stored deployment key does not match the deployment public key.");
  }

  return {
    version: 2,
    chainId: normalizeChainId(value.chainId ?? chainId),
    currentKey,
    deploymentKey,
    deploymentPublicKey,
    deploymentSalt: value.deploymentSalt?.startsWith("0x") ? (value.deploymentSalt as Hex) : undefined,
    accountAddress: value.accountAddress?.startsWith("0x") ? (value.accountAddress as Hex) : undefined,
    currentPublicKeyCommitment: value.currentPublicKeyCommitment?.startsWith("0x")
      ? (value.currentPublicKeyCommitment as Hex)
      : undefined,
    keyVersion: typeof value.keyVersion === "number" && value.keyVersion > 0 ? value.keyVersion : 1,
    lastRotationAt: typeof value.lastRotationAt === "string" ? value.lastRotationAt : undefined,
    lastRotationTransactionHash: value.lastRotationTransactionHash?.startsWith("0x")
      ? (value.lastRotationTransactionHash as Hex)
      : undefined,
  };
}

function parseStoredProfile(value: string | null, chainId = QUBITOR_DEVNET_CHAIN_ID): QubitorDevPQWalletProfile | undefined {
  if (!value) return undefined;
  const parsed = JSON.parse(value) as StoredProfileV2 & Partial<MLDSA65KeyPair>;
  const currentKey = parseKey(parsed.currentKey) ?? parseKey(parsed);
  return currentKey ? normalizeProfile(parsed, currentKey, chainId) : undefined;
}

function parseProfileObject(value: unknown, chainId = QUBITOR_DEVNET_CHAIN_ID): QubitorDevPQWalletProfile {
  if (!isRecord(value)) throw new Error("Backup profile is missing or invalid.");
  const parsed = value as StoredProfileV2 & Partial<MLDSA65KeyPair>;
  const currentKey = parseKey(parsed.currentKey) ?? parseKey(parsed);
  if (!currentKey) throw new Error("Backup does not contain a valid ML-DSA private key.");
  const signature = signQubitorPQAccountAuthorization(DEV_PQ_RESTORE_VALIDATION_MESSAGE, currentKey.privateKey);
  if (!verifyMLDSA65(signature, DEV_PQ_RESTORE_VALIDATION_MESSAGE, currentKey.publicKey)) {
    throw new Error("Backup ML-DSA key could not sign a validation message.");
  }
  return normalizeProfile(parsed, currentKey, chainId);
}

function previewFromProfile(
  profile: QubitorDevPQWalletProfile,
  format: string,
  encrypted: boolean,
): QubitorDevPQWalletBackupPreview {
  return {
    encrypted,
    format,
    chainId: normalizeChainId(profile.chainId),
    accountAddress: profile.accountAddress,
    deploymentPublicKey: profile.deploymentPublicKey,
    currentPublicKeyCommitment: profile.currentPublicKeyCommitment,
    keyVersion: profile.keyVersion,
    lastRotationAt: profile.lastRotationAt,
  };
}

function encryptedBackupAad(chainId = QUBITOR_DEVNET_CHAIN_ID, format = DEV_PQ_ENCRYPTED_BACKUP_FORMAT) {
  return `${format}:${normalizeChainId(chainId)}:pq-wallet-profile`;
}

function parsePlainBackupRecord(parsed: Record<string, unknown>, expectedChainId = QUBITOR_DEVNET_CHAIN_ID): QubitorDevPQWalletProfile {
  if (!isRecord(parsed)) throw new Error("Backup JSON must be an object.");
  if ("format" in parsed) {
    if (parsed.format !== DEV_PQ_BACKUP_FORMAT && parsed.format !== LEGACY_DEV_PQ_BACKUP_FORMAT) {
      throw new Error("Backup format is not supported.");
    }
    const backupChainId = normalizeChainId(typeof parsed.chainId === "number" ? parsed.chainId : expectedChainId);
    if (backupChainId !== normalizeChainId(expectedChainId)) {
      throw new Error("Backup is not for this Qubitor network.");
    }
    return parseProfileObject(parsed.profile, backupChainId);
  }
  return parseProfileObject(parsed, expectedChainId);
}

async function parseBackupPayload(
  encoded: string,
  passcode?: string,
  expectedChainId = QUBITOR_DEVNET_CHAIN_ID,
): Promise<QubitorDevPQWalletProfile> {
  const parsed = JSON.parse(encoded) as unknown;
  if (!isRecord(parsed)) throw new Error("Backup JSON must be an object.");
  if (parsed.format === DEV_PQ_ENCRYPTED_BACKUP_FORMAT || parsed.format === LEGACY_DEV_PQ_ENCRYPTED_BACKUP_FORMAT) {
    const backupChainId = normalizeChainId(typeof parsed.chainId === "number" ? parsed.chainId : expectedChainId);
    if (backupChainId !== normalizeChainId(expectedChainId)) {
      throw new Error("Backup is not for this Qubitor network.");
    }
    if (!passcode) throw new Error("Encrypted backup requires a passcode.");
    const plaintext = await decryptStringWithPasscode(parsed.encryption as PasscodeEncryptedPayload, passcode, {
      aad: encryptedBackupAad(backupChainId, parsed.format),
    });
    return parseProfileObject(JSON.parse(plaintext), backupChainId);
  }
  return parsePlainBackupRecord(parsed, expectedChainId);
}

async function readStoredProfile(chainId = QUBITOR_DEVNET_CHAIN_ID): Promise<QubitorDevPQWalletProfile | undefined> {
  const key = storageKey(chainId);
  const vault = getKeyVault();
  return (
    parseStoredProfile(await vault.getItem(key), chainId) ??
    parseStoredProfile(await vault.getItem(LEGACY_DEV_PQ_KEY_STORAGE_KEY), chainId)
  );
}

async function writeStoredProfile(profile: QubitorDevPQWalletProfile, chainId = profile.chainId ?? QUBITOR_DEVNET_CHAIN_ID) {
  const normalizedProfile = { ...profile, chainId: normalizeChainId(chainId) };
  const encoded = JSON.stringify(normalizedProfile);
  const key = storageKey(normalizedProfile.chainId);
  await getKeyVault().setItem(key, encoded);
}

export async function generateQubitorDevPQKey(): Promise<MLDSA65KeyPair> {
  return generateMLDSA65KeyPair(await Crypto.getRandomBytesAsync(32));
}

export async function loadOrCreateQubitorDevPQProfile(chainId = QUBITOR_DEVNET_CHAIN_ID): Promise<QubitorDevPQWalletProfile> {
  const normalizedChainId = normalizeChainId(chainId);
  const stored = await readStoredProfile(normalizedChainId);
  if (stored) return stored;

  const generated = await generateQubitorDevPQKey();
  const profile: QubitorDevPQWalletProfile = {
    version: 2,
    chainId: normalizedChainId,
    currentKey: generated,
    deploymentKey: generated,
    deploymentPublicKey: generated.publicKey,
    keyVersion: 1,
  };
  await writeStoredProfile(profile, normalizedChainId);
  return profile;
}

export async function rememberQubitorDevPQDeployment(
  metadata: Pick<QubitorDevPQWalletProfile, "accountAddress"> &
    Partial<Pick<QubitorDevPQWalletProfile, "chainId" | "deploymentPublicKey" | "deploymentSalt" | "currentPublicKeyCommitment">>,
): Promise<QubitorDevPQWalletProfile> {
  const chainId = normalizeChainId(metadata.chainId ?? QUBITOR_DEVNET_CHAIN_ID);
  const profile = await loadOrCreateQubitorDevPQProfile(chainId);
  const nextProfile: QubitorDevPQWalletProfile = {
    ...profile,
    chainId,
    accountAddress: metadata.accountAddress,
    deploymentPublicKey: metadata.deploymentPublicKey ?? profile.deploymentPublicKey,
    deploymentSalt: metadata.deploymentSalt ?? profile.deploymentSalt,
    currentPublicKeyCommitment: metadata.currentPublicKeyCommitment ?? profile.currentPublicKeyCommitment,
  };
  await writeStoredProfile(nextProfile, chainId);
  return nextProfile;
}

export async function rotateStoredQubitorDevPQKey(
  nextKey: MLDSA65KeyPair,
  metadata: Pick<QubitorDevPQWalletProfile, "accountAddress"> &
    Partial<
      Pick<
        QubitorDevPQWalletProfile,
        "chainId" | "deploymentPublicKey" | "deploymentSalt" | "currentPublicKeyCommitment" | "lastRotationTransactionHash"
      >
    >,
): Promise<QubitorDevPQWalletProfile> {
  const chainId = normalizeChainId(metadata.chainId ?? QUBITOR_DEVNET_CHAIN_ID);
  const profile = await loadOrCreateQubitorDevPQProfile(chainId);
  const nextProfile: QubitorDevPQWalletProfile = {
    ...profile,
    chainId,
    currentKey: nextKey,
    accountAddress: metadata.accountAddress,
    deploymentPublicKey: metadata.deploymentPublicKey ?? profile.deploymentPublicKey,
    deploymentSalt: metadata.deploymentSalt ?? profile.deploymentSalt,
    currentPublicKeyCommitment: metadata.currentPublicKeyCommitment,
    keyVersion: profile.keyVersion + 1,
    lastRotationAt: new Date().toISOString(),
    lastRotationTransactionHash: metadata.lastRotationTransactionHash,
  };
  await writeStoredProfile(nextProfile, chainId);
  return nextProfile;
}

export async function exportQubitorDevPQBackup(chainId = QUBITOR_DEVNET_CHAIN_ID): Promise<string> {
  const normalizedChainId = normalizeChainId(chainId);
  const profile = await loadOrCreateQubitorDevPQProfile(normalizedChainId);
  const backup: QubitorDevPQWalletBackup = {
    format: DEV_PQ_BACKUP_FORMAT,
    chainId: normalizedChainId,
    exportedAt: new Date().toISOString(),
    warning: "UNENCRYPTED QUANTA WALLET BACKUP. Anyone with this JSON can control this Quanta Account.",
    profile,
  };
  return JSON.stringify(backup, null, 2);
}

export async function exportQubitorDevPQEncryptedBackup(passcode: string, chainId = QUBITOR_DEVNET_CHAIN_ID): Promise<string> {
  const normalizedChainId = normalizeChainId(chainId);
  const profile = await loadOrCreateQubitorDevPQProfile(normalizedChainId);
  const backup: QubitorDevPQWalletEncryptedBackup = {
    format: DEV_PQ_ENCRYPTED_BACKUP_FORMAT,
    chainId: normalizedChainId,
    exportedAt: new Date().toISOString(),
    warning: "PASSCODE-ENCRYPTED QUANTA WALLET BACKUP. The passcode cannot be recovered if forgotten.",
    preview: previewFromProfile(profile, DEV_PQ_ENCRYPTED_BACKUP_FORMAT, true),
    encryption: await encryptStringWithPasscode(JSON.stringify(profile), passcode, {
      salt: await Crypto.getRandomBytesAsync(16),
      nonce: await Crypto.getRandomBytesAsync(12),
      aad: encryptedBackupAad(normalizedChainId),
    }),
  };
  return JSON.stringify(backup, null, 2);
}

export async function inspectQubitorDevPQBackup(
  encoded: string,
  passcode?: string,
  chainId = QUBITOR_DEVNET_CHAIN_ID,
): Promise<QubitorDevPQWalletBackupPreview> {
  const profile = await parseBackupPayload(encoded, passcode, chainId);
  const parsed = JSON.parse(encoded) as Record<string, unknown>;
  const format = typeof parsed.format === "string" ? parsed.format : DEV_PQ_BACKUP_FORMAT;
  return previewFromProfile(
    profile,
    format,
    format === DEV_PQ_ENCRYPTED_BACKUP_FORMAT || format === LEGACY_DEV_PQ_ENCRYPTED_BACKUP_FORMAT,
  );
}

export async function restoreQubitorDevPQBackup(
  encoded: string,
  passcode?: string,
  chainId = QUBITOR_DEVNET_CHAIN_ID,
): Promise<QubitorDevPQWalletProfile> {
  const profile = await parseBackupPayload(encoded, passcode, chainId);
  await writeStoredProfile(profile, profile.chainId ?? chainId);
  return profile;
}

export async function loadOrCreateQubitorDevPQKey(chainId = QUBITOR_DEVNET_CHAIN_ID): Promise<MLDSA65KeyPair> {
  return (await loadOrCreateQubitorDevPQProfile(chainId)).currentKey;
}

/**
 * Hard reset: permanently deletes the on-device ML-DSA profile for every
 * supported chain plus the legacy key. This is irreversible — the only
 * recovery afterwards is restoring an exported backup.
 */
export async function resetQuantaWallet(): Promise<void> {
  const vault = getKeyVault();
  for (const chainId of SUPPORTED_QUBITOR_CHAIN_IDS) {
    await vault.deleteItem(storageKey(chainId)).catch(() => undefined);
  }
  await vault.deleteItem(LEGACY_DEV_PQ_KEY_STORAGE_KEY).catch(() => undefined);
}
