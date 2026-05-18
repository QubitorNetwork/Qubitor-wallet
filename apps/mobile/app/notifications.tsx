import { View } from "react-native";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Repeat,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { WarningCard } from "@/components/WarningCard";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";
import { colors } from "@qubitor/ui-tokens";
import type { WarningSeverity } from "@qubitor/core";

const ICONS: Record<string, LucideIcon> = {
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  bridge: Repeat,
  security: ShieldCheck,
  swap: Repeat,
};

/** Real notification center — every entry is derived from live wallet
 *  activity or a true account signal. Nothing is fabricated. */
export default function Notifications() {
  const snapshot = useAccountSnapshot();
  const account = snapshot.account;

  // Real, derived signals (not events) — only shown when actually true.
  const signals: { title: string; detail: string; severity: WarningSeverity }[] = [];
  if (!account.deployed) {
    signals.push({
      title: "Account not deployed",
      detail: "Your counterfactual address activates on the first PQ action.",
      severity: "info",
    });
  }
  if (account.security.recovery !== "active") {
    signals.push({
      title: "Recovery not configured",
      detail: "Back up your Quanta Recovery Kit before moving significant funds.",
      severity: "review",
    });
  }
  if (snapshot.status !== "live") {
    signals.push({
      title: "Network unreachable",
      detail: snapshot.error ?? "Showing last known state until the RPC responds.",
      severity: "review",
    });
  }

  const events = snapshot.status === "live" ? snapshot.activity : [];

  return (
    <PageContainer>
      <PageHeader title="Notifications" showBack />

      <View className="gap-5">
        {signals.length === 0 && events.length === 0 ? (
          <Card>
            <Text variant="body" muted>
              You're all caught up. Notifications appear here when transactions confirm or fail, and when
              your account needs attention. No activity is simulated.
            </Text>
          </Card>
        ) : null}

        {signals.length > 0 ? (
          <View className="gap-3">
            {signals.map((s) => (
              <WarningCard key={s.title} severity={s.severity} title={s.title} detail={s.detail} />
            ))}
          </View>
        ) : null}

        {events.length > 0 ? (
          <View>
            <Text variant="label" muted className="mb-3">
              From activity ({events.length})
            </Text>
            <Card>
              {events.map((e, i) => {
                const Icon = ICONS[e.type] ?? AlertTriangle;
                return (
                  <View
                    key={e.id}
                    className={`flex-row gap-3 py-3 ${i === events.length - 1 ? "" : "border-b border-qb-line"}`}
                  >
                    <View className="w-10 h-10 rounded-pill bg-qb-ink items-center justify-center">
                      <Icon size={18} color={colors.text} />
                    </View>
                    <View className="flex-1">
                      <Text variant="body" weight="medium">
                        {e.title}
                      </Text>
                      <Text variant="caption" muted className="mt-0.5">
                        {e.detail} · {e.timestamp}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        ) : null}
      </View>
    </PageContainer>
  );
}
