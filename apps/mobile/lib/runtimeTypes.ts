export interface ActivityItem {
  id: string;
  type: "send" | "receive" | "swap" | "bridge" | "security";
  title: string;
  detail: string;
  timestamp: string;
  badge?: string;
}

export interface TokenItem {
  symbol: string;
  name: string;
  balance: string;
  fiatValue: string;
}
