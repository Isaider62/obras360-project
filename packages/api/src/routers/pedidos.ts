import { db } from "@obras360-project/db";
import { os } from "@orpc/server";
import { z } from "zod";
import { requerAutenticacao, requerPermissao } from "../middleware/auth";

export const pedidoInputSchema = z.object({
	solicitacaoId: z.string().uuid(),
	fornecedorId: z.string().uuid().optional(),
	totalValue: z.number().positive(),
	prazoEntrega: z.string().datetime().optional(),
});

export const pedidoOutputSchema = z.object({
	id: z.string().uuid(),
	solicitacaoId: z.string().uuid(),
	fornecedorId: z.string().uuid().nullable(),
	totalValue: z.number(),
	prazoEntrega: z.string().datetime().nullable(),
	status: z.enum([
		"AGUARDANDO",
		"COTANDO",
		"APROVADO",
		"COMPRADO",
		"ENVIADO",
		"ENTREGUE",
		"CANCELADO",
	]),
	nfUrl: z.string().nullable(),
	nfNumber: z.string().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const pedidosRouter = os.router({
	list: os
		.use(requerAutenticacao())
		.use(requerPermissao("SOLICITACAO:Processar"))
		.handler(
			async ({ input }) => {
				const where: Record<string, unknown> = {};
				if (input.status) {
					where.status = input.status;
				}
				return db.pedidoCompra.findMany({
					where,
					orderBy: { createdAt: "desc" },
					take: input.limit ?? 50,
					include: {
						fornecedor: true,
					},
				});
			},
			{
				input: z.object({
					status: z
						.enum([
							"AGUARDANDO",
							"COTANDO",
							"APROVADO",
							"COMPRADO",
							"ENVIADO",
							"ENTREGUE",
							"CANCELADO",
						])
						.optional(),
					limit: z.number().optional(),
				}),
				output: z.array(pedidoOutputSchema),
			},
		),

	create: os
		.use(requerAutenticacao())
		.use(requerPermissao("SOLICITACAO:Processar"))
		.handler(
			async ({ input }) => {
				return db.pedidoCompra.create({
					data: {
						solicitacaoId: input.solicitacaoId,
						fornecedorId: input.fornecedorId,
						totalValue: input.totalValue,
						prazoEntrega: input.prazoEntrega
							? new Date(input.prazoEntrega)
							: undefined,
						status: "AGUARDANDO",
					},
				});
			},
			{ input: pedidoInputSchema, output: pedidoOutputSchema },
		),

	updateStatus: os
		.use(requerAutenticacao())
		.use(requerPermissao("SOLICITACAO:Processar"))
		.handler(
			async ({ input }) => {
				const statusFlow: Record<string, string[]> = {
					AGUARDANDO: ["COTANDO"],
					COTANDO: ["APROVADO", "CANCELADO"],
					APROVADO: ["COMPRADO", "CANCELADO"],
					COMPRADO: ["ENVIADO"],
					ENVIADO: ["ENTREGUE"],
					ENTREGUE: [],
					CANCELADO: [],
				};

				const current = await db.pedidoCompra.findUnique({
					where: { id: input.id },
					select: { status: true },
				});

				if (!current) {
					throw new Error("Pedido não encontrado");
				}

				const allowed = statusFlow[current.status];
				if (!allowed.includes(input.status)) {
					throw new Error(
						`Não é possível mover de ${current.status} para ${input.status}`,
					);
				}

				return db.pedidoCompra.update({
					where: { id: input.id },
					data: {
						status: input.status,
						updatedAt: new Date(),
					},
				});
			},
			{
				input: z.object({
					id: z.string().uuid(),
					status: z.enum([
						"AGUARDANDO",
						"COTANDO",
						"APROVADO",
						"COMPRADO",
						"ENVIADO",
						"ENTREGUE",
						"CANCELADO",
					]),
				}),
				output: pedidoOutputSchema,
			},
		),

	stats: os
		.use(requerAutenticacao())
		.use(requerPermissao("DASHBOARD:KPIs"))
		.handler(async () => {
			const [pendentes, emCotacao, comprados, entregues] = await Promise.all([
				db.pedidoCompra.count({
					where: { status: "AGUARDANDO" },
				}),
				db.pedidoCompra.count({
					where: { status: "COTANDO" },
				}),
				db.pedidoCompra.count({
					where: { status: "COMPRADO" },
				}),
				db.pedidoCompra.count({
					where: { status: "ENTREGUE" },
				}),
			]);

			return { pendentes, emCotacao, comprados, entregues };
		}),
});
