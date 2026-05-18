import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Wallet } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";
import { Row } from "@/components/Row";
import { colors } from "@qubitor/ui-tokens";
import { useMockState } from "@/hooks/useMockState";
import { DebugOnly } from "@/components/DebugOnly";

const PROVIDERS = ["MetaMask", "Rabby", "Coinbase Wallet", "WalletConnect", "Ledger"];
const STATES = [
  "Provider list",
  "Provider connecting",
  "Provider connected",
  "Provider rejected",
  "Provider unsupported",
] as const;

/** Source: SWallet `First connect.png` adapted to a provider list. */
export default function ConnectExisting() {
  const [scan, setScan] = useState(true);
  const { variant, cycle } = useMockState(STATES);

  const connecting = variant === "Provider connecting";
  const connected = variant === "Provider connected";
  const rejected = variant === "Provider rejected";
  const unsupported = variant === "Provider unsupported";

  return (
    <PageContainer>
      <PageHeader title="Connect existing wallet" showBack />

      <View className="gap-5">
        <Text variant="body" muted>
          Use your existing wallet to create and control a smarter Quanta Account.
        </Text>

        <Card>
          {PROVIDERS.map((p, idx) => {
            const last = idx === PROVIDERS.length - 1;
            return (
              <Pressable
                key={p}
                onPress={() => router.replace("/onboarding/address")}
                className={`flex-row items-center gap-3 py-3 ${last ? "" : "border-b border-divider"}`}
              >
                <View className="w-10 h-10 rounded-md bg-background items-center justify-center border border-divider">
                  <Wallet size={20} color={colors.text} />
                </View>
                <Text variant="body" weight="medium" className="flex-1">
                  {p}
                </Text>
                {connecting && idx === 0 ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text variant="caption" muted>
                    Connect
                  </Text>
                )}
              </Pressable>
            );
          })}
        </Card>

        <Card>
          <Row
            label="Migration scan"
            detail="Optional. Look for legacy wallets and prompt to migrate."
            trailing={
              <Pressable onPress={() => setScan((s) => !s)}>
                <Text variant="caption" weight="semibold">
                  {scan ? "On" : "Off"}
                </Text>
              </Pressable>
            }
            showChevron={false}
            last
          />
        </Card>

        {connecting ? (
          <WarningCard
            severity="info"
            title="Connecting…"
            detail="Approve in your existing wallet to continue."
          />
        ) : null}
        {rejected ? (
          <WarningCard
            severity="review"
            title="Connection rejected"
            detail="Try another provider or come back later."
          />
        ) : null}
        {unsupported ? (
          <WarningCard
            severity="warning"
            title="Provider unsupported"
            detail="This provider isn't supported yet."
          />
        ) : null}
        {connected ? (
          <WarningCard
            severity="review"
            title="Existing wallet still controls the smart account"
            detail="You can rotate to a Qubitor-controlled key from Security."
          />
        ) : null}

        <View className="items-center">
          <Button onPress={() => router.replace("/onboarding/address")} disabled={!connected}>
            Continue
          </Button>
        </View>
        <View className="items-center">
          <DebugOnly>
          <Button variant="tertiary" onPress={cycle}>
            State: {variant}
          </Button>
          </DebugOnly>
        </View>
      </View>
    </PageContainer>
  );
}
