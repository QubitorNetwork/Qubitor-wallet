import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { colors } from "@qubitor/ui-tokens";
import { Text } from "@/components/Text";

export default function ConfirmPasscode() {
  useEffect(() => {
    router.replace("/onboarding/passcode");
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-qb-black gap-3 px-8">
      <ActivityIndicator color={colors.text} />
      <Text variant="body" muted className="text-center">
        Opening secure account creation…
      </Text>
    </View>
  );
}
