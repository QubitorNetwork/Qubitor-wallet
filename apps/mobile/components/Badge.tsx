import { View } from "react-native";
import { badgeColorByState, colors, type BadgeColor } from "@qubitor/ui-tokens";
import { Text } from "./Text";

interface Props {
  label: string;
  color?: BadgeColor;
}

/** Source: Qubitor Network — monochrome only.
 *  - positive: qb-bone fill on qb-black text
 *  - review:   qb-spark 1px outline, qb-bone text
 *  - warning:  warn 1px outline, warn text
 *  - neutral:  qb-line-strong 1px outline, qb-mist text */
const containerClass: Record<BadgeColor, string> = {
  positive: "bg-qb-bone",
  review: "bg-transparent border border-qb-spark",
  warning: "bg-transparent border border-warn",
  neutral: "bg-transparent border border-qb-line-strong",
};

const textClass: Record<BadgeColor, string> = {
  positive: "text-qb-black",
  review: "text-qb-bone",
  warning: "text-warn",
  neutral: "text-qb-mist",
};

const textColor: Record<BadgeColor, string> = {
  positive: colors.background,
  review: colors.text,
  warning: colors.warn,
  neutral: colors.textMuted,
};

export function Badge({ label, color }: Props) {
  const resolved = color ?? badgeColorByState[label] ?? "neutral";
  return (
    <View className={`self-start px-2.5 py-1 rounded-pill ${containerClass[resolved]}`}>
      <Text variant="label" weight="medium" className={textClass[resolved]} style={{ color: textColor[resolved] }}>
        {label}
      </Text>
    </View>
  );
}
