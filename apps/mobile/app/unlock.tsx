import { useEffect, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";
import { AddressDisplay } from "@/components/AddressDisplay";
import {
  getWalletBootStateForAnyChain,
  migrateLegacyWalletProfile,
  unlockWalletProfile,
  type QubitorWalletPreview,
} from "@/lib/pqDevWallet";
import { setSelectedChainId } from "@/lib/networkPreference";
import { configuredQubitorChainId } from "@/lib/runtimeConfig";

export default function UnlockWallet() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [preview, setPreview] = useState<QubitorWalletPreview | undefined>();
  const [migrating, setMigrating] = useState(params.mode === "migrate");
  const [passcode, setPasscode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    getWalletBootStateForAnyChain(configuredQubitorChainId())
      .then((state) => {
        if (!active) return;
        if (state.status === "no-wallet") {
          router.replace("/onboarding/welcome");
          return;
        }
        if (state.status === "migrate-required") setMigrating(true);
        if ("preview" in state) {
          void setSelectedChainId(state.chainId as Parameters<typeof setSelectedChainId>[0]);
          setPreview(state.preview);
        }
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not read wallet profile.");
      });
    return () => {
      active = false;
    };
  }, []);

  const canSubmit = passcode.length >= 8 && (!migrating || passcode === confirm);

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      if (migrating) {
        const state = await getWalletBootStateForAnyChain(configuredQubitorChainId());
        await migrateLegacyWalletProfile(passcode, state.chainId);
      } else {
        const state = await getWalletBootStateForAnyChain(configuredQubitorChainId());
        await unlockWalletProfile(passcode, state.chainId);
      }
      router.replace("/(tabs)/home");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not unlock Quanta Wallet.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer scrollable={false}>
      <PageHeader title={migrating ? "Secure wallet" : "Unlock wallet"} showBack />

      <View className="gap-5 flex-1">
        <Text variant="body" muted>
          {migrating
            ? "Secure your existing Quanta Account with an encrypted local profile. Your address will not change."
            : "Enter your local passcode to unlock signing and recovery actions."}
        </Text>

        {preview ? (
          <View className="rounded-md border border-qb-line bg-qb-panel p-4 gap-2">
            <Text variant="label" muted>
              Quanta Account
            </Text>
            <AddressDisplay address={preview.accountAddress} />
          </View>
        ) : null}

        <Input
          label={migrating ? "New wallet passcode" : "Wallet passcode"}
          placeholder="At least 8 characters"
          secureTextEntry
          value={passcode}
          onChangeText={setPasscode}
        />
        {migrating ? (
          <Input
            label="Confirm passcode"
            placeholder="Repeat passcode"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />
        ) : null}

        {passcode.length > 0 && passcode.length < 8 ? (
          <WarningCard severity="warning" title="Passcode too short" detail="Use at least 8 characters." />
        ) : null}
        {migrating && confirm.length > 0 && passcode !== confirm ? (
          <WarningCard severity="warning" title="Passcodes do not match" detail="Re-enter the same passcode." />
        ) : null}
        {error ? <WarningCard severity="critical" title="Unlock failed" detail={error} /> : null}

        <View className="flex-1" />

        <Button size="block" onPress={submit} disabled={!canSubmit || busy}>
          {busy ? "Working…" : migrating ? "Secure and continue" : "Unlock"}
        </Button>
      </View>
    </PageContainer>
  );
}
