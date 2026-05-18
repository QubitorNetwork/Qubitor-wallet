import type { QubitorAccount, Hex } from "@qubitor/core";
import type { DappConnection } from "@qubitor/wallet-policy";

export const MOCK_ADDRESS = "0x71a9f10E2e4e63F8d1E3E58AB4F2C07A06f11F6c" as Hex;

export const MOCK_ACCOUNT: QubitorAccount = {
  label: "Quanta Account",
  address: MOCK_ADDRESS,
  chainId: 91338,
  deployed: true,
  security: {
    mode: "PQ Native",
    recovery: "active",
    rotationRecommended: false,
    pqLayerEnabled: true,
  },
};

export const MOCK_BALANCE_QBT = "1.4823";
export const MOCK_BALANCE_LABEL = "1.4823 QBT";

export interface ActivityItem {
  id: string;
  type: "send" | "receive" | "swap" | "bridge" | "security";
  title: string;
  detail: string;
  timestamp: string;
  badge?: string;
}

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "1",
    type: "receive",
    title: "Received QBT",
    detail: "From 0x9f12...A82B",
    timestamp: "Today, 09:14",
    badge: "Hybrid Protected",
  },
  {
    id: "2",
    type: "security",
    title: "Recovery configured",
    detail: "3 of 5 guardians",
    timestamp: "Yesterday",
  },
  {
    id: "3",
    type: "send",
    title: "Sent QBT",
    detail: "To 0xC0D3...4F1E",
    timestamp: "2 days ago",
    badge: "Hybrid Protected",
  },
  {
    id: "4",
    type: "security",
    title: "Dapp connected",
    detail: "swap.qubitor.org",
    timestamp: "3 days ago",
  },
  {
    id: "5",
    type: "bridge",
    title: "Bridge prepared",
    detail: "0.25 QBT",
    timestamp: "1 week ago",
    badge: "Hybrid Route",
  },
];

export interface TokenItem {
  symbol: string;
  name: string;
  balance: string;
  fiatValue: string;
}

export const MOCK_TOKENS: TokenItem[] = [
  { symbol: "QBT", name: "Qubitor", balance: "1.4823", fiatValue: "Qubitor Testnet" },
  { symbol: "QUSD", name: "Qubitor USD Test", balance: "842.10", fiatValue: "Test asset" },
  { symbol: "QSEC", name: "Security Credit", balance: "120.00", fiatValue: "Policy asset" },
];

export const MOCK_CONNECTIONS: DappConnection[] = [
  {
    id: "qubiswap",
    name: "QubiSwap",
    domain: "swap.qubitor.org",
    verified: true,
    connectedAt: Date.now() - 1000 * 60 * 60 * 72,
    lastUsedAt: Date.now() - 1000 * 60 * 60 * 24,
    permissions: [{ permission: "view-account" }, { permission: "request-signatures" }],
    compatibilityMode: false,
  },
  {
    id: "qbt-market",
    name: "QBT Market",
    domain: "market.qubitor.org",
    verified: true,
    connectedAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    lastUsedAt: Date.now() - 1000 * 60 * 60 * 24 * 9,
    permissions: [
      { permission: "view-account" },
      { permission: "request-signatures" },
      { permission: "request-token-allowance" },
    ],
    compatibilityMode: true,
  },
  {
    id: "unknown-app",
    name: "newdapp.xyz",
    domain: "newdapp.xyz",
    verified: false,
    connectedAt: Date.now() - 1000 * 60 * 60 * 6,
    permissions: [{ permission: "view-account" }, { permission: "send-transactions" }],
    compatibilityMode: false,
  },
];

export const MOCK_GUARDIANS = ["Sarah's iPhone", "Recovery hardware", "Alex (guardian)"];
