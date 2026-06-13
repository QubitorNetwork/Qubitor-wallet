import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Copy, Gift, Globe, Maximize2, Share2 } from "lucide-react-native";
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
  const [qrOpen, setQrOpen] = useState(false);

  const copyAddress = async () => {
    if (!accountReady) return;
    if (await copyText(account.address, "Address")) setCopyOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader title="Receive" eyebrow="02 / Receive" showBack centerTitle />

      <View className="gap-8">
        <View className="items-center">
          <Pressable onPress={() => accountReady && setQrOpen(true)}>
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
          </Pressable>
          <View className="mt-5 items-center gap-2">
            {accountReady ? (
              <AddressDisplay address={account.address} />
            ) : (
              <Text variant="mono" muted>
                —
              </Text>
            )}
            <View className="flex-row gap-2">
              <Badge label={account.security.mode} />
              <Badge label={snapshot.deploymentLabel} />
            </View>
          </View>
        </View>

        <View className="flex-row gap-3">
          <IconAction label="Copy" Icon={Copy} onPress={copyAddress} disabled={!accountReady} />
          <IconAction label={chain || snapshot.chainName} Icon={Globe} onPress={() => setChainOpen(true)} />
          <IconAction label="Share" Icon={Share2} onPress={() => setShareOpen(true)} disabled={!accountReady} />
        </View>
        <View className="flex-row gap-3">
          <IconAction label="Big QR" Icon={Maximize2} onPress={() => setQrOpen(true)} disabled={!accountReady} />
          <IconAction
            label={snapshot.faucetStatus === "requesting" ? "Funding" : "Faucet"}
            Icon={Gift}
            onPress={snapshot.requestFaucet}
            disabled={!accountReady || snapshot.faucetStatus === "requesting"}
          />
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
            This is your Quanta Account address. It uses a normal 0x format while Qubitor validates actions with
            PQ-native account security.
          </Text>
        </Card>
        {snapshot.faucetStatus === "error" ? (
          <WarningCard
            severity="warning"
            title="Faucet unavailable"
            detail={snapshot.faucetError ?? "The testnet faucet did not return funds."}
          />
        ) : null}

      </View>

      <Modal visible={qrOpen && accountReady} transparent animationType="fade" onRequestClose={() => setQrOpen(false)}>
        <Pressable className="flex-1 bg-black/80 items-center justify-center px-6" onPress={() => setQrOpen(false)}>
          <View className="bg-qb-panel border border-qb-line rounded-xl p-6 items-center gap-4">
            <Text variant="title" weight="semibold">
              Quanta Account
            </Text>
            <QRCode value={account.address} size={280} color={colors.text} backgroundColor="transparent" />
            <AddressDisplay address={account.address} />
            <Text variant="caption" muted className="text-center">
              Tap anywhere outside the QR to close.
            </Text>
          </View>
        </Pressable>
      </Modal>

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
