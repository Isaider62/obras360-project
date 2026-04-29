import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import type { Obra } from "~/domain/entities";
import { api } from "~/lib/api";

const OBRAS_CACHE_KEY = "@obras_cache";

export interface UseObrasResult {
	obras: Obra[];
	loading: boolean;
	error: Error | null;
	refetch: () => Promise<void>;
	isStale: boolean;
}

async function getCachedObras(): Promise<Obra[] | null> {
	try {
		const cached = await AsyncStorage.getItem(OBRAS_CACHE_KEY);
		return cached ? JSON.parse(cached) : null;
	} catch {
		return null;
	}
}

async function setCachedObras(obras: Obra[]): Promise<void> {
	await AsyncStorage.setItem(OBRAS_CACHE_KEY, JSON.stringify(obras));
}

export function useObras(): UseObrasResult {
	const [obras, setObras] = useState<Obra[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [isStale, setIsStale] = useState(false);

	const loadObras = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const cached = await getCachedObras();
			if (cached && cached.length > 0) {
				setObras(cached);
				setIsStale(true);
			}

			const result = await api.obras.list();
			const mapped = result.map(transformObraApi);
			setObras(mapped);
			await setCachedObras(mapped);
			setIsStale(false);
		} catch (e) {
			setError(e as Error);

			const cached = await getCachedObras();
			if (cached) {
				setObras(cached);
				setIsStale(true);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadObras();
	}, [loadObras]);

	return { obras, loading, error, refetch: loadObras, isStale };
}

export function useObra(id: string) {
	const { obras, loading, error, refetch } = useObras();
	const obra = obras.find((o) => o.id === id);

	return { obra, loading, error, refetch };
}

function transformObraApi(apiObra: {
	id: string;
	name: string;
	address: string | null;
	status: string;
	startDate: string | null;
	endDate: string | null;
	budgetTotal: number | null;
	budgetCurrent: number | null;
	location: { lat: number; lng: number } | null;
	encarregadoId: string | null;
	createdAt: string;
	updatedAt: string;
}): Obra {
	return {
		id: apiObra.id,
		name: apiObra.name,
		address: apiObra.address ?? undefined,
		status: apiObra.status as Obra["status"],
		startDate: apiObra.startDate ? new Date(apiObra.startDate) : undefined,
		endDate: apiObra.endDate ? new Date(apiObra.endDate) : undefined,
		budgetTotal: apiObra.budgetTotal ?? undefined,
		budgetCurrent: apiObra.budgetCurrent ?? undefined,
		location: apiObra.location ?? undefined,
		encarregadoId: apiObra.encarregadoId ?? undefined,
		createdAt: new Date(apiObra.createdAt),
		updatedAt: new Date(apiObra.updatedAt),
	};
}
