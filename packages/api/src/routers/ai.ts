import { os } from "@orpc/server";
import { z } from "zod";
import {
	analisarProgresso,
	classificarFoto,
	gerarAlertaPreditivo,
} from "../infrastructure/ai/ai.service";
import { requerAutenticacao, requerPermissao } from "../middleware/auth";

export const aiRouter = os.router({
	classificarFoto: os
		.use(requerAutenticacao())
		.use(requerPermissao("OBRA:Leitura"))
		.handler(
			async ({ input }) => {
				const resultado = await classificarFoto(input.imageUrl);
				return resultado;
			},
			{
				input: z.object({
					imageUrl: z.string().url(),
				}),
				output: z.object({
					etapa: z.string(),
					confianca: z.number(),
					descricao: z.string(),
					tags: z.array(z.string()),
				}),
			},
		),

	analisarProgresso: os
		.use(requerAutenticacao())
		.use(requerPermissao("DASHBOARD:GLOBAL"))
		.handler(
			async ({ input }) => {
				const resultado = await analisarProgresso({
					nome: input.nome,
					dataInicio: input.dataInicio,
					dataPrevFim: input.dataPrevFim,
					avancoPct: input.avancoPct,
					cronograma: input.cronograma,
				});
				return resultado;
			},
			{
				input: z.object({
					nome: z.string(),
					dataInicio: z.string(),
					dataPrevFim: z.string(),
					avancoPct: z.number(),
					cronograma: z.array(
						z.object({
							etapa: z.string(),
							dataPrevista: z.string(),
							dataReal: z.string().optional(),
						}),
					),
				}),
				output: z.object({
					desvioDias: z.number(),
					desvioCusto: z.number(),
					alertaNivel: z.enum(["verde", "amarelo", "vermelho"]),
					acaoRecomendada: z.string(),
					insights: z.array(z.string()),
				}),
			},
		),

	gerarAlertaPreditivo: os
		.use(requerAutenticacao())
		.use(requerPermissao("DASHBOARD:GLOBAL"))
		.handler(
			async ({ input }) => {
				const resultado = await gerarAlertaPreditivo({
					obraNome: input.obraNome,
					diariosUltimos30Dias: input.diariosUltimos30Dias,
					solicitacoesPendentes: input.solicitacoesPendentes,
					avancoMedio7Dias: input.avancoMedio7Dias,
					avancoEsperado7Dias: input.avancoEsperado7Dias,
				});
				return resultado;
			},
			{
				input: z.object({
					obraNome: z.string(),
					diariosUltimos30Dias: z.number(),
					solicitacoesPendentes: z.number(),
					avancoMedio7Dias: z.number(),
					avancoEsperado7Dias: z.number(),
				}),
				output: z.object({
					tipo: z.string(),
					score: z.number(),
					mensagem: z.string(),
					acaoRecomendada: z.string(),
					prioridade: z.enum(["baixa", "media", "alta"]),
				}),
			},
		),
});
