import { View } from "react-native";
import { router } from "expo-router";
import { Users, KeyRound, Smartphone } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { colors } from "@qubitor/ui-tokens";

const POINTS = [
  {
    Icon: Users,
    title: "Guardians can help you recover",
    detail: "They cannot spend your funds — they can only help complete a recovery action.",
  },
  {
    Icon: Smartphone,
    title: "Devices and passkeys",
    detail: "Add more devices or passkeys so a lost phone never locks you out.",
  },
  {
    Icon: KeyRound,
    title: "Your address stays the same",
    detail: "Recovery and key rotation keep your public Qubitor address stable.",
  },
];

export default function RecoveryEducation() {
  return (
    <PageContainer>
      <PageHeader title="Set up recovery" showBack />

      <View className="gap-5">
        <Text variant="body" muted>
          Recovery helps you regain access if a device is lost, a key is replaced, or your account needs to
          rotate to a safer authorization method.
        </Text>

        <View className="gap-3">
          {POINTS.map(({ Icon, title, detail }) => (
            <Card key={title}>
              <View className="flex-row gap-3">
                <Icon size={24} color={colors.text} />
                <View className="flex-1">
                  <Text variant="body" weight="semibold">
                    {title}
                  </Text>
                  <Text variant="caption" muted className="mt-1">
                    {detail}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <View className="items-center gap-2 mt-2">
          <Button onPress={() => router.push("/onboarding/account-label")}>Continue</Button>
          <Button variant="tertiary" onPress={() => router.push("/onboarding/account-label")}>
            Skip for now
          </Button>
        </View>
      </View>
    </PageContainer>
  );
}
