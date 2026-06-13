import { View } from "react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Row } from "@/components/Row";
import { Badge } from "@/components/Badge";
import { WarningCard } from "@/components/WarningCard";
import { Button } from "@/components/Button";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";
import { router } from "expo-router";

function shortHex(value?: string) {
  if (!value) return "Unavailable";
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

export default function PQDetails() {
  const snapshot = useAccountSnapshot();
  const keyVersion = snapshot.pqProfile?.keyVersion ?? snapshot.walletPreview?.keyVersion ?? 1;
  const lastRotation =
    snapshot.pqProfile?.lastRotationAt ?? snapshot.walletPreview?.lastRotationAt ?? "No rotation recorded";

  return (
    <PageContainer>
      <PageHeader title="PQ Native" showBack centerTitle />

      <View className="gap-5">
        <Card>
          <View className="flex-row items-center justify-between">
            <Text variant="title" weight="semibold">
              Quanta Account
            </Text>
            <Badge label={snapshot.account.security.mode} />
          </View>
          <Text variant="body" muted className="mt-2">
            PQ Native means this account validates wallet actions with ML-DSA key material held locally by Quanta Wallet.
          </Text>
          <View className="mt-4">
            <Row label="Address" value={snapshot.accountReady ? shortHex(snapshot.account.address) : "Loading"} showChevron={false} />
            <Row label="Deployment" value={snapshot.deploymentLabel} showChevron={false} />
            <Row label="Readiness" value={snapshot.readinessLabel} showChevron={false} last />
          </View>
        </Card>

        <Card>
          <Text variant="label" muted className="mb-2">
            ML-DSA control key
          </Text>
          <Row label="Algorithm" value="ML-DSA-65" showChevron={false} />
          <Row label="Key version" value={`v${keyVersion}`} showChevron={false} />
          <Row label="Public commitment" value={shortHex(snapshot.pqCurrentPublicKeyCommitment)} showChevron={false} />
          <Row label="Last rotation" value={lastRotation} showChevron={false} last />
        </Card>

        {snapshot.account.security.mode === "Legacy" || snapshot.account.security.mode === "Compatibility Mode" ? (
          <WarningCard
            severity="critical"
            title="Legacy compatibility active"
            detail="This account is not fully PQ-native. Move funds only after reviewing the compatibility dependency."
          />
        ) : (
          <WarningCard
            severity="info"
            title="No legacy fallback detected"
            detail="The wallet currently reports PQ-native validation for this Quanta Account."
          />
        )}

        <View className="flex-row gap-3">
          <Button className="flex-1" variant="secondary" onPress={() => router.push("/recovery")}>
            Recovery
          </Button>
          <Button className="flex-1" onPress={() => router.push("/recovery")}>
            Rotate key
          </Button>
        </View>
      </View>
    </PageContainer>
  );
}
