import { Alert, Linking, Share } from "react-native";
import { readinessScore, type QubitorAccount } from "@qubitor/core";
import { explorerTxUrl as qubitorExplorerTxUrl } from "@qubitor/evm";
import type { WalletActivityItem } from "@/lib/walletActivity";

interface DebugBundleInput {
  account: QubitorAccount;
  latestUserOperation?: Record<string, unknown>;
  logs?: string[];
  chainConfig?: Record<string, unknown>;
  diagnostics?: Record<string, unknown>;
  activity?: WalletActivityItem[];
}

function stringifyPayload(payload: unknown): string {
  return JSON.stringify(payload, (_key, value) => (typeof value === "bigint" ? value.toString() : value), 2);
}

async function shareText(title: string, message: string) {
  try {
    await Share.share({ title, message });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "The system share sheet could not be opened.";
    Alert.alert("Share unavailable", detail);
  }
}

export function buildReadinessReport(account: QubitorAccount) {
  return {
    generatedAt: new Date().toISOString(),
    account: {
      label: account.label,
      address: account.address,
      chainId: account.chainId,
      deployed: account.deployed,
    },
    security: account.security,
    readinessScore: readinessScore(account.security),
    notes: [
      "Qubitor readiness comes from smart-account validation logic, not the 0x address format.",
      "This report is generated from the current Quanta Wallet runtime state.",
    ],
  };
}

export async function shareReadinessReport(account: QubitorAccount) {
  await shareText("Qubitor readiness report", stringifyPayload(buildReadinessReport(account)));
}

export async function shareDebugBundle(input: DebugBundleInput) {
  const bundle = {
    generatedAt: new Date().toISOString(),
    build: "runtime",
    account: {
      label: input.account.label,
      address: input.account.address,
      chainId: input.account.chainId,
      deployed: input.account.deployed,
      security: input.account.security,
    },
    chainConfig: input.chainConfig ?? null,
    diagnostics: input.diagnostics ?? null,
    recentActivity: (input.activity ?? []).slice(0, 20).map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      detail: item.detail,
      status: item.status,
      source: item.source,
      direction: item.direction,
      hash: item.hash,
      blockNumber: item.blockNumber,
      labels: item.labels,
      occurredAt: item.occurredAt,
      explorerUrl: item.explorerUrl,
    })),
    latestUserOperation: input.latestUserOperation ?? null,
    logs: input.logs ?? [],
    redactions: [
      "No passcodes are exported.",
      "No private ML-DSA keys are exported.",
      "No Recovery Kit payloads are exported.",
      "No encrypted vault blobs are exported.",
    ],
  };

  await shareText("Qubitor debug bundle", stringifyPayload(bundle));
}

export async function shareQubitorDevPQBackup(payload: string) {
  await shareText("Qubitor PQ wallet backup", payload);
}

export function explorerTxUrl(hash: string, chainId = 91338): string {
  return qubitorExplorerTxUrl(hash, chainId);
}

export async function openExternalUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "The link could not be opened on this device.";
    Alert.alert("Link unavailable", detail);
  }
}
