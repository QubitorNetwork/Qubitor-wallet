import { View } from "react-native";
import { router } from "expo-router";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Row } from "@/components/Row";
import { Button } from "@/components/Button";
import { SegmentedBar } from "@/components/SegmentedBar";
import { shareReadinessReport } from "@/lib/externalActions";
import { readinessScore } from "@qubitor/core";
import { colors } from "@qubitor/ui-tokens";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";

/** Source: SWallet `Wallet analytics.png` + `Wallet analytics (transactions).png`
 *  adapted to security/quantum readiness. */
export default function ReadinessReport() {
  const snapshot = useAccountSnapshot();
  const account = snapshot.account;
  const score = readinessScore(account.security);
  const segments = [
    { value: 60, color: colors.hero.green, label: "Protected" },
    { value: 25, color: colors.badge.review, label: "Partially protected" },
    { value: 15, color: colors.warningStrong, label: "Legacy / external" },
  ];

  return (
    <PageContainer>
      <PageHeader title="Readiness Report" showBack />

      <View className="gap-5">
        <View className="bg-qb-panel border border-qb-line-strong rounded-xl p-5">
          <View className="flex-row items-center justify-between">
            <Text variant="body" weight="semibold">
              Current state
            </Text>
            <Badge label={account.security.mode} />
          </View>
          <Text variant="page-title" weight="bold" className="mt-2">
            {score}/100
          </Text>
          <View className="mt-4">
            <SegmentedBar segments={segments} />
          </View>
          <View className="mt-3 gap-1">
            {segments.map((s) => (
              <View key={s.label} className="flex-row items-center gap-2">
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
                <Text variant="caption" muted>
                  {s.label} · {s.value}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text variant="title" weight="semibold">
            Boundaries
          </Text>
          <Card>
            <Row
              label="Validation"
              value="ML-DSA PQ signature"
              detail={`Active on ${snapshot.chainName}`}
              showChevron={false}
            />
            <Row label="Recovery" value="3 of 5 guardians" showChevron={false} />
            <Row label="Network" value={snapshot.chainName} showChevron={false} />
            <Row
              label="External dependencies"
              value="No ECDSA account control"
              detail="Default Quanta Accounts require PQ authorization"
              showChevron={false}
              last
            />
          </Card>
        </View>

        <View className="gap-2">
          <Text variant="title" weight="semibold">
            Recommended actions
          </Text>
          <Card>
            <Row
              label="Tighten QubiSwap permissions"
              detail="Compatibility mode active"
              onPress={() => router.push("/(tabs)/apps")}
            />
            <Row
              label="Test recovery"
              detail="Last tested 12 days ago"
              onPress={() => router.push("/recovery")}
              last
            />
          </Card>
        </View>

        <View className="items-center">
          <Button variant="secondary" onPress={() => shareReadinessReport(account)}>
            Export report
          </Button>
        </View>
      </View>
    </PageContainer>
  );
}
