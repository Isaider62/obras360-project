import * as Network from "expo-network";
import { useCallback, useEffect, useState } from "react";
import { syncQueue } from "~/infrastructure/sync/SyncQueue";

export interface UseOfflineResult {
	isOnline: boolean;
	isOffline: boolean;
	connectionType: Network.NetworkStateType | null;
	pendingSyncCount: number;
	isSyncing: boolean;
	checkConnection: () => Promise<void>;
	triggerSync: () => Promise<void>;
}

export function useOffline(): UseOfflineResult {
	const [isOnline, setIsOnline] = useState(true);
	const [connectionType, setConnectionType] =
		useState<Network.NetworkStateType | null>(null);
	const [pendingSyncCount, setPendingSyncCount] = useState(0);
	const [isSyncing, setIsSyncing] = useState(false);

	const checkConnection = useCallback(async () => {
		try {
			const networkState = await Network.getNetworkStateAsync();
			const online = networkState.isInternetReachable ?? false;
			const type = networkState.type ?? null;
			setIsOnline(online);
			setConnectionType(type);

			if (online) {
				const count = await syncQueue.getPendingCount();
				setPendingSyncCount(count);
			}
		} catch {
			setIsOnline(false);
		}
	}, []);

	const triggerSync = useCallback(async () => {
		if (!isOnline) return;

		setIsSyncing(true);
		try {
			await syncQueue.processQueue();
			const count = await syncQueue.getPendingCount();
			setPendingSyncCount(count);
		} finally {
			setIsSyncing(false);
		}
	}, [isOnline]);

	useEffect(() => {
		checkConnection();

		const unsubscribe = Network.addNetworkStateListener((state) => {
			const online = state.isInternetReachable ?? false;
			setIsOnline(online);
			setConnectionType(state.type ?? null);

			if (online) {
				triggerSync();
			}
		});

		return () => {
			unsubscribe.remove();
		};
	}, [checkConnection, triggerSync]);

	return {
		isOnline,
		isOffline: !isOnline,
		connectionType,
		pendingSyncCount,
		isSyncing,
		checkConnection,
		triggerSync,
	};
}

export function useOfflineIndicator() {
	const { isOffline, pendingSyncCount, isSyncing, triggerSync } = useOffline();

	useEffect(() => {
		if (!isOffline && pendingSyncCount > 0) {
			triggerSync();
		}
	}, [isOffline, pendingSyncCount, triggerSync]);

	return { isOffline, pendingSyncCount, isSyncing };
}
