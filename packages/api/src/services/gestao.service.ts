import { db } from "@obras360-project/db";

export class GestaoService {
	async getDashboard() {
		const [totalObras, emAndamento, concluidas, arquivadas] = await Promise.all(
			[
				db.obra.count({ where: { deletedAt: null } }),
				db.obra.count({ where: { status: "EM_ANDAMENTO", deletedAt: null } }),
				db.obra.count({ where: { status: "CONCLUIDO", deletedAt: null } }),
				db.obra.count({ where: { status: "ARQUIVADO", deletedAt: null } }),
			],
		);

		const [solicitacoesAbertas, solicitaçõesUrgentes, emCotacao] =
			await Promise.all([
				db.solicitacaoMaterial.count({
					where: { status: "ABERTA", deletedAt: null },
				}),
				db.solicitacaoMaterial.count({
					where: { urgency: "URGENTE", deletedAt: null },
				}),
				db.solicitacaoMaterial.count({
					where: { status: "EM_COTACAO", deletedAt: null },
				}),
			]);

		const [alertasPendentes, alertasCriticos] = await Promise.all([
			db.alerta.count({ where: { resolved: false } }),
			db.alerta.count({
				where: { severity: "CRITICAL", resolved: false },
			}),
		]);

		const usuariosAtivos = await db.user.count({
			where: { ativo: true },
		});

		return {
			obras: {
				total: totalObras,
				emAndamento,
				concluidas,
				arquivadas,
			},
			solicitacoes: {
				abertas: solicitacoesAbertas,
				urgentes: solicitaçõesUrgentes,
				emCotacao,
			},
			alertas: {
				pendentes: alertasPendentes,
				criticos: alertasCriticos,
			},
			usuarios: {
				ativos: usuariosAtivos,
			},
		};
	}

	async getCurvaS(obraId: string) {
		const obra = await db.obra.findUnique({
			where: { id: obraId },
			select: {
				id: true,
				name: true,
				startDate: true,
				endDate: true,
				budgetTotal: true,
				budgetCurrent: true,
			},
		});

		if (!obra) {
			throw new Error("Obra não encontrada");
		}

		const diarios = await db.diarioObra.findMany({
			where: { obraId },
			select: {
				date: true,
				progressPct: true,
			},
			orderBy: { date: "asc" },
		});

		const etapas = [
			{ nome: "Fundação", inicio: 0, fim: 15 },
			{ nome: "Estrutura", inicio: 15, fim: 40 },
			{ nome: "Alvenaria", inicio: 40, fim: 60 },
			{ nome: "Instalações", inicio: 60, fim: 80 },
			{ nome: "Acabamento", inicio: 80, fim: 100 },
		];

		return {
			obra: {
				id: obra.id,
				nome: obra.name,
				inicio: obra.startDate,
				fim: obra.endDate,
				orcamentoTotal: obra.budgetTotal,
				orcamentoAtual: obra.budgetCurrent,
			},
			diarios,
			etapas,
		};
	}

	async getFluxoCaixa(obraId: string, mes?: number, ano?: number) {
		const obra = await db.obra.findUnique({
			where: { id: obraId },
			select: {
				id: true,
				name: true,
				budgetTotal: true,
				budgetCurrent: true,
			},
		});

		if (!obra) {
			throw new Error("Obra não encontrada");
		}

		const now = new Date();
		const mesAtual = mes ?? now.getMonth() + 1;
		const anoAtual = ano ?? now.getFullYear();

		const inicio = new Date(anoAtual, mesAtual - 1, 1);
		const fim = new Date(anoAtual, mesAtual, 0);

		const entradas = await db.solicitacaoMaterial.count({
			where: {
				obraId,
				status: { in: ["COMPRADA", "ENVIADA", "ENTREGUE"] },
				updatedAt: { gte: inicio, lte: fim },
			},
		});

		return {
			obra: {
				id: obra.id,
				nome: obra.name,
			},
			periodo: {
				mes: mesAtual,
				ano: anoAtual,
			},
			previsto: obra.budgetTotal,
			realizado: obra.budgetCurrent,
		};
	}

	async getKPIs(obraId?: string) {
		const where = obraId ? { obraId, deletedAt: null } : { deletedAt: null };

		const [obraCount, solicitacaoCount, pontoCount, diarioCount] =
			await Promise.all([
				db.obra.count({ where: { deletedAt: null } }),
				db.solicitacaoMaterial.count({ where: { ...where, deletedAt: null } }),
				db.registroPonto.count({ where: { obraId } }),
				db.diarioObra.count({ where: { ...where } }),
			]);

		const solicitacoesAbertas = await db.solicitacaoMaterial.count({
			where: { ...where, status: "ABERTA", deletedAt: null },
		});

		const solicitacoesUrgentes = await db.solicitacaoMaterial.count({
			where: { ...where, urgency: "URGENTE", deletedAt: null },
		});

		const mediaDiaria =
			pontoCount > 0
				? await db.registroPonto.aggregate({
						where: { obraId },
						_avg: { entryTime: true },
					})
				: null;

		return {
			totalObras: obraCount,
			totalSolicitacoes: solicitacaoCount,
			solicitacoesAbertas,
			solicitacoesUrgentes,
			totalPontos: pontoCount,
			totalDiarios: diarioCount,
		};
	}

	async getRankingObras(
		criterio: "prazo" | "custo" | "progresso" = "progresso",
	) {
		const obras = await db.obra.findMany({
			where: { status: "EM_ANDAMENTO", deletedAt: null },
			select: {
				id: true,
				name: true,
				startDate: true,
				endDate: true,
				budgetTotal: true,
				budgetCurrent: true,
			},
		});

		const ranked = obras.map((obra) => {
			let score = 0;
			let label = "";

			if (criterio === "prazo" && obra.endDate) {
				const diasRestantes = Math.ceil(
					(obra.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
				);
				score = diasRestantes;
				label = `${diasRestantes} dias`;
			} else if (criterio === "custo" && obra.budgetTotal) {
				const utilizado = obra.budgetCurrent ?? 0;
				const pct = (utilizado / Number(obra.budgetTotal)) * 100;
				score = 100 - pct;
				label = `${pct.toFixed(1)}%`;
			} else if (criterio === "progresso" && obra.budgetTotal) {
				const utilizado = obra.budgetCurrent ?? 0;
				score = (utilizado / Number(obra.budgetTotal)) * 100;
				label = `${score.toFixed(1)}%`;
			}

			return {
				id: obra.id,
				nome: obra.name,
				score,
				label,
			};
		});

		return ranked.sort((a, b) => b.score - a.score).slice(0, 10);
	}
}

export const gestaoService = new GestaoService();
