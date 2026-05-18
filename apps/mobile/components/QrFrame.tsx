import { ReactNode } from "react";
import { View } from "react-native";

interface Props {
  children: ReactNode;
}

/** Source: Qubitor Network — white-on-black framed QR. Thick 2px qb-bone border
 *  over qb-black, replacing the SWallet white frame on white. */
export function QrFrame({ children }: Props) {
  return (
    <View className="self-center p-5 rounded-xl border-2 border-qb-bone bg-qb-black">
      {children}
    </View>
  );
}
