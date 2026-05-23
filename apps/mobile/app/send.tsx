import { useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Row } from "@/components/Row";
import { WarningCard } from "@/components/WarningCard";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";
import {
  formatBalanceWei,
  isValidEvmAddress,
  normalizeEvmAddress,
  parseNativeAmountToWei,
  type QubitorSimulationResult,
} from "@qubitor/evm";

function tryParseAmount(value: string): bigint | undefined {
  try {
    const wei = parseNativeAmountToWei(value);
    return wei > 0n ? wei : undefined;
  } catch {
    return undefined;
  }
}

/** Real Send — live recipient/amount validation plus a debounced on-chain
 *  fee preview (eth_estimateGas + eth_gasPrice). No mock state. */
export default function Send() {
  const snapshot = useAccountSnapshot();
  const [asset, setAsset] = useState(snapshot.nativeCurrencySymbol);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sim, setSim] = useState<QubitorSimulationResult | undefined>();
  const [simulating, setSimulating] = useState(false);

  const trimmedRecipient = recipient.trim();
  const parsedAmountWei = tryParseAmount(amount);
  const recipientValid = isValidEvmAddress(trimmedRecipient);
  const recipientIsInvalid = trimmedRecipient.length > 0 && !recipientValid;
  const amountIsInvalid = amount.trim().length > 0 && parsedAmountWei === undefined;
  const insufficientFunds =
    parsedAmountWei !== undefined && snapshot.balanceWei !== undefined && parsedAmountWei > snapshot.balanceWei;
  const accountReady = snapshot.accountReady && snapshot.status === "live";
  const walletUnlocked = snapshot.walletStatus === "unlocked";

  useEffect(() => {
    setAsset((current) => (current === "QBT" ? snapshot.nativeCurrencySymbol : current));
  }, [snapshot.nativeCurrencySymbol]);

  // Debounced real fee preview once recipient + amount are valid.
  useEffect(() => {
    if (!recipientValid || parsedAmountWei === undefined) {
      setSim(undefined);
      return;
    }
    let active = true;
    setSimulating(true);
    const handle = setTimeout(() => {
      snapshot
        .simulateTransfer({ to: normalizeEvmAddress(trimmedRecipient), valueWei: parsedAmountWei })
        .then((result) => {
          if (active) setSim(result);
        })
        .catch(() => {
          if (active) setSim(undefined);
        })
        .finally(() => {
          if (active) setSimulating(false);
        });
    }, 450);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [snapshot, recipientValid, trimmedRecipient, parsedAmountWei]);

  const wouldRevert = sim ? !sim.willSucceed : false;
  const simInsufficient = sim?.insufficientFunds ?? false;
  const canReview =
    accountReady &&
    walletUnlocked &&
    recipientValid &&
    parsedAmountWei !== undefined &&
    !insufficientFunds &&
    !wouldRevert &&
    !simInsufficient;

  return (
    <PageContainer>
      <PageHeader title="Send" eyebrow="03 / Transfer" showBack centerTitle />

      <View className="gap-4">
        <Card>
          <Text variant="caption" muted weight="medium" className="uppercase tracking-wider">
            From
          </Text>
          <Text variant="body-lg" weight="semibold" className="mt-1">
            Quanta 0x smart account
          </Text>
          <Text variant="caption" muted className="mt-1">
            Balance {snapshot.balanceLabel}
          </Text>
        </Card>

        {!accountReady ? (
          <WarningCard
            severity="info"
            title="Account is loading"
            detail="Wait for the live Quanta Account address and balance before preparing a transfer."
          />
        ) : null}
        {accountReady && !walletUnlocked ? (
          <WarningCard
            severity="review"
            title="Unlock required"
            detail="Viewing balance works while locked. Unlock before signing a QBT transfer."
          />
        ) : null}

        <View className="gap-3">
          <Input label="Asset" value={asset} onChangeText={setAsset} />
          <Input
            label="Recipient"
            placeholder="0x…"
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
          />
          <Input
            label="Amount"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <Input label="Network" value={snapshot.chainName} editable={false} />
        </View>

        {recipientIsInvalid ? (
          <WarningCard severity="warning" title="Invalid recipient" detail="Address does not look like a valid 0x address." />
        ) : null}
        {amountIsInvalid ? (
          <WarningCard severity="warning" title="Invalid amount" detail="Enter a positive decimal amount." />
        ) : null}
        {insufficientFunds ? (
          <WarningCard
            severity="warning"
            title="Insufficient funds"
            detail={`Balance ${snapshot.balanceLabel} can't cover this amount.`}
          />
        ) : null}

        {canReview || simulating || sim ? (
          <Card>
            <Text variant="caption" muted weight="medium" className="uppercase tracking-wider">
              Fee preview
            </Text>
            <View className="mt-2">
              <Row
                label="Status"
                value={simulating ? "Estimating…" : wouldRevert ? "Would revert" : sim ? "OK" : "—"}
                showChevron={false}
              />
              <Row
                label="Network fee"
                value={
                  sim?.maxFeeWei !== undefined
                    ? `~${formatBalanceWei(sim.maxFeeWei)} ${snapshot.nativeCurrencySymbol}`
                    : "—"
                }
                showChevron={false}
              />
              <Row
                label="Total out"
                value={
                  sim ? `${formatBalanceWei(sim.totalOutWei)} ${snapshot.nativeCurrencySymbol}` : "—"
                }
                showChevron={false}
                last
              />
            </View>
          </Card>
        ) : null}

        {wouldRevert ? (
          <WarningCard
            severity="critical"
            title="Transfer would revert"
            detail={sim?.revertReason ?? "The node rejected this transfer in simulation."}
          />
        ) : null}
        {simInsufficient && !insufficientFunds ? (
          <WarningCard
            severity="warning"
            title="Value + fee exceeds balance"
            detail="Lower the amount to leave room for the network fee."
          />
        ) : null}

        <View className="items-center mt-2">
          {accountReady && !walletUnlocked ? (
            <View className="mb-3 w-full">
              <Button size="block" variant="secondary" onPress={() => router.push("/unlock")}>
                Unlock Wallet
              </Button>
            </View>
          ) : null}
          <Button
            onPress={() => {
              router.push({
                pathname: "/transaction-review",
                params: {
                  target: normalizeEvmAddress(trimmedRecipient),
                  amount,
                  valueWei: parsedAmountWei!.toString(),
                  asset: snapshot.nativeCurrencySymbol,
                },
              });
            }}
            disabled={!canReview}
          >
            Continue to Review
          </Button>
        </View>
      </View>
    </PageContainer>
  );
}
