import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export default function AccountLabel() {
  const [name, setName] = useState("Quanta Account");
  return (
    <PageContainer scrollable={false}>
      <PageHeader title="Name your account" showBack />

      <View className="gap-5 flex-1">
        <Text variant="body" muted>
          Optional. Pick a label to recognize this account inside the app. Your public address is unchanged.
        </Text>
        <Input
          label="Account label"
          placeholder="Quanta Account"
          value={name}
          onChangeText={setName}
          maxLength={32}
        />

        <View className="flex-1" />

        <View className="items-center">
          <Button onPress={() => router.push("/onboarding/generating")}>Continue</Button>
        </View>
      </View>
    </PageContainer>
  );
}
