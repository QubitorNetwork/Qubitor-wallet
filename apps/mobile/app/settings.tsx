import { useEffect, useState } from "react";
import { View } from "react-native";
import { router, type Href } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BookUser, KeyRound, ShieldCheck, Trash2, Code2, LockKeyhole, Info } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Row } from "@/components/Row";
import { SettingsRow } from "@/components/SettingsRow";
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";
import { Input } from "@/components/Input";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";
import { isDebugMode } from "@qubitor/core";
import { lockWalletProfile, resetQuantaWallet } from "@/lib/pqDevWallet";
import { SELECTABLE_CHAINS } from "@/lib/networkPreference";
import { getWalletLockTimeoutMinutes, setWalletLockTimeoutMinutes } from "@/lib/walletLockSettings";

function readEnv(key: string): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.[key];
}

/** Real settings — every row reflects actual runtime config or performs a
 *  real action. No placeholder toggles. */
export default function Settings() {
  const snapshot = useAccountSnapshot();
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [wipeArmed, setWipeArmed] = useState(false);
  const [wipePhrase, setWipePhrase] = useState("");
  const [lockTimeout, setLockTimeout] = useState(5);

  const biometricRequired = readEnv("EXPO_PUBLIC_QUBITOR_REQUIRE_BIOMETRIC") === "1";

  useEffect(() => {
    let active = true;
    getWalletLockTimeoutMinutes().then((minutes) => {
      if (active) setLockTimeout(minutes);
    });
    return () => {
      active = false;
    };
  }, []);

  const updateLockTimeout = async (minutes: number) => {
    await setWalletLockTimeoutMinutes(minutes);
    setLockTimeout(minutes);
  };

  const performReset = async () => {
    setResetting(true);
    try {
      await resetQuantaWallet();
      const keys = await AsyncStorage.getAllKeys();
      const walletKeys = keys.filter((k) => k.startsWith("quanta.wallet."));
      if (walletKeys.length > 0) await AsyncStorage.multiRemove(walletKeys);
      setResetDone(true);
      router.replace("/onboarding/welcome");
    } finally {
      setResetting(false);
    }
  };

  const lockWallet = () => {
    lockWalletProfile(snapshot.chainId);
    snapshot.refresh();
    router.replace("/unlock");
  };

  return (
    <PageContainer>
      <PageHeader title="Settings" showBack />

      <View className="gap-5">
        <Card>
          <Text variant="label" muted className="mb-2">
            Network
          </Text>
          <Row label="Active chain" value={snapshot.chainName} showChevron={false} />
          <Row label="Native gas" value={snapshot.nativeCurrencySymbol} showChevron={false} />
          <Row label="Status" value={snapshot.status} showChevron={false} last />
          <View className="flex-row gap-3 mt-4">
            {SELECTABLE_CHAINS.map((c) => {
              const active = snapshot.chainId === c.id;
              return (
                <Button
                  key={c.id}
                  variant={active ? "primary" : "secondary"}
                  className="flex-1"
                  disabled={active}
                  onPress={() => snapshot.setChain(c.id)}
                >
                  {c.name.replace("Qubitor ", "")}
                </Button>
              );
            })}
          </View>
          <Text variant="caption" muted className="mt-2">
            Switching repoints every screen's live reads and persists across launches.
          </Text>
        </Card>

        <Card>
          <Text variant="label" muted className="mb-2">
            Security
          </Text>
          <Row
            label="Key storage"
            value="Secure enclave (this device)"
            showChevron={false}
          />
          <Row
            label="Biometric unlock"
            value={biometricRequired ? "Required" : "Off (env)"}
            showChevron={false}
          />
          <Row label="Lock timeout" value={lockTimeout === 0 ? "Manual only" : `${lockTimeout} min`} showChevron={false} />
          <Row label="Debug mode" value={isDebugMode() ? "On" : "Off"} showChevron={false} last />
          <View className="flex-row gap-2 mt-4">
            {[1, 5, 15, 0].map((minutes) => (
              <Button
                key={minutes}
                variant={lockTimeout === minutes ? "primary" : "secondary"}
                className="flex-1 px-2"
                onPress={() => updateLockTimeout(minutes)}
              >
                {minutes === 0 ? "Manual" : `${minutes}m`}
              </Button>
            ))}
          </View>
        </Card>

        <View>
          <SettingsRow
            Icon={KeyRound}
            iconColor="yellow"
            label="Recovery Kit & key rotation"
            detail="Back up or rotate the ML-DSA control key"
            onPress={() => router.push("/recovery")}
          />
          <SettingsRow
            Icon={BookUser}
            iconColor="gray"
            label="Address book"
            detail="Saved contacts with poisoning checks"
            onPress={() => router.push("/address-book" as Href)}
          />
          <SettingsRow
            Icon={ShieldCheck}
            iconColor="green"
            label="Security Center"
            detail="Readiness, validation, modules"
            onPress={() => router.push("/(tabs)/security")}
          />
          <SettingsRow
            Icon={LockKeyhole}
            iconColor="yellow"
            label="Lock Wallet"
            detail="Clear the in-memory ML-DSA unlock session"
            onPress={lockWallet}
          />
          <SettingsRow
            Icon={Code2}
            iconColor="gray"
            label="Developer Mode"
            detail="Account contract, RPC, debug export"
            onPress={() => router.push("/developer-mode")}
          />
          <SettingsRow
            Icon={Info}
            iconColor="gray"
            label="About Quanta Wallet"
            detail="Version, stores, releases, privacy"
            onPress={() => router.push("/about")}
          />
        </View>

        {resetDone ? (
          <WarningCard
            severity="info"
            title="Wallet reset"
            detail="On-device key and local data were deleted. Restart onboarding to create a new Quanta Account."
          />
        ) : (
          <Card>
            <Text variant="label" muted className="mb-2">
              Danger zone
            </Text>
            <Text variant="caption" muted className="mb-3">
              Irreversible. Deletes the ML-DSA key, activity, address book, and local wallet state on this device.
            </Text>
            {wipeArmed ? (
              <View className="gap-3">
                <Input
                  label="Type WIPE to confirm"
                  value={wipePhrase}
                  onChangeText={setWipePhrase}
                  autoCapitalize="characters"
                />
                <View className="flex-row gap-3">
                  <Button
                    className="flex-1"
                    variant="secondary"
                    onPress={() => {
                      setWipeArmed(false);
                      setWipePhrase("");
                    }}
                    disabled={resetting}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    variant="danger"
                    onPress={performReset}
                    disabled={resetting || wipePhrase !== "WIPE"}
                  >
                    {resetting ? "Wiping…" : "Wipe"}
                  </Button>
                </View>
              </View>
            ) : (
              <Button variant="danger" onPress={() => setWipeArmed(true)} disabled={resetting}>
                Wipe wallet data
              </Button>
            )}
          </Card>
        )}

        <View className="flex-row items-center gap-2 px-1">
          <Trash2 size={14} color="#8a8a8a" />
          <Text variant="caption" muted>
            Reset cannot be undone without a backup exported from Recovery.
          </Text>
        </View>
      </View>
    </PageContainer>
  );
}
