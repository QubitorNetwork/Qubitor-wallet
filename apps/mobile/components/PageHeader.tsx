import { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Text } from "./Text";
import { colors } from "@qubitor/ui-tokens";

interface Props {
  title: string;
  /** Optional uppercase mono eyebrow above the title (Qubitor Network qb-label pattern). */
  eyebrow?: string;
  showBack?: boolean;
  onBack?: () => void;
  trailing?: ReactNode;
  centerTitle?: boolean;
}

/** Source: Qubitor Network — back arrow + display title in qb-bone, optional qb-label eyebrow. */
export function PageHeader({ title, eyebrow, showBack, onBack, trailing, centerTitle = false }: Props) {
  const handleBack = onBack ?? (() => router.back());
  return (
    <View className="mb-4">
      <View className="flex-row items-center min-h-row-comfy">
        {showBack ? (
          <Pressable onPress={handleBack} className="w-10 h-10 items-center justify-center -ml-2">
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        ) : null}
        <View className={`flex-1 ${centerTitle ? "items-center" : ""}`}>
          {eyebrow ? (
            <Text variant="label" muted className="mb-1">
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="page-title" weight="medium">
            {title}
          </Text>
        </View>
        {trailing}
      </View>
    </View>
  );
}
