import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useThemeColor } from "heroui-native";
import { useCallback } from "react";
import { Pressable, Text } from "react-native";

import { ThemeToggle } from "@/components/theme-toggle";

function DrawerLayout() {
	const themeColorForeground = useThemeColor("foreground");
	const themeColorBackground = useThemeColor("background");

	const renderThemeToggle = useCallback(() => <ThemeToggle />, []);

	return (
		<Drawer
			screenOptions={{
				headerTintColor: themeColorForeground,
				headerStyle: { backgroundColor: themeColorBackground },
				headerTitleStyle: {
					fontWeight: "600",
					color: themeColorForeground,
				},
				headerRight: renderThemeToggle,
				drawerStyle: { backgroundColor: themeColorBackground },
			}}
		>
			<Drawer.Screen
				name="index"
				options={{
					headerTitle: "Home",
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Home
						</Text>
					),
					drawerIcon: ({ size, color, focused }) => (
						<Ionicons
							name="home-outline"
							size={size}
							color={focused ? color : themeColorForeground}
						/>
					),
				}}
			/>
			<Drawer.Screen
				name="(tabs)"
				options={{
					headerTitle: "Tabs",
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Tabs
						</Text>
					),
					drawerIcon: ({ size, color, focused }) => (
						<MaterialIcons
							name="border-bottom"
							size={size}
							color={focused ? color : themeColorForeground}
						/>
					),
					headerRight: () => (
						<Link href="/modal" asChild>
							<Pressable className="mr-4">
								<Ionicons
									name="add-outline"
									size={24}
									color={themeColorForeground}
								/>
							</Pressable>
						</Link>
					),
				}}
			/>
			<Drawer.Screen
				name="ai"
				options={{
					headerTitle: "AI",
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							AI
						</Text>
					),
					drawerIcon: ({ size, color, focused }) => (
						<Ionicons
							name="chatbubble-ellipses-outline"
							size={size}
							color={focused ? color : themeColorForeground}
						/>
					),
				}}
			/>
			<Drawer.Screen
				name="compras"
				options={{
					headerTitle: "Compras",
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Compras
						</Text>
					),
					drawerIcon: ({ size, color, focused }) => (
						<Ionicons
							name="cart-outline"
							size={size}
							color={focused ? color : themeColorForeground}
						/>
					),
				}}
			/>
			<Drawer.Screen
				name="gestao"
				options={{
					headerTitle: "Gestão",
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Gestão
						</Text>
					),
					drawerIcon: ({ size, color, focused }) => (
						<MaterialIcons
							name="assessment"
							size={size}
							color={focused ? color : themeColorForeground}
						/>
					),
				}}
			/>
			<Drawer.Screen
				name="dashboard"
				options={{
					headerTitle: "Dashboard",
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Dashboard
						</Text>
					),
					drawerIcon: ({ size, color, focused }) => (
						<Ionicons
							name="analytics-outline"
							size={size}
							color={focused ? color : themeColorForeground}
						/>
					),
				}}
			/>
			<Drawer.Screen
				name="usuarios"
				options={{
					headerTitle: "Usuários",
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Usuários
						</Text>
					),
					drawerIcon: ({ size, color, focused }) => (
						<Ionicons
							name="people-outline"
							size={size}
							color={focused ? color : themeColorForeground}
						/>
					),
				}}
			/>
		</Drawer>
	);
}

export default DrawerLayout;
