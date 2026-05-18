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
} from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Badge } from "@/components/Badge";
import { SettingsRow } from "@/components/SettingsRow";
import { WarningCard } from "@/components/WarningCard";
import { Button } from "@/components/Button";
import { SegmentedBar } from "@/components/SegmentedBar";
import { useMockState } from "@/hooks/useMockState";
import { readinessScore } from "@qubitor/core";
import { colors } from "@qubitor/ui-tokens";
import { DebugOnly } from "@/components/DebugOnly";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";

const STATES = [
  "Smart Account Ready",
  "Hybrid Protected",
  "PQ Ready",
  "PQ Native",
  "Recovery missing",
  "Rotation recommended",
] as const;

/** Source: SWallet `Setting.png` (rows with colored icons) + `Wallet analytics.png` (top hero card). */
export default function SecurityCenter() {
  const { variant, cycle } = useMockState(STATES, "Hybrid Protected");
  const snapshot = useAccountSnapshot();
  const account = snapshot.account;
  const score = readinessScore(account.security);
  const keyRotationDetail = snapshot.isQubitorDevnet
    ? snapshot.pqRotateStatus === "requesting"
      ? "Rotating ML-DSA key"
      : `ML-DSA key v${snapshot.pqProfile?.keyVersion ?? 1}`
    : "Last rotated 32 days ago";

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

        {variant === "Recovery missing" ? (
          <WarningCard severity="warning" title="Recovery not configured" detail="Add a recovery method before moving significant funds." />
        ) : null}
        {variant === "Rotation recommended" ? (
          <WarningCard severity="review" title="Rotation recommended" detail="Your authorization keys are due for rotation." />
        ) : null}

        <View>
          <SettingsRow
            Icon={ShieldCheck}
            iconColor="green"
            label="Validation Mode"
            detail={snapshot.isQubitorDevnet ? "ML-DSA PQ signature" : "Hybrid signature"}
            onPress={() => router.push("/developer-mode")}
          />
          <SettingsRow
            Icon={KeyRound}
            iconColor="orange"
            label="Recovery"
            detail="3 of 5 guardians"
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
            detail="3 active sessions"
            onPress={() => router.push("/(tabs)/apps")}
          />
          <SettingsRow
            Icon={AlertTriangle}
            iconColor="orange"
            label="Approval Risk"
            detail="2 to review"
            onPress={() => router.push("/(tabs)/apps")}
          />
          <SettingsRow
            Icon={Activity}
            iconColor="green"
            label="Bridge Readiness"
            detail={snapshot.isQubitorDevnet ? "Qubitor Devnet" : "Hybrid"}
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
