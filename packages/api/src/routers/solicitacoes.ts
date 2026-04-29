import { db } from "@obras360-project/db";
import { os } from "@orpc/server";
import { z } from "zod";
import {
	obterPerfil,
	requerAutenticacao,
	requerPermissao,
} from "../middleware/auth";

export const solicitacaoInputSchema = z.object({
	obraId: z.string().uuid(),
	item: z.string().min(1).max(500),
	quantity: z.number().positive(),
	unit: z.string().optional(),
	urgency: z.enum(["NORMAL", "URGENTE", "CRITICAL"]).optional(),
	observation: z.string().optional(),
	imageUrl: z.string().optional(),
	voiceUrl: z.string().optional(),
	fotos: z.array(z.string()).optional(),
});

export const solicitacaoOutputSchema = z.object({
	id: z.string().uuid(),
	obraId: z.string().uuid(),
	solicitanteId: z.string().uuid(),
	item: z.string(),
	quantity: z.number(),
	unit: z.string(),
	urgency: z.enum(["NORMAL", "URGENTE", "CRITICAL"]),
	observation: z.string().nullable(),
	imageUrl: z.string().nullable(),
	voiceUrl: z.string().nullable(),
	status: z.enum([
		"ABERTA",
		"EM_ANALISE",
		"EM_COTACAO",
		"APROVADA",
		"COMPRADA",
		"ENVIADA",
		"ENTREGUE",
		"CANCELADA",
		"REJEITADA",
	]),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const solicitacoesRouter = os.router({
	list: os
		.use(requerAutenticacao())
		.use(requerPermissao("SOLICITACAO:Leitura"))
		.handler(
			async ({ input, context }) => {
				const perfil = obterPerfil(context.session);

				if (perfil === "ENCARREGADO") {
					return db.solicitacaoMaterial.findMany({
						where: {
							obraId: input.obraId,
							solicitanteId: context.session?.user?.id,
							deletedAt: null,
						},
						orderBy: { createdAt: "desc" },
						take: input.limit ?? 50,
					});
				}

				return db.solicitacaoMaterial.findMany({
					where: {
						obraId: input.obraId,
						deletedAt: null,
					},
					orderBy: { createdAt: "desc" },
					take: input.limit ?? 50,
				});
			},
			{
				input: z.object({
					obraId: z.string().uuid(),
					limit: z.number().optional(),
				}),
				output: z.array(solicitacaoOutputSchema),
			},
		),

	get: os
		.use(requerAutenticacao())
		.use(requerPermissao("SOLICITACAO:Leitura"))
		.handler(
			async ({ input }) => {
				return db.solicitacaoMaterial.findUnique({
					where: { id: input.id },
				});
			},
			{
				input: z.object({ id: z.string().uuid() }),
				output: solicitacaoOutputSchema,
			},
		),

	create: os
		.use(requerAutenticacao())
		.use(requerPermissao("SOLICITACAO:Criar"))
		.handler(
			async ({ input, context }) => {
				const imageUrl = input.fotos?.[0] ?? input.imageUrl;

				return db.solicitacaoMaterial.create({
					data: {
						obraId: input.obraId,
						solicitanteId: context.session?.user?.id ?? "",
						item: input.item,
						quantity: input.quantity,
						unit: input.unit ?? "un",
						urgency: input.urgency ?? "NORMAL",
						observation: input.observation,
						imageUrl,
						voiceUrl: input.voiceUrl,
						status: "ABERTA",
					},
				});
			},
			{ input: solicitacaoInputSchema, output: solicitacaoOutputSchema },
		),

	update: os
		.use(requerAutenticacao())
		.use(requerPermissao("SOLICITACAO:Processar"))
		.handler(
			async ({ input }) => {
				const { id, ...data } = input;
				return db.solicitacaoMaterial.update({
					where: { id },
					data: {
						...data,
						updatedAt: new Date(),
					},
				});
			},
			{
				input: solicitacaoInputSchema.extend({ id: z.string().uuid() }),
				output: solicitacaoOutputSchema,
			},
		),

	updateStatus: os
		.use(requerAutenticacao())
		.use(requerPermissao("SOLICITACAO:Processar"))
		.handler(
			async ({ input }) => {
				return db.solicitacaoMaterial.update({
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
						"ABERTA",
						"EM_ANALISE",
						"EM_COTACAO",
						"APROVADA",
						"COMPRADA",
						"ENVIADA",
						"ENTREGUE",
						"CANCELADA",
						"REJEITADA",
					]),
				}),
				output: solicitacaoOutputSchema,
			},
		),

	delete: os
		.use(requerAutenticacao())
		.use(requerPermissao("SOLICITACAO:Processar"))
		.handler(
			async ({ input }) => {
				return db.solicitacaoMaterial.update({
					where: { id: input.id },
					data: { deletedAt: new Date() },
				});
			},
			{ input: z.object({ id: z.string().uuid() }) },
		),

	stats: os
		.use(requerAutenticacao())
		.use(requerPermissao("DASHBOARD:GLOBAL"))
		.handler(
			async () => {
				const now = new Date();
				const thirtyDaysAgo = new Date(
					now.getTime() - 30 * 24 * 60 * 60 * 1000,
				);

				const [total, urgentes, pendentes, emAnalise, entregues, ultimos30] =
					await Promise.all([
						db.solicitacaoMaterial.count({ where: { deletadoEm: null } }),
						db.solicitacaoMaterial.count({
							where: { urgency: "URGENTE", deletadoEm: null },
						}),
						db.solicitacaoMaterial.count({
							where: { status: "ABERTA", deletadoEm: null },
						}),
						db.solicitacaoMaterial.count({
							where: { status: "EM_ANALISE", deletadoEm: null },
						}),
						db.solicitacaoMaterial.count({
							where: { status: "ENTREGUE", deletadoEm: null },
						}),
						db.solicitacaoMaterial.count({
							where: {
								createdAt: { gte: thirtyDaysAgo },
								deletadoEm: null,
							},
						}),
					]);

				const avgTime = await getAverageTime();

				return {
					total,
					urgentes,
					pendentes,
					emAnalise,
					entregues,
					ultimos30,
					tempoMedio: avgTime,
				};
			},
			{
				output: z.object({
					total: z.number(),
					urgentes: z.number(),
					pendentes: z.number(),
					emAnalise: z.number(),
					entregues: z.number(),
					ultimos30: z.number(),
					tempoMedio: z.number().nullable(),
				}),
			},
		),
});

async function getAverageTime(): Promise<number | null> {
	const entregas = await db.solicitacaoMaterial.findMany({
		where: {
			status: "ENTREGUE",
			deletadoEm: null,
		},
		select: { createdAt: true, updatedAt: true },
		take: 100,
	});

	if (entregas.length === 0) return null;

	const totalMs =
		entregas.reduce((acc, s) => {
			const diff = s.updatedAt.getTime() - s.createdAt.getTime();
			return acc + diff;
		}, 0) / entregas.length;

	return Math.round(totalMs / (1000 * 60 * 60));
}

const tokenInputSchema = z.object({
	token: z.string().min(1),
	deviceId: z.string().optional(),
});

const tokenOutputSchema = z.object({
	success: z.boolean(),
});

export const tokenRouter = os.router({
	register: os.use(requerAutenticacao()).handler(
		async ({ input, context }) => {
			await db.user.update({
				where: { id: context.session?.user?.id },
				data: {
					fcmToken: input.token,
				},
			});
			return { success: true };
		},
		{
			input: tokenInputSchema,
			output: tokenOutputSchema,
		},
	),
});
