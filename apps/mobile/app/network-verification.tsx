import { View } from "react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Row } from "@/components/Row";
import { Badge } from "@/components/Badge";
import { WarningCard } from "@/components/WarningCard";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";
import { readPublicEnv } from "@/lib/runtimeConfig";
import {
  QUBITOR_ACCOUNT_FACTORY,
  QUBITOR_ACCOUNT_READINESS_REGISTRY,
  QUBITOR_MLDSA65_PRECOMPILE,
  QUBITOR_SECURITY_MODE_REGISTRY,
  QUBITOR_TESTNET_CHAIN_ID,
  defaultQubitorIndexerUrl,
} from "@qubitor/evm";

export default function NetworkVerification() {
  const snapshot = useAccountSnapshot();
  const rpcUrl = snapshot.rpcUrl ?? readPublicEnv("EXPO_PUBLIC_QUBITOR_RPC_URL") ?? "Default";
  const indexerUrl = readPublicEnv("EXPO_PUBLIC_QUBITOR_INDEXER_URL") ?? defaultQubitorIndexerUrl(snapshot.chainId);
  const chainOk = snapshot.chainId === QUBITOR_TESTNET_CHAIN_ID;

  return (
    <PageContainer>
      <PageHeader title="Network verification" showBack centerTitle />

      <View className="gap-5">
        <Card>
          <View className="flex-row items-center justify-between">
            <Text variant="title" weight="semibold">
              Qubitor Testnet
            </Text>
            <Badge label={chainOk ? "Verified" : "Review"} />
          </View>
          <View className="mt-4">
            <Row label="Expected chain ID" value={String(QUBITOR_TESTNET_CHAIN_ID)} showChevron={false} />
            <Row label="Current chain ID" value={String(snapshot.chainId)} showChevron={false} />
            <Row label="Latest block" value={snapshot.latestBlock ?? "Unavailable"} showChevron={false} last />
          </View>
        </Card>

        {!chainOk ? (
          <WarningCard
            severity="critical"
            title="Wrong network"
            detail="Production Quanta Wallet builds should use Qubitor Testnet chain ID 91338."
          />
        ) : null}
        {snapshot.status === "fallback" ? (
          <WarningCard
            severity="warning"
            title="RPC state unavailable"
            detail={snapshot.error ?? "The wallet could not verify the network from live RPC."}
          />
        ) : null}

        <Card>
          <Text variant="label" muted className="mb-2">
            Endpoints
          </Text>
          <Row label="RPC" value={rpcUrl} showChevron={false} />
          <Row label="Indexer" value={indexerUrl} showChevron={false} />
          <Row label="Explorer" value="https://testexplorer.qubitor.org" showChevron={false} last />
        </Card>

        <Card>
          <Text variant="label" muted className="mb-2">
            System addresses
          </Text>
          <Row label="ML-DSA-65 precompile" value={QUBITOR_MLDSA65_PRECOMPILE} showChevron={false} />
          <Row label="SecurityModeRegistry" value={QUBITOR_SECURITY_MODE_REGISTRY} showChevron={false} />
          <Row label="AccountReadinessRegistry" value={QUBITOR_ACCOUNT_READINESS_REGISTRY} showChevron={false} />
          <Row label="QubitorAccountFactory" value={QUBITOR_ACCOUNT_FACTORY} showChevron={false} last />
        </Card>
      </View>
    </PageContainer>
  );
}
