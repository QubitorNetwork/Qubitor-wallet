import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { router } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Repeat,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";
import { useMockState } from "@/hooks/useMockState";
import { MOCK_ACTIVITY, type ActivityItem } from "@/lib/mockData";
import { colors } from "@qubitor/ui-tokens";
import { DebugOnly } from "@/components/DebugOnly";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";

const FILTERS = ["All", "Transactions", "Security"] as const;
const STATES = [
  "Mixed transactions and security events",
  "Empty",
  "Filtered transactions",
  "Filtered security",
  "Loading",
  "Fetch failed",
] as const;

const iconFor: Record<ActivityItem["type"], LucideIcon> = {
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  swap: ArrowLeftRight,
  bridge: Repeat,
  security: ShieldCheck,
};

/** Source: SWallet `Transactions.png` + `Wallet analytics (transactions).png`. */
export default function Activity() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const { variant, cycle } = useMockState(STATES);
  const snapshot = useAccountSnapshot();

  // The state cycle drives both filter chip selection and dataset.
  const effectiveFilter =
    variant === "Filtered transactions"
      ? "Transactions"
      : variant === "Filtered security"
        ? "Security"
        : filter;

  const sourceItems = snapshot.status === "live" ? snapshot.activity : MOCK_ACTIVITY;
  const items =
    variant === "Empty" || variant === "Loading" || variant === "Fetch failed"
      ? []
      : sourceItems.filter((i) =>
          effectiveFilter === "All"
            ? true
            : effectiveFilter === "Transactions"
              ? i.type !== "security"
              : i.type === "security",
        );

  return (
    <PageContainer>
      <PageHeader title="Activity" />

      <View className="gap-5">
        <View className="flex-row gap-2">
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-pill border ${
                effectiveFilter === f ? "bg-text border-text" : "border-divider"
              }`}
            >
              <Text
                variant="caption"
                weight="semibold"
                className={effectiveFilter === f ? "text-background" : "text-text"}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>

        {variant === "Loading" ? (
          <Card>
            <View className="items-center py-8 gap-3">
              <ActivityIndicator color={colors.text} />
              <Text variant="caption" muted>
                Loading activity…
              </Text>
            </View>
          </Card>
        ) : null}

        {variant === "Fetch failed" ? (
          <WarningCard
            severity="warning"
            title="Couldn't load activity"
            detail="Check your network and pull to retry."
          />
        ) : null}

        {items.length === 0 && variant !== "Loading" && variant !== "Fetch failed" ? (
          <Card>
            <Text variant="body" muted>
              Your activity will appear here after you send, receive, sign, connect apps, or update account
              security.
            </Text>
          </Card>
        ) : null}

        {items.length > 0 ? (
          <Card>
            {items.map((i, idx) => {
              const Icon = iconFor[i.type];
              const last = idx === items.length - 1;
              return (
                <Pressable
                  key={i.id}
                  onPress={() => router.push({ pathname: "/activity-detail", params: { id: i.id } })}
                  className={`flex-row gap-3 py-3 ${last ? "" : "border-b border-divider"}`}
                >
                  <View className="w-10 h-10 rounded-pill bg-background items-center justify-center">
                    <Icon size={18} color={colors.text} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text variant="body" weight="medium">
                        {i.title}
                      </Text>
                      {i.badge ? <Badge label={i.badge} /> : null}
                    </View>
                    <Text variant="caption" muted className="mt-0.5">
                      {i.detail} · {i.timestamp}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </Card>
        ) : null}

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
