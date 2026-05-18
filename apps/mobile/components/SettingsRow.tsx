import { Pressable, View } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { Text } from "./Text";
import { colors } from "@qubitor/ui-tokens";

type IconColor = "green" | "orange" | "gray" | "yellow";

interface Props {
  Icon: LucideIcon;
  /** Retained for source-compat with Phase 1–3 callers; ignored visually in Phase 4. */
  iconColor?: IconColor;
  label: string;
  detail?: string;
  onPress?: () => void;
  /** Use a stronger hairline emphasis for rare priority rows. */
  accent?: boolean;
}

/** Source: Qubitor Network — uniform qb-ink square with qb-line hairline,
 *  qb-bone icon, qb-bone label, qb-mist sub-label. iconColor accepted for
 *  API compat but does not change the visual (Phase 4 is monochrome). */
export function SettingsRow({ Icon, label, detail, onPress, accent = false }: Props) {
  const borderClass = accent ? "border-qb-line-strong" : "border-qb-line";
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 py-3 border-b border-qb-line"
    >
      <View className={`w-11 h-11 rounded-md bg-qb-ink border ${borderClass} items-center justify-center`}>
        <Icon size={20} color={colors.text} />
      </View>
      <View className="flex-1">
        <Text variant="body-lg" weight="medium">
          {label}
        </Text>
        {detail ? (
          <Text variant="caption" muted className="mt-0.5">
            {detail}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </Pressable>
  );
}
