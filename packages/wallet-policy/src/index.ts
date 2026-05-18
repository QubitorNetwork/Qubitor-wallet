/**
 * @qubitor/wallet-policy
 *
 * Dapp permissions, session key scopes, warning hierarchy.
 * Source: docs/swallet-ui-adaptation.md § Apps and § Dapp Connection,
 * docs/risk-warning-system.md, docs/copy-library.md § Dapp Permissions / § Session Keys.
 */
import type { Warning, WarningSeverity } from "@qubitor/core";

export type Permission =
  | "view-account"
  | "request-signatures"
  | "send-transactions"
  | "request-token-allowance"
  | "switch-chain";

export interface DappPermission {
  permission: Permission;
  scope?: {
    contracts?: string[];
    methods?: string[];
    spendLimit?: bigint;
    expiresAt?: number;
  };
}

export interface SessionKeyScope {
  contracts: string[];
  methods: string[];
  spendLimit: bigint;
  expiresAt: number;
}

export interface DappConnection {
  id: string;
  name: string;
  domain: string;
  verified: boolean;
  connectedAt: number;
  lastUsedAt?: number;
  permissions: DappPermission[];
  sessionKey?: SessionKeyScope;
  compatibilityMode: boolean;
}

export interface WarningRule {
  id: string;
  severity: WarningSeverity;
  matches: (input: WarningInput) => boolean;
  build: (input: WarningInput) => Warning;
}

export interface WarningInput {
  connection?: DappConnection;
  recipientIsNew?: boolean;
  recipientLooksSimilar?: boolean;
  recipientIsContract?: boolean;
  simulationFailed?: boolean;
  legacySigning?: boolean;
  unexpectedAssetMovement?: boolean;
  broadApproval?: boolean;
  domainMismatch?: boolean;
  permitDetected?: boolean;
}

const RULES: WarningRule[] = [
  {
    id: "new-recipient",
    severity: "review",
    matches: (i) => i.recipientIsNew === true,
    build: () => ({
      id: "new-recipient",
      severity: "review",
      title: "New address",
      detail: "Address format valid. Recipient is new, so review carefully before continuing.",
    }),
  },
  {
    id: "similar-recipient",
    severity: "warning",
    matches: (i) => i.recipientLooksSimilar === true,
    build: () => ({
      id: "similar-recipient",
      severity: "warning",
      title: "Similar to a recent address",
      detail: "This address looks similar to one you used recently. Confirm before sending.",
    }),
  },
  {
    id: "send-to-contract",
    severity: "review",
    matches: (i) => i.recipientIsContract === true,
    build: () => ({
      id: "send-to-contract",
      severity: "review",
      title: "Sending to a contract",
      detail: "The recipient is a contract. Review the action it will perform.",
    }),
  },
  {
    id: "simulation-failed",
    severity: "warning",
    matches: (i) => i.simulationFailed === true,
    build: () => ({
      id: "simulation-failed",
      severity: "warning",
      title: "Simulation failed",
      detail: "This transaction may not complete as expected.",
    }),
  },
  {
    id: "legacy-signing",
    severity: "review",
    matches: (i) => i.legacySigning === true,
    build: () => ({
      id: "legacy-signing",
      severity: "review",
      title: "Legacy signing",
      detail: "This action uses legacy signing and is not fully post-quantum protected.",
    }),
  },
  {
    id: "unexpected-movement",
    severity: "warning",
    matches: (i) => i.unexpectedAssetMovement === true,
    build: () => ({
      id: "unexpected-movement",
      severity: "warning",
      title: "Unexpected asset movement",
      detail: "This transaction may move assets beyond the amount shown in the original request.",
    }),
  },
  {
    id: "broad-approval",
    severity: "warning",
    matches: (i) => i.broadApproval === true,
    build: () => ({
      id: "broad-approval",
      severity: "warning",
      title: "Broad approval",
      detail: "This approval is broader than usual. Consider tightening the spend limit.",
    }),
  },
  {
    id: "domain-mismatch",
    severity: "critical",
    matches: (i) => i.domainMismatch === true,
    build: () => ({
      id: "domain-mismatch",
      severity: "critical",
      title: "Domain mismatch",
      detail: "The signing domain does not match the connected app's origin.",
    }),
  },
  {
    id: "permit-detected",
    severity: "warning",
    matches: (i) => i.permitDetected === true,
    build: () => ({
      id: "permit-detected",
      severity: "warning",
      title: "Permit can move funds",
      detail: "This signature may allow an app to spend tokens from your account.",
    }),
  },
];

export function evaluateWarnings(input: WarningInput): Warning[] {
  return RULES.filter((rule) => rule.matches(input)).map((rule) => rule.build(input));
}

export function summarizePermissions(permissions: DappPermission[]): string {
  if (permissions.length === 0) return "No permissions";
  const labels: Record<Permission, string> = {
    "view-account": "view account",
    "request-signatures": "request signatures",
    "send-transactions": "send transactions",
    "request-token-allowance": "request token allowances",
    "switch-chain": "switch chain",
  };
  return permissions.map((p) => labels[p.permission]).join(", ");
}
