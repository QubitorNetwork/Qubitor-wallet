import { View } from "react-native";
import { router } from "expo-router";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Row } from "@/components/Row";
import { WarningCard } from "@/components/WarningCard";
import { AddressDisplay } from "@/components/AddressDisplay";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";

export default function SetupSummary() {
  const snapshot = useAccountSnapshot();
  const { account } = snapshot;

  return (
    <PageContainer>
      <PageHeader title="You're all set" />

      <View className="gap-5">
        <Text variant="body" muted>
          Quick summary of your new Quanta Account.
        </Text>
        <Card>
          <View className="flex-row items-center justify-between">
            <Text variant="body" weight="semibold">
              {account.label}
            </Text>
            <Badge label={account.security.mode} />
          </View>
          <View className="mt-2">
            {snapshot.accountReady ? (
              <AddressDisplay address={account.address} />
            ) : (
              <Text variant="caption" muted>
                Loading account…
              </Text>
            )}
          </View>
          <View className="mt-4">
            <Row label="Recovery" value="Recovery Kit not exported yet" showChevron={false} />
            <Row label="Validation" value="ML-DSA PQ signature" showChevron={false} last />
          </View>
        </Card>
        <WarningCard
          severity="review"
          title="Export a Recovery Kit next"
          detail="The wallet is created. Export an encrypted Recovery Kit before moving significant funds."
        />
        <View className="flex-1" />
        <View className="items-center">
          <Button onPress={() => router.replace("/(tabs)/home")} disabled={!snapshot.accountReady}>
            Continue to Home
          </Button>
        </View>
      </View>
    </PageContainer>
  );
}
