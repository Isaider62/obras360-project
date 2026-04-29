import { db } from "@obras360-project/db";
import { os } from "@orpc/server";
import { z } from "zod";
import { requerAutenticacao, requerPermissao } from "../middleware/auth";

export const exportInputSchema = z.object({
	obraId: z.string().uuid(),
	type: z.enum(["DIARIO", "FINANCEIRO", "SOLICITACOES", "FOTOS"]),
	format: z.enum(["JSON", "CSV"]),
});

export const exportRouter = os.router({
	diario: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Leitura"))
		.handler(
			async ({ input }) => {
				const diarios = await db.diarioObra.findMany({
					where: { obraId: input.obraId, deletedAt: null },
					orderBy: { date: "desc" },
					select: {
						date: true,
						activities: true,
						problems: true,
						notes: true,
						progressPct: true,
						weather: true,
					},
				});

				if (input.format === "CSV") {
					const headers = [
						"Data",
						"Atividades",
						"Problemas",
						"Observações",
						"Progresso %",
						"Clima",
					];
					const rows = diarios.map((d) => [
						d.date.toISOString().split("T")[0],
						d.activities || "",
						d.problems || "",
						d.notes || "",
						d.progressPct?.toString() || "",
						JSON.stringify(d.weather || {}),
					]);
					return { csv: [headers, ...rows].map((r) => r.join(",")).join("\n") };
				}

				return { data: diarios };
			},
			{
				input: z.object({
					obraId: z.string().uuid(),
					format: z.enum(["JSON", "CSV"]),
				}),
				output: z.object({
					csv: z.string().optional(),
					data: z.any().optional(),
				}),
			},
		),

	financeiro: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Leitura"))
		.handler(
			async ({ input }) => {
				const transacoes = await db.transacao.findMany({
					where: { obraId: input.obraId, deletedAt: null },
					orderBy: { data: "desc" },
					select: {
						data: true,
						tipo: true,
						categoria: true,
						descricao: true,
						valor: true,
						pago: true,
					},
				});

				if (input.format === "CSV") {
					const headers = [
						"Data",
						"Tipo",
						"Categoria",
						"Descrição",
						"Valor",
						"Pago",
					];
					const rows = transacoes.map((t) => [
						t.data.toISOString().split("T")[0],
						t.tipo,
						t.categoria,
						t.descricao || "",
						t.valor.toString(),
						t.pago ? "Sim" : "Não",
					]);
					return { csv: [headers, ...rows].map((r) => r.join(",")).join("\n") };
				}

				return { data: transacoes };
			},
			{
				input: z.object({
					obraId: z.string().uuid(),
					format: z.enum(["JSON", "CSV"]),
				}),
				output: z.object({
					csv: z.string().optional(),
					data: z.any().optional(),
				}),
			},
		),

	solicitacoes: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Leitura"))
		.handler(
			async ({ input }) => {
				const solicitacoes = await db.solicitacaoMaterial.findMany({
					where: { obraId: input.obraId },
					orderBy: { createdAt: "desc" },
					select: {
						item: true,
						quantity: true,
						unit: true,
						urgency: true,
						status: true,
						createdAt: true,
					},
				});

				if (input.format === "CSV") {
					const headers = [
						"Item",
						"Quantidade",
						"Unidade",
						"Urgência",
						"Status",
						"Data",
					];
					const rows = solicitacoes.map((s) => [
						s.item,
						s.quantity.toString(),
						s.unit || "",
						s.urgency,
						s.status,
						s.createdAt.toISOString().split("T")[0],
					]);
					return { csv: [headers, ...rows].map((r) => r.join(",")).join("\n") };
				}

				return { data: solicitacoes };
			},
			{
				input: z.object({
					obraId: z.string().uuid(),
					format: z.enum(["JSON", "CSV"]),
				}),
				output: z.object({
					csv: z.string().optional(),
					data: z.any().optional(),
				}),
			},
		),

	fotos: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Leitura"))
		.handler(
			async ({ input }) => {
				const fotos = await db.foto.findMany({
					where: { obraId: input.obraId, deletedAt: null },
					orderBy: { createdAt: "desc" },
					select: {
						url: true,
						stageIa: true,
						createdAt: true,
					},
				});

				if (input.format === "CSV") {
					const headers = ["URL", "Etapa (IA)", "Data"];
					const rows = fotos.map((f) => [
						f.url,
						f.stageIa || "",
						f.createdAt.toISOString().split("T")[0],
					]);
					return { csv: [headers, ...rows].map((r) => r.join(",")).join("\n") };
				}

				return { data: fotos };
			},
			{
				input: z.object({
					obraId: z.string().uuid(),
					format: z.enum(["JSON", "CSV"]),
				}),
				output: z.object({
					csv: z.string().optional(),
					data: z.any().optional(),
				}),
			},
		),
});
