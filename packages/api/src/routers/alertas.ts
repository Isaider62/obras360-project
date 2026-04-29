import { db } from "@obras360-project/db";
import { os } from "@orpc/server";
import { z } from "zod";
import { gerarAlertaPreditivo } from "../infrastructure/ai/ai.service";
import { requerAutenticacao, requerPermissao } from "../middleware/auth";

export const alertasRouter = os.router({
	listByObra: os.handler(
		async ({ input }) => {
			return db.alerta.findMany({
				where: { obraId: input.obraId },
				orderBy: { createdAt: "desc" },
				take: input.limit ?? 20,
			});
		},
		{
			input: z.object({
				obraId: z.string().uuid(),
				limit: z.number().optional(),
			}),
			output: z.array(
				z.object({
					id: z.string().uuid(),
					obraId: z.string().uuid(),
					type: z.enum([
						"FALTA_MATERIAL",
						"ATRASO",
						"INTERFERENCIA",
						"CUSTO",
						"PRAZO",
						"SINCRONIZACAO",
					]),
					severity: z.enum(["INFO", "WARNING", "ALERT", "CRITICAL"]),
					title: z.string(),
					description: z.string().nullable(),
					resolved: z.boolean(),
					createdAt: z.string().datetime(),
				}),
			),
		},
	),

	create: os.handler(
		async ({ input, context }) => {
			if (!context.session?.user) throw new Error("Unauthorized");

			return db.alerta.create({
				data: {
					obraId: input.obraId,
					userId: context.session.user.id,
					type: input.type,
					source: "USUARIO",
					severity: input.severity,
					title: input.title,
					description: input.description,
				},
			});
		},
		{
			input: z.object({
				obraId: z.string().uuid(),
				type: z.enum([
					"FALTA_MATERIAL",
					"ATRASO",
					"INTERFERENCIA",
					"CUSTO",
					"PRAZO",
					"SINCRONIZACAO",
				]),
				severity: z.enum(["INFO", "WARNING", "ALERT", "CRITICAL"]),
				title: z.string().min(1),
				description: z.string().optional(),
			}),
			output: z.object({
				id: z.string().uuid(),
				obraId: z.string().uuid(),
				type: z.enum([
					"FALTA_MATERIAL",
					"ATRASO",
					"INTERFERENCIA",
					"CUSTO",
					"PRAZO",
					"SINCRONIZACAO",
				]),
				severity: z.enum(["INFO", "WARNING", "ALERT", "CRITICAL"]),
				title: z.string(),
				createdAt: z.string().datetime(),
			}),
		},
	),

	resolve: os.handler(
		async ({ input }) => {
			return db.alerta.update({
				where: { id: input.id },
				data: {
					resolved: true,
					resolvedAt: new Date(),
					resolution: input.resolution,
				},
			});
		},
		{
			input: z.object({
				id: z.string().uuid(),
				resolution: z.string().optional(),
			}),
			output: z.object({
				id: z.string().uuid(),
				resolved: z.boolean(),
				resolvedAt: z.string().datetime(),
			}),
		},
	),

	stats: os.handler(
		async () => {
			const [ativos, criticos, naoLidos] = await Promise.all([
				db.alerta.count({ where: { resolved: false } }),
				db.alerta.count({ where: { severity: "CRITICAL", resolved: false } }),
				db.alerta.count({ where: { resolved: false }, take: 10 }),
			]);
			return { ativos, criticos, naoLidos };
		},
		{
			output: z.object({
				ativos: z.number(),
				criticos: z.number(),
				naoLidos: z.number(),
			}),
		},
	),

	analyzePredictive: os
		.use(requerAutenticacao())
		.use(requerPermissao("DASHBOARD:GLOBAL"))
		.handler(
			async ({ input }) => {
				const dias = 7;
				const inicio = new Date();
				inicio.setDate(inicio.getDate() - dias);

				const [diarios, solicitacoes, obra] = await Promise.all([
					db.diarioObra.count({
						where: {
							obraId: input.obraId,
							createdAt: { gte: inicio },
						},
					}),
					db.solicitacaoMaterial.count({
						where: {
							obraId: input.obraId,
							status: { in: ["ABERTA", "EM_ANALISE"] },
						},
					}),
					db.obra.findUnique({
						where: { id: input.obraId },
						select: { name: true, status: true },
					}),
				]);

				const ultimoDiario = await db.diarioObra.findFirst({
					where: { obraId: input.obraId },
					orderBy: { date: "desc" },
					select: { progressPct: true },
				});

				const avancoMedio7Dias =
					diarios > 0 ? Number(ultimoDiario?.progressPct || 0) / diarios : 0;
				const avancoEsperado7Dias = 100 / (((365 / 12) * dias) / 7);

				const result = await gerarAlertaPreditivo({
					obraNome: obra?.name || "Obra",
					diariosUltimos30Dias: diarios,
					solicitacoesPendentes: solicitacoes,
					avancoMedio7Dias,
					avancoEsperado7Dias,
				});

				const created = await db.alerta.create({
					data: {
						obraId: input.obraId,
						title: result.mensagem,
						type: result.tipo as any,
						severity:
							result.prioridade === "alta"
								? "CRITICAL"
								: result.prioridade === "media"
									? "MEDIA"
									: "LOW",
						message: result.acaoRecomendada,
						resolved: false,
					},
				});

				return {
					alerta: created,
					analise: result,
				};
			},
			{
				input: z.object({ obraId: z.string().uuid() }),
				output: z.object({
					alerta: z.object({
						id: z.string(),
						title: z.string(),
						type: z.string(),
						severity: z.string(),
					}),
					analise: z.object({
						tipo: z.string(),
						score: z.number(),
						mensagem: z.string(),
						acaoRecomendada: z.string(),
						prioridade: z.string(),
					}),
				}),
			},
		),
});
