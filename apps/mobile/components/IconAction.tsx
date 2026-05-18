import { Pressable, View } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { Text } from "./Text";
import { colors } from "@qubitor/ui-tokens";

interface Props {
  label: string;
  Icon: LucideIcon;
  onPress?: () => void;
}

/** Source: Qubitor Network — qb-panel square with qb-line hairline,
 *  qb-bone icon, qb-bone caption below. Pressed state → qb-ink. */
export function IconAction({ label, Icon, onPress }: Props) {
  return (
    <View className="items-center gap-2 flex-1">
      <Pressable
        onPress={onPress}
        className="w-14 h-14 rounded-md bg-qb-panel border border-qb-line items-center justify-center active:bg-qb-ink"
      >
        <Icon size={22} color={colors.text} />
      </Pressable>
      <Text variant="caption" weight="medium" className="text-center">
        {label}
      </Text>
    </View>
  );
}
