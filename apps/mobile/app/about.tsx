import { Platform, View } from "react-native";
import { Github, Globe, MonitorDown, Package, ShieldCheck } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Row } from "@/components/Row";
import { SettingsRow } from "@/components/SettingsRow";
import { Button } from "@/components/Button";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";
import { readPublicEnv } from "@/lib/runtimeConfig";
import { openExternalUrl } from "@/lib/externalActions";
import {
  QUBITOR_ACCOUNT_FACTORY,
  QUBITOR_ACCOUNT_READINESS_REGISTRY,
  QUBITOR_MLDSA65_PRECOMPILE,
  QUBITOR_SECURITY_MODE_REGISTRY,
  defaultQubitorIndexerUrl,
} from "@qubitor/evm";

const VERSION = readPublicEnv("EXPO_PUBLIC_QUANTA_WALLET_VERSION") ?? "0.0.26";
const RELEASES_URL = "https://github.com/QubitorNetwork/Qubitor-wallet/releases";
const CHROME_URL = "https://chromewebstore.google.com/detail/cjfhgclheennacdlpbmjopikfiaecmmn";
const SNAP_URL = "https://snapcraft.io/quanta-wallet";
const WINDOWS_URL = "https://apps.microsoft.com/store/detail/quanta-wallet";
const GITHUB_URL = "https://github.com/QubitorNetwork/Qubitor-wallet";
const PRIVACY_URL = "https://docs.qubitor.org/privacy";

export default function About() {
  const snapshot = useAccountSnapshot();
  const indexerUrl = readPublicEnv("EXPO_PUBLIC_QUBITOR_INDEXER_URL") ?? defaultQubitorIndexerUrl(snapshot.chainId);

  return (
    <PageContainer>
      <PageHeader title="About" showBack centerTitle />

      <View className="gap-5">
        <Card>
          <Text variant="title" weight="semibold">
            Quanta Wallet
          </Text>
          <Text variant="body" muted className="mt-2">
            PQ-native wallet for Quanta Accounts on Qubitor Network.
          </Text>
          <View className="mt-4">
            <Row label="Version" value={VERSION} showChevron={false} />
            <Row label="Build target" value={Platform.OS} showChevron={false} />
            <Row label="Chain" value={`${snapshot.chainName} (${snapshot.chainId})`} showChevron={false} last />
          </View>
        </Card>

        <Card>
          <Text variant="label" muted className="mb-2">
            Network config
          </Text>
          <Row label="RPC" value={snapshot.rpcUrl ?? "Default"} showChevron={false} />
          <Row label="Indexer" value={indexerUrl} showChevron={false} />
          <Row label="Explorer" value="testexplorer.qubitor.org" showChevron={false} last />
        </Card>

        <Card>
          <Text variant="label" muted className="mb-2">
            System addresses
          </Text>
          <Row label="ML-DSA-65" value={`${QUBITOR_MLDSA65_PRECOMPILE.slice(0, 10)}...0100`} showChevron={false} />
          <Row label="Security modes" value={`${QUBITOR_SECURITY_MODE_REGISTRY.slice(0, 10)}...0201`} showChevron={false} />
          <Row label="Readiness" value={`${QUBITOR_ACCOUNT_READINESS_REGISTRY.slice(0, 10)}...0202`} showChevron={false} />
          <Row label="Account factory" value={`${QUBITOR_ACCOUNT_FACTORY.slice(0, 10)}...0203`} showChevron={false} last />
        </Card>

        <View>
          <SettingsRow
            Icon={MonitorDown}
            iconColor="green"
            label="Check for updates"
            detail="Open GitHub Releases"
            onPress={() => openExternalUrl(RELEASES_URL)}
          />
          <SettingsRow
            Icon={Globe}
            iconColor="gray"
            label="Privacy Policy"
            detail="docs.qubitor.org/privacy"
            onPress={() => openExternalUrl(PRIVACY_URL)}
          />
          <SettingsRow Icon={Github} iconColor="gray" label="GitHub" detail="Source and releases" onPress={() => openExternalUrl(GITHUB_URL)} />
          <SettingsRow Icon={Package} iconColor="gray" label="Chrome Web Store" detail="Browser extension" onPress={() => openExternalUrl(CHROME_URL)} />
          <SettingsRow Icon={Package} iconColor="gray" label="Snap Store" detail="Ubuntu desktop package" onPress={() => openExternalUrl(SNAP_URL)} />
          <SettingsRow Icon={Package} iconColor="gray" label="Windows Store" detail="Desktop package listing" onPress={() => openExternalUrl(WINDOWS_URL)} />
        </View>

        <Card>
          <View className="flex-row items-start gap-3">
            <ShieldCheck size={20} color="#ededed" />
            <Text variant="caption" muted className="flex-1">
              No crash-reporting SDK is enabled in this build. Debug bundles are local/export-only and must not include
              passcodes, private keys, Recovery Kits, or encrypted vault blobs.
            </Text>
          </View>
          <View className="mt-4">
            <Button variant="secondary" size="block" onPress={() => openExternalUrl(RELEASES_URL)}>
              View releases
            </Button>
          </View>
        </Card>
      </View>
    </PageContainer>
  );
}
