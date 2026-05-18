import { View } from "react-native";
import { Tabs } from "expo-router";
import { Home, Activity, Wallet, AppWindow, Shield, type LucideIcon } from "lucide-react-native";
import { tabBar, typography } from "@qubitor/ui-tokens";

interface PillIconProps {
  Icon: LucideIcon;
  focused: boolean;
}

/** Source: Qubitor Network — bone pill behind active icon (inverts the website's
 *  selection-bg pattern: bone fill, black icon). Inactive = qb-mist outline icon. */
function PillIcon({ Icon, focused }: PillIconProps) {
  if (!focused) {
    return <Icon size={tabBar.iconSize} color={tabBar.inactiveIconColor} />;
  }
  return (
    <View
      style={{
        width: tabBar.pillWidth,
        height: tabBar.pillHeight,
        borderRadius: tabBar.pillRadius,
        backgroundColor: tabBar.activeBackground,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={tabBar.iconSize} color={tabBar.activeIconColor} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: tabBar.activeLabelColor,
        tabBarInactiveTintColor: tabBar.inactiveLabelColor,
        tabBarStyle: {
          borderTopColor: tabBar.borderTopColor,
          backgroundColor: tabBar.background,
          height: tabBar.height,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarItemStyle: { gap: 4 },
        tabBarLabelStyle: {
          fontSize: tabBar.labelSize,
          fontFamily: typography.fontFamily.mono,
          letterSpacing: 1.4,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <PillIcon Icon={Home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ focused }) => <PillIcon Icon={Activity} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ focused }) => <PillIcon Icon={Wallet} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="apps"
        options={{
          title: "Apps",
          tabBarIcon: ({ focused }) => <PillIcon Icon={AppWindow} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="security"
        options={{
          title: "Security",
          tabBarIcon: ({ focused }) => <PillIcon Icon={Shield} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
