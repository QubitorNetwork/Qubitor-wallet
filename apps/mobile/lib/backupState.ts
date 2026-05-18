import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_PREFIX = "quanta.wallet.backup.v1";

function key(chainId: number): string {
  return `${STORAGE_PREFIX}.${chainId}`;
}

export interface BackupState {
  backedUp: boolean;
  /** ISO timestamp of the last successful encrypted backup export. */
  lastBackupAt?: string;
}

/** Records that the user successfully exported an encrypted Recovery Kit for
 *  this chain. The only state stored is a timestamp — never key material. */
export async function markBackedUp(chainId: number): Promise<void> {
  await AsyncStorage.setItem(key(chainId), new Date().toISOString());
}

export async function getBackupState(chainId: number): Promise<BackupState> {
  const raw = await AsyncStorage.getItem(key(chainId));
  if (!raw) return { backedUp: false };
  return { backedUp: true, lastBackupAt: raw };
}

export async function clearBackupState(chainId: number): Promise<void> {
  await AsyncStorage.removeItem(key(chainId));
}
