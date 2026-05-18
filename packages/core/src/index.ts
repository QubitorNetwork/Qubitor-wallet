/**
 * @qubitor/core
 *
 * Account model, security states, validation labels, warning logic.
 * Source: docs/security-state-system.md, docs/screen-requirements.md, docs/swallet-ui-adaptation.md.
 */

export type Hex = `0x${string}`;

export type SecurityMode =
  | "Smart Account Ready"
  | "Hybrid Protected"
  | "PQ Ready"
  | "PQ Native"
  | "Legacy"
  | "Compatibility Mode";

export type RecoveryStatus = "active" | "skipped" | "incomplete" | "missing";

export type WarningSeverity = "info" | "review" | "warning" | "critical";

export type ValidationMethod =
  | "Single key"
  | "Hybrid signature"
  | "PQ signature"
  | "Session key"
  | "Guardian recovery";

export interface SecurityState {
  mode: SecurityMode;
  recovery: RecoveryStatus;
  rotationRecommended: boolean;
  pqLayerEnabled: boolean;
}

export interface QubitorAccount {
  label: string;
  address: Hex;
  chainId: number;
  deployed: boolean;
  security: SecurityState;
}

export interface Warning {
  id: string;
  severity: WarningSeverity;
  title: string;
  detail?: string;
}

export type ScreenName =
  | "welcome"
  | "address"
  | "home"
  | "send"
  | "transaction-review"
  | "receive"
  | "security-center"
  | "readiness-report"
  | "apps"
  | "dapp-connection"
  | "bridge"
  | "recovery"
  | "developer-mode"
  | "activity"
  | "accounts"
  | "message-signing-review"
  | "connect-existing";

/**
 * Human-readable label for a security mode.
 * docs/copy-library.md § Hybrid Protection / § Post-Quantum Readiness.
 */
export function securityModeLabel(mode: SecurityMode): string {
  switch (mode) {
    case "Smart Account Ready":
      return "Smart Account Ready";
    case "Hybrid Protected":
      return "Hybrid Protected";
    case "PQ Ready":
      return "PQ Ready";
    case "PQ Native":
      return "PQ Native";
    case "Legacy":
      return "Legacy";
    case "Compatibility Mode":
      return "Compatibility Mode";
  }
}

export function shortenAddress(address: Hex, lead = 6, trail = 4): string {
  if (address.length <= lead + trail + 2) return address;
  return `${address.slice(0, lead)}...${address.slice(-trail)}`;
}

export function readinessScore(security: SecurityState): number {
  let score = 0;
  if (security.mode === "Smart Account Ready") score += 30;
  if (security.mode === "Hybrid Protected") score += 60;
  if (security.mode === "PQ Ready") score += 80;
  if (security.mode === "PQ Native") score += 95;
  if (security.recovery === "active") score += 15;
  if (security.pqLayerEnabled) score += 5;
  if (security.rotationRecommended) score -= 5;
  return Math.max(0, Math.min(100, score));
}

export const ACCOUNT_TYPE_LABEL = "Qubitor Account";

/**
 * Returns true when the prototype should expose dev-only affordances
 * (state-cycle buttons, mock toggles, etc.).
 *
 * Driven by the env flag `EXPO_PUBLIC_QUBITOR_DEBUG`. Set to "1" in `.env`
 * during development; unset / "0" in production / shareable demo builds.
 */
export function isDebugMode(): boolean {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.EXPO_PUBLIC_QUBITOR_DEBUG === "1";
}
