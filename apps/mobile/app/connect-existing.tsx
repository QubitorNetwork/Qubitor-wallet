import { View } from "react-native";
import { router } from "expo-router";
import { Wallet } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";
import { colors } from "@qubitor/ui-tokens";

export default function ConnectExisting() {
  return (
    <PageContainer>
      <PageHeader title="Connect existing wallet" showBack />

      <View className="gap-5">
        <View className="items-center gap-3 py-6">
          <View className="w-16 h-16 rounded-pill bg-qb-panel border border-qb-line items-center justify-center">
            <Wallet size={26} color={colors.text} />
          </View>
          <Text variant="title" weight="semibold" className="text-center">
            External wallet import is not the main path
          </Text>
          <Text variant="body" muted className="text-center">
            Quanta Wallet creates a PQ-native Quanta Account controlled by local ML-DSA key material. Existing EOA
            compatibility can be added later, but it is not used for public-testnet account control.
          </Text>
        </View>

        <WarningCard
          severity="review"
          title="Use Create or Recover"
          detail="Create a Quanta Account locally, or restore an encrypted Recovery Kit if you already have one."
        />

        <Card>
          <Text variant="body" muted>
            No provider list is shown here because there is no production external-wallet control flow wired for
            PQ-native accounts yet.
          </Text>
        </Card>

        <View className="gap-3">
          <Button size="block" onPress={() => router.replace("/onboarding/passcode")}>
            Create Quanta Account
          </Button>
          <Button size="block" variant="secondary" onPress={() => router.replace("/recovery")}>
            Recover Account
          </Button>
        </View>
      </View>
    </PageContainer>
  );
}
