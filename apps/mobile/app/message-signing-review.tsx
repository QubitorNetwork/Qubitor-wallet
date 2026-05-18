import { View } from "react-native";
import { router } from "expo-router";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";

/** Honest state — this screen reviews real dapp signature requests. The
 *  dapp→wallet request plumbing is not wired in this build, so no request is
 *  shown. It does NOT fabricate an app, a permit, or a raw payload. When wired,
 *  signing is PQ-validated by the Quanta Account's ML-DSA key on Qubitor. */
export default function MessageSigningReview() {
  return (
    <PageContainer>
      <PageHeader title="Sign" showBack centerTitle />

      <View className="gap-5">
        <WarningCard
          severity="info"
          title="No signature request"
          detail="This screen reviews signature requests from connected apps. No request is pending, and none is fabricated here."
        />

        <Card>
          <Text variant="body" muted>
            When dapp request plumbing lands, this screen will show the requesting origin and
            verification status, a decoded human-readable summary, permit/allowance warnings, and the
            raw payload — all from the real request. Signing is then PQ-validated by your Quanta
            Account on Qubitor Network.
          </Text>
        </Card>

        <Button variant="secondary" onPress={() => router.back()}>
          Back
        </Button>
      </View>
    </PageContainer>
  );
}
