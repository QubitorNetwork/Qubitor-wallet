import { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  children: ReactNode;
  scrollable?: boolean;
}

export function PageContainer({ children, scrollable = true }: Props) {
  if (!scrollable) {
    return (
      <SafeAreaView className="flex-1 bg-qb-black">
        <View className="flex-1 px-page">{children}</View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-qb-black">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-page pb-12"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
