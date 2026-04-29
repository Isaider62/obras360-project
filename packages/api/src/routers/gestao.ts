import { db } from "@obras360-project/db";
import { os } from "@orpc/server";
import { z } from "zod";
import { requerAutenticacao, requerPermissao } from "../middleware/auth";

export const gestaoRouter = os.router({
	dashboard: os
		.use(requerAutenticacao())
		.use(requerPermissao("DASHBOARD:GLOBAL"))
		.handler(async () => {
			const [
				totalObras,
				emAndamento,
				concluidas,
				pendentes,
				emCotacao,
				comprados,
			] = await Promise.all([
				db.obra.count({ where: { deletedAt: null } }),
				db.obra.count({
					where: { status: "EM_ANDAMENTO", deletedAt: null },
				}),
				db.obra.count({
					where: { status: "CONCLUIDO", deletedAt: null },
				}),
				db.solicitacaoMaterial.count({
					where: { status: "ABERTA", deletedAt: null },
				}),
				db.pedidoCompra.count({ where: { status: "COTANDO" } }),
				db.pedidoCompra.count({ where: { status: "COMPRADO" } }),
			]);

			const orcamentos = await db.obra.aggregate({
				where: { deletedAt: null, budgetTotal: { not: null } },
				_sum: { budgetTotal: true },
			});

			const executado = await db.obra.aggregate({
				where: { deletedAt: null, budgetCurrent: { not: null } },
				_sum: { budgetCurrent: true },
			});

			return {
				obras: {
					total: totalObras,
					emAndamento,
					concluidas,
				},
				solicitacoes: {
					pendentes,
				},
				compras: {
					emCotacao,
					comprados,
				},
				financeiro: {
					orcamentoTotal: Number(orcamentos._sum.budgetTotal || 0),
					executado: Number(executado._sum.budgetCurrent || 0),
				},
			};
		}),
});
