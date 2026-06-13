import { View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowDownLeft, ArrowUpRight, ShieldCheck, Repeat, ArrowLeftRight, type LucideIcon } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Row } from "@/components/Row";
import { WarningCard } from "@/components/WarningCard";
import { Button } from "@/components/Button";
import { explorerTxUrl, openExternalUrl } from "@/lib/externalActions";
import { colors } from "@qubitor/ui-tokens";
import type { ActivityItem } from "@/lib/runtimeTypes";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";
import type { WalletActivityItem } from "@/lib/walletActivity";

type ActivityDetailItem = (ActivityItem | WalletActivityItem) & {
  hash?: string;
  displayHash?: string;
  from?: string;
  to?: string;
  fee?: string;
  security?: string;
  amountLabel?: string;
  chainId?: number;
  explorerUrl?: string;
};

const iconFor: Record<ActivityItem["type"], LucideIcon> = {
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  swap: ArrowLeftRight,
  bridge: Repeat,
  security: ShieldCheck,
};

/** Real activity detail — resolves the item from live recorded wallet
 *  activity by id. If it isn't found (e.g. opened without context) it says
 *  so honestly instead of rendering a fabricated fixture. */
export default function ActivityDetail() {
  const params = useLocalSearchParams<{ id?: string }>();
  const snapshot = useAccountSnapshot();
  const item = snapshot.activity.find((a) => a.id === params.id) as ActivityDetailItem | undefined;

  if (!item) {
    return (
      <PageContainer>
        <PageHeader title="Activity" showBack centerTitle />
        <View className="gap-5">
          <WarningCard
            severity="info"
            title="Activity not found"
            detail="This entry isn't in the local or indexed activity feed. Open it from the Activity tab to see live details."
          />
          <View className="items-center">
            <Button variant="secondary" onPress={() => router.replace("/(tabs)/activity")}>
              Go to Activity
            </Button>
          </View>
        </View>
      </PageContainer>
    );
  }

  const Icon = iconFor[item.type];
  const isSecurity = item.type === "security";
  const hash = item.hash;
  const displayHash = item.displayHash ?? (hash ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : "—");

  return (
    <PageContainer>
      <PageHeader title="Activity" showBack centerTitle />

      <View className="gap-5">
        <View className="items-center gap-3">
          <View className="w-16 h-16 rounded-pill bg-qb-panel border border-qb-line items-center justify-center">
            <Icon size={28} color={colors.text} />
          </View>
          <Text variant="title" weight="semibold" className="text-center">
            {item.title}
          </Text>
          <Text variant="caption" muted>
            {item.timestamp}
          </Text>
          {item.badge ? <Badge label={item.badge} /> : null}
        </View>

        <Card>
          <Row label="From" value={item.from ?? "Quanta Account"} showChevron={false} />
          <Row label="To" value={item.to ?? "Quanta Account"} showChevron={false} />
          <Row label="Asset" value={item.amountLabel ?? item.detail} showChevron={false} />
          <Row label="Network fee" value={item.fee ?? (hash ? "QBT gas" : "—")} showChevron={false} />
          <Row label="Security" value={item.security ?? item.badge ?? "Account validation"} showChevron={false} />
          <Row label="Hash" value={displayHash} showChevron={false} last />
        </Card>

        {isSecurity ? (
          <WarningCard
            severity="info"
            title="Account update"
            detail="This event changed your account configuration. No transaction left your wallet."
          />
        ) : null}

        {hash ? (
          <View className="items-center">
            <Button
              variant="secondary"
              onPress={() => openExternalUrl(item.explorerUrl ?? explorerTxUrl(hash, item.chainId ?? snapshot.account.chainId))}
            >
              View on explorer
            </Button>
          </View>
        ) : null}
      </View>
    </PageContainer>
  );
}
