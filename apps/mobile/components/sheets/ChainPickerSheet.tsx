import { Pressable, View } from "react-native";
import { Check } from "lucide-react-native";
import { Sheet } from "../Sheet";
import { Text } from "../Text";
import { Badge } from "../Badge";
import { colors } from "@qubitor/ui-tokens";

interface Chain {
  name: string;
  badge: string;
}

const CHAINS: Chain[] = [
  { name: "Qubitor Testnet", badge: "PQ Native" },
  { name: "Qubitor Devnet", badge: "Local QA" },
];

interface Props {
  visible: boolean;
  onDismiss: () => void;
  selected?: string;
  onSelect?: (chain: string) => void;
}

/** Source: SWallet network selector pattern; reused for Receive / Bridge selection. */
export function ChainPickerSheet({ visible, onDismiss, selected = "Qubitor Testnet", onSelect }: Props) {
  return (
    <Sheet visible={visible} onDismiss={onDismiss}>
      <Text variant="title" weight="semibold" className="mb-3">
        Select network
      </Text>
      {CHAINS.map((c, idx) => {
        const last = idx === CHAINS.length - 1;
        return (
          <Pressable
            key={c.name}
            onPress={() => {
              onSelect?.(c.name);
              onDismiss();
            }}
            className={`flex-row items-center gap-3 py-3 ${last ? "" : "border-b border-divider"}`}
          >
            <View className="flex-1">
              <Text variant="body-lg" weight="medium">
                {c.name}
              </Text>
              <View className="mt-1 self-start">
                <Badge label={c.badge} />
              </View>
            </View>
            {selected === c.name ? <Check size={20} color={colors.primary} /> : null}
          </Pressable>
        );
      })}
    </Sheet>
  );
}
