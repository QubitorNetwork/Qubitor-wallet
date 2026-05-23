import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Hex } from "@qubitor/core";
import type { ActivityItem } from "@/lib/runtimeTypes";

const ACTIVITY_STORAGE_PREFIX = "quanta.wallet.activity.v1";
const MAX_ACTIVITY_ITEMS = 40;

export interface WalletActivityItem extends ActivityItem {
  occurredAt: string;
  chainId: number;
  accountAddress?: Hex;
  hash?: Hex;
  displayHash?: string;
  from?: string;
  to?: string;
  asset?: string;
  amountLabel?: string;
  fee?: string;
  security?: string;
  status?: "pending" | "success" | "failed";
}

export interface WalletActivityContext {
  chainId: number;
  accountAddress?: Hex;
}

function storageKey(context: WalletActivityContext) {
  const account = context.accountAddress?.toLowerCase() ?? "default";
  return `${ACTIVITY_STORAGE_PREFIX}.${context.chainId}.${account}`;
}

function shortHash(value?: string) {
  if (!value) return undefined;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function formatActivityTimestamp(occurredAt: string, now = Date.now()): string {
  const time = Date.parse(occurredAt);
  if (!Number.isFinite(time)) return "Recently";
  const deltaMs = Math.max(0, now - time);
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(time).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function normalizeItem(value: unknown): WalletActivityItem | undefined {
  if (!value || typeof value !== "object") return undefined;
  const item = value as Partial<WalletActivityItem>;
  if (!item.id || !item.type || !item.title || !item.detail || !item.occurredAt || typeof item.chainId !== "number") {
    return undefined;
  }
  return {
    ...item,
    id: item.id,
    type: item.type,
    title: item.title,
    detail: item.detail,
    timestamp: formatActivityTimestamp(item.occurredAt),
    occurredAt: item.occurredAt,
    chainId: item.chainId,
  } as WalletActivityItem;
}

export async function readWalletActivity(context: WalletActivityContext): Promise<WalletActivityItem[]> {
  const encoded = await AsyncStorage.getItem(storageKey(context));
  if (!encoded) return [];
  const parsed = JSON.parse(encoded) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map(normalizeItem)
    .filter((item): item is WalletActivityItem => Boolean(item))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}

export async function writeWalletActivity(
  context: WalletActivityContext,
  items: readonly WalletActivityItem[],
): Promise<void> {
  const deduped = new Map<string, WalletActivityItem>();
  for (const item of items) {
    const key = item.hash?.toLowerCase() ?? item.id;
    if (!deduped.has(key)) deduped.set(key, item);
  }
  const ordered = [...deduped.values()]
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, MAX_ACTIVITY_ITEMS);
  await AsyncStorage.setItem(storageKey(context), JSON.stringify(ordered));
}

export async function recordWalletActivity(
  context: WalletActivityContext,
  item: Omit<WalletActivityItem, "id" | "timestamp" | "occurredAt" | "chainId" | "accountAddress"> &
    Partial<Pick<WalletActivityItem, "id" | "occurredAt" | "accountAddress" | "chainId">>,
): Promise<WalletActivityItem> {
  const occurredAt = item.occurredAt ?? new Date().toISOString();
  const next: WalletActivityItem = {
    ...item,
    id: item.id ?? `${item.hash ?? item.type}-${occurredAt}`,
    occurredAt,
    timestamp: formatActivityTimestamp(occurredAt),
    chainId: item.chainId ?? context.chainId,
    accountAddress: item.accountAddress ?? context.accountAddress,
    displayHash: item.displayHash ?? shortHash(item.hash),
  };
  const current = await readWalletActivity(context);
  await writeWalletActivity(context, [next, ...current]);
  return next;
}

export async function clearWalletActivity(context: WalletActivityContext): Promise<void> {
  await AsyncStorage.removeItem(storageKey(context));
}
