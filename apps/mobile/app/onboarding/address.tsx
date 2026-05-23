import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { colors } from "@qubitor/ui-tokens";
import { Copy, Globe, Share2 } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { IconAction } from "@/components/IconAction";
import { AddressDisplay } from "@/components/AddressDisplay";
import { QrFrame } from "@/components/QrFrame";
import { ChainPickerSheet } from "@/components/sheets/ChainPickerSheet";
import { ShareSheet } from "@/components/sheets/ShareSheet";
import { CopySheet } from "@/components/sheets/CopySheet";
import { WarningCard } from "@/components/WarningCard";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";
import { copyText } from "@/lib/clipboard";

/** Source: SWallet `Receive.png` — first-time onboarding variant. */
export default function YourAddress() {
  const snapshot = useAccountSnapshot();
  const { account } = snapshot;
  const accountReady = snapshot.accountReady;
  const [chain, setChain] = useState("");
  const [copyOpen, setCopyOpen] = useState(false);
  const [chainOpen, setChainOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const copyAddress = async () => {
    if (!accountReady) return;
    if (await copyText(account.address, "Address")) setCopyOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader title="Your 0x Address" centerTitle />

      <View className="gap-6">
        <View className="items-center">
          <QrFrame>
            {accountReady ? (
              <QRCode value={account.address} size={200} color={colors.text} backgroundColor="transparent" />
            ) : (
              <View className="w-[200px] h-[200px] items-center justify-center px-6">
                <Text variant="body" muted className="text-center">
                  Loading your Quanta Account address…
                </Text>
              </View>
            )}
          </QrFrame>
          <View className="mt-5 items-center gap-2">
            {accountReady ? (
              <AddressDisplay address={account.address} />
            ) : (
              <Text variant="mono" muted>
                —
              </Text>
            )}
            <Badge label={account.security.mode} />
          </View>
        </View>

        <View className="flex-row gap-3">
          <IconAction label="Copy" Icon={Copy} onPress={copyAddress} disabled={!accountReady} />
          <IconAction label={chain || snapshot.chainName} Icon={Globe} onPress={() => setChainOpen(true)} />
          <IconAction label="Share" Icon={Share2} onPress={() => setShareOpen(true)} disabled={!accountReady} />
        </View>

        {!account.deployed ? (
          <WarningCard
            severity="info"
            title="Counterfactual address"
            detail="Your address is reserved. It deploys on chain the first time you confirm a supported action."
          />
        ) : null}

        <Card>
          <Text variant="body" muted>
            This is your Qubitor smart account address. It uses a normal 0x format while Qubitor's programmable
            validation controls security underneath.
          </Text>
        </Card>

        <View className="items-center">
          <Button onPress={() => router.push("/onboarding/summary")} disabled={!accountReady}>
            Continue
          </Button>
        </View>

      </View>

      <ChainPickerSheet
        visible={chainOpen}
        onDismiss={() => setChainOpen(false)}
        selected={chain || snapshot.chainName}
        onSelect={setChain}
      />
      <ShareSheet
        visible={shareOpen && accountReady}
        onDismiss={() => setShareOpen(false)}
        payload={accountReady ? account.address : ""}
        onCopied={() => setCopyOpen(true)}
      />
      <CopySheet visible={copyOpen} onDismiss={() => setCopyOpen(false)} label="Address" />
    </PageContainer>
  );
}
