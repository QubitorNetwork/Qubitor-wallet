import { View } from "react-native";
import { router, type Href } from "expo-router";
import { Wallet, Activity as ActivityIcon, AppWindow, ShieldCheck, KeyRound, BookUser } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { HeroCard } from "@/components/HeroCard";
import { SettingsRow } from "@/components/SettingsRow";
import { AddressDisplay } from "@/components/AddressDisplay";
import { Badge } from "@/components/Badge";
import { WarningCard } from "@/components/WarningCard";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";

/** Real drill-down of the one Quanta Account. Every field is live snapshot
 *  data — no legacy/watch-only/secondary mock variants. */
export default function AccountDetail() {
  const snapshot = useAccountSnapshot();
  const account = snapshot.account;
  const accountReady = snapshot.accountReady;
  const badge = account.deployed ? account.security.mode : "Counterfactual";

  return (
    <PageContainer>
      <PageHeader title="Account" showBack centerTitle />

      <View className="gap-5">
        <HeroCard title={account.label} subtitle={badge} tone="green">
          {accountReady ? (
            <AddressDisplay address={account.address} />
          ) : (
            <Text variant="caption" className="text-background opacity-80">
              Loading account…
            </Text>
          )}
          <View className="flex-row items-center justify-between mt-4">
            <Text variant="caption" className="text-background opacity-80">
              Balance
            </Text>
            <Text variant="body" weight="semibold" className="text-background">
              {snapshot.balanceLabel}
            </Text>
          </View>
        </HeroCard>

        {!account.deployed ? (
          <WarningCard
            severity="info"
            title="Counterfactual address"
            detail="The address is derived and reserved. It deploys on chain on the first PQ action."
          />
        ) : null}

        <View>
          <SettingsRow
            Icon={Wallet}
            iconColor="green"
            label="Balance"
            detail={snapshot.balanceLabel}
            onPress={() => router.push("/(tabs)/home")}
          />
          <SettingsRow
            Icon={Wallet}
            iconColor="gray"
            label="Network"
            detail={`${snapshot.chainName} · ${snapshot.nativeCurrencySymbol}`}
            onPress={() => router.push("/developer-mode")}
          />
          <SettingsRow
            Icon={ActivityIcon}
            iconColor="orange"
            label="Activity"
            detail="Transactions and security events"
            onPress={() => router.push("/(tabs)/activity")}
          />
          <SettingsRow
            Icon={AppWindow}
            iconColor="gray"
            label="Connected apps"
            detail="Managed in the browser extension"
            onPress={() => router.push("/(tabs)/apps")}
          />
          <SettingsRow
            Icon={ShieldCheck}
            iconColor="green"
            label="Security mode"
            detail={account.deployed ? snapshot.readinessLabel : `${snapshot.readinessLabel} · ${snapshot.deploymentLabel}`}
            onPress={() => router.push("/(tabs)/security")}
          />
          <SettingsRow
            Icon={KeyRound}
            iconColor="yellow"
            label="Control Key & recovery"
            detail="Rotate the ML-DSA key or back up the Recovery Kit"
            onPress={() => router.push("/recovery")}
          />
          <SettingsRow
            Icon={BookUser}
            iconColor="gray"
            label="Address book"
            detail="Saved contacts with poisoning checks"
            onPress={() => router.push("/address-book" as Href)}
          />
        </View>

        <View className="items-center">
          <Badge label={badge} />
        </View>
      </View>
    </PageContainer>
  );
}
