import { useState } from "react";
import { Pressable, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Row } from "@/components/Row";
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";
import { Badge } from "@/components/Badge";
import { colors } from "@qubitor/ui-tokens";
import { shareDebugBundle } from "@/lib/externalActions";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";
import type { WalletActivityItem } from "@/lib/walletActivity";
import { QUBITOR_ACCOUNT_FACTORY, QUBITOR_MLDSA65_PRECOMPILE } from "@qubitor/evm";

function shortHash(value?: string) {
  if (!value) return "Not recorded";
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function ExpandableSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <Pressable onPress={() => setOpen((o) => !o)} className="flex-row items-center justify-between">
        <Text variant="body" weight="semibold">
          {title}
        </Text>
        {open ? <ChevronUp size={18} color={colors.text} /> : <ChevronDown size={18} color={colors.text} />}
      </Pressable>
      {open ? <View className="mt-3">{children}</View> : null}
    </Card>
  );
}

/** Source: SWallet `Setting.png` + `Wallet analytics (transactions).png` (compact rows). */
export default function DeveloperMode() {
  const snapshot = useAccountSnapshot();
  const account = snapshot.account;
  const accountAddressLabel = snapshot.accountReady ? account.address : "Loading";
  const latestTx = snapshot.pqTxReceipt ?? snapshot.pqRotateReceipt ?? snapshot.deployReceipt;

  return (
    <PageContainer>
      <PageHeader
        title="Developer Mode"
        showBack
        trailing={<Badge label="Live" color={snapshot.status === "live" ? "positive" : "neutral"} />}
      />

      <View className="gap-4">
        <WarningCard
          severity="info"
          title="Advanced details"
          detail="Developer Mode shows raw account and transaction details. Normal users do not need these fields to use Qubitor safely."
        />

        {snapshot.status === "fallback" ? (
          <WarningCard
            severity="warning"
            title="Live RPC unavailable"
            detail={snapshot.error ?? "Developer details are limited to local wallet metadata."}
          />
        ) : null}

            <ExpandableSection title="Smart account" defaultOpen>
              <Row label="Address" value={accountAddressLabel} showChevron={false} />
              <Row label="Chain ID" value={String(account.chainId)} showChevron={false} />
              <Row label="Network" value={snapshot.chainName} showChevron={false} />
              <Row label="Gas coin" value={snapshot.nativeCurrencySymbol} showChevron={false} />
              <Row label="Deployment" value={snapshot.deploymentLabel} showChevron={false} />
              <Row label="Readiness" value={snapshot.readinessLabel} showChevron={false} />
              {snapshot.pqProfile ? (
                <Row label="PQ key version" value={`v${snapshot.pqProfile.keyVersion}`} showChevron={false} />
              ) : null}
              {snapshot.pqCurrentPublicKeyCommitment ? (
                <Row label="Active PQ key" value={shortHash(snapshot.pqCurrentPublicKeyCommitment)} showChevron={false} />
              ) : null}
              {snapshot.pqAccount ? (
                <Row label="Deployment PQ key" value={shortHash(snapshot.pqAccount.publicKeyCommitment)} showChevron={false} />
              ) : null}
              {snapshot.pqProfile?.lastRotationTransactionHash ? (
                <Row label="Last rotation tx" value={shortHash(snapshot.pqProfile.lastRotationTransactionHash)} showChevron={false} />
              ) : null}
              <Row label="RPC status" value={snapshot.status === "live" ? "Live" : snapshot.status} showChevron={false} />
              {snapshot.latestBlock ? <Row label="Latest block" value={snapshot.latestBlock} showChevron={false} /> : null}
              <Row label="RPC URL" value={snapshot.rpcUrl ?? "Default"} showChevron={false} />
              <Row label="Factory" value={QUBITOR_ACCOUNT_FACTORY} showChevron={false} />
              <Row label="ML-DSA precompile" value={QUBITOR_MLDSA65_PRECOMPILE} showChevron={false} last />
            </ExpandableSection>

            <ExpandableSection title="Modules">
              <Row label="Validation" value={snapshot.isQubitorDevnet ? "ML-DSA-65 native" : "HybridSigValidator v1.2"} showChevron={false} />
              <Row label="Recovery" value="Encrypted Recovery Kit" showChevron={false} />
              <Row label="Connected apps" value="Extension storage only" showChevron={false} last />
            </ExpandableSection>

            <ExpandableSection title="Latest wallet action">
              <Row
                label="Transaction"
                value={
                  latestTx && "transactionHash" in latestTx && latestTx.transactionHash
                    ? shortHash(latestTx.transactionHash)
                    : "None recorded this session"
                }
                showChevron={false}
              />
              <Row
                label="Status"
                value={latestTx && "status" in latestTx && latestTx.status ? String(latestTx.status) : "—"}
                showChevron={false}
                last
              />
            </ExpandableSection>

            <View className="items-start">
              <Button
                variant="secondary"
                onPress={() =>
                  shareDebugBundle({
                    account,
                    chainConfig: {
                      chainId: snapshot.chainId,
                      chainName: snapshot.chainName,
                      nativeCurrencySymbol: snapshot.nativeCurrencySymbol,
                      rpcUrl: snapshot.rpcUrl ?? "default",
                      latestBlock: snapshot.latestBlock ?? null,
                    },
                    diagnostics: {
                      walletStatus: snapshot.walletStatus,
                      snapshotStatus: snapshot.status,
                      deployment: snapshot.deploymentLabel,
                      readiness: snapshot.readinessLabel,
                      error: snapshot.error ?? null,
                    },
                    activity: snapshot.activity.filter((item): item is WalletActivityItem =>
                      "occurredAt" in item && typeof item.occurredAt === "string",
                    ),
                    latestUserOperation:
                      latestTx && "transactionHash" in latestTx
                        ? { transactionHash: latestTx.transactionHash, status: "status" in latestTx ? latestTx.status : undefined }
                        : undefined,
                  })
                }
              >
                Export debug JSON
              </Button>
            </View>
      </View>
    </PageContainer>
  );
}
