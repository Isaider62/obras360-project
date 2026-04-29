import { db } from "@obras360-project/db";
import { os } from "@orpc/server";
import { z } from "zod";
import { requerAutenticacao, requerPermissao } from "../middleware/auth";

const transacaoInputSchema = z.object({
	obraId: z.string().uuid(),
	tipo: z.enum(["RECEITA", "DESPESA"]),
	categoria: z.string().min(1).max(100),
	descricao: z.string().optional(),
	valor: z.number().positive(),
	data: z.string().datetime().optional(),
	pago: z.boolean().optional(),
});

const transacaoOutputSchema = z.object({
	id: z.string().uuid(),
	obraId: z.string().uuid(),
	tipo: z.enum(["RECEITA", "DESPESA"]),
	categoria: z.string(),
	descricao: z.string().nullable(),
	valor: z.number(),
	data: z.string().datetime(),
	pago: z.boolean(),
	createdAt: z.string().datetime(),
});

const fluxoCaixaOutputSchema = z.object({
	resumo: z.object({
		totalReceitas: z.number(),
		totalDespesas: z.number(),
		saldo: z.number(),
		receitasPagas: z.number(),
		despesasPagas: z.number(),
	}),
	porCategoria: z.array(
		z.object({
			categoria: z.string(),
			receita: z.number(),
			despesa: z.number(),
		}),
	),
	porPeriodo: z.array(
		z.object({
			periodo: z.string(),
			receita: z.number(),
			despesa: z.number(),
		}),
	),
	projetado: z.object({
		receitaPrevista: z.number(),
		despesaPrevista: z.number(),
		saldoPrevisto: z.number(),
	}),
});

export const financeRouter = os.router({
	list: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Leitura"))
		.handler(
			async ({ input }) => {
				return db.transacao.findMany({
					where: {
						obraId: input.obraId,
						deletedAt: null,
					},
					orderBy: { data: "desc" },
					take: input.limit ?? 50,
				});
			},
			{
				input: z.object({
					obraId: z.string().uuid(),
					limit: z.number().optional(),
				}),
				output: z.array(transacaoOutputSchema),
			},
		),

	create: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Escrita"))
		.handler(
			async ({ input }) => {
				return db.transacao.create({
					data: {
						obraId: input.obraId,
						tipo: input.tipo,
						categoria: input.categoria,
						descricao: input.descricao,
						valor: input.valor,
						data: input.data ? new Date(input.data) : new Date(),
						pago: input.pago ?? false,
					},
				});
			},
			{
				input: transacaoInputSchema,
				output: transacaoOutputSchema,
			},
		),

	update: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Escrita"))
		.handler(
			async ({ input }) => {
				const data: Record<string, unknown> = {};
				if (input.categoria) data.categoria = input.categoria;
				if (input.descricao !== undefined) data.descricao = input.descricao;
				if (input.valor) data.valor = input.valor;
				if (input.pago !== undefined) data.pago = input.pago;

				return db.transacao.update({
					where: { id: input.id },
					data,
				});
			},
			{
				input: transacaoInputSchema.extend({ id: z.string().uuid() }),
				output: transacaoOutputSchema,
			},
		),

	delete: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Escrita"))
		.handler(
			async ({ input }) => {
				return db.transacao.update({
					where: { id: input.id },
					data: { deletedAt: new Date() },
				});
			},
			{
				input: z.object({ id: z.string().uuid() }),
				output: transacaoOutputSchema,
			},
		),

	fluxoCaixa: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Leitura"))
		.handler(
			async ({ input }) => {
				const where = {
					obraId: input.obraId,
					deletedAt: null,
					data: {
						gte: input.startDate
							? new Date(input.startDate)
							: new Date(new Date().getFullYear(), 0, 1),
						lte: input.endDate ? new Date(input.endDate) : new Date(),
					},
				};

				const transacoes = await db.transacao.findMany({
					where,
					orderBy: { data: "asc" },
				});

				let totalReceitas = 0;
				let totalDespesas = 0;
				let receitasPagas = 0;
				let despesasPagas = 0;

				const catMap = new Map<string, { receita: number; despesa: number }>();
				const periodoMap = new Map<
					string,
					{ receita: number; despesa: number }
				>();

				for (const t of transacoes) {
					const valor = Number(t.valor);
					if (t.tipo === "RECEITA") {
						totalReceitas += valor;
						if (t.pago) receitasPagas += valor;
					} else {
						totalDespesas += valor;
						if (t.pago) despesasPagas += valor;
					}

					const cat = t.categoria;
					const existing = catMap.get(cat) || { receita: 0, despesa: 0 };
					if (t.tipo === "RECEITA") {
						existing.receita += valor;
					} else {
						existing.despesa += valor;
					}
					catMap.set(cat, existing);

					const mes = t.data.toISOString().substring(0, 7);
					const periodoExisting = periodoMap.get(mes) || {
						receita: 0,
						despesa: 0,
					};
					if (t.tipo === "RECEITA") {
						periodoExisting.receita += valor;
					} else {
						periodoExisting.despesa += valor;
					}
					periodoMap.set(mes, periodoExisting);
				}

				const porCategoria = Array.from(catMap.entries()).map(
					([categoria, v]) => ({
						categoria,
						receita: v.receita,
						despesa: v.despesa,
					}),
				);

				const porPeriodo = Array.from(periodoMap.entries())
					.map(([periodo, v]) => ({
						periodo,
						receita: v.receita,
						despesa: v.despesa,
					}))
					.sort((a, b) => a.periodo.localeCompare(b.periodo));

				const obra = await db.obra.findUnique({
					where: { id: input.obraId },
					select: { budgetTotal: true },
				});
				const budgetTotal = Number(obra?.budgetTotal || 0);
				const saldo = totalReceitas - totalDespesas;

				return {
					resumo: {
						totalReceitas,
						totalDespesas,
						saldo,
						receitasPagas,
						despesasPagas,
					},
					porCategoria,
					porPeriodo,
					projetado: {
						receitaPrevista: budgetTotal,
						despesaPrevista: budgetTotal * 0.85,
						saldoPrevisto: budgetTotal * 0.15,
					},
				};
			},
			{
				input: z.object({
					obraId: z.string().uuid(),
					startDate: z.string().optional(),
					endDate: z.string().optional(),
				}),
				output: fluxoCaixaOutputSchema,
			},
		),
});
