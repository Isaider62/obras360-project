# ADR-007: Módulos de Inteligência Artificial

## Metadata

| Campo | Valor |
|-------|-------|
| **ID** | ADR-007 |
| **Título** | Módulos de IA do OBRA360 |
| **Status** | ✅ Aceito |
| **Data de Criação** | 2026-04-28 |
| **Autor** | Arquiteto de Software |
| **Dernière Update** | 2026-04-28 |

---

## Contexto

Este ADR define os 4 módulos de inteligência artificial do OBRA360. Cada módulo resolve um problema real da gestão de obras, não são gimmick:

1. **Classificação de Fotos** (on-device): O encarregado fotografa, a IA classifica a etapa
2. **Análise de Progresso**: Compara cronograma vs execução em tempo real
3. **Alertas Preditivos**: Detecta padrões de risco antes que virem problemas
4. **Organização de Fotos**: Organize automatically por etapa, data e tipo

---

## Decisões de IA

### Decisão 1: Stack de IA

| Módulo | Provider | Tipo | Status |
|--------|----------|------|--------|
| **Classificação fotos** | Ollama (qwen3.5) | Cloud | ✅ IMPLEMENTADO |
| **Análise progresso** | Ollama (gpt-oss) | Cloud | ✅ IMPLEMENTADO |
| **Alertas preditivos** | Ollama (gpt-oss) | Cloud | ✅ IMPLEMENTADO |
| **Organização fotos** | Ollama | Cloud | ✅ IMPLEMENTADO |

### Decisão 1b: Provedor Ollama

| Configuração | Valor |
|------------|-------|
| **Provider** | ollama-ai-provider-v2 |
| **Vision Model** | qwen3.5:latest |
| **Text Model** | gpt-oss:latest |

---

## Módulo 1: Classificação de Fotos (On-Device)

### Decisão 2: ML Kit

```typescript
// apps/native/src/infrastructure/ai/PhotoClassifier.ts
import { runOnDeviceModel, classifyImage } from "@react-native-google-mlkit/image-labeling";
import type { EtapaObra } from "@obras360-project/api";

export type EtapaClassificada = 
  | "FUNDACAO"
  | "ESTRUTURA"
  | "ALVENARIA"
  | "INSTALACOES"
  | "ACABAMENTO";

interface ClassificacaoResultado {
  etapa: EtapaClassificada;
  confianca: number;
  rotulos: { nome: string; confianca: number }[];
}

export class PhotoClassifier {
  private model: ImageLabeler;

  async initialize() {
    this.model = await runOnDeviceModel({
      modelType: ImageLabelerModelType.XLarge,
      labels: [
        "Fundação", "Estaques", "Radier", "Viga baldrame",
        "Pilares", "Vigas", "Laje", "Concreto",
        "Alvenaria", "Blocos", "Tijolos", "Argamassa",
        "Elétrica", "Hydraulica", "Tubulação", "Fiação",
        "Pintura", "Cerâmica", "Porcelanato", "Gesso"
      ],
    });
  }

  async classificar(uri: string): Promise<ClassificacaoResultado> {
    const labels = await classifyImage(uri, this.model);
    
    // Mapeia labels para etapa
    const etapa = this.mapearEtapa(labels);
    const confianca = Math.max(...labels.map((l) => l.confidence));
    
    return {
      etapa,
      confianca,
      rotulos: labels.map((l) => ({
        nome: l.name,
        confianca: l.confidence,
      })),
    };
  }

  private mapearEtapa(labels: { name: string; confidence: number }[]): EtapaClassificada {
    const scores = {
      FUNDACAO: 0,
      ESTRUTURA: 0,
      ALVENARIA: 0,
      INSTALACOES: 0,
      ACABAMENTO: 0,
    };

    // weights por label
    const weights: Record<string, keyof typeof scores> = {
      "Fundação": "FUNDACAO",
      "Estaques": "FUNDACAO",
      "Radier": "FUNDACAO",
      "Viga baldrame": "FUNDACAO",
      "Pilares": "ESTRUTURA",
      "Vigas": "ESTRUTURA",
      "Laje": "ESTRUTURA",
      "Concreto": "ESTRUTURA",
      "Alvenaria": "ALVENARIA",
      "Blocos": "ALVENARIA",
      "Tijolos": "ALVENARIA",
      "Argamassa": "ALVENARIA",
      "Elétrica": "INSTALACOES",
      "Hidraulica": "INSTALACOES",
      "Tubulação": "INSTALACOES",
      "Fiação": "INSTALACOES",
      "Pintura": "ACABAMENTO",
      "Cerâmica": "ACABAMENTO",
      "Porcelanato": "ACABAMENTO",
      "Gesso": "ACABAMENTO",
    };

    for (const label of labels) {
      const etapa = weights[label.name];
      if (etapa) {
        scores[etapa] += label.confidence;
      }
    }

    // Retorna etapa com maior score
    return Object.entries(scores).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0] as EtapaClassificada;
  }
}

export const photoClassifier = new PhotoClassifier();
```

### Integração com Upload

```typescript
// Fluxo: photo -> ML Kit -> save local -> upload background
async function processarFoto(uri: string, obraId: string) {
  // 1. Classifica on-device (offline!)
  const resultado = await photoClassifier.classificar(uri);
  
  // 2. Salva local com classificação
  await fotoRepository.create({
    obraId,
    url: uri,
    etapaIa: resultado.etapa,
    confiancaIa: resultado.confianca,
  });

  // 3. Upload em background (quando online)
  if (await isOnline()) {
    await uploadFotoAsync(uri, {
      metadata: {
        etapaIa: resultado.etapa,
        confiancaIa: resultado.confianca,
      },
    });
  }
}
```

---

## Módulo 2: Análise de Progresso

### Decisão 3: AI Cloud

```typescript
// apps/server/src/services/analise-progresso.service.ts
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

interface DadosObra {
  id: string;
  nome: string;
  dataInicio: string;
  dataPrevFim: string;
  cronograma: { etapa: string; dataPrevista: string; dataReal?: string }[];
  avancoPct: number;
}

interface AnaliseResultado {
  desvioDias: number;
  desvioCusto: number;
  recomendadaAcao: string;
  alertaNivel: "verde" | "amarelo" | "vermelho";
}

export async function analisarProgresso(obra: DadosObra): Promise<AnaliseResultado> {
  const prompt = `
    Você é um especialista em gestão de obras civis.
    
    Analise os dados da obra "${obra.nome}":
    - Início: ${obra.dataInicio}
    - Previsão término: ${obra.dataPrevFim}
    - Avanço atual: ${obra.avancoPct}%
    - Cronograma: ${JSON.stringify(obra.cronograma)}
    
    Calcule:
    1. Desvio em dias (positivo = atraso)
    2. Desvio de custo estimado
    3. Nível de alerta (verde: no prazo, amarelo: até 15 dias atraso, vermelho: +15 dias)
    4. Ação recomendada
    
    Responda em JSON com: { desvioDias, desvioCusto, alertaNivel, recomendadaAcao }
  `;

  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt,
  });

  return JSON.parse(text);
}
```

---

## Módulo 3: Alertas Preditivos

### Decisão 4: Sistema de Alertas

```typescript
// apps/server/src/services/alerta-preditivo.service.ts
import { db } from "@obras360-project/db";

interface IndicadorRisco {
  tipo: string;
  score: number; // 0-1
  mensagem: string;
  acaoRecomendada: string;
}

export async function verificarRiscos(obraId: string): Promise<IndicadorRisco[]> {
  const riscos: IndicadorRisco[] = [];

  // 1. Verifica ritmo de avanço
  const diarioUltimos30Dias = await db.diarioObra.findMany({
    where: {
      obraId,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { data: "desc" },
  });

  if (diarioUltimos30Dias.length < 15) {
    riscos.push({
      tipo: "ATRASO_REGISTRO",
      score: 1 - (diarioUltimos30Dias.length / 15),
      mensagem: `Apenas ${diarioUltimos30Dias.length} dias registrados nos últimos 30 dias`,
      acaoRecomendada: "Verificar se obra tem atualização do campo",
    });
  }

  // 2. Verifica solicitações pendentes
  const solicitacoesPendentes = await db.solicitacaoMaterial.count({
    where: {
      obraId,
      status: { in: ["ABERTA", "EM_ANALISE"] },
      createdAt: { lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    },
  });

  if (solicitacoesPendentes > 5) {
    riscos.push({
      tipo: "COMPRAS_PARADAS",
      score: Math.min(solicitacoesPendentes / 10, 1),
      mensagem: `${solicitacoesPendentes} solicitações pendentes há mais de 3 dias`,
      acaoRecomendada: "Verificar situação das compras",
    });
  }

  // 3. Verifica avanço vs cronograma
  // (implementar lógica comparando cronograma com diário)
  // ...

  // 4. AI enhanced (opcional)
  if (riscos.length > 0 && process.env.GOOGLE_AI_KEY) {
    const analise = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: `Analise os seguintes indicadores de risco:\n${JSON.stringify(riscos)}\n\nListe em ordem de prioridade e adicione insights.`,
    });
    // Adicionar insights da IA
  }

  return riscos;
}
```

---

## Módulo 4: Organização de Fotos (Cloud)

### Decisão 5: Vision API

```typescript
// apps/server/src/services/vision.service.ts
import { ImageAnnotatorClient } from "@google-cloud/vision";

const visionClient = new ImageAnnotatorClient();

interface FotoMetadata {
  labels: { descricao: string; score: number }[];
  objetos: { nome: string; score: number }[];
  texto?: string;
}

export async function analisarFoto(url: string): Promise<FotoMetadata> {
  const [result] = await visionClient.annotateImage({
    image: { source: { imageUri: url } },
    features: [
      { type: "LABEL_DETECTION", maxResults: 10 },
      { type: "OBJECT_LOCALIZATION", maxResults: 10 },
      { type: "TEXT_DETECTION" },
    ],
  });

  return {
    labels: (result.labelAnnotations || []).map((l) => ({
      descricao: l.description || "",
      score: l.score || 0,
    })),
    objetos: (result.objectAnnotations || []).map((o) => ({
      nome: o.name || "",
      score: o.score || 0,
    })),
    texto: result.textAnnotations?.[0]?.description,
  };
}
```

---

## Integração Mobile

### Decisão 6: Hook de IA no Mobile

```typescript
// apps/native/src/presentation/hooks/usePhotoAI.ts
import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { photoClassifier } from "~/infrastructure/ai/PhotoClassifier";

export function usePhotoAI() {
  const [classificando, setClassificando] = useState(false);

  const classificarFoto = useCallback(async (uri: string) => {
    setClassificando(true);
    try {
      const resultado = await photoClassifier.classificar(uri);
      return resultado;
    } finally {
      setClassificando(false);
    }
  }, []);

  const capturarEClassificar = useCallback(async () => {
    const { assets } = await ImagePicker.launchCameraAsyncAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!assets?.[0]?.uri) return null;

    return classificarFoto(assets[0].uri);
  }, [classificarFoto]);

  return {
    classificarFoto,
    capturarEClassificar,
    classificando,
  };
}
```

---

## Custos Estimados

### Decisão 7: Precificação

| Serviço | Uso Estimado | Custo Mensal |
|----------|-----------|------------|
| **ML Kit** (on-device) | Ilimitado | $0 |
| **Gemini 2.0 Flash** | 10k requisições/mês | ~$0 |
| **Google Vision API** | 1k fotos/mês | ~$1.50 |
| **AI SDK** | - | Included |

---

## Check-list de Implementação

### Módulo 1: Classificação de Fotos (✅ IMPLEMENTADO)
- [x] Configurar Ollama provider v2
- [x] Implementar ai.service.ts com classificarFoto()
- [x] Criar router /ai/classificarFoto
- [x] Integrar com Supabase Storage

### Módulo 2: Análise de Progresso (✅ IMPLEMENTADO)
- [x] Configurar AI SDK com Ollama
- [x] Implementar analiseProgresso() no ai.service.ts
- [x] Criar endpoint /ai/analisarProgresso
- [ ] Integrar com dashboard gestão (futuro)

### Módulo 3: Alertas Preditivos (✅ IMPLEMENTADO)
- [x] Implementar gerarAlertaPreditivo() no ai.service.ts
- [x] Criar endpoint /ai/gerarAlertaPreditivo
- [ ] Configurar cron job (futuro)

### Módulo 4: Organização de Fotos (✅ IMPLEMENTADO)
- [x] Implementar visão por etapa/data (filtros por etapa + data)
- [x] Criar galeria com grid (fotos.tsx)
- [x] Integrar classificação IA na galeria (botão classificar)
- [x] Filtros avançados (HOJE, SEMANA, MES)

---

## Histórico de Alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-04-28 | Versão inicial do ADR | Arquiteto |
| 2026-04-28 | Atualizado para usar Ollama provider v2 | Arquiteto |
| 2026-04-28 | Implementado ai.service.ts + router ai.ts com 3 endpoints | Arquiteto |
| 2026-04-28 | Configurado Ollama com modelos qwen3.5 e gpt-oss | Arquiteto |
| 2026-04-28 | Módulo 4 completo: galeria fotos com filtros + classificação IA | Arquiteto |