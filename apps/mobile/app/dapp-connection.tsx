import { View } from "react-native";
import { router } from "expo-router";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Row } from "@/components/Row";
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";
import { useMockState } from "@/hooks/useMockState";
import { DebugOnly } from "@/components/DebugOnly";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";

const STATES = ["Verified app", "Unverified app", "Compatibility mode required", "Unsupported request"] as const;

/** Source: SWallet `DApps.png` + `Payment example.png` (receipt-style review). */
export default function DappConnection() {
  const { variant, cycle } = useMockState(STATES);
  const snapshot = useAccountSnapshot();
  const verified = variant === "Verified app";
  const unsupported = variant === "Unsupported request";
  const compat = variant === "Compatibility mode required";

  const goToApps = () => router.replace("/(tabs)/apps");

  return (
    <PageContainer>
      <PageHeader title="Connect" showBack centerTitle />

      <View className="gap-5">
        <Text variant="body" muted className="text-center">
          This app wants to connect to your Quanta Account.
        </Text>

        <Card>
          <View className="flex-row items-center justify-between">
            <Text variant="title" weight="semibold">
              QubiSwap
            </Text>
            <Badge label={verified ? "Verified" : "Unverified"} />
          </View>
          <Text variant="caption" muted className="mt-0.5">
            swap.qubitor.org
          </Text>
          <View className="mt-4">
            <Row label="Account" value="Quanta Account" showChevron={false} />
            <Row label="Chain" value={snapshot.chainName} showChevron={false} />
            <Row label="Permissions" value="View account, Sign messages" showChevron={false} />
            <Row label="Session" value="24 hours" showChevron={false} />
            <Row label="Compatibility" value={compat ? "Required" : "Not needed"} showChevron={false} last />
          </View>
        </Card>

        {!verified && !unsupported ? (
          <WarningCard
            severity="warning"
            title="Unverified app"
            detail="We could not verify this app's identity. Connect only if you trust it."
          />
        ) : null}
        {compat ? (
          <WarningCard
            severity="review"
            title="Compatibility mode required"
            detail="This dapp does not fully support smart accounts. Some protections may be limited."
          />
        ) : null}
        {unsupported ? (
          <WarningCard
            severity="critical"
            title="Unsupported request"
            detail="This app is requesting capabilities Qubitor does not support."
          />
        ) : null}

        <View className="flex-row gap-3">
          <Button variant="secondary" className="flex-1" onPress={() => router.back()}>
            Reject
          </Button>
          <Button variant="secondary" className="flex-1" onPress={goToApps} disabled={unsupported}>
            Limited
          </Button>
          <Button className="flex-1" onPress={goToApps} disabled={unsupported}>
            Connect
          </Button>
        </View>

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
