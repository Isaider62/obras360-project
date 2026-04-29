import { db } from "@obras360-project/db";
import { os } from "@orpc/server";
import { z } from "zod";
import { requerAutenticacao, requerPermissao } from "../middleware/auth";

export const usuarioInputSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1).max(200),
	email: z.string().email(),
	perfil: z.enum(["ENCARREGADO", "COMPRAS", "ADMIN", "GESTAO"]).optional(),
	ativo: z.boolean().optional(),
});

export const usuarioOutputSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	email: z.string(),
	perfil: z.string(),
	ativo: z.boolean(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const usuariosRouter = os.router({
	list: os
		.use(requerAutenticacao())
		.use(requerPermissao("USUARIO:Gestao"))
		.handler(
			async ({ input }) => {
				return db.user.findMany({
					where: {
						...(input.ativo !== undefined && { ativo: input.ativo }),
					},
					orderBy: { name: "asc" },
					select: {
						id: true,
						name: true,
						email: true,
						perfil: true,
						ativo: true,
						createdAt: true,
						updatedAt: true,
					},
				});
			},
			{
				input: z.object({
					ativo: z.boolean().optional(),
				}),
				output: z.array(usuarioOutputSchema),
			},
		),

	get: os
		.use(requerAutenticacao())
		.use(requerPermissao("USUARIO:Gestao"))
		.handler(
			async ({ input }) => {
				return db.user.findUnique({
					where: { id: input.id },
					select: {
						id: true,
						name: true,
						email: true,
						perfil: true,
						ativo: true,
						createdAt: true,
						updatedAt: true,
					},
				});
			},
			{
				input: z.object({ id: z.string().uuid() }),
				output: usuarioOutputSchema,
			},
		),

	create: os
		.use(requerAutenticacao())
		.use(requerPermissao("USUARIO:Gestao"))
		.handler(
			async ({ input }) => {
				const existing = await db.user.findUnique({
					where: { email: input.email },
				});
				if (existing) {
					throw new Error("Email já cadastrado");
				}

				return db.user.create({
					data: {
						name: input.name,
						email: input.email,
						perfil: input.perfil || "ENCARREGADO",
						ativo: input.ativo ?? true,
					},
					select: {
						id: true,
						name: true,
						email: true,
						perfil: true,
						ativo: true,
						createdAt: true,
						updatedAt: true,
					},
				});
			},
			{
				input: z.object({
					name: z.string().min(1).max(200),
					email: z.string().email(),
					perfil: z
						.enum(["ENCARREGADO", "COMPRAS", "ADMIN", "GESTAO"])
						.optional(),
					ativo: z.boolean().optional(),
				}),
				output: usuarioOutputSchema,
			},
		),

	update: os
		.use(requerAutenticacao())
		.use(requerPermissao("USUARIO:Gestao"))
		.handler(
			async ({ input }) => {
				const user = await db.user.update({
					where: { id: input.id },
					data: {
						...(input.name && { name: input.name }),
						...(input.perfil && { perfil: input.perfil }),
						...(input.ativo !== undefined && { ativo: input.ativo }),
					},
					select: {
						id: true,
						name: true,
						email: true,
						perfil: true,
						ativo: true,
						createdAt: true,
						updatedAt: true,
					},
				});
				return user;
			},
			{
				input: z.object({
					id: z.string().uuid(),
					name: z.string().min(1).max(200).optional(),
					perfil: z
						.enum(["ENCARREGADO", "COMPRAS", "ADMIN", "GESTAO"])
						.optional(),
					ativo: z.boolean().optional(),
				}),
				output: usuarioOutputSchema,
			},
		),

	delete: os
		.use(requerAutenticacao())
		.use(requerPermissao("USUARIO:Gestao"))
		.handler(
			async ({ input }) => {
				await db.user.update({
					where: { id: input.id },
					data: { ativo: false },
				});
				return { success: true };
			},
			{
				input: z.object({ id: z.string().uuid() }),
				output: z.object({ success: z.boolean() }),
			},
		),
});
