import { View } from "react-native";
import { router, type Href } from "expo-router";
import {
  ShieldCheck,
  KeyRound,
  RotateCw,
  AppWindow,
  AlertTriangle,
  Activity,
  Code2,
  Settings,
  Network,
} from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Badge } from "@/components/Badge";
import { SettingsRow } from "@/components/SettingsRow";
import { WarningCard } from "@/components/WarningCard";
import { Button } from "@/components/Button";
import { SegmentedBar } from "@/components/SegmentedBar";
import { readinessScore } from "@qubitor/core";
import { colors } from "@qubitor/ui-tokens";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";

/** Source: SWallet `Setting.png` (rows with colored icons) + `Wallet analytics.png` (top hero card). */
export default function SecurityCenter() {
  const snapshot = useAccountSnapshot();
  const account = snapshot.account;
  const score = readinessScore(account.security);
  const keyRotationDetail = snapshot.isQubitorDevnet
    ? snapshot.pqRotateStatus === "requesting"
      ? "Rotating ML-DSA key"
      : snapshot.walletStatus === "unlocked"
        ? `ML-DSA key v${snapshot.pqProfile?.keyVersion ?? snapshot.walletPreview?.keyVersion ?? 1}`
        : "Unlock to manage ML-DSA key"
    : "Unavailable";

  return (
    <PageContainer>
      <PageHeader title="Security" eyebrow="05 / Security" />

      <View className="gap-4">
        <View className="bg-qb-panel border border-qb-line-strong rounded-xl p-5">
          <View className="flex-row items-center justify-between">
            <Text variant="label" muted>
              Quantum readiness
            </Text>
            <Badge label={account.security.mode} />
          </View>
          <Text variant="page-title" weight="medium" className="mt-2">
            {score}/100
          </Text>
          <Text variant="caption" muted className="mt-1">
            Quantum readiness comes from how your Quanta Account validates actions, not from the address format itself.
          </Text>
          <View className="mt-4">
            <SegmentedBar
              segments={[
                { value: 60, color: colors.text },
                { value: 25, color: colors.textMuted },
                { value: 15, color: colors.warn },
              ]}
            />
          </View>
          <View className="mt-4 self-start">
            <Button onPress={() => router.push("/readiness-report")}>Open Readiness Report</Button>
          </View>
        </View>

        {snapshot.status === "fallback" ? (
          <WarningCard
            severity="warning"
            title="Network state unavailable"
            detail={snapshot.error ?? "The wallet is showing locally stored account metadata."}
          />
        ) : null}
        {snapshot.walletStatus !== "unlocked" ? (
          <WarningCard severity="review" title="Wallet locked" detail="Unlock before exporting backups, rotating keys, or signing." />
        ) : null}

        <View>
          <SettingsRow
            Icon={ShieldCheck}
            iconColor="green"
            label="Validation Mode"
            detail={snapshot.isQubitorDevnet ? "ML-DSA PQ signature" : "Hybrid signature"}
            onPress={() => router.push("/pq-details")}
          />
          <SettingsRow
            Icon={Network}
            iconColor="green"
            label="Network Verification"
            detail={`Chain ${snapshot.chainId}, system contracts`}
            onPress={() => router.push("/network-verification")}
          />
          <SettingsRow
            Icon={KeyRound}
            iconColor="orange"
            label="Recovery"
            detail="Encrypted Recovery Kit"
            onPress={() => router.push("/recovery")}
          />
          <SettingsRow
            Icon={RotateCw}
            iconColor="yellow"
            label="Key Rotation"
            detail={keyRotationDetail}
            onPress={() => router.push("/recovery")}
          />
          <SettingsRow
            Icon={AppWindow}
            iconColor="gray"
            label="Connected Apps"
            detail="0 active sessions"
            onPress={() => router.push("/(tabs)/apps")}
          />
          <SettingsRow
            Icon={AlertTriangle}
            iconColor="orange"
            label="Approval Risk"
            detail="No live approvals indexed"
            onPress={() => router.push("/(tabs)/apps")}
          />
          <SettingsRow
            Icon={Activity}
            iconColor="green"
            label="Bridge Readiness"
            detail="Coming soon"
            onPress={() => router.push("/bridge")}
          />
          <SettingsRow
            Icon={Code2}
            iconColor="gray"
            label="Developer Mode"
            detail="Hidden by default"
            onPress={() => router.push("/developer-mode")}
          />
          <SettingsRow
            Icon={Settings}
            iconColor="gray"
            label="Settings"
            detail="Network, security, reset wallet"
            onPress={() => router.push("/settings" as Href)}
          />
        </View>
      </View>
    </PageContainer>
  );
}
