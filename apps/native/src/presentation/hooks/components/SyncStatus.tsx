import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { useOffline } from "./useOffline";

interface SyncStatusProps {
	showLabel?: boolean;
}

export function SyncStatus({ showLabel = true }: SyncStatusProps) {
	const themeColorMuted = useThemeColor("muted");
	const { isOnline, pendingSyncCount, isSyncing } = useOffline();

	if (isOnline && pendingSyncCount === 0) {
		return null;
	}

	return (
		<View className="flex-row items-center gap-2">
			{!isOnline && (
				<View className="flex-row items-center gap-1 rounded bg-warning/20 px-2 py-1">
					<Ionicons name="cloud-offline" size={14} />
					{showLabel && <Text className="text-xs">Offline</Text>}
				</View>
			)}

			{isSyncing && (
				<View className="flex-row items-center gap-1 rounded bg-primary/20 px-2 py-1">
					<Ionicons name="sync" size={14} />
					{showLabel && <Text className="text-xs">Sincronizando...</Text>}
				</View>
			)}

			{isOnline && pendingSyncCount > 0 && !isSyncing && (
				<View className="flex-row items-center gap-1 rounded bg-warning/20 px-2 py-1">
					<Ionicons name="cloud-upload" size={14} />
					{showLabel && (
						<Text className="text-xs">
							{pendingSyncCount} pendente{pendingSyncCount > 1 ? "s" : ""}
						</Text>
					)}
				</View>
			)}
		</View>
	);
}

export function useSyncIndicator() {
	const { isOnline, pendingSyncCount, isSyncing } = useOffline();

	return {
		isOnline,
		isOffline: !isOnline,
		hasPendingSync: pendingSyncCount > 0,
		isSyncing,
		pendingCount: pendingSyncCount,
	};
}
