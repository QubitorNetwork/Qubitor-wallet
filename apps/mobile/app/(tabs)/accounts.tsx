import { View } from "react-native";
import { router } from "expo-router";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Row } from "@/components/Row";
import { AddressDisplay } from "@/components/AddressDisplay";
import { WarningCard } from "@/components/WarningCard";
import { HeroCard } from "@/components/HeroCard";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";

/** Real accounts list — exactly the one Quanta Account that exists on device.
 *  No fabricated legacy/watch-only/secondary wallets. */
export default function Accounts() {
  const snapshot = useAccountSnapshot();
  const account = snapshot.account;
  const badge = account.deployed ? account.security.mode : "Counterfactual";

  return (
    <PageContainer>
      <PageHeader title="Accounts" />

      <View className="gap-5">
        <Text variant="body" muted>
          Your Quanta Account on {snapshot.chainName}.
        </Text>

        <HeroCard
          title={account.label}
          subtitle={badge}
          tone="green"
          onPress={() => router.push("/account-detail")}
        >
          <AddressDisplay address={account.address} />
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

        <Card>
          <Text variant="label" muted className="mb-2">
            Account
          </Text>
          <Row label="Deployment" value={snapshot.deploymentLabel} showChevron={false} />
          <Row label="Readiness" value={snapshot.readinessLabel} showChevron={false} />
          <Row label="Network" value={snapshot.chainName} showChevron={false} last />
        </Card>

        <WarningCard
          severity="info"
          title="Single account"
          detail="This build manages one ML-DSA Quanta Account. Multi-account and watch-only support are not wired, so none are shown."
        />
      </View>
    </PageContainer>
  );
}
