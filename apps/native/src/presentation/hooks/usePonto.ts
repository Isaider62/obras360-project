import { useCallback, useEffect, useState } from "react";
import type { RegistroPonto } from "~/domain/entities";

const MOCK_PONTOS: RegistroPonto[] = [
	{
		id: "ponto-1",
		obraId: "1",
		encarregadoId: "user-1",
		date: new Date(),
		entryTime: new Date("2026-04-28T07:30:00"),
		team: [
			{ id: "t1", name: "João", entryTime: new Date("2026-04-28T07:35:00") },
			{ id: "t2", name: "José", entryTime: new Date("2026-04-28T07:40:00") },
		],
		weather: "Ensolarado, 22°C",
		synced: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
];

export interface UsePontosResult {
	pontos: RegistroPonto[];
	loading: boolean;
	error: Error | null;
	refetch: () => Promise<void>;
}

export function usePontos(obraId?: string): UsePontosResult {
	const [pontos, setPontos] = useState<RegistroPonto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const loadPontos = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			await new Promise((resolve) => setTimeout(resolve, 300));
			const filtered = obraId
				? MOCK_PONTOS.filter((p) => p.obraId === obraId)
				: MOCK_PONTOS;
			setPontos(filtered);
		} catch (e) {
			setError(e as Error);
		} finally {
			setLoading(false);
		}
	}, [obraId]);

	useEffect(() => {
		loadPontos();
	}, [loadPontos]);

	return { pontos, loading, error, refetch: loadPontos };
}

export function usePontoDoDia(obraId: string) {
	const { pontos, loading, error, refetch } = usePontos(obraId);
	const hoje = new Date();
	hoje.setHours(0, 0, 0, 0);
	const pontoDoDia = pontos.find((p) => {
		const pDate = new Date(p.date);
		pDate.setHours(0, 0, 0, 0);
		return pDate.getTime() === hoje.getTime() && p.obraId === obraId;
	});

	return { ponto: pontoDoDia, loading, error, refetch };
}
