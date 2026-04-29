import { db } from "@obras360-project/db";
import { os } from "@orpc/server";
import { z } from "zod";
import { requerAutenticacao, requerPermissao } from "../middleware/auth";

export const pontoInputSchema = z.object({
	obraId: z.string().uuid(),
	date: z.string().datetime(),
	entryTime: z.string().datetime().optional(),
	exitTime: z.string().datetime().optional(),
	signatureUrl: z.string().optional(),
	team: z
		.array(
			z.object({
				id: z.string(),
				name: z.string(),
				entryTime: z.string().datetime().optional(),
				exitTime: z.string().datetime().optional(),
			}),
		)
		.optional(),
	weather: z.string().optional(),
});

export const pontoOutputSchema = z.object({
	id: z.string().uuid(),
	obraId: z.string().uuid(),
	encarregadoId: z.string().uuid(),
	date: z.string().datetime(),
	entryTime: z.string().datetime().nullable(),
	exitTime: z.string().datetime().nullable(),
	team: z.array(z.any()).nullable(),
	weather: z.string().nullable(),
	signatureUrl: z.string().nullable(),
	synced: z.boolean(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const pontoRouter = os.router({
	list: os
		.use(requerAutenticacao())
		.use(requerPermissao("PONTO:Registrar"))
		.handler(
			async ({ input }) => {
				return db.registroPonto.findMany({
					where: {
						obraId: input.obraId,
					},
					orderBy: { date: "desc" },
					take: input.limit ?? 30,
				});
			},
			{
				input: z.object({
					obraId: z.string().uuid(),
					limit: z.number().optional(),
				}),
				output: z.array(pontoOutputSchema),
			},
		),

	get: os
		.use(requerAutenticacao())
		.use(requerPermissao("PONTO:Registrar"))
		.handler(
			async ({ input }) => {
				return db.registroPonto.findUnique({
					where: {
						obraId_date: {
							obraId: input.obraId,
							date: new Date(input.date),
						},
					},
				});
			},
			{
				input: z.object({
					obraId: z.string().uuid(),
					date: z.string().datetime(),
				}),
				output: pontoOutputSchema.nullable(),
			},
		),

	register: os
		.use(requerAutenticacao())
		.use(requerPermissao("PONTO:Registrar"))
		.handler(
			async ({ input, context }) => {
				const today = new Date();
				today.setHours(0, 0, 0, 0);

				const existing = await db.registroPonto.findFirst({
					where: {
						obraId: input.obraId,
						date: {
							gte: today,
						},
					},
				});

				if (existing) {
					return db.registroPonto.update({
						where: { id: existing.id },
						data: {
							exitTime: input.exitTime ? new Date(input.exitTime) : undefined,
							team: input.team as unknown as Record<string, never>,
							weather: input.weather,
							signatureUrl: input.signatureUrl,
							synced: false,
						},
					});
				}

				return db.registroPonto.create({
					data: {
						obraId: input.obraId,
						encarregadoId: context.session?.user?.id || "",
						date: today,
						entryTime: input.entryTime ? new Date(input.entryTime) : new Date(),
						exitTime: input.exitTime ? new Date(input.exitTime) : undefined,
						team: input.team as unknown as Record<string, never>,
						weather: input.weather,
						signatureUrl: input.signatureUrl,
						synced: false,
					},
				});
			},
			{
				input: pontoInputSchema.omit({ date: true }),
				output: pontoOutputSchema,
			},
		),

	stats: os
		.use(requerAutenticacao())
		.use(requerPermissao("PONTO:Relatorio"))
		.handler(
			async ({ input }) => {
				const [total, thisMonth] = await Promise.all([
					db.registroPonto.count({
						where: { obraId: input.obraId },
					}),
					db.registroPonto.count({
						where: {
							obraId: input.obraId,
							date: {
								gte: new Date(
									new Date().getFullYear(),
									new Date().getMonth(),
									1,
								),
							},
						},
					}),
				]);

				return { total, thisMonth };
			},
			{
				input: z.object({ obraId: z.string().uuid() }),
				output: z.object({
					total: z.number(),
					thisMonth: z.number(),
				}),
			},
		),
});
