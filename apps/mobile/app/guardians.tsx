import { View } from "react-native";
import { router } from "expo-router";
import { Users } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Row } from "@/components/Row";
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";
import { colors } from "@qubitor/ui-tokens";

/** Honest state — Qubitor has no on-chain guardian / social-recovery module
 *  yet, so this screen states that truthfully instead of listing fake
 *  guardians. The real recovery path today is the encrypted Recovery Kit. */
export default function Guardians() {
  return (
    <PageContainer>
      <PageHeader title="Guardians" showBack />

      <View className="gap-5">
        <View className="items-center gap-3 py-6">
          <View className="w-16 h-16 rounded-pill bg-qb-panel border border-qb-line items-center justify-center">
            <Users size={26} color={colors.text} />
          </View>
          <Text variant="title" weight="semibold" className="text-center">
            Guardian recovery — coming soon
          </Text>
          <Text variant="body" muted className="text-center">
            Social and multi-device recovery need an on-chain guardian module that isn't deployed on
            Qubitor yet. When it ships, guardians, thresholds, and invitations will appear here — all
            real, none simulated.
          </Text>
        </View>

        <Card>
          <Text variant="label" muted className="mb-2">
            Planned
          </Text>
          <Row label="Guardian set + threshold" value="Not deployed" showChevron={false} />
          <Row label="Multi-device approval" value="Not deployed" showChevron={false} />
          <Row label="Time-delayed recovery" value="Not deployed" showChevron={false} last />
        </Card>

        <WarningCard
          severity="info"
          title="Use the Recovery Kit today"
          detail="Until guardian recovery ships, your real recovery path is the encrypted Recovery Kit backup."
        />

        <View className="items-center">
          <Button variant="secondary" onPress={() => router.replace("/recovery")}>
            Back to Recovery
          </Button>
        </View>
      </View>
    </PageContainer>
  );
}
