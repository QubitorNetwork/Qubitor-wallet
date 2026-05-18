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

const STATES = ["Default", "QR expanded", "Copy success", "Unsupported chain selected"] as const;

/** Source: SWallet `Receive.png` — back arrow + centered title, framed QR, three icon-action squares. */
export default function Receive() {
  const { variant, cycle } = useMockState(STATES);
  const snapshot = useAccountSnapshot();
  const { account } = snapshot;
  const [chain, setChain] = useState("");
  const [copyOpen, setCopyOpen] = useState(false);
  const [chainOpen, setChainOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <PageContainer>
      <PageHeader title="Receive" eyebrow="02 / Receive" showBack centerTitle />

      <View className="gap-8">
        <View className="items-center">
          <QrFrame>
            <QRCode
              value={account.address}
              size={variant === "QR expanded" ? 240 : 200}
              color={colors.text}
              backgroundColor="transparent"
            />
          </QrFrame>
          <View className="mt-5 items-center gap-2">
            <AddressDisplay address={account.address} />
            <Badge label={account.security.mode} />
          </View>
        </View>

        <View className="flex-row gap-3">
          <IconAction label="Copy" Icon={Copy} onPress={() => setCopyOpen(true)} />
          <IconAction label={chain || snapshot.chainName} Icon={Globe} onPress={() => setChainOpen(true)} />
          <IconAction label="Share" Icon={Share2} onPress={() => setShareOpen(true)} />
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
      <ShareSheet visible={shareOpen} onDismiss={() => setShareOpen(false)} payload={account.address} />
      <CopySheet visible={copyOpen} onDismiss={() => setCopyOpen(false)} label="Address" />
    </PageContainer>
  );
}
