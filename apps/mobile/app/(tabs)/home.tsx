import { Pressable, ScrollView, View } from "react-native";
import { router, type Href } from "expo-router";
import { ArrowDownLeft, ArrowUpRight, ShieldCheck, Repeat, User } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { IconAction } from "@/components/IconAction";
import { WarningCard } from "@/components/WarningCard";
import { AddressDisplay } from "@/components/AddressDisplay";
import { HeroCard } from "@/components/HeroCard";
import { TokenChip } from "@/components/TokenChip";
import { Row } from "@/components/Row";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";
import { readinessScore } from "@qubitor/core";
import { colors } from "@qubitor/ui-tokens";

/** Live Home — reads the real account snapshot (balance, deployment, readiness,
 *  chain, latest block). No mock data: a zero balance shows the fund-account
 *  empty state; an unreachable RPC shows the offline notice. */
export default function Home() {
  const snapshot = useAccountSnapshot();
  const { account } = snapshot;
  const score = readinessScore(account.security);
  const live = snapshot.status === "live";
  const loading = snapshot.status === "loading";
  const accountReady = snapshot.accountReady;
  const balanceIsZero = (snapshot.balanceWei ?? 0n) === 0n;

  return (
    <PageContainer>
      <View className="pt-4 gap-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text variant="label" muted>
              01 / Account
            </Text>
            <Text variant="page-title" weight="medium" className="mt-1">
              {account.label}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/notifications" as Href)}
            className="w-12 h-12 rounded-pill bg-qb-panel border border-qb-line items-center justify-center"
          >
            <User size={22} color={colors.text} />
          </Pressable>
        </View>

        <View className="flex-row gap-3">
          <HeroCard
            title={account.label}
            subtitle="QUANTA ACCOUNT"
            tone="primary"
            onPress={() => router.push("/(tabs)/accounts")}
          >
            {accountReady ? (
              <AddressDisplay address={account.address} />
            ) : (
              <Text variant="caption" muted>
                Loading account…
              </Text>
            )}
          </HeroCard>
          <HeroCard
            title={`${score}/100`}
            subtitle="QUANTUM READINESS"
            tone="dark"
            onPress={() => router.push("/(tabs)/security")}
          >
            <Badge label={account.security.mode} />
          </HeroCard>
        </View>

        <View className="flex-row items-baseline justify-between">
          <Text variant="label" muted>
            Balance
          </Text>
          <Text variant="section" weight="medium">
            {loading ? "…" : snapshot.balanceLabel}
          </Text>
        </View>

        <Card>
          <Text variant="label" muted className="mb-3">
            Network
          </Text>
          <Row label="Chain" value={snapshot.chainName} showChevron={false} />
          <Row label="Deployment" value={snapshot.deploymentLabel} showChevron={false} />
          <Row label="Readiness" value={snapshot.readinessLabel} showChevron={false} />
          <Row
            label="Latest block"
            value={snapshot.latestBlock ?? "—"}
            showChevron={false}
            last
          />
        </Card>

        <View className="flex-row gap-3">
          <IconAction
            label="Send"
            Icon={ArrowUpRight}
            onPress={() => router.push("/send")}
            disabled={!accountReady}
          />
          <IconAction
            label="Receive"
            Icon={ArrowDownLeft}
            onPress={() => router.push("/receive")}
            disabled={!accountReady}
          />
          <IconAction label="Bridge" Icon={Repeat} onPress={() => router.push("/bridge")} />
          <IconAction label="Secure" Icon={ShieldCheck} onPress={() => router.push("/(tabs)/security")} />
        </View>

        {!live && !loading ? (
          <WarningCard
            severity="review"
            title="Offline — showing last known state"
            detail={snapshot.error ?? "Couldn't reach the Qubitor RPC. Check your network or RPC URL."}
          />
        ) : null}
        {account.security.recovery !== "active" ? (
          <WarningCard
            severity="review"
            title="Recovery not configured"
            detail="Back up your Quanta Recovery Kit before moving significant funds."
          />
        ) : null}

        <View>
          <Text variant="label" muted className="mb-3">
            Tokens
          </Text>
          {balanceIsZero ? (
            <Card>
              <Text variant="body" muted>
                Your smart account is ready. Add funds, request {snapshot.nativeCurrencySymbol} from the
                faucet, or receive at your Quanta 0x address.
              </Text>
            </Card>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              <TokenChip
                symbol={snapshot.nativeCurrencySymbol}
                name={snapshot.chainName}
                balance={snapshot.balanceLabel.replace(` ${snapshot.nativeCurrencySymbol}`, "")}
                fiatValue={snapshot.balanceUsd}
              />
            </ScrollView>
          )}
        </View>
      </View>
    </PageContainer>
  );
}
