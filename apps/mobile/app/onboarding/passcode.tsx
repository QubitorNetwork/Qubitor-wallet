import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";
import { createEncryptedWalletProfile } from "@/lib/pqDevWallet";
import { configuredQubitorChainId } from "@/lib/runtimeConfig";

export default function CreatePasscode() {
  const [passcode, setPasscode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const canCreate = passcode.length >= 8 && passcode === confirm && !busy;

  const createWallet = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await createEncryptedWalletProfile(passcode, configuredQubitorChainId());
      router.replace("/onboarding/generating");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create Quanta Account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer scrollable={false}>
      <PageHeader title="Create wallet passcode" showBack />

      <View className="gap-5 flex-1">
        <Text variant="body" muted>
          This passcode encrypts your local ML-DSA signing key. Quanta Wallet cannot recover it for you.
        </Text>
        <Input
          label="Wallet passcode"
          placeholder="At least 8 characters"
          secureTextEntry
          value={passcode}
          onChangeText={setPasscode}
        />
        <Input
          label="Confirm passcode"
          placeholder="Repeat passcode"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        {passcode.length > 0 && passcode.length < 8 ? (
          <WarningCard severity="warning" title="Passcode too short" detail="Use at least 8 characters." />
        ) : null}
        {confirm.length > 0 && passcode !== confirm ? (
          <WarningCard severity="warning" title="Passcodes do not match" detail="Re-enter the same passcode." />
        ) : null}
        {error ? <WarningCard severity="critical" title="Account creation failed" detail={error} /> : null}

        <View className="flex-1" />

        <Button size="block" onPress={createWallet} disabled={!canCreate}>
          {busy ? "Creating…" : "Create Quanta Account"}
        </Button>
      </View>
    </PageContainer>
  );
}
