import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";
import { useMockState } from "@/hooks/useMockState";
import { DebugOnly } from "@/components/DebugOnly";

const STATES = ["Empty", "Entering", "Too short", "Ready"] as const;

export default function CreatePasscode() {
  const [code, setCode] = useState("");
  const { variant, cycle } = useMockState(STATES, "Empty");
  const tooShort = variant === "Too short";

  return (
    <PageContainer scrollable={false}>
      <PageHeader title="Create app passcode" showBack />

      <View className="gap-5 flex-1">
        <Text variant="body" muted>
          Use a passcode to unlock the Qubitor app on this device. This is local to your device and does not
          control your account.
        </Text>
        <Input
          label="Passcode"
          placeholder="Enter 6 digits"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />

        {tooShort ? (
          <WarningCard severity="warning" title="Passcode too short" detail="Use at least 6 digits." />
        ) : null}

        <View className="flex-1" />

        <View className="items-center">
          <Button
            onPress={() => router.push("/onboarding/confirm-passcode")}
            disabled={code.length < 6 && variant !== "Ready"}
          >
            Continue
          </Button>
          <View className="mt-2">
            <DebugOnly>
            <Button variant="tertiary" onPress={cycle}>
              State: {variant}
            </Button>
            </DebugOnly>
          </View>
        </View>
      </View>
    </PageContainer>
  );
}
