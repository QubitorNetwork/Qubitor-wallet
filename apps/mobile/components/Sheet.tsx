import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
}

/** Source: Qubitor Network — qb-ink sheet on a near-opaque qb-black backdrop,
 *  qb-line top hairline, qb-line-strong drag handle. */
export function Sheet({ visible, onDismiss, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable className="flex-1" style={{ backgroundColor: "rgba(5,5,5,0.7)" }} onPress={onDismiss}>
        <View className="flex-1" />
      </Pressable>
      <View className="bg-qb-ink rounded-t-xl border-t border-qb-line px-page pt-2 pb-8">
        <View className="self-center w-12 h-1.5 rounded-pill bg-qb-line-strong mb-4" />
        {children}
      </View>
    </Modal>
  );
}
