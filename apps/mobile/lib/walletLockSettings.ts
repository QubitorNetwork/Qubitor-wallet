import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "quanta.wallet.lock-timeout-minutes.v1";
const DEFAULT_TIMEOUT_MINUTES = 5;

export async function getWalletLockTimeoutMinutes(): Promise<number> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : DEFAULT_TIMEOUT_MINUTES;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_TIMEOUT_MINUTES;
}

export async function setWalletLockTimeoutMinutes(minutes: number): Promise<void> {
  const normalized = Number.isFinite(minutes) && minutes >= 0 ? Math.floor(minutes) : DEFAULT_TIMEOUT_MINUTES;
  await AsyncStorage.setItem(STORAGE_KEY, String(normalized));
}
