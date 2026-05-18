import { ReactNode } from "react";
import { View, ViewProps } from "react-native";

interface Props extends ViewProps {
  children: ReactNode;
  /** Hero variant: stronger hairline border + larger radius. */
  hero?: boolean;
}

/** Source: Qubitor Network — qb-panel surface with qb-line 1px hairline. Flat (no shadow). */
export function Card({ children, hero = false, className, ...rest }: Props) {
  const base = hero
    ? "bg-qb-panel rounded-xl border border-qb-line-strong p-5"
    : "bg-qb-panel rounded-lg border border-qb-line p-4";
  return (
    <View className={`${base} ${className ?? ""}`} {...rest}>
      {children}
    </View>
  );
}
