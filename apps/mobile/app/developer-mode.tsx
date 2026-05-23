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
import { useMockState } from "@/hooks/useMockState";
import { DebugOnly } from "@/components/DebugOnly";
import { shareDebugBundle } from "@/lib/externalActions";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";

const STATES = ["Disabled", "Enabled", "Transaction debug", "Export ready", "Logs unavailable"] as const;

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
  const { variant, cycle } = useMockState(STATES, "Enabled");
  const snapshot = useAccountSnapshot();
  const account = snapshot.account;
  const accountAddressLabel = snapshot.accountReady ? account.address : "Loading";

  const disabled = variant === "Disabled";
  const showTxDebug = variant === "Transaction debug";
  const exportReady = variant === "Export ready";
  const logsUnavailable = variant === "Logs unavailable";

  return (
    <PageContainer>
      <PageHeader
        title="Developer Mode"
        showBack
        trailing={<Badge label={disabled ? "Off" : "On"} color={disabled ? "neutral" : "positive"} />}
      />

      <View className="gap-4">
        <WarningCard
          severity="info"
          title="Advanced details"
          detail="Developer Mode shows raw account and transaction details. Normal users do not need these fields to use Qubitor safely."
        />

        {disabled ? (
          <Card>
            <Text variant="body" muted>
              Developer Mode is off. Enable it to inspect account internals, UserOperations, and signatures.
            </Text>
            <View className="mt-3 self-start">
              <Button>Enable Developer Mode</Button>
            </View>
          </Card>
        ) : (
          <>
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
              <Row label="Factory" value={snapshot.isQubitorDevnet ? "QubitorAccountFactory" : "0xFACADE…00FA"} showChevron={false} />
              <Row label="Precompile" value={snapshot.isQubitorDevnet ? "0x0000…0100" : "n/a"} showChevron={false} last />
            </ExpandableSection>

            <ExpandableSection title="Modules">
              <Row label="Validation" value={snapshot.isQubitorDevnet ? "ML-DSA-65 native" : "HybridSigValidator v1.2"} showChevron={false} />
              <Row label="Recovery" value="GuardianModule v1.0" showChevron={false} />
              <Row label="Session keys" value="SessionKeyModule v0.9" showChevron={false} last />
            </ExpandableSection>

            {showTxDebug ? (
              <ExpandableSection title="Latest UserOperation" defaultOpen>
                <Row label="Hash" value="0x9a…c1" showChevron={false} />
                <Row label="Bundler" value="bundler.qubitor.dev" showChevron={false} />
                <Row label="Paymaster" value="None" showChevron={false} />
                <Row label="Status" value="Confirmed" showChevron={false} last />
              </ExpandableSection>
            ) : (
              <ExpandableSection title="UserOperation">
                <Row label="Latest hash" value="0x9a…c1" showChevron={false} />
                <Row label="Bundler" value="bundler.qubitor.dev" showChevron={false} />
                <Row label="Paymaster" value="None" showChevron={false} last />
              </ExpandableSection>
            )}

            {logsUnavailable ? (
              <WarningCard
                severity="review"
                title="Logs unavailable"
                detail="Bundler logs aren't reachable right now. Try again later."
              />
            ) : null}

            {exportReady ? (
              <WarningCard
                severity="info"
                title="Export ready"
                detail="A debug bundle is ready for download. Tap Export to share."
              />
            ) : null}

            <View className="items-start">
              <Button variant="secondary" onPress={() => shareDebugBundle({ account })}>
                Export debug JSON
              </Button>
            </View>
          </>
        )}

        <View className="items-center">
          <DebugOnly>
          <Button variant="tertiary" onPress={cycle}>
            State: {variant}
          </Button>
          </DebugOnly>
        </View>
      </View>
    </PageContainer>
  );
}
