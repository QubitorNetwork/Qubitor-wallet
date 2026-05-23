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
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";
import { QrFrame } from "@/components/QrFrame";
import { DebugOnly } from "@/components/DebugOnly";
import { ChainPickerSheet } from "@/components/sheets/ChainPickerSheet";
import { ShareSheet } from "@/components/sheets/ShareSheet";
import { CopySheet } from "@/components/sheets/CopySheet";
import { useMockState } from "@/hooks/useMockState";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";
import { colors } from "@qubitor/ui-tokens";
import { copyText } from "@/lib/clipboard";

const STATES = ["Default", "QR expanded", "Copy success", "Unsupported chain selected"] as const;

/** Source: SWallet `Receive.png` — back arrow + centered title, framed QR, three icon-action squares. */
export default function Receive() {
  const { variant, cycle } = useMockState(STATES);
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
                size={variant === "QR expanded" ? 240 : 200}
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

        {variant === "Unsupported chain selected" ? (
          <WarningCard
            severity="warning"
            title="Chain not supported"
            detail="This network may not support all Qubitor security features."
          />
        ) : null}

        <Card>
          <Text variant="body" muted>
            Your Quanta Account is a normal 0x address with smarter security underneath.
          </Text>
        </Card>

        <DebugOnly>
          <Button variant="tertiary" onPress={cycle}>
            State: {variant}
          </Button>
        </DebugOnly>
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
