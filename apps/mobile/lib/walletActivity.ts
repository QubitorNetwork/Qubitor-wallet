import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Hex } from "@qubitor/core";
import {
  explorerTxUrl,
  formatBalanceWei,
  type QubitorIndexedAddressActivity,
  type QubitorIndexerEvent,
  type QubitorIndexerTransaction,
} from "@qubitor/evm";
import type { ActivityItem } from "@/lib/runtimeTypes";

const ACTIVITY_STORAGE_PREFIX = "quanta.wallet.activity.v1";
const MAX_ACTIVITY_ITEMS = 40;

export interface WalletActivityItem extends ActivityItem {
  occurredAt: string;
  chainId: number;
  accountAddress?: Hex;
  source?: "local" | "indexer" | "merged";
  direction?: "sent" | "received" | "self" | "unknown";
  blockNumber?: number | string;
  explorerUrl?: string;
  labels?: string[];
  indexedAt?: string;
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

function normalizeStatus(value?: string): WalletActivityItem["status"] {
  if (!value) return "success";
  const status = value.toLowerCase();
  if (status.includes("pending")) return "pending";
  if (status.includes("fail") || status.includes("revert")) return "failed";
  return "success";
}

function normalizeDirection(
  tx: Pick<QubitorIndexerTransaction, "from" | "to">,
  accountAddress?: Hex,
): NonNullable<WalletActivityItem["direction"]> {
  if (!accountAddress) return "unknown";
  const account = accountAddress.toLowerCase();
  const fromMatches = tx.from?.toLowerCase() === account;
  const toMatches = tx.to?.toLowerCase() === account;
  if (fromMatches && toMatches) return "self";
  if (fromMatches) return "sent";
  if (toMatches) return "received";
  return "unknown";
}

function labelsForTransaction(tx: QubitorIndexerTransaction, direction: WalletActivityItem["direction"]): string[] {
  const tags = (tx.tags ?? []).map((tag) => tag.toLowerCase());
  const labels = new Set<string>();
  if (tags.some((tag) => tag.includes("faucet"))) labels.add("Faucet");
  if (tags.some((tag) => tag.includes("deploy"))) labels.add("Account deployed");
  if (tags.some((tag) => tag.includes("rotate"))) labels.add("PQ key rotated");
  if (direction === "sent") labels.add("Sent");
  if (direction === "received") labels.add("Received");
  return [...labels];
}

function labelsForEvent(event: QubitorIndexerEvent): string[] {
  const haystack = [event.type, ...(event.tags ?? [])].filter(Boolean).join(" ").toLowerCase();
  if (haystack.includes("faucet")) return ["Faucet"];
  if (haystack.includes("rotate")) return ["PQ key rotated"];
  if (haystack.includes("deploy")) return ["Account deployed"];
  return ["Security"];
}

function eventTitle(labels: string[]): string {
  if (labels.includes("PQ key rotated")) return "PQ key rotated";
  if (labels.includes("Account deployed")) return "Account deployed";
  if (labels.includes("Faucet")) return "Faucet";
  return "Security event";
}

function normalizeIndexedTransaction(
  tx: QubitorIndexerTransaction,
  context: WalletActivityContext,
  indexedAt?: string,
): WalletActivityItem {
  const occurredAt = tx.timestamp ?? indexedAt ?? new Date().toISOString();
  const direction = normalizeDirection(tx, context.accountAddress);
  const labels = labelsForTransaction(tx, direction);
  const valueWei = tx.value !== undefined ? BigInt(tx.value) : 0n;
  const amountLabel = `${formatBalanceWei(valueWei)} QBT`;
  const title =
    labels[0] ??
    (direction === "sent" ? "Sent" : direction === "received" ? "Received" : "Transaction");
  const status = normalizeStatus(tx.status);

  return {
    id: tx.hash,
    type: direction === "received" ? "receive" : "send",
    title,
    detail: status === "failed" ? "Transaction failed" : amountLabel,
    timestamp: formatActivityTimestamp(occurredAt),
    occurredAt,
    chainId: context.chainId,
    accountAddress: context.accountAddress,
    source: "indexer",
    direction,
    blockNumber: tx.blockNumber,
    indexedAt,
    explorerUrl: explorerTxUrl(tx.hash, context.chainId),
    labels,
    hash: tx.hash,
    displayHash: shortHash(tx.hash),
    from: tx.from,
    to: tx.to,
    amountLabel,
    status,
    badge: status === "failed" ? "Failed" : labels[0] ?? "Indexed",
  };
}

function normalizeIndexedEvent(
  event: QubitorIndexerEvent,
  context: WalletActivityContext,
  indexedAt?: string,
): WalletActivityItem {
  const occurredAt = event.timestamp ?? indexedAt ?? new Date().toISOString();
  const hash = event.transactionHash;
  const labels = labelsForEvent(event);
  const title = eventTitle(labels);
  return {
    id: event.id ?? `${hash ?? event.type ?? "event"}-${event.blockNumber ?? occurredAt}`,
    type: "security",
    title,
    detail: event.type ?? labels.join(", "),
    timestamp: formatActivityTimestamp(occurredAt),
    occurredAt,
    chainId: context.chainId,
    accountAddress: context.accountAddress,
    source: "indexer",
    direction: "unknown",
    blockNumber: event.blockNumber,
    indexedAt,
    explorerUrl: hash ? explorerTxUrl(hash, context.chainId) : undefined,
    labels,
    hash,
    displayHash: shortHash(hash),
    status: "success",
    badge: labels[0],
  };
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

export function indexedActivityItems(
  context: WalletActivityContext,
  indexed?: QubitorIndexedAddressActivity,
): WalletActivityItem[] {
  if (!indexed) return [];
  return [
    ...(indexed.transactions ?? []).map((tx) => normalizeIndexedTransaction(tx, context, indexed.indexedAt)),
    ...(indexed.events ?? []).map((event) => normalizeIndexedEvent(event, context, indexed.indexedAt)),
  ];
}

export function mergeWalletActivity(
  local: readonly WalletActivityItem[],
  indexed: readonly WalletActivityItem[],
): WalletActivityItem[] {
  const merged = new Map<string, WalletActivityItem>();
  for (const item of local) {
    merged.set(item.hash?.toLowerCase() ?? item.id, item);
  }
  for (const item of indexed) {
    const key = item.hash?.toLowerCase() ?? item.id;
    const previous = merged.get(key);
    merged.set(key, {
      ...previous,
      ...item,
      source: previous ? "merged" : item.source,
      labels: [...new Set([...(previous?.labels ?? []), ...(item.labels ?? [])])],
    });
  }
  return [...merged.values()]
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, MAX_ACTIVITY_ITEMS);
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
