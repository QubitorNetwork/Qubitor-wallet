import "../global.css";
import { Stack } from "expo-router";
import { router } from "expo-router";
import {
  useFonts,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { colors } from "@qubitor/ui-tokens";
import { registerKeyVault } from "@qubitor/keystore";
import { secureKeyVault } from "@/lib/secureKeyVault";
import { tauriKeyVault } from "@/lib/tauriKeyVault";
import { getWalletBootStateForAnyChain, lockWalletProfile } from "@/lib/pqDevWallet";
import { getWalletLockTimeoutMinutes } from "@/lib/walletLockSettings";
import { configuredQubitorChainId } from "@/lib/runtimeConfig";

// Pick the platform key vault at startup. Inside the Tauri desktop shell the
// blob lives in the OS keychain (Rust `vault_*` commands); on native mobile it
// lives in expo-secure-store. Both store the same passcode-encrypted ciphertext.
const underTauri =
  typeof globalThis !== "undefined" &&
  Boolean((globalThis as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
registerKeyVault(underTauri ? tauriKeyVault : secureKeyVault);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const backgroundedAt = useRef<number | undefined>();
  const [loaded] = useFonts({
    // Display (qb-display) — Space Grotesk
    SpaceGrotesk: SpaceGrotesk_500Medium,
    "SpaceGrotesk-Medium": SpaceGrotesk_500Medium,
    "SpaceGrotesk-Semibold": SpaceGrotesk_600SemiBold,
    "SpaceGrotesk-Bold": SpaceGrotesk_700Bold,
    // Body (qb-body) — Inter
    Inter: Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-Semibold": Inter_600SemiBold,
    // Mono (qb-label / qb-mono) — JetBrains Mono
    JetBrainsMono: JetBrainsMono_400Regular,
    "JetBrainsMono-Medium": JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    const onChange = async (nextState: AppStateStatus) => {
      if (nextState === "background" || nextState === "inactive") {
        backgroundedAt.current = Date.now();
        return;
      }
      if (nextState !== "active" || backgroundedAt.current === undefined) return;
      const elapsedMs = Date.now() - backgroundedAt.current;
      backgroundedAt.current = undefined;
      const timeoutMinutes = await getWalletLockTimeoutMinutes();
      if (timeoutMinutes === 0 || elapsedMs < timeoutMinutes * 60_000) return;
      const state = await getWalletBootStateForAnyChain(configuredQubitorChainId());
      if (state.status === "unlocked" || state.status === "read-only-ready" || state.status === "migrate-required") {
        lockWalletProfile("all");
        router.replace("/unlock");
      }
    };
    const subscription = AppState.addEventListener("change", (nextState) => {
      void onChange(nextState);
    });
    return () => subscription.remove();
  }, []);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="unlock" options={{ animation: "fade" }} />
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
