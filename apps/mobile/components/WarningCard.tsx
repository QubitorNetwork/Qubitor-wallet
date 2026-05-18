import { View } from "react-native";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react-native";
import { colors } from "@qubitor/ui-tokens";
import type { WarningSeverity } from "@qubitor/core";
import { Text } from "./Text";

interface Props {
  severity: WarningSeverity;
  title: string;
  detail?: string;
}

/** Source: Qubitor Network — qb-panel surface with a 2px left accent bar.
 *  info → qb-line-strong, review/warning → warn, critical → crit. */
const accentClass: Record<WarningSeverity, string> = {
  info: "bg-qb-line-strong",
  review: "bg-warn",
  warning: "bg-warn",
  critical: "bg-crit",
};

const iconColor: Record<WarningSeverity, string> = {
  info: colors.textMuted,
  review: colors.warn,
  warning: colors.warn,
  critical: colors.crit,
};

const titleColor: Record<WarningSeverity, string> = {
  info: "text-qb-bone",
  review: "text-qb-bone",
  warning: "text-qb-bone",
  critical: "text-qb-bone",
};

export function WarningCard({ severity, title, detail }: Props) {
  const Icon = severity === "info" ? Info : severity === "critical" ? ShieldAlert : AlertTriangle;
  return (
    <View className="flex-row rounded-md overflow-hidden bg-qb-panel border border-qb-line">
      <View className={`w-1 ${accentClass[severity]}`} />
      <View className="flex-row gap-3 p-4 flex-1">
        <Icon size={20} color={iconColor[severity]} />
        <View className="flex-1">
          <Text variant="body" weight="semibold" className={titleColor[severity]}>
            {title}
          </Text>
          {detail ? (
            <Text variant="caption" muted className="mt-1">
              {detail}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
