import { generateText } from "ai";
import { createOllama } from "ollama-ai-provider-v2";

const OLLAMA_URL = process.env.OLLAMA_URL;
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const VISION_MODEL =
	process.env.OLLAMA_VISION_MODEL ||
	process.env.OLLAMA_MODEL ||
	"qwen3.5:latest";
const TEXT_MODEL =
	process.env.OLLAMA_TEXT_MODEL || process.env.OLLAMA_MODEL || "gpt-oss:latest";

if (!OLLAMA_URL || !OLLAMA_API_KEY) {
	throw new Error("OLLAMA_URL and OLLAMA_API_KEY must be configured");
}

export const ollama = createOllama({
	baseURL: OLLAMA_URL,
	headers: {
		Authorization: `Bearer ${OLLAMA_API_KEY}`,
	},
});

export const visionModel = ollama(VISION_MODEL);
export const textModel = ollama(TEXT_MODEL);

export interface ClassificacaoFotoResult {
	etapa: string;
	confianca: number;
	descricao: string;
	tags: string[];
}

export async function classificarFoto(
	imageUrl: string,
): Promise<ClassificacaoFotoResult> {
	const prompt = `Você é um especialista em classificação de obras civis.
Analise esta foto de uma obra e determine:
1. Etapa: Uma das opções: FUNDACAO, ESTRUTURA, ALVENARIA, INSTALACOES, ACABAMENTO
2. Confiança: Um número de 0 a 1
3. Descrição: Breve descrição do que види na foto
4. Tags: Array de tags relevantes como Fundação, Concreto, Alvenaria, Elétrica, Hidráulica, etc.

Responda em JSON válido com este formato:
{
  "etapa": "ETAPA_IDENTIFICADA",
  "confianca": 0.0-1.0,
  "descricao": "texto",
  "tags": ["tag1", "tag2"]
}`;

	const { text } = await generateText({
		model: visionModel,
		prompt,
		providerOptions: {
			ollama: {
				images: [imageUrl],
			},
		},
	});

	try {
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			return JSON.parse(jsonMatch[0]);
		}
	} catch {
		// Se falhar, retorna estrutura básica
	}

	return {
		etapa: "ALVENARIA",
		confianca: 0.5,
		descricao: "Foto de obra",
		tags: [],
	};
}

export interface AnaliseProgressoResult {
	desvioDias: number;
	desvioCusto: number;
	alertaNivel: "verde" | "amarelo" | "vermelho";
	acaoRecomendada: string;
	insights: string[];
}

export async function analisarProgresso(params: {
	nome: string;
	dataInicio: string;
	dataPrevFim: string;
	avancoPct: number;
	cronograma: { etapa: string; dataPrevista: string; dataReal?: string }[];
}): Promise<AnaliseProgressoResult> {
	const prompt = `Você é um especialista em gestão de obras civis.
Analise os dados da obra "${params.nome}":
- Início: ${params.dataInicio}
- Previsão término: ${params.dataPrevFim}
- Avanço atual: ${params.avancoPct}%
- Cronograma: ${JSON.stringify(params.cronograma)}

Calcule:
1. Desvio em dias (positivo = atraso)
2. Desvio de custo estimado (% do orçamento)
3. Nível de alerta:
   - verde: no prazo ou até 7 dias atraso
   - amarelo: 8-21 dias atraso
   - vermelho: +21 dias atraso
4. Ação recomendada
5. Insights (array de observações)

Responda em JSON:
{
  "desvioDias": number,
  "desvioCusto": number,
  "alertaNivel": "verde"|"amarelo"|"vermelho",
  "acaoRecomendada": "texto",
  "insights": ["insight1", "insight2"]
}`;

	const { text } = await generateText({
		model: textModel,
		prompt,
	});

	try {
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			return JSON.parse(jsonMatch[0]);
		}
	} catch {
		// Fallback
	}

	return {
		desvioDias: 0,
		desvioCusto: 0,
		alertaNivel: "verde",
		acaoRecomendada: "Continuar monitoramento",
		insights: [],
	};
}

export interface AlertaPreditivoResult {
	tipo: string;
	score: number;
	mensagem: string;
	acaoRecomendada: string;
	prioridade: "baixa" | "media" | "alta";
}

export async function gerarAlertaPreditivo(params: {
	obraNome: string;
	diariosUltimos30Dias: number;
	solicitacoesPendentes: number;
	avancoMedio7Dias: number;
	avancoEsperado7Dias: number;
}): Promise<AlertaPreditivoResult> {
	const prompt = `Você é um especialista em gestão de riscos de obras.
Analise os indicadores da obra "${params.obraNome}":
- Diários registrados (30 dias): ${params.diariosUltimos30Dias}
- Solicitações pendentes: ${params.solicitacoesPendentes}
- Avanço médio (7 dias): ${params.avancoMedio7Dias}%
- Avanço esperado (7 dias): ${params.avancoEsperado7Dias}%

Identifique riscos e gere um alerta preditivo.

Responda em JSON:
{
  "tipo": "TIPO_ALERTA",
  "score": 0.0-1.0,
  "mensagem": "descrição do risco",
  "acaoRecomendada": "o que fazer",
  "prioridade": "baixa"|"media"|"alta"
}`;

	const { text } = await generateText({
		model: textModel,
		prompt,
	});

	try {
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			return JSON.parse(jsonMatch[0]);
		}
	} catch {
		// Fallback
	}

	return {
		tipo: "MONITORAMENTO",
		score: 0.3,
		mensagem: "Monitorar indicadores",
		acaoRecomendada: "Continuar acompanhamento",
		prioridade: "baixa",
	};
}
