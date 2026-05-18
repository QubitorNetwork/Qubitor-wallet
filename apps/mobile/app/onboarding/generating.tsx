import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { Text } from "@/components/Text";
import { colors } from "@qubitor/ui-tokens";

export default function Generating() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setDone(true), 1100);
    const t2 = setTimeout(() => router.replace("/onboarding/address"), 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <PageContainer scrollable={false}>
      <View className="flex-1 items-center justify-center gap-6">
        {done ? (
          <CheckCircle2 size={64} color={colors.primary} />
        ) : (
          <ActivityIndicator size="large" color={colors.text} />
        )}
        <Text variant="title" weight="semibold" className="text-center">
          {done ? "Account ready" : "Generating Quanta Account"}
        </Text>
        <Text variant="body" muted className="text-center px-8">
          {done
            ? "Your 0x address has been derived."
            : "Deriving your Quanta 0x smart account address."}
        </Text>
      </View>
    </PageContainer>
  );
}
