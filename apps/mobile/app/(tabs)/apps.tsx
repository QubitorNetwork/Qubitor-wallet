import { View } from "react-native";
import { AppWindow } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Row } from "@/components/Row";
import { WarningCard } from "@/components/WarningCard";
import { colors } from "@qubitor/ui-tokens";

/** Honest state — the mobile app has no injected EIP-1193 provider, so it has
 *  zero dapp connections. Connections are real only in the Quanta browser
 *  extension. No fabricated sessions are shown. */
export default function Apps() {
  return (
    <PageContainer>
      <PageHeader title="Apps" />

      <View className="gap-5">
        <View className="items-center gap-3 py-6">
          <View className="w-16 h-16 rounded-pill bg-qb-panel border border-qb-line items-center justify-center">
            <AppWindow size={26} color={colors.text} />
          </View>
          <Text variant="title" weight="semibold" className="text-center">
            No connected apps
          </Text>
          <Text variant="body" muted className="text-center">
            Dapp connections, permissions, and signature requests are handled by the Quanta browser
            extension, which exposes the EIP-6963 provider. The mobile app has no injected provider, so
            there are no sessions to manage here.
          </Text>
        </View>

        <Card>
          <Text variant="label" muted className="mb-2">
            Where connections live
          </Text>
          <Row label="Browser extension" value="EIP-6963 provider" showChevron={false} />
          <Row label="Connected sites" value="Managed in extension Options" showChevron={false} />
          <Row label="Mobile sessions" value="0 (no provider)" showChevron={false} last />
        </Card>

        <WarningCard
          severity="info"
          title="Why this is empty"
          detail="Real connection state is read from the extension's storage. Nothing is mocked on mobile."
        />
      </View>
    </PageContainer>
  );
}
