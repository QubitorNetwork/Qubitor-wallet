import { ReactNode } from "react";
import { Pressable, PressableProps, View } from "react-native";
import { colors } from "@qubitor/ui-tokens";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "tertiary" | "danger";
type Size = "default" | "block";

interface Props extends PressableProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
}

/** Source: Qubitor Network — bone-filled primary on qb-black, outlined secondary,
 *  transparent tertiary, hairline-crit danger. Pill, h-12. */
const containerClass: Record<Variant, string> = {
  primary: "bg-qb-bone",
  secondary: "bg-transparent border border-qb-line-strong",
  tertiary: "bg-transparent",
  danger: "bg-transparent border border-crit",
};

const labelClass: Record<Variant, string> = {
  primary: "text-qb-black",
  secondary: "text-qb-bone",
  tertiary: "text-qb-mist",
  danger: "text-crit",
};

const labelColor: Record<Variant, string> = {
  primary: colors.background,
  secondary: colors.text,
  tertiary: colors.textMuted,
  danger: colors.crit,
};

export function Button({ children, variant = "primary", size = "default", className, disabled, ...rest }: Props) {
  const widthClass = size === "block" ? "w-full" : "";
  const opacity = disabled ? "opacity-40" : "";
  return (
    <Pressable
      disabled={disabled}
      className={`h-12 rounded-pill items-center justify-center px-8 ${containerClass[variant]} ${widthClass} ${opacity} ${className ?? ""}`}
      {...rest}
    >
      <View>
        <Text variant="body-lg" weight="medium" className={labelClass[variant]} style={{ color: labelColor[variant] }}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}
