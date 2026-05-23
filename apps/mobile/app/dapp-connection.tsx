import { View } from "react-native";
import { router } from "expo-router";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Row } from "@/components/Row";
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";

export default function DappConnection() {
  const snapshot = useAccountSnapshot();

  return (
    <PageContainer>
      <PageHeader title="Connect" showBack centerTitle />

      <View className="gap-5">
        <WarningCard
          severity="info"
          title="No mobile dapp request"
          detail="Mobile has no injected provider. Real dapp connection requests are handled by the Quanta browser extension."
        />

        <Card>
          <Text variant="body" weight="semibold">
            Current account
          </Text>
          <View className="mt-4">
            <Row label="Account" value={snapshot.accountReady ? snapshot.account.address : "No wallet"} showChevron={false} />
            <Row label="Network" value={snapshot.chainName} showChevron={false} />
            <Row label="Connected apps" value="0" showChevron={false} last />
          </View>
        </Card>

        <View className="items-center">
          <Button onPress={() => router.replace("/(tabs)/apps")}>Open Apps</Button>
        </View>
      </View>
    </PageContainer>
  );
}
