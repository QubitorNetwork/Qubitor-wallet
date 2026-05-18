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
import { useMockState } from "@/hooks/useMockState";
import { DebugOnly } from "@/components/DebugOnly";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";

const STATES = ["Recovery configured", "Recovery skipped"] as const;

export default function SetupSummary() {
  const { variant, cycle } = useMockState(STATES);
  const { account } = useAccountSnapshot();
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
            <AddressDisplay address={account.address} />
          </View>
          <View className="mt-4">
            <Row
              label="Recovery"
              value={variant === "Recovery configured" ? "Active" : "Skipped"}
              showChevron={false}
            />
            <Row label="Validation" value="Hybrid signature" showChevron={false} last />
          </View>
        </Card>
        {variant === "Recovery skipped" ? (
          <WarningCard
            severity="review"
            title="Recovery not configured"
            detail="Add a recovery method before moving significant funds."
          />
        ) : null}
        <View className="flex-1" />
        <View className="items-center">
          <Button onPress={() => router.replace("/(tabs)/home")}>Continue to Home</Button>
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
