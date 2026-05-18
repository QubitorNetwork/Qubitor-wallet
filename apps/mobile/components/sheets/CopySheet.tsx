import { useEffect } from "react";
import { View } from "react-native";
import { Check } from "lucide-react-native";
import { Sheet } from "../Sheet";
import { Text } from "../Text";
import { colors } from "@qubitor/ui-tokens";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  /** What was copied (used in confirmation copy). */
  label?: string;
}

/** Lightweight confirmation sheet shown briefly when something was copied to clipboard.
 *  Auto-dismisses after 1.2s. */
export function CopySheet({ visible, onDismiss, label = "Address" }: Props) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, 1200);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <Sheet visible={visible} onDismiss={onDismiss}>
      <View className="items-center py-4 gap-3">
        <View className="w-12 h-12 rounded-pill bg-primary/15 items-center justify-center">
          <Check size={24} color={colors.primary} />
        </View>
        <Text variant="body-lg" weight="semibold">
          {label} copied
        </Text>
      </View>
    </Sheet>
  );
}
