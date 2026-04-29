import { db } from "@obras360-project/db";
import { os } from "@orpc/server";
import { z } from "zod";
import { requerAutenticacao, requerPermissao } from "../middleware/auth";

export const diarioInputSchema = z.object({
	obraId: z.string().uuid(),
	date: z.string().datetime().optional(),
	activities: z.string().optional(),
	problems: z.string().optional(),
	notes: z.string().optional(),
	progressPct: z.number().min(0).max(100).optional(),
	weather: z
		.object({
			temperature: z.number(),
			humidity: z.number(),
			weatherCode: z.number(),
			description: z.string(),
		})
		.optional(),
});

export const diarioOutputSchema = z.object({
	id: z.string().uuid(),
	obraId: z.string().uuid(),
	userId: z.string().uuid(),
	date: z.string().datetime(),
	activities: z.string().nullable(),
	problems: z.string().nullable(),
	notes: z.string().nullable(),
	progressPct: z.number().nullable(),
	weather: z.any(),
	synced: z.boolean(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const diariosRouter = os.router({
	list: os
		.use(requerAutenticacao())
		.use(requerPermissao("DIARIO:Leitura"))
		.handler(
			async ({ input }) => {
				return db.diarioObra.findMany({
					where: {
						obraId: input.obraId,
						deletedAt: null,
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
				output: z.array(diarioOutputSchema),
			},
		),

	get: os
		.use(requerAutenticacao())
		.use(requerPermissao("DIARIO:Leitura"))
		.handler(
			async ({ input }) => {
				return db.diarioObra.findUnique({
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
				output: diarioOutputSchema.nullable(),
			},
		),

	create: os
		.use(requerAutenticacao())
		.use(requerPermissao("DIARIO:Criar"))
		.handler(
			async ({ input, context }) => {
				const today = new Date();
				today.setHours(12, 0, 0, 0);

				const existing = await db.diarioObra.findFirst({
					where: {
						obraId: input.obraId,
						date: {
							gte: today,
						},
					},
				});

				if (existing) {
					return db.diarioObra.update({
						where: { id: existing.id },
						data: {
							activities: input.activities,
							problems: input.problems,
							notes: input.notes,
							progressPct: input.progressPct,
							weather: input.weather as unknown as Record<string, never>,
							synced: false,
						},
					});
				}

				return db.diarioObra.create({
					data: {
						obraId: input.obraId,
						userId: context.session?.user?.id || "",
						date: today,
						activities: input.activities,
						problems: input.problems,
						notes: input.notes,
						progressPct: input.progressPct,
						weather: input.weather as unknown as Record<string, never>,
						synced: false,
					},
				});
			},
			{
				input: diarioInputSchema.omit({ date: true }),
				output: diarioOutputSchema,
			},
		),
});
