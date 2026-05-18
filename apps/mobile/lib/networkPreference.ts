import AsyncStorage from "@react-native-async-storage/async-storage";
import { QUBITOR_DEVNET_CHAIN_ID, QUBITOR_TESTNET_CHAIN_ID } from "@qubitor/evm";

const STORAGE_KEY = "quanta.wallet.network.v1";

export const SELECTABLE_CHAINS = [
  { id: QUBITOR_DEVNET_CHAIN_ID, name: "Qubitor Devnet" },
  { id: QUBITOR_TESTNET_CHAIN_ID, name: "Qubitor Testnet" },
] as const;

export type SelectableChainId = (typeof SELECTABLE_CHAINS)[number]["id"];

function isSelectable(value: number): value is SelectableChainId {
  return SELECTABLE_CHAINS.some((c) => c.id === value);
}

/** Returns the user's persisted chain override, or undefined to fall back to env. */
export async function getSelectedChainId(): Promise<SelectableChainId | undefined> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && isSelectable(parsed) ? parsed : undefined;
}

export async function setSelectedChainId(chainId: SelectableChainId): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, String(chainId));
}

export function chainName(chainId: number): string {
  return SELECTABLE_CHAINS.find((c) => c.id === chainId)?.name ?? `Chain ${chainId}`;
}
