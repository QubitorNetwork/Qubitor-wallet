import { Pressable, Share, View } from "react-native";
import { Copy, Image as ImageIcon, Share2 } from "lucide-react-native";
import { Sheet } from "../Sheet";
import { Text } from "../Text";
import { colors } from "@qubitor/ui-tokens";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  /** Address or link to share. */
  payload: string;
}

/** Source: SWallet `Receive.png` "Share" action — exposed as a sheet of share targets. */
export function ShareSheet({ visible, onDismiss, payload }: Props) {
  const targets: { Icon: typeof Copy; label: string; onPress: () => void }[] = [
    {
      Icon: Copy,
      label: "Copy address",
      onPress: () => {
        // navigator.clipboard not available in RN — real impl uses expo-clipboard.
        onDismiss();
      },
    },
    {
      Icon: ImageIcon,
      label: "Copy QR image",
      onPress: () => {
        // real impl saves the QR svg to clipboard.
        onDismiss();
      },
    },
    {
      Icon: Share2,
      label: "Share via system",
      onPress: async () => {
        try {
          await Share.share({ message: payload });
        } catch {
          // ignore user cancel
        }
        onDismiss();
      },
    },
  ];

  return (
    <Sheet visible={visible} onDismiss={onDismiss}>
      <Text variant="title" weight="semibold" className="mb-3">
        Share
      </Text>
      {targets.map(({ Icon, label, onPress }, idx) => {
        const last = idx === targets.length - 1;
        return (
          <Pressable
            key={label}
            onPress={onPress}
            className={`flex-row items-center gap-3 py-3 ${last ? "" : "border-b border-divider"}`}
          >
            <View className="w-10 h-10 rounded-md bg-surface items-center justify-center">
              <Icon size={20} color={colors.text} />
            </View>
            <Text variant="body-lg" weight="medium" className="flex-1">
              {label}
            </Text>
          </Pressable>
        );
      })}
    </Sheet>
  );
}
