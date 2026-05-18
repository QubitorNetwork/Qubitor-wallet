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

const STATES = ["Empty", "Entering", "Mismatch", "Ready"] as const;

export default function ConfirmPasscode() {
  const [code, setCode] = useState("");
  const { variant, cycle } = useMockState(STATES, "Empty");
  const mismatch = variant === "Mismatch";

  return (
    <PageContainer scrollable={false}>
      <PageHeader title="Confirm passcode" showBack />

      <View className="gap-5 flex-1">
        <Text variant="body" muted>
          Enter your passcode again to confirm.
        </Text>
        <Input
          label="Passcode"
          placeholder="Re-enter 6 digits"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />

        {mismatch ? (
          <WarningCard severity="warning" title="Passcodes don't match" detail="Try again." />
        ) : null}

        <View className="flex-1" />

        <View className="items-center">
          <Button
            onPress={() => router.push("/onboarding/recovery-education")}
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
