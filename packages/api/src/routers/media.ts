import { db } from "@obras360-project/db";
import { os } from "@orpc/server";
import { z } from "zod";
import { requerAutenticacao, requerPermissao } from "../middleware/auth";

export const mediaInputSchema = z.object({
	obraId: z.string().uuid(),
	fileName: z.string(),
	fileType: z.enum([
		"image/jpeg",
		"image/png",
		"image/webp",
		"audio/mpeg",
		"audio/wav",
		"audio/mp3",
	]),
	etapa: z
		.enum(["FUNDACAO", "ESTRUTURA", "ALVENARIA", "INSTALACOES", "ACABAMENTO"])
		.optional(),
});

export const mediaOutputSchema = z.object({
	id: z.string(),
	url: z.string(),
	thumbnail: z.string().nullable(),
	obraId: z.string(),
	userId: z.string(),
	createdAt: z.string().datetime(),
});

export const mediaRouter = os.router({
	uploadFoto: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Criar"))
		.handler(
			async ({ input, context }) => {
				const { obraId, fileName } = input;
				const userId = context.session?.user?.id;
				if (!userId) {
					throw new Error("Usuário não autenticado");
				}

				const path = `obras/${obraId}/fotos/${Date.now()}-${fileName}`;

				return {
					path,
					uploadUrl: `https://gbtceqmdxbnbkephacus.supabase.co/storage/v1/object/${path}`,
					userId,
					obraId,
				};
			},
			{
				input: mediaInputSchema,
				output: z.object({
					path: z.string(),
					uploadUrl: z.string(),
					userId: z.string(),
					obraId: z.string(),
				}),
			},
		),

	registrarFoto: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Criar"))
		.handler(
			async ({ input, context }) => {
				const { obraId, path, stageIa, tagsIa } = input;
				const userId = context.session?.user?.id;
				if (!userId) {
					throw new Error("Usuário não autenticado");
				}

				const url = `https://gbtceqmdxbnbkephacus.supabase.co/storage/v1/object/public/obras360/${path}`;

				const foto = await db.foto.create({
					data: {
						obraId,
						userId,
						url,
						stageIa: stageIa as unknown as Record<string, unknown> | undefined,
						tagsIa,
					},
				});

				return foto;
			},
			{
				input: z.object({
					obraId: z.string().uuid(),
					path: z.string(),
					stageIa: z
						.enum([
							"FUNDACAO",
							"ESTRUTURA",
							"ALVENARIA",
							"INSTALACOES",
							"ACABAMENTO",
						])
						.optional(),
					tagsIa: z.string().optional(),
				}),
				output: mediaOutputSchema,
			},
		),

	listFotos: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Leitura"))
		.handler(
			async ({ input }) => {
				const fotos = await db.foto.findMany({
					where: { obraId: input.obraId, deletedAt: null },
					orderBy: { capturedAt: "desc" },
					take: input.take ?? 50,
				});
				return fotos;
			},
			{
				input: z.object({
					obraId: z.string().uuid(),
					take: z.number().optional(),
				}),
				output: z.array(mediaOutputSchema),
			},
		),
});
