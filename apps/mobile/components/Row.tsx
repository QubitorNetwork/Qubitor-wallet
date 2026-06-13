import { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { Text } from "./Text";
import { colors } from "@qubitor/ui-tokens";

interface Props {
  label: string;
  value?: string;
  detail?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  last?: boolean;
}

/** Source: Qubitor Network receipt-style row — qb-line bottom hairline, qb-bone label,
 *  qb-mist value/detail, chevron in qb-mist. */
export function Row({ label, value, detail, trailing, onPress, showChevron = true, last = false }: Props) {
  const border = last ? "" : "border-b border-qb-line";
  const content = (
    <View className={`flex-row items-center justify-between min-h-row-min py-3 ${border}`}>
      <View className="flex-1 pr-3">
        <Text variant="body" weight="medium">
          {label}
        </Text>
        {detail ? (
          <Text variant="caption" muted className="mt-0.5">
            {detail}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-2 max-w-[62%] justify-end">
        {value ? (
          <Text variant="body" muted className="text-right" numberOfLines={2}>
            {value}
          </Text>
        ) : null}
        {trailing}
        {onPress && showChevron ? <ChevronRight size={18} color={colors.textMuted} /> : null}
      </View>
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}
