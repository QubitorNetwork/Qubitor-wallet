import { View } from "react-native";
import { shortenAddress, type Hex } from "@qubitor/core";
import { Text } from "./Text";

interface Props {
  address: Hex;
  full?: boolean;
}

/** Source: Qubitor Network — JetBrains Mono in qb-bone. */
export function AddressDisplay({ address, full = false }: Props) {
  return (
    <View>
      <Text variant="mono" weight="medium">
        {full ? address : shortenAddress(address)}
      </Text>
    </View>
  );
}
