import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import type { SolicitacaoMaterial, Urgency } from "~/domain/entities";
import { api } from "~/lib/api";

const SOLICITACOES_CACHE_KEY = "@solicitacoes_cache";

async function getCachedSolicitacoes(): Promise<SolicitacaoMaterial[] | null> {
	try {
		const cached = await AsyncStorage.getItem(SOLICITACOES_CACHE_KEY);
		return cached ? JSON.parse(cached) : null;
	} catch {
		return null;
	}
}

async function setCachedSolicitacoes(
	solicitacoes: SolicitacaoMaterial[],
): Promise<void> {
	await AsyncStorage.setItem(
		SOLICITACOES_CACHE_KEY,
		JSON.stringify(solicitacoes),
	);
}

export interface UseSolicitacoesResult {
	solicitacoes: SolicitacaoMaterial[];
	loading: boolean;
	error: Error | null;
	refetch: () => Promise<void>;
	isStale: boolean;
}

export function useSolicitacoes(obraId?: string): UseSolicitacoesResult {
	const [solicitacoes, setSolicitacoes] = useState<SolicitacaoMaterial[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [isStale, setIsStale] = useState(false);

	const loadSolicitacoes = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const cached = await getCachedSolicitacoes();
			if (cached && cached.length > 0) {
				const filtered = obraId
					? cached.filter((s) => s.obraId === obraId)
					: cached;
				setSolicitacoes(filtered);
				setIsStale(true);
			}

			const result = await api.solicitacoes.list({
				obraId: obraId || "",
				limit: 50,
			});
			const mapped = result.map(transformApi);
			setSolicitacoes(mapped);
			await setCachedSolicitacoes(mapped);
			setIsStale(false);
		} catch (e) {
			setError(e as Error);

			const cached = await getCachedSolicitacoes();
			if (cached) {
				const filtered = obraId
					? cached.filter((s) => s.obraId === obraId)
					: cached;
				setSolicitacoes(filtered);
				setIsStale(true);
			}
		} finally {
			setLoading(false);
		}
	}, [obraId]);

	useEffect(() => {
		loadSolicitacoes();
	}, [loadSolicitacoes]);

	return { solicitacoes, loading, error, refetch: loadSolicitacoes, isStale };
}

export function useSolicitacao(id: string) {
	const { solicitacoes, loading, error, refetch } = useSolicitacoes();
	const solicitacao = solicitacoes.find((s) => s.id === id);

	return { solicitacao, loading, error, refetch };
}

export function useSolicitacoesPendentes(
	obraId?: string,
): UseSolicitacoesResult {
	const { solicitacoes, loading, error, refetch } = useSolicitacoes(obraId);
	const pendentes = solicitacoes.filter(
		(s) => s.status === "ABERTA" || s.status === "EM_ANALISE",
	);

	return { solicitacoes: pendentes, loading, error, refetch };
}

function transformApi(apiSolicitacao: {
	id: string;
	obraId: string;
	solicitanteId: string;
	item: string;
	quantity: number;
	unit: string;
	urgency: string;
	observation: string | null;
	imageUrl: string | null;
	voiceUrl: string | null;
	status: string;
	createdAt: string;
	updatedAt: string;
}): SolicitacaoMaterial {
	return {
		id: apiSolicitacao.id,
		obraId: apiSolicitacao.obraId,
		solicitanteId: apiSolicitacao.solicitanteId,
		item: apiSolicitacao.item,
		quantity: Number(apiSolicitacao.quantity),
		unit: apiSolicitacao.unit,
		urgency: apiSolicitacao.urgency as Urgency,
		observation: apiSolicitacao.observation ?? undefined,
		imageUrl: apiSolicitacao.imageUrl ?? undefined,
		voiceUrl: apiSolicitacao.voiceUrl ?? undefined,
		status: apiSolicitacao.status as SolicitacaoMaterial["status"],
		createdAt: new Date(apiSolicitacao.createdAt),
		updatedAt: new Date(apiSolicitacao.updatedAt),
	};
}
