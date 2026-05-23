import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Row } from "@/components/Row";
import { WarningCard } from "@/components/WarningCard";
import { colors } from "@qubitor/ui-tokens";
import { formatBalanceWei, type QubitorSimulationResult } from "@qubitor/evm";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";

/** Real receipt-style review. The "Simulation" row is driven by a live
 *  eth_estimateGas + eth_call + eth_gasPrice preflight — not a mock toggle. */
export default function TransactionReview() {
  const [advanced, setAdvanced] = useState(false);
  const snapshot = useAccountSnapshot();
  const params = useLocalSearchParams<{
    target?: string;
    amount?: string;
    valueWei?: string;
    asset?: string;
  }>();

  const target = params.target?.startsWith("0x")
    ? (params.target as `0x${string}`)
    : ("0x000000000000000000000000000000000000dEaD" as const);
  const valueWei = params.valueWei ?? "250000000000000000";
  const asset = params.asset ?? snapshot.nativeCurrencySymbol;
  const amountLabel = params.amount ? `${params.amount} ${asset}` : `${formatBalanceWei(BigInt(valueWei))} ${asset}`;

  const [sim, setSim] = useState<QubitorSimulationResult | undefined>();
  const [simError, setSimError] = useState<string | undefined>();
  const [simulating, setSimulating] = useState(true);

  useEffect(() => {
    let active = true;
    setSimulating(true);
    snapshot
      .simulateTransfer({ to: target, valueWei: BigInt(valueWei) })
      .then((result) => {
        if (active) setSim(result);
      })
      .catch((error: unknown) => {
        if (active) setSimError(error instanceof Error ? error.message : "Simulation unavailable");
      })
      .finally(() => {
        if (active) setSimulating(false);
      });
    return () => {
      active = false;
    };
  }, [snapshot, target, valueWei]);

  const willRevert = sim ? !sim.willSucceed : false;
  const insufficient = sim?.insufficientFunds ?? false;
  const walletUnlocked = snapshot.walletStatus === "unlocked";
  const blockConfirm = simulating || willRevert || insufficient || !walletUnlocked || snapshot.pqTxStatus === "requesting";

  const simulationValue = simulating
    ? "Simulating…"
    : simError
      ? "Unavailable"
      : willRevert
        ? "Would revert"
        : `Sends ${amountLabel}`;

  const feeValue =
    sim?.maxFeeWei !== undefined
      ? `~${formatBalanceWei(sim.maxFeeWei)} ${snapshot.nativeCurrencySymbol}`
      : `${snapshot.nativeCurrencySymbol} gas`;

  const confirm = async () => {
    if (snapshot.isQubitorDevnet) {
      try {
        await snapshot.sendPQTransfer({ target, valueWei });
      } catch {
        return;
      }
    }
    router.replace("/(tabs)/activity");
  };

  return (
    <PageContainer>
      <PageHeader title="Review" showBack centerTitle />

      <View className="gap-5">
        <View className="items-center">
          <Badge label={snapshot.account.security.mode} />
        </View>
        <Text variant="body" muted className="text-center">
          This transfer is validated by your Quanta smart account on {snapshot.chainName}.
        </Text>

        <Card>
          <Text variant="caption" muted weight="medium" className="uppercase tracking-wider">
            Action
          </Text>
          <Text variant="body-lg" weight="semibold" className="mt-1">
            Send {amountLabel}
          </Text>
          <View className="mt-4">
            <Row label="From" value="Quanta Account" showChevron={false} />
            <Row label="To" value={`${target.slice(0, 6)}…${target.slice(-4)}`} showChevron={false} />
            <Row label="Asset" value={amountLabel} showChevron={false} />
            <Row label="Network" value={snapshot.chainName} showChevron={false} />
            <Row label="Network fee" value={feeValue} showChevron={false} />
            <Row label="Simulation" value={simulationValue} showChevron={false} />
            <Row label="Validation" value="ML-DSA PQ signature" showChevron={false} last />
          </View>
        </Card>

        {willRevert ? (
          <WarningCard
            severity="critical"
            title="Transaction would revert"
            detail={sim?.revertReason ?? "The node rejected this transfer in simulation."}
          />
        ) : null}
        {insufficient ? (
          <WarningCard
            severity="warning"
            title="Insufficient funds"
            detail={`Balance ${formatBalanceWei(sim?.senderBalanceBeforeWei ?? 0n)} ${snapshot.nativeCurrencySymbol} can't cover value + fee.`}
          />
        ) : null}
        {simError ? (
          <WarningCard
            severity="review"
            title="Simulation unavailable"
            detail={`${simError}. Review carefully before confirming.`}
          />
        ) : null}
        {!walletUnlocked ? (
          <WarningCard
            severity="review"
            title="Unlock required"
            detail="Unlock Quanta Wallet before signing this PQ transaction."
          />
        ) : null}
        {snapshot.pqTxStatus === "error" ? (
          <WarningCard
            severity="review"
            title="PQ transfer failed"
            detail={snapshot.pqTxError ?? "Fund and deploy the Quanta Account before confirming."}
          />
        ) : null}

        <Pressable onPress={() => setAdvanced((a) => !a)} className="flex-row items-center gap-2 py-2">
          <Text variant="body" weight="medium">
            Advanced details
          </Text>
          {advanced ? <ChevronUp size={16} color={colors.text} /> : <ChevronDown size={16} color={colors.text} />}
        </Pressable>
        {advanced ? (
          <Card>
            <Row label="Account" value={snapshot.accountReady ? snapshot.account.address : "Loading"} showChevron={false} />
            <Row label="Deployment" value={snapshot.deploymentLabel} showChevron={false} />
            <Row label="Readiness" value={snapshot.readinessLabel} showChevron={false} />
            <Row
              label="Gas estimate"
              value={sim?.gasEstimate !== undefined ? sim.gasEstimate.toString() : "—"}
              showChevron={false}
            />
            <Row
              label="Gas price"
              value={sim?.gasPriceWei !== undefined ? `${sim.gasPriceWei.toString()} wei` : "—"}
              showChevron={false}
            />
            <Row
              label="Total out"
              value={
                sim ? `${formatBalanceWei(sim.totalOutWei)} ${snapshot.nativeCurrencySymbol}` : "—"
              }
              showChevron={false}
            />
            <Row label="Precompile" value={snapshot.isQubitorDevnet ? "0x0000…0100" : "n/a"} showChevron={false} last />
          </Card>
        ) : null}

        <View className="flex-row gap-3">
          <Button variant="secondary" className="flex-1" onPress={() => router.back()}>
            Reject
          </Button>
          {!walletUnlocked ? (
            <Button className="flex-1" onPress={() => router.push("/unlock")}>
              Unlock
            </Button>
          ) : (
          <Button className="flex-1" onPress={confirm} disabled={blockConfirm}>
            {snapshot.pqTxStatus === "requesting"
              ? "Signing PQ"
              : simulating
                ? "Simulating"
                : "Confirm"}
          </Button>
          )}
        </View>
      </View>
    </PageContainer>
  );
}
