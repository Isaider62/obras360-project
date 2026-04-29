import { db } from "@obras360-project/db";
import { os } from "@orpc/server";
import { z } from "zod";
import {
	obterPerfil,
	requerAutenticacao,
	requerPermissao,
	verificarAcessoObra,
} from "../middleware/auth";

export const obraInputSchema = z.object({
	name: z.string().min(1).max(200),
	address: z.string().optional(),
	status: z
		.enum(["PLANEJAMENTO", "EM_ANDAMENTO", "CONCLUIDO", "ARQUIVADO"])
		.optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	budgetTotal: z.number().positive().optional(),
	location: z.object({ lat: z.number(), lng: z.number() }).optional(),
	encarregadoId: z.string().optional(),
});

export const obraOutputSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	address: z.string().nullable(),
	status: z.enum(["PLANEJAMENTO", "EM_ANDAMENTO", "CONCLUIDO", "ARQUIVADO"]),
	startDate: z.string().datetime().nullable(),
	endDate: z.string().datetime().nullable(),
	budgetTotal: z.number().nullable(),
	budgetCurrent: z.number().nullable(),
	location: z.object({ lat: z.number(), lng: z.number() }).nullable(),
	encarregadoId: z.string().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const obrasRouter = os.router({
	list: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Leitura"))
		.handler(
			async ({ context }) => {
				const perfil = obterPerfil(context.session);
				if (perfil === "ENCARREGADO") {
					return db.obra.findMany({
						where: {
							encarregadoId: context.session?.user?.id,
							deletedAt: null,
						},
						orderBy: { createdAt: "desc" },
					});
				}
				return db.obra.findMany({
					where: { deletedAt: null },
					orderBy: { createdAt: "desc" },
				});
			},
			{ output: z.array(obraOutputSchema) },
		),

	get: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Leitura"))
		.handler(
			async ({ input, context }) => {
				await verificarAcessoObra(input.id, context.session);
				return db.obra.findUnique({
					where: { id: input.id },
				});
			},
			{
				input: z.object({ id: z.string().uuid() }),
				output: obraOutputSchema,
			},
		),

	create: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Criar"))
		.handler(
			async ({ input }) => {
				const data: Record<string, unknown> = {
					name: input.name,
					address: input.address,
					status: input.status || "PLANEJAMENTO",
				};
				if (input.startDate) data.startDate = new Date(input.startDate);
				if (input.endDate) data.endDate = new Date(input.endDate);
				if (input.budgetTotal) data.budgetTotal = input.budgetTotal;
				if (input.location) data.location = input.location;
				if (input.encarregadoId) data.encarregadoId = input.encarregadoId;
				return db.obra.create({ data });
			},
			{
				input: obraInputSchema,
				output: obraOutputSchema,
			},
		),

	update: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Escrita"))
		.handler(
			async ({ input }) => {
				await verificarAcessoObra(input.id, input.context?.session);
				const data: Record<string, unknown> = {};
				if (input.name) data.name = input.name;
				if (input.address !== undefined) data.address = input.address;
				if (input.status) data.status = input.status;
				if (input.startDate) data.startDate = new Date(input.startDate);
				if (input.endDate) data.endDate = new Date(input.endDate);
				if (input.budgetTotal) data.budgetTotal = input.budgetTotal;
				return db.obra.update({
					where: { id: input.id },
					data,
				});
			},
			{
				input: obraInputSchema.extend({ id: z.string().uuid() }),
				output: obraOutputSchema,
			},
		),

	delete: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Escrita"))
		.handler(
			async ({ input }) => {
				await verificarAcessoObra(input.id, input.context?.session);
				return db.obra.update({
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
				const [total, emAndamento, concluidas, pendentes] = await Promise.all([
					db.obra.count({ where: { deletedAt: null } }),
					db.obra.count({ where: { status: "EM_ANDAMENTO", deletedAt: null } }),
					db.obra.count({ where: { status: "CONCLUIDO", deletedAt: null } }),
					db.solicitacaoMaterial.count({
						where: { status: "ABERTA", deletedAt: null },
					}),
				]);
				return { total, emAndamento, concluidas, pendentes };
			},
			{
				output: z.object({
					total: z.number(),
					emAndamento: z.number(),
					concluidas: z.number(),
					pendentes: z.number(),
				}),
			},
		),

	timeline: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Leitura"))
		.handler(
			async ({ input }) => {
				const obraId = input.obraId;
				const [diarios, alertas, fotos, pontos] = await Promise.all([
					db.diarioObra.findMany({
						where: { obraId, deletedAt: null },
						select: {
							id: true,
							date: true,
							activities: true,
							progressPct: true,
							createdAt: true,
						},
						orderBy: { date: "desc" },
						take: 20,
					}),
					db.alerta.findMany({
						where: { obraId, deletedAt: null },
						select: {
							id: true,
							title: true,
							type: true,
							severity: true,
							resolved: true,
							createdAt: true,
						},
						orderBy: { createdAt: "desc" },
						take: 10,
					}),
					db.foto.findMany({
						where: { obraId, deletedAt: null },
						select: { id: true, url: true, stageIa: true, createdAt: true },
						orderBy: { createdAt: "desc" },
						take: 10,
					}),
					db.registroPonto.findMany({
						where: { obraId, deletedAt: null },
						select: {
							id: true,
							type: true,
							signatureUrl: true,
							createdAt: true,
						},
						orderBy: { createdAt: "desc" },
						take: 10,
					}),
				]);

				type TimelineItem = {
					id: string;
					type: "DIARIO" | "ALERTA" | "FOTO" | "PONTO";
					date: Date;
					title: string;
					subtitle?: string;
				};
				const items: TimelineItem[] = [
					...diarios.map((d) => ({
						id: d.id,
						type: "DIARIO" as const,
						date: d.date,
						title: d.activities?.substring(0, 50) || "Diário",
						subtitle: d.progressPct ? `Avanço: ${d.progressPct}%` : undefined,
					})),
					...alertas.map((a) => ({
						id: a.id,
						type: "ALERTA" as const,
						date: a.createdAt,
						title: a.title,
						subtitle: a.resolved ? "Resolvido" : a.severity,
					})),
					...fotos.map((f) => ({
						id: f.id,
						type: "FOTO" as const,
						date: f.createdAt,
						title: "Foto registrada",
						subtitle: f.stageIa || undefined,
					})),
					...pontos.map((p) => ({
						id: p.id,
						type: "PONTO" as const,
						date: p.createdAt,
						title: p.type === "entrada" ? "Entrada" : "Saída",
					})),
				];
				items.sort((a, b) => b.date.getTime() - a.date.getTime());
				return items.slice(0, 50);
			},
			{
				input: z.object({ obraId: z.string().uuid() }),
				output: z.array(
					z.object({
						id: z.string(),
						type: z.enum(["DIARIO", "ALERTA", "FOTO", "PONTO"]),
						date: z.string(),
						title: z.string(),
						subtitle: z.string().optional(),
					}),
				),
			},
		),

	curvaS: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Leitura"))
		.handler(
			async ({ input }) => {
				const diarios = await db.diarioObra.findMany({
					where: {
						obraId: input.obraId,
						deletedAt: null,
						progressPct: { not: null },
					},
					select: { date: true, progressPct: true },
					orderBy: { date: "asc" },
				});
				const obra = await db.obra.findUnique({
					where: { id: input.obraId },
					select: {
						startDate: true,
						endDate: true,
						budgetTotal: true,
						budgetCurrent: true,
					},
				});
				if (!obra) return null;
				const planned = generatePlannedCurve(obra.startDate, obra.endDate, 100);
				const actual = diarios.map((d) => ({
					date: d.date.toISOString().split("T")[0],
					progress: Number(d.progressPct),
				}));
				const today = new Date().toISOString().split("T")[0];
				const expectedToday = planned.find((p) => p.date <= today);
				const actualToday = actual.find((a) => a.date === today);
				return {
					planned,
					actual,
					summary: {
						startDate: obra.startDate?.toISOString().split("T")[0],
						endDate: obra.endDate?.toISOString().split("T")[0],
						budgetTotal: Number(obra.budgetTotal || 0),
						budgetExecuted: Number(obra.budgetCurrent || 0),
						expectedToday: expectedToday?.progress || 0,
						actualToday: actualToday?.progress || 0,
					},
				};
			},
			{
				input: z.object({ obraId: z.string().uuid() }),
				output: z.object({
					planned: z.array(
						z.object({ date: z.string(), progress: z.number() }),
					),
					actual: z.array(z.object({ date: z.string(), progress: z.number() })),
					summary: z.object({
						startDate: z.string().nullable(),
						endDate: z.string().nullable(),
						budgetTotal: z.number(),
						budgetExecuted: z.number(),
						expectedToday: z.number(),
						actualToday: z.number(),
					}),
				}),
			},
		),

	desvio: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Leitura"))
		.handler(
			async ({ input }) => {
				const obra = await db.obra.findUnique({
					where: { id: input.obraId },
					select: {
						startDate: true,
						endDate: true,
						finishedDate: true,
						status: true,
						budgetTotal: true,
						budgetCurrent: true,
					},
				});
				if (!obra) return null;
				const ultimoDiario = await db.diarioObra.findFirst({
					where: {
						obraId: input.obraId,
						deletedAt: null,
						progressPct: { not: null },
					},
					orderBy: { date: "desc" },
					select: { date: true, progressPct: true },
				});
				const today = new Date();
				const startDate = obra.startDate;
				const endDate = obra.endDate;
				if (!startDate || !endDate)
					return {
						prazoDias: 0,
						prazoStatus: "NO_PRAZO" as const,
						custoDiferenca: 0,
						custoPercent: 0,
						custoStatus: "NO_ORCAMENTO" as const,
						diasRestantes: 0,
						percentConcluido: 0,
						ritmoAtual: null,
						ritmoEsperado: null,
						dataPrevista: null,
					};
				const totalDias = Math.ceil(
					(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
				);
				const diasDecorridos = Math.ceil(
					(today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
				);
				const diasRestantes = Math.max(
					0,
					Math.ceil(
						(endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
					),
				);
				const percentConcluido = Number(ultimoDiario?.progressPct || 0);
				const percentEsperado =
					totalDias > 0 ? Math.round((diasDecorridos / totalDias) * 100) : 0;
				const prazoDias =
					diasRestantes > 0
						? Math.round(totalDias * (percentConcluido / 100) - diasDecorridos)
						: totalDias - diasDecorridos;
				const budgetTotal = Number(obra.budgetTotal || 0);
				const budgetExecuted = Number(obra.budgetCurrent || 0);
				const custoDiferenca = budgetTotal - budgetExecuted;
				const custoPercent =
					budgetTotal > 0
						? Math.round(
								(budgetExecuted / budgetTotal) * 100 - percentConcluido,
							)
						: 0;
				const diarioCount = await db.diarioObra.count({
					where: {
						obraId: input.obraId,
						deletedAt: null,
						progressPct: { not: null },
					},
				});
				let ritmoAtual: number | null = null;
				let ritmoEsperado: number | null = null;
				if (diarioCount > 1 && diasDecorridos > 0) {
					ritmoAtual = Math.round(percentConcluido / diarioCount);
					ritmoEsperado = Math.round(percentEsperado / diasDecorridos);
				}
				const dataPrevista =
					endDate > today
						? new Date(
								startDate.getTime() +
									(percentConcluido / 100) * totalDias * 24 * 60 * 60 * 1000,
							)
								.toISOString()
								.split("T")[0]
						: null;
				return {
					prazoDias,
					prazoStatus:
						prazoDias > 0
							? ("ADIANTADO" as const)
							: prazoDias < 0
								? ("ATRASADO" as const)
								: ("NO_PRAZO" as const),
					custoDiferenca,
					custoPercent,
					custoStatus:
						custoPercent < 0
							? ("ABAIXO" as const)
							: custoPercent > 5
								? ("ACIMA" as const)
								: ("NO_ORCAMENTO" as const),
					diasRestantes,
					percentConcluido,
					ritmoAtual,
					ritmoEsperado,
					dataPrevista,
				};
			},
			{
				input: z.object({ obraId: z.string().uuid() }),
				output: z.object({
					prazoDias: z.number(),
					prazoStatus: z.enum(["ADIANTADO", "NO_PRAZO", "ATRASADO"]),
					custoDiferenca: z.number(),
					custoPercent: z.number(),
					custoStatus: z.enum(["ABAIXO", "NO_ORCAMENTO", "ACIMA"]),
					diasRestantes: z.number(),
					percentConcluido: z.number(),
					ritmoAtual: z.number().nullable(),
					ritmoEsperado: z.number().nullable(),
					dataPrevista: z.string().nullable(),
				}),
			},
		),
});

function generatePlannedCurve(
	startDate: Date | null,
	endDate: Date | null,
	targetProgress: number,
): { date: string; progress: number }[] {
	if (!startDate || !endDate) return [];
	const days = Math.ceil(
		(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
	);
	const curve: { date: string; progress: number }[] = [];
	for (let i = 0; i <= days; i++) {
		const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
		const progress = Math.round((i / days) * targetProgress);
		curve.push({ date: date.toISOString().split("T")[0], progress });
	}
	return curve;
}
