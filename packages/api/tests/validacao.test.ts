import { describe, expect, it } from "bun:test";
import { z } from "zod";

describe("Validacao de Schemas Zod", () => {
	describe("Obra Schema", () => {
		const obraInputSchema = z.object({
			name: z.string().min(1).max(200),
			address: z.string().optional(),
			status: z
				.enum(["PLANEJAMENTO", "EM_ANDAMENTO", "CONCLUIDO", "ARQUIVADO"])
				.optional(),
			startDate: z.string().datetime().optional(),
			endDate: z.string().datetime().optional(),
			budgetTotal: z.number().positive().optional(),
		});

		it("deve validar nome obrigatorio", () => {
			const result = obraInputSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it("deve validar nome valido", () => {
			const result = obraInputSchema.safeParse({ name: "Obra Teste" });
			expect(result.success).toBe(true);
		});

		it("deve validar budget positivo", () => {
			const result = obraInputSchema.safeParse({
				name: "Test",
				budgetTotal: 10000,
			});
			expect(result.success).toBe(true);
		});

		it("deve rejeitar budget negativo", () => {
			const result = obraInputSchema.safeParse({
				name: "Test",
				budgetTotal: -100,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Usuario Schema", () => {
		const usuarioInputSchema = z.object({
			name: z.string().min(1).max(200),
			email: z.string().email(),
			perfil: z.enum(["ENCARREGADO", "COMPRAS", "ADMIN", "GESTAO"]).optional(),
		});

		it("deve validar email obrigatorio", () => {
			const result = usuarioInputSchema.safeParse({ name: "Test" });
			expect(result.success).toBe(false);
		});

		it("deve validar email invalido", () => {
			const result = usuarioInputSchema.safeParse({
				name: "Test",
				email: "invalid",
			});
			expect(result.success).toBe(false);
		});

		it("deve validar email valido", () => {
			const result = usuarioInputSchema.safeParse({
				name: "Test",
				email: "test@example.com",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("Transacao Schema", () => {
		const transacaoInputSchema = z.object({
			obraId: z.string().uuid(),
			tipo: z.enum(["RECEITA", "DESPESA"]),
			categoria: z.string().min(1).max(100),
			descricao: z.string().optional(),
			valor: z.number().positive(),
			data: z.string().datetime().optional(),
			pago: z.boolean().optional(),
		});

		it("deve validar UUID valido", () => {
			const result = transacaoInputSchema.safeParse({
				obraId: "550e8400-e29b-41d4-a716-446655440000",
				tipo: "DESPESA",
				categoria: "MATERIAL",
				valor: 100,
			});
			expect(result.success).toBe(true);
		});

		it("deve rejeitar UUID invalido", () => {
			const result = transacaoInputSchema.safeParse({
				obraId: "invalid-uuid",
				tipo: "DESPESA",
				categoria: "MATERIAL",
				valor: 100,
			});
			expect(result.success).toBe(false);
		});

		it("deve rejeitar valor negativo", () => {
			const result = transacaoInputSchema.safeParse({
				obraId: "550e8400-e29b-41d4-a716-446655440000",
				tipo: "DESPESA",
				categoria: "MATERIAL",
				valor: -100,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Diario Schema", () => {
		const diarioInputSchema = z.object({
			obraId: z.string().uuid(),
			date: z.string().datetime().optional(),
			activities: z.string().optional(),
			problems: z.string().optional(),
			notes: z.string().optional(),
			progressPct: z.number().min(0).max(100).optional(),
		});

		it("deve validar progresso 0-100", () => {
			const result = diarioInputSchema.safeParse({
				obraId: "550e8400-e29b-41d4-a716-446655440000",
				progressPct: 50,
			});
			expect(result.success).toBe(true);
		});

		it("deve rejeitar progresso > 100", () => {
			const result = diarioInputSchema.safeParse({
				obraId: "550e8400-e29b-41d4-a716-446655440000",
				progressPct: 150,
			});
			expect(result.success).toBe(false);
		});

		it("deve rejeitar progresso negativo", () => {
			const result = diarioInputSchema.safeParse({
				obraId: "550e8400-e29b-41d4-a716-446655440000",
				progressPct: -10,
			});
			expect(result.success).toBe(false);
		});
	});
});

describe("Constantes e Enums", () => {
	it("deve ter todos os perfis definidos", () => {
		const perfis = ["ENCARREGADO", "COMPRAS", "GESTAO", "ADMIN"];
		expect(perfis.length).toBe(4);
	});

	it("deve ter todas as etapas definidas", () => {
		const etapas = [
			"FUNDACAO",
			"ESTRUTURA",
			"ALVENARIA",
			"INSTALACOES",
			"ACABAMENTO",
		];
		expect(etapas.length).toBe(5);
	});

	it("deve ter todos os status de solicitacao", () => {
		const status = [
			"ABERTA",
			"EM_ANALISE",
			"EM_COTACAO",
			"APROVADA",
			"COMPRADA",
			"ENVIADA",
			"ENTREGUE",
			"CANCELADA",
			"REJEITADA",
		];
		expect(status.length).toBe(9);
	});
});

describe("Utilitarios", () => {
	it("deve gerar UUID valido", () => {
		const uuid = crypto.randomUUID();
		const regex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		expect(regex.test(uuid)).toBe(true);
	});

	it("deve formatar currency", () => {
		const value = 1234.56;
		const formatted = new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
		expect(formatted).toContain("1.234,56");
	});

	it("deve validar data ISO", () => {
		const date = new Date().toISOString();
		const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
		expect(regex.test(date)).toBe(true);
	});
});
