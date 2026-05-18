import { useState } from "react";
import { TextInput, TextInputProps, View } from "react-native";
import { Text } from "./Text";
import { colors } from "@qubitor/ui-tokens";

interface Props extends TextInputProps {
  label?: string;
}

/** Source: Qubitor Network — qb-ink filled input with qb-line 1px hairline,
 *  qb-bone text, qb-mist placeholder. Focus deepens border to qb-line-strong. */
export function Input({ label, className, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-1.5">
      {label ? (
        <Text variant="label" muted>
          {label}
        </Text>
      ) : null}
      <TextInput
        className={`h-14 px-4 bg-qb-ink rounded-md border text-body-lg text-qb-bone ${focused ? "border-qb-line-strong" : "border-qb-line"} ${className ?? ""}`}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
    </View>
  );
}
