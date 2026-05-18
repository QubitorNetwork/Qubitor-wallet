import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { KeyVault } from "@qubitor/keystore";

function secureStoreOptions(): SecureStore.SecureStoreOptions {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return {
    keychainService: "quanta.wallet.mldsa65.profile",
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    requireAuthentication: proc?.env?.EXPO_PUBLIC_QUBITOR_REQUIRE_BIOMETRIC === "1",
    authenticationPrompt: "Unlock Quanta Wallet",
  };
}

/**
 * Mobile KeyVault — OS Keychain/Keystore via expo-secure-store on native.
 * On RN-web (Expo web preview) SecureStore is unavailable, so it falls back
 * to localStorage and reports `secure: false` so the UI can be honest about it.
 */
export const secureKeyVault: KeyVault = {
  backend: Platform.OS === "web" ? "local-insecure" : "secure-store",
  secure: Platform.OS !== "web",
  async getItem(key) {
    if (Platform.OS === "web" && typeof globalThis.localStorage !== "undefined") {
      return globalThis.localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key, secureStoreOptions());
  },
  async setItem(key, value) {
    if (Platform.OS === "web" && typeof globalThis.localStorage !== "undefined") {
      globalThis.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value, secureStoreOptions());
  },
  async deleteItem(key) {
    if (Platform.OS === "web" && typeof globalThis.localStorage !== "undefined") {
      globalThis.localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key, secureStoreOptions());
  },
};
