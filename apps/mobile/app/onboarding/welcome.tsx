import { Image, View } from "react-native";
import { router } from "expo-router";
import { PageContainer } from "@/components/PageContainer";
import { Text } from "@/components/Text";
import { Button } from "@/components/Button";

/** Source: Qubitor Network — qb-black background, qb-label eyebrow, qb-display title,
 *  qb-panel framed illustration, bone-filled primary + outlined secondary + transparent tertiary. */
export default function Welcome() {
  return (
    <PageContainer>
      <View className="pt-12 gap-8">
        <View className="items-center gap-3">
          <Text variant="label" muted>
            00 / Welcome
          </Text>
          <Text variant="page-title" weight="medium" className="text-center">
            Hello
          </Text>
        </View>

        <View className="rounded-xl border border-qb-line-strong bg-qb-panel p-8 items-center gap-4">
          <Image
            source={require("@/assets/quanta-logo.png")}
            style={{ width: 72, height: 72 }}
            resizeMode="contain"
          />
          <Text variant="body" muted className="text-center">
            A smart account with programmable validation, recovery, key rotation, and quantum-ready security.
          </Text>
        </View>

        <View className="items-center gap-1">
          <Text variant="body" muted className="text-center">
            Your Quanta Account is a normal 0x address
          </Text>
          <Text variant="body" muted className="text-center">
            with smarter security underneath.
          </Text>
        </View>

        <View className="gap-3 mt-2">
          <Button size="block" onPress={() => router.push("/onboarding/passcode")}>
            Create Quanta Account
          </Button>
          <Button
            size="block"
            variant="secondary"
            onPress={() => router.push("/onboarding/recovery-education")}
          >
            Recover Account
          </Button>
          <Button size="block" variant="tertiary" onPress={() => router.push("/connect-existing")}>
            Connect Existing Wallet
          </Button>
        </View>
      </View>
    </PageContainer>
  );
}
