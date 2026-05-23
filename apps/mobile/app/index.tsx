import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { colors } from "@qubitor/ui-tokens";
import { Text } from "@/components/Text";
import { getWalletBootStateForAnyChain } from "@/lib/pqDevWallet";
import { setSelectedChainId } from "@/lib/networkPreference";
import { configuredQubitorChainId } from "@/lib/runtimeConfig";

export default function Index() {
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let active = true;

    async function boot() {
      const chainId = configuredQubitorChainId();
      const state = await getWalletBootStateForAnyChain(chainId);
      if (!active) return;
      if (state.status === "no-wallet") {
        router.replace("/onboarding/welcome");
      } else if (state.status === "migrate-required") {
        if (state.chainId !== chainId) await setSelectedChainId(state.chainId as Parameters<typeof setSelectedChainId>[0]);
        router.replace("/unlock?mode=migrate");
      } else if (state.status === "error") {
        setError(state.error);
      } else {
        if (state.chainId !== chainId) await setSelectedChainId(state.chainId as Parameters<typeof setSelectedChainId>[0]);
        router.replace("/(tabs)/home");
      }
    }

    void boot().catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : "Could not open Quanta Wallet.");
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-qb-black px-8 gap-4">
      <ActivityIndicator color={colors.text} />
      <Text variant="body" muted className="text-center">
        {error ?? "Opening Quanta Wallet…"}
      </Text>
    </View>
  );
}
