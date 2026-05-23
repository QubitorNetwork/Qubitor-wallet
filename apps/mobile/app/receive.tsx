import { useState } from "react";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Copy, Globe, Share2 } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { IconAction } from "@/components/IconAction";
import { AddressDisplay } from "@/components/AddressDisplay";
import { WarningCard } from "@/components/WarningCard";
import { QrFrame } from "@/components/QrFrame";
import { ChainPickerSheet } from "@/components/sheets/ChainPickerSheet";
import { ShareSheet } from "@/components/sheets/ShareSheet";
import { CopySheet } from "@/components/sheets/CopySheet";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";
import { colors } from "@qubitor/ui-tokens";
import { copyText } from "@/lib/clipboard";

/** Source: SWallet `Receive.png` — back arrow + centered title, framed QR, three icon-action squares. */
export default function Receive() {
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
      <PageHeader title="Receive" eyebrow="02 / Receive" showBack centerTitle />

      <View className="gap-8">
        <View className="items-center">
          <QrFrame>
            {accountReady ? (
              <QRCode
                value={account.address}
                size={200}
                color={colors.text}
                backgroundColor="transparent"
              />
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

        {snapshot.status === "fallback" ? (
          <WarningCard
            severity="warning"
            title="Live state unavailable"
            detail={snapshot.error ?? "The address is stored locally, but the RPC is not responding."}
          />
        ) : null}

        <Card>
          <Text variant="body" muted>
            Your Quanta Account is a normal 0x address with smarter security underneath.
          </Text>
        </Card>

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
