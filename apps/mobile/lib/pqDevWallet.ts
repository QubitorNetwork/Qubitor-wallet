import * as Crypto from "expo-crypto";
import { getKeyVault } from "@qubitor/keystore";
import {
  deriveQubitorPQAccountAddress,
  generateMLDSA65KeyPair,
  QUBITOR_DEVNET_CHAIN_ID,
  QUBITOR_TESTNET_CHAIN_ID,
  QUBITOR_ZERO_HASH,
  signQubitorPQAccountAuthorization,
  supportedChainId,
  type MLDSA65KeyPair,
} from "@qubitor/evm";
import {
  deriveMLDSA65PublicKey,
  decryptStringWithPasscode,
  encryptStringWithPasscode,
  type Hex,
  type PasscodeEncryptedPayload,
  verifyMLDSA65,
} from "@qubitor/pq-crypto";

const LEGACY_DEV_PQ_KEY_STORAGE_KEY = "qubitor.devnet.mldsa65.key.v1";
const LEGACY_RAW_PROFILE_PREFIX = "quanta.wallet.mldsa65.profile.v2";
const ENCRYPTED_PROFILE_PREFIX = "quanta.wallet.mldsa65.profile.encrypted.v1";
const DEV_PQ_BACKUP_FORMAT = "quanta.wallet.pq-wallet-backup.v1";
const DEV_PQ_ENCRYPTED_BACKUP_FORMAT = "quanta.wallet.pq-wallet-backup.encrypted.v1";
const LEGACY_DEV_PQ_BACKUP_FORMAT = "qubitor.devnet.pq-wallet-backup.v1";
const LEGACY_DEV_PQ_ENCRYPTED_BACKUP_FORMAT = "qubitor.devnet.pq-wallet-backup.encrypted.v1";
const DEV_PQ_RESTORE_VALIDATION_MESSAGE = "0x71756269746f722d6465766e65742d726573746f72652d636865636b";
const DEFAULT_CHAIN_ID = QUBITOR_TESTNET_CHAIN_ID;
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

export interface QubitorWalletPreview {
  version: 1;
  chainId: number;
  accountAddress: Hex;
  deploymentPublicKey: Hex;
  deploymentSalt: Hex;
  currentPublicKeyCommitment?: Hex;
  keyVersion: number;
  lastRotationAt?: string;
  lastRotationTransactionHash?: Hex;
  updatedAt: string;
}

export type WalletBootState =
  | { status: "no-wallet"; chainId: number }
  | { status: "migrate-required"; chainId: number; preview?: QubitorWalletPreview }
  | { status: "locked"; chainId: number; preview: QubitorWalletPreview }
  | { status: "unlocked"; chainId: number; preview: QubitorWalletPreview }
  | { status: "read-only-ready"; chainId: number; preview: QubitorWalletPreview }
  | { status: "error"; chainId: number; error: string };

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

interface EncryptedWalletRecord {
  format: "quanta.wallet.encrypted-profile.v1";
  preview: QubitorWalletPreview;
  encryption: PasscodeEncryptedPayload;
}

const unlockedProfiles = new Map<number, QubitorDevPQWalletProfile>();
const unlockedPasscodes = new Map<number, string>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeChainId(chainId = DEFAULT_CHAIN_ID): number {
  return supportedChainId(chainId);
}

function rawProfileKey(chainId = DEFAULT_CHAIN_ID) {
  return `${LEGACY_RAW_PROFILE_PREFIX}.${normalizeChainId(chainId)}`;
}

function encryptedProfileKey(chainId = DEFAULT_CHAIN_ID) {
  return `${ENCRYPTED_PROFILE_PREFIX}.${normalizeChainId(chainId)}`;
}

function encryptedProfileAad(chainId = DEFAULT_CHAIN_ID) {
  return `quanta.wallet.encrypted-profile.v1:${normalizeChainId(chainId)}:mldsa65`;
}

function encryptedBackupAad(chainId = DEFAULT_CHAIN_ID, format = DEV_PQ_ENCRYPTED_BACKUP_FORMAT) {
  return `${format}:${normalizeChainId(chainId)}:pq-wallet-profile`;
}

function assertPasscode(passcode: string) {
  if (passcode.length < 8) throw new Error("Wallet passcode must be at least 8 characters.");
}

function assertHex(value: unknown): value is Hex {
  return typeof value === "string" && value.startsWith("0x");
}

function parseKey(value: Partial<MLDSA65KeyPair> | undefined): MLDSA65KeyPair | undefined {
  if (!assertHex(value?.privateKey)) return undefined;
  const derivedPublicKey = deriveMLDSA65PublicKey(value.privateKey);
  if (assertHex(value.publicKey) && value.publicKey.toLowerCase() !== derivedPublicKey.toLowerCase()) {
    throw new Error("Stored PQ public key does not match the private key.");
  }
  return {
    publicKey: derivedPublicKey,
    privateKey: value.privateKey,
  };
}

function normalizeProfile(
  value: StoredProfileV2,
  currentKey: MLDSA65KeyPair,
  chainId = DEFAULT_CHAIN_ID,
): QubitorDevPQWalletProfile {
  const parsedDeploymentKey = parseKey(value.deploymentKey);
  const deploymentPublicKey = assertHex(value.deploymentPublicKey)
    ? value.deploymentPublicKey
    : parsedDeploymentKey?.publicKey ?? currentKey.publicKey;
  const deploymentKey =
    parsedDeploymentKey ??
    (deploymentPublicKey.toLowerCase() === currentKey.publicKey.toLowerCase() ? currentKey : undefined);

  if (deploymentKey && deploymentKey.publicKey.toLowerCase() !== deploymentPublicKey.toLowerCase()) {
    throw new Error("Stored deployment key does not match the deployment public key.");
  }

  const normalizedChainId = normalizeChainId(value.chainId ?? chainId);
  const deploymentSalt = assertHex(value.deploymentSalt) ? value.deploymentSalt : QUBITOR_ZERO_HASH;
  const derivedAddress = deriveQubitorPQAccountAddress(deploymentPublicKey, deploymentSalt);

  return {
    version: 2,
    chainId: normalizedChainId,
    currentKey,
    deploymentKey,
    deploymentPublicKey,
    deploymentSalt,
    accountAddress: assertHex(value.accountAddress) ? value.accountAddress : derivedAddress,
    currentPublicKeyCommitment: assertHex(value.currentPublicKeyCommitment) ? value.currentPublicKeyCommitment : undefined,
    keyVersion: typeof value.keyVersion === "number" && value.keyVersion > 0 ? value.keyVersion : 1,
    lastRotationAt: typeof value.lastRotationAt === "string" ? value.lastRotationAt : undefined,
    lastRotationTransactionHash: assertHex(value.lastRotationTransactionHash) ? value.lastRotationTransactionHash : undefined,
  };
}

function parseStoredProfile(value: string | null, chainId = DEFAULT_CHAIN_ID): QubitorDevPQWalletProfile | undefined {
  if (!value) return undefined;
  const parsed = JSON.parse(value) as StoredProfileV2 & Partial<MLDSA65KeyPair>;
  const currentKey = parseKey(parsed.currentKey) ?? parseKey(parsed);
  return currentKey ? normalizeProfile(parsed, currentKey, chainId) : undefined;
}

function parseProfileObject(value: unknown, chainId = DEFAULT_CHAIN_ID): QubitorDevPQWalletProfile {
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

function profileWithAddress(profile: QubitorDevPQWalletProfile, chainId = DEFAULT_CHAIN_ID): QubitorDevPQWalletProfile {
  const normalizedChainId = normalizeChainId(profile.chainId ?? chainId);
  const deploymentSalt = profile.deploymentSalt ?? QUBITOR_ZERO_HASH;
  const accountAddress = profile.accountAddress ?? deriveQubitorPQAccountAddress(profile.deploymentPublicKey, deploymentSalt);
  return {
    ...profile,
    chainId: normalizedChainId,
    deploymentSalt,
    accountAddress,
  };
}

function previewFromProfile(profile: QubitorDevPQWalletProfile, updatedAt = new Date().toISOString()): QubitorWalletPreview {
  const normalized = profileWithAddress(profile, profile.chainId);
  return {
    version: 1,
    chainId: normalizeChainId(normalized.chainId),
    accountAddress: normalized.accountAddress!,
    deploymentPublicKey: normalized.deploymentPublicKey,
    deploymentSalt: normalized.deploymentSalt ?? QUBITOR_ZERO_HASH,
    currentPublicKeyCommitment: normalized.currentPublicKeyCommitment,
    keyVersion: normalized.keyVersion,
    lastRotationAt: normalized.lastRotationAt,
    lastRotationTransactionHash: normalized.lastRotationTransactionHash,
    updatedAt,
  };
}

function backupPreviewFromProfile(
  profile: QubitorDevPQWalletProfile,
  format: string,
  encrypted: boolean,
): QubitorDevPQWalletBackupPreview {
  const preview = previewFromProfile(profile);
  return {
    encrypted,
    format,
    chainId: preview.chainId,
    accountAddress: preview.accountAddress,
    deploymentPublicKey: preview.deploymentPublicKey,
    currentPublicKeyCommitment: preview.currentPublicKeyCommitment,
    keyVersion: preview.keyVersion,
    lastRotationAt: preview.lastRotationAt,
  };
}

function parseEncryptedRecord(value: string | null): EncryptedWalletRecord | undefined {
  if (!value) return undefined;
  const parsed = JSON.parse(value) as EncryptedWalletRecord;
  if (parsed.format !== "quanta.wallet.encrypted-profile.v1" || !parsed.preview || !parsed.encryption) {
    throw new Error("Stored Quanta Wallet profile is not a supported encrypted profile.");
  }
  return parsed;
}

async function readRawProfile(chainId = DEFAULT_CHAIN_ID): Promise<QubitorDevPQWalletProfile | undefined> {
  const normalizedChainId = normalizeChainId(chainId);
  const vault = getKeyVault();
  return (
    parseStoredProfile(await vault.getItem(rawProfileKey(normalizedChainId)), normalizedChainId) ??
    parseStoredProfile(await vault.getItem(LEGACY_DEV_PQ_KEY_STORAGE_KEY), normalizedChainId)
  );
}

async function writeRawProfile(profile: QubitorDevPQWalletProfile, chainId = profile.chainId ?? DEFAULT_CHAIN_ID) {
  const normalized = profileWithAddress(profile, chainId);
  await getKeyVault().setItem(rawProfileKey(normalized.chainId), JSON.stringify(normalized));
}

async function readEncryptedRecord(chainId = DEFAULT_CHAIN_ID): Promise<EncryptedWalletRecord | undefined> {
  return parseEncryptedRecord(await getKeyVault().getItem(encryptedProfileKey(chainId)));
}

async function writeEncryptedProfile(
  profile: QubitorDevPQWalletProfile,
  passcode: string,
  chainId = profile.chainId ?? DEFAULT_CHAIN_ID,
): Promise<QubitorDevPQWalletProfile> {
  assertPasscode(passcode);
  const normalized = profileWithAddress(profile, chainId);
  const preview = previewFromProfile(normalized);
  const record: EncryptedWalletRecord = {
    format: "quanta.wallet.encrypted-profile.v1",
    preview,
    encryption: await encryptStringWithPasscode(JSON.stringify(normalized), passcode, {
      salt: await Crypto.getRandomBytesAsync(16),
      nonce: await Crypto.getRandomBytesAsync(12),
      aad: encryptedProfileAad(preview.chainId),
    }),
  };
  await getKeyVault().setItem(encryptedProfileKey(preview.chainId), JSON.stringify(record));
  unlockedProfiles.set(preview.chainId, normalized);
  unlockedPasscodes.set(preview.chainId, passcode);
  return normalized;
}

async function updateStoredProfile(profile: QubitorDevPQWalletProfile): Promise<QubitorDevPQWalletProfile> {
  const chainId = normalizeChainId(profile.chainId);
  const passcode = unlockedPasscodes.get(chainId);
  if (passcode) return writeEncryptedProfile(profile, passcode, chainId);
  if (await readEncryptedRecord(chainId)) {
    throw new Error("Unlock Quanta Wallet before changing the encrypted profile.");
  }
  await writeRawProfile(profile, chainId);
  return profileWithAddress(profile, chainId);
}

function parsePlainBackupRecord(parsed: Record<string, unknown>, expectedChainId = DEFAULT_CHAIN_ID): QubitorDevPQWalletProfile {
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
  expectedChainId = DEFAULT_CHAIN_ID,
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

export async function generateQubitorDevPQKey(): Promise<MLDSA65KeyPair> {
  return generateMLDSA65KeyPair(await Crypto.getRandomBytesAsync(32));
}

export async function getWalletPreview(chainId = DEFAULT_CHAIN_ID): Promise<QubitorWalletPreview | undefined> {
  const normalizedChainId = normalizeChainId(chainId);
  const record = await readEncryptedRecord(normalizedChainId);
  if (record) return record.preview;
  const raw = await readRawProfile(normalizedChainId);
  return raw ? previewFromProfile(raw) : undefined;
}

export async function hasWalletProfile(chainId = DEFAULT_CHAIN_ID): Promise<boolean> {
  return Boolean(await getWalletPreview(chainId));
}

export async function getWalletBootState(chainId = DEFAULT_CHAIN_ID): Promise<WalletBootState> {
  const normalizedChainId = normalizeChainId(chainId);
  try {
    const encrypted = await readEncryptedRecord(normalizedChainId);
    if (encrypted) {
      return unlockedProfiles.has(normalizedChainId)
        ? { status: "unlocked", chainId: normalizedChainId, preview: encrypted.preview }
        : { status: "read-only-ready", chainId: normalizedChainId, preview: encrypted.preview };
    }
    const raw = await readRawProfile(normalizedChainId);
    if (raw) return { status: "migrate-required", chainId: normalizedChainId, preview: previewFromProfile(raw) };
    return { status: "no-wallet", chainId: normalizedChainId };
  } catch (error) {
    return {
      status: "error",
      chainId: normalizedChainId,
      error: error instanceof Error ? error.message : "Could not read Quanta Wallet profile.",
    };
  }
}

function bootStateHasProfile(state: WalletBootState): boolean {
  return state.status !== "no-wallet" && state.status !== "error";
}

export async function getWalletBootStateForAnyChain(chainId = DEFAULT_CHAIN_ID): Promise<WalletBootState> {
  const normalizedChainId = normalizeChainId(chainId);
  const preferred = await getWalletBootState(normalizedChainId);
  if (bootStateHasProfile(preferred)) return preferred;

  for (const candidate of SUPPORTED_QUBITOR_CHAIN_IDS) {
    if (candidate === normalizedChainId) continue;
    const state = await getWalletBootState(candidate);
    if (bootStateHasProfile(state)) return state;
  }

  return preferred;
}

export function isWalletUnlocked(chainId = DEFAULT_CHAIN_ID): boolean {
  return unlockedProfiles.has(normalizeChainId(chainId));
}

export function getUnlockedWalletProfile(chainId = DEFAULT_CHAIN_ID): QubitorDevPQWalletProfile | undefined {
  return unlockedProfiles.get(normalizeChainId(chainId));
}

export function requireUnlockedWalletProfile(chainId = DEFAULT_CHAIN_ID): QubitorDevPQWalletProfile {
  const profile = getUnlockedWalletProfile(chainId);
  if (!profile) throw new Error("Unlock Quanta Wallet before signing or changing account security.");
  return profile;
}

export async function createEncryptedWalletProfile(
  passcode: string,
  chainId = DEFAULT_CHAIN_ID,
): Promise<QubitorDevPQWalletProfile> {
  const normalizedChainId = normalizeChainId(chainId);
  const generated = await generateQubitorDevPQKey();
  const profile: QubitorDevPQWalletProfile = {
    version: 2,
    chainId: normalizedChainId,
    currentKey: generated,
    deploymentKey: generated,
    deploymentPublicKey: generated.publicKey,
    deploymentSalt: QUBITOR_ZERO_HASH,
    accountAddress: deriveQubitorPQAccountAddress(generated.publicKey, QUBITOR_ZERO_HASH),
    keyVersion: 1,
  };
  await writeEncryptedProfile(profile, passcode, normalizedChainId);
  await getKeyVault().deleteItem(rawProfileKey(normalizedChainId)).catch(() => undefined);
  if (normalizedChainId === QUBITOR_DEVNET_CHAIN_ID) {
    await getKeyVault().deleteItem(LEGACY_DEV_PQ_KEY_STORAGE_KEY).catch(() => undefined);
  }
  return profile;
}

export async function unlockWalletProfile(passcode: string, chainId = DEFAULT_CHAIN_ID): Promise<QubitorDevPQWalletProfile> {
  assertPasscode(passcode);
  const normalizedChainId = normalizeChainId(chainId);
  const record = await readEncryptedRecord(normalizedChainId);
  if (!record) throw new Error("No encrypted Quanta Wallet profile found.");
  const plaintext = await decryptStringWithPasscode(record.encryption, passcode, {
    aad: encryptedProfileAad(normalizedChainId),
  });
  const profile = profileWithAddress(parseProfileObject(JSON.parse(plaintext), normalizedChainId), normalizedChainId);
  unlockedProfiles.set(normalizedChainId, profile);
  unlockedPasscodes.set(normalizedChainId, passcode);
  return profile;
}

export async function migrateLegacyWalletProfile(
  passcode: string,
  chainId = DEFAULT_CHAIN_ID,
): Promise<QubitorDevPQWalletProfile> {
  assertPasscode(passcode);
  const normalizedChainId = normalizeChainId(chainId);
  const raw = await readRawProfile(normalizedChainId);
  if (!raw) throw new Error("No legacy Quanta Wallet profile found.");
  const migrated = await writeEncryptedProfile(profileWithAddress(raw, normalizedChainId), passcode, normalizedChainId);
  await getKeyVault().deleteItem(rawProfileKey(normalizedChainId)).catch(() => undefined);
  if (normalizedChainId === QUBITOR_DEVNET_CHAIN_ID) {
    await getKeyVault().deleteItem(LEGACY_DEV_PQ_KEY_STORAGE_KEY).catch(() => undefined);
  }
  return migrated;
}

export async function loadOrCreateQubitorDevPQProfile(chainId = DEFAULT_CHAIN_ID): Promise<QubitorDevPQWalletProfile> {
  const normalizedChainId = normalizeChainId(chainId);
  const unlocked = getUnlockedWalletProfile(normalizedChainId);
  if (unlocked) return unlocked;
  const raw = await readRawProfile(normalizedChainId);
  if (raw) return raw;

  const generated = await generateQubitorDevPQKey();
  const profile: QubitorDevPQWalletProfile = {
    version: 2,
    chainId: normalizedChainId,
    currentKey: generated,
    deploymentKey: generated,
    deploymentPublicKey: generated.publicKey,
    deploymentSalt: QUBITOR_ZERO_HASH,
    accountAddress: deriveQubitorPQAccountAddress(generated.publicKey, QUBITOR_ZERO_HASH),
    keyVersion: 1,
  };
  await writeRawProfile(profile, normalizedChainId);
  return profile;
}

export async function rememberQubitorDevPQDeployment(
  metadata: Pick<QubitorDevPQWalletProfile, "accountAddress"> &
    Partial<Pick<QubitorDevPQWalletProfile, "chainId" | "deploymentPublicKey" | "deploymentSalt" | "currentPublicKeyCommitment">>,
): Promise<QubitorDevPQWalletProfile> {
  const chainId = normalizeChainId(metadata.chainId ?? DEFAULT_CHAIN_ID);
  const profile = getUnlockedWalletProfile(chainId) ?? (await readRawProfile(chainId));
  if (!profile) throw new Error("No Quanta Wallet profile found for deployment metadata.");
  const nextProfile: QubitorDevPQWalletProfile = {
    ...profile,
    chainId,
    accountAddress: metadata.accountAddress,
    deploymentPublicKey: metadata.deploymentPublicKey ?? profile.deploymentPublicKey,
    deploymentSalt: metadata.deploymentSalt ?? profile.deploymentSalt ?? QUBITOR_ZERO_HASH,
    currentPublicKeyCommitment: metadata.currentPublicKeyCommitment ?? profile.currentPublicKeyCommitment,
  };
  return updateStoredProfile(nextProfile);
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
  const chainId = normalizeChainId(metadata.chainId ?? DEFAULT_CHAIN_ID);
  const profile = requireUnlockedWalletProfile(chainId);
  const nextProfile: QubitorDevPQWalletProfile = {
    ...profile,
    chainId,
    currentKey: nextKey,
    accountAddress: metadata.accountAddress,
    deploymentPublicKey: metadata.deploymentPublicKey ?? profile.deploymentPublicKey,
    deploymentSalt: metadata.deploymentSalt ?? profile.deploymentSalt ?? QUBITOR_ZERO_HASH,
    currentPublicKeyCommitment: metadata.currentPublicKeyCommitment,
    keyVersion: profile.keyVersion + 1,
    lastRotationAt: new Date().toISOString(),
    lastRotationTransactionHash: metadata.lastRotationTransactionHash,
  };
  return updateStoredProfile(nextProfile);
}

export async function exportQubitorDevPQBackup(chainId = DEFAULT_CHAIN_ID): Promise<string> {
  const normalizedChainId = normalizeChainId(chainId);
  const profile = requireUnlockedWalletProfile(normalizedChainId);
  const backup: QubitorDevPQWalletBackup = {
    format: DEV_PQ_BACKUP_FORMAT,
    chainId: normalizedChainId,
    exportedAt: new Date().toISOString(),
    warning: "UNENCRYPTED QUANTA WALLET BACKUP. Anyone with this JSON can control this Quanta Account.",
    profile,
  };
  return JSON.stringify(backup, null, 2);
}

export async function exportQubitorDevPQEncryptedBackup(passcode: string, chainId = DEFAULT_CHAIN_ID): Promise<string> {
  const normalizedChainId = normalizeChainId(chainId);
  const profile = requireUnlockedWalletProfile(normalizedChainId);
  const backup: QubitorDevPQWalletEncryptedBackup = {
    format: DEV_PQ_ENCRYPTED_BACKUP_FORMAT,
    chainId: normalizedChainId,
    exportedAt: new Date().toISOString(),
    warning: "PASSCODE-ENCRYPTED QUANTA WALLET BACKUP. The passcode cannot be recovered if forgotten.",
    preview: backupPreviewFromProfile(profile, DEV_PQ_ENCRYPTED_BACKUP_FORMAT, true),
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
  chainId = DEFAULT_CHAIN_ID,
): Promise<QubitorDevPQWalletBackupPreview> {
  const profile = await parseBackupPayload(encoded, passcode, chainId);
  const parsed = JSON.parse(encoded) as Record<string, unknown>;
  const format = typeof parsed.format === "string" ? parsed.format : DEV_PQ_BACKUP_FORMAT;
  return backupPreviewFromProfile(
    profile,
    format,
    format === DEV_PQ_ENCRYPTED_BACKUP_FORMAT || format === LEGACY_DEV_PQ_ENCRYPTED_BACKUP_FORMAT,
  );
}

export async function restoreQubitorDevPQBackup(
  encoded: string,
  passcode?: string,
  chainId = DEFAULT_CHAIN_ID,
): Promise<QubitorDevPQWalletProfile> {
  if (!passcode) throw new Error("Restore requires a new wallet passcode.");
  const profile = await parseBackupPayload(encoded, passcode, chainId);
  return writeEncryptedProfile(profile, passcode, profile.chainId ?? chainId);
}

export async function loadOrCreateQubitorDevPQKey(chainId = DEFAULT_CHAIN_ID): Promise<MLDSA65KeyPair> {
  return requireUnlockedWalletProfile(chainId).currentKey;
}

export async function wipeWalletProfile(chainId: number | "all" = DEFAULT_CHAIN_ID): Promise<void> {
  const vault = getKeyVault();
  const chainIds = chainId === "all" ? SUPPORTED_QUBITOR_CHAIN_IDS : [normalizeChainId(chainId)];
  for (const id of chainIds) {
    await vault.deleteItem(encryptedProfileKey(id)).catch(() => undefined);
    await vault.deleteItem(rawProfileKey(id)).catch(() => undefined);
    unlockedProfiles.delete(id);
    unlockedPasscodes.delete(id);
  }
  if (chainId === "all" || normalizeChainId(chainId) === QUBITOR_DEVNET_CHAIN_ID) {
    await vault.deleteItem(LEGACY_DEV_PQ_KEY_STORAGE_KEY).catch(() => undefined);
  }
}

/**
 * Hard reset: permanently deletes the on-device ML-DSA profile for every
 * supported chain plus the legacy key. This is irreversible — the only
 * recovery afterwards is restoring an exported backup.
 */
export async function resetQuantaWallet(): Promise<void> {
  await wipeWalletProfile("all");
}
