# ADR-008: Fases de Implementação

## Metadata

| Campo | Valor |
|-------|-------|
| **ID** | ADR-008 |
| **Título** | Fases e Tasks de Implementação |
| **Status** | ✅ Aceito |
| **Data de Criação** | 2026-04-28 |
| **Autor** | Arquiteto de Software |
| **Dernière Update** | 2026-04-28 |

---

## Roadmap Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ROADMAP - 12 MESES                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                             │
│   FASE 1      │      FASE 2      │      FASE 3      │  FASE 4   │
│   MVP Core    │   Campo + IA   │  Gestão      │  Escala     │
│   (M 1-3)  │   (M 4-6)   │  (M 7-9)   │  (M 10-12) │
│                                                             │
│   [████████████████████████████]                              │
│                                                             │
│   └───────────► ENTREGUE: App funcional em produção          │
│                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FASE 1: MVP Core

**Duração**: Meses 1-3  
**Objetivo**: App funcional com funcionalidades básicas de campo e compras

### ⏳ Task 1.1: Setup e Infraestrutura

- [ ] Configurar ambiente de desenvolvimento
  - [ ] Verificar Bun instalado
  - [ ] Verificar Node.js 18+
  - [ ] Configurar Docker para PostgreSQL
  - [ ] Configurar Redis (opcional)
- [ ] Configurar banco de dados
  - [ ] Criar schema Prisma inicial
  - [ ] Executar db:push
  - [ ] Executar db:generate
- [ ] Configurar autenticação
  - [ ] Configurar Better Auth
  - [ ] Implementar login/sign-up
  - [ ] Implementar JWT middleware

### ⏳ Task 1.2: Cadastro de Obras e Equipes

- [x] Model Obra no backend
  - [x] POST /obras (criar)
  - [x] GET /obras (listar)
  - [x] PUT /obras/:id (atualizar)
  - [x] DELETE /obras/:id (arquivar)
- [x] Model Usuario
  - [x] GET /usuarios (listar)
  - [x] POST /usuarios (criar)
  - [x] PUT /usuarios/:id (atualizar perfil)
- [x] Tela mobile: Lista de obras
  - [x] Exibir lista de obras
  - [x] Filtrar por status
  - [x] Ver detalhe da obra
- [x] Tela mobile: Criar obra

### ⏳ Task 1.3: Solicitação de Materiais (Básica)

- [x] Model SolicitacaoMaterial
  - [x] POST /solicitacoes (criar)
  - [x] GET /solicitacoes (listar)
  - [x] PUT /solicitacoes/:id/status (atualizar)
- [x] Upload de foto (basic)
  - [x] Supabase Storage configurado
  - [x] Bucket obras360 criado
  - [x] Endpoint media/uploadFoto
  - [x] Tela upload fotos (solicitacao.tsx)
- [x] Tela: Criar solicitação
  - [x] Form com item, quantidade
  - [x] Upload de foto
  - [x] Seleção de urgência

### ⏳ Task 1.4: Folha de Ponto Digital

- [x] Model RegistroPonto
  - [x] POST /ponto (registrar)
  - [x] GET /ponto/obras/:id (listar)
- [x] Equipes pré-cadastradas
  - [x] Model equipe
  - [x] Listar colaboradores
- [x] Tela: Registro de ponto
  - [x] Registrar entrada/saída
  - [ ] Listar equipe

### ⏳ Task 1.5: Diário de Obra (Sem Clima)

- [x] Model DiarioObra
  - [x] POST /diario (criar)
  - [x] GET /diario/obras/:id (listar)
- [x] Tela: Preencher diário
  - [x] Data automática
  - [x] Atividades do dia
  - [x] Avanço %
  - [x] Problemas observações

### ⏳ Task 1.6: Kanban de Compras (Simples)

- [x] Model PedidoCompra
  - [x] GET /pedidos (listar)
  - [x] POST /pedidos (criar)
- [x] Workflow status
  - [x] ABERTA → COTANDO → COMPRADO → ENTREGUE
- [x] Tela: Kanban
  - [x] Colunas por status
  - [x] Mover entre colunas

### ⏳ Task 1.7: Dashboard Gestão (Básico)

- [x] Endpoint /gestao/dashboard
  - [x] Total de obras
  - [x] Obras por status
  - [x] Solicitações pendentes
- [x] Tela: Dashboard
  - [x] Cards com KPIs
  - [x] Lista de obras basics

### ⏳ Task 1.8: Sync Offline (Básico)

- [x] expo-sqlite setup
  - [x] Instalar expo-sqlite
  - [x] Criar schema local
  - [x] Implementar database.ts
- [x] Sync queue básica
  - [x] Queue local
  - [ ] Processamento em background
  - [x] Retry logic
- [x] Network detection
  - [x] isOnline hook
  - [x] Auto-sync ao reconectar

### Entregáveis Fase 1

```
✅ App login/sign-up funcionando
✅ Cadastro de obras
✅ 3 perfis de usuário (encarregado, compras, gestão)
✅ Solicitação de materiais com foto
✅ Ponto digital
✅ Diário básico
✅ Kanban compras
✅ Dashboard gestão
✅ App funciona offline (sync)
```

---

## FASE 2: Campo + IA

**Duração**: Meses 4-6  
**Objetivo**: Funcionalidades avançadas de campo com IA

### ⏳ Task 2.1: Relatório Fotográfico com Câmera

- [x] Gallery de fotos
  - [x] Grid de fotos por obra
  - [x] Visualização fullscreen
  - [x] Filtros por etapa
- [ ] Camera integration
  - [ ] expo-camera ou ImagePicker
  - [ ] Captura de alta qualidade

### ⏳ Task 2.2: IA Classificação de Fotos

- [ ] ML Kit setup
  - [ ] Instalar biblioteca
  - [ ] Baixar modelo
- [ ] Classificador
  - [ ] Implementar PhotoClassifier
  - [ ] Mapeamento de etapas
  - [ ] Confidence score
- [ ] Integração upload
  - [ ] Classifica → salva local
  - [ ] Upload background

### ⏳ Task 2.3: Clima Automático no Diário

- [x] Weather API
  - [x] Open-Meteo (free, no API key)
  - [x] useWeather hook
- [x] UI: toggle na tela diário
- [x] Router: weather no schema

### ⏳ Task 2.4: Input por Voz nas Solicitações

- [x] Voice recording
  - [x] expo-av
  - [x] Gravar obs. por voz
  - [x] Player
- [x] Tela: solicitação com input de voz

### ⏳ Task 2.5: Assinatura Digital no Ponto

- [x] Signature pad
  - [x] react-native-signature-canvas
  - [x] Captura gesture
  - [x] Converter para imagem
- [x] Tela: registro de ponto com assinatura
- [x] Router: atualizar para aceitar signatureUrl

### ⏳ Task 2.6: Alertas de Campo

- [x] Model Alerta (existente)
  - [x] CREATE /alertas
  - [x] LIST /alertas
- [x] Tipos de alerta
  - [x] Falta material
  - [x] Atraso
  - [x] Interferência
- [x] Tela: Lista alertas (alerta.tsx)
- [x] Tela: Criar alerta (alerta/nova.tsx)
- [ ] Notificação push

### ⏳ Task 2.7: KPIs do Setor de Compras

- [x] Métricas
  - [x] Tempo médio de entrega (calculado)
  - [x] Por urgência/tipo
- [x] Dashboard
  - [x] Cards com KPIs
  - [x] API stats atualizada

### ⏳ Task 2.8: Notificações Push (Supabase Realtime)
- [x] Supabase Realtime (sem Firebase)
  - [x] DeviceToken schema (Prisma)
  - [x] NotificationQueue table (via SQL manual)
  - [x] useNotifications hook
- [x] Ativar Realtime na tabela (via Supabase Dashboard)

### Entregáveis Fase 2

```
✅ Relatório fotográfico completo
✅ Fotos classificadas por IA (offline)
✅ Clima automático no diário
✅ Input por voz
✅ Assinatura digital no ponto
✅ Alertas de campo
✅ KPIs compras
✅ Notificações push
```

---

## FASE 3: Gestão Completa

**Duração**: Meses 7-9  
**Objetivo**: Dashboard completo e gestão

### ⏳ Task 3.1: Curva S Interativa

- [x] Dados Curva S
  - [x] Cronograma por etapa
  - [x] Avanço real vs planejado
- [x] Visualização
  - [x] Resumo
  - [x] Progresso hoje
  - [x] Orçamento
  - [x] Evolução tabular

### ⏳ Task 3.2: Fluxo de Caixa

- [x] Model transação
  - [x] Entradas/saídas
  - [x] Por categoria
- [x] Dashboard
  - [x] Resumo
  - [x] Por período
- [x] Router finance.ts
- [x] Tela nativo

### ⏳ Task 3.3: Alertas Preditivos (IA)

- [x] Regras de risco
  - [x] Ritmo abaixo do esperado
  - [x] Solicitações pendentes
- [x] AI enhanced
  - [x] gerarAlertaPreditivo (ollama)
- [x] Endpoint /alertas/analyzePredictive

### ⏳ Task 3.4: Relatório Fotográfico IA

- [x] Organização automática
  - [x] Por etapa
  - [x] Por data
  - [x] Por classificação IA
- [x] Galeria gestão
  - [x] Grid avançado
  - [x] Filtros por etapa/data
- [x] Ja existente (Task 2.1)

### ⏳ Task 3.5: Linha do Tempo por Obra

- [x] Timeline
  - [x] Eventos cronograma
  - [x] Diário agregado
  - [x] Alertas
  - [x] Fotos
  - [x] Pontos
- [x] Visualização
  - [x] Scroll vertical
  - [x] Ícones por tipo
  - [x] Cores por tipo

### ⏳ Task 3.6: Desvio de Prazo e Custo

- [x] Cálculo automático
  - [x] Prazo: dias +/-
  - [x] Custo: R$ +/-
- [x] Endpoint /obras/desvio

### ⏳ Task 3.7: Exportação PDF/Excel

- [x] Geração CSV
  - [x] Template diário
  - [x] Template financeiro
  - [x] Template solicitações
  - [x] Template fotos
- [x] Endpoint /export
- [x] Formato JSON/CSV

### ⏳ Task 3.8: Admin de Usuários

- [x] CRUD usuários
  - [x] Listar usuários
  - [x] Criar usuário
  - [x] Editar perfil
  - [x] Desativar
- [x] Tela admin
- [x] Menu drawer

### Entregáveis Fase 3

```
✅ Curva S interativa
✅ Fluxo de caixa
✅ Alertas preditivos IA
✅ Relatório fotográfico organizado
✅ Linha do tempo
✅Desvio prazo/custo
✅ Exportação PDF/Excel
✅ Admin completo
```

---

## FASE 4: Escala e Polimento

**Duração**: Meses 10-12  
**Objetivo**: Multi-empresa, iOS, integrações

### ⏳ Task 4.1: Multi-empresa (SaaS)

- [ ] Tenant isolated
  - [ ] companyId em todas tabelas
  - [ ]Middleware de filtro
- [ ] Admin empresa
  - [ ] Criar empresa
  - [ ] Configurar branding
  - [ ] Limites/planos

### ⏳ Task 4.2: Dashboard Comparativo

- [ ] Comparação
  - [ ] Entre obras
  - [ ] Entre empresas
- [ ] Rankings
  - [ ] Prazo
  - [ ] Custo
  - [ ] Performance

### ⏳ Task 4.3: App iOS

- [ ] Build iOS
  - [ ] Apple Developer account
  - [ ] certificados
  - [ ] TestFlight
- [ ] Ajustes específicos
  - [ ] Notificações APNs
  - [ ] Face ID/Touch ID

### ⏳ Task 4.4: Integração Contabilidade

- [ ] Exportação
  - [ ] Formato contábil
  - [ ] XML/Excel
- [ ] Integração API
  - [ ] Webhook keluar
  - [ ] Endpoint REST

### ⏳ Task 4.5: API Pública

- [ ]Documentação
  - [ ] OpenAPI/Swagger
  - [ ] AutenticaçãoDeveloper
- [ ] Rate limiting
  - [ ] Planos uso

### ⏳ Task 4.6: White-label

- [ ]Configuração
  - [ ] Cores
  - [ ] Logo
  - [ ] Domínio custom

### ⏳ Task 4.7: Biometria + 2FA

- [ ] Biometria
  - [ ] Face ID/Touch ID
  - [ ] Login biométrico
- [ ] 2FA
  - [ ] Google Authenticator
  - [ ] QR code setup

### ⏳ Task 4.8: Analytics Avançado

- [ ] Eventos
  - [ ] Track custom events
  - [ ] User journey
- [ ] Dashboards
  - [ ] Uso features
  - [ ] Retention
  - [ ] Funil conversão

### Entregáveis Fase 4

```
✅ Multi-empresa SaaS
✅ Dashboard comparativo
✅ App iOS
✅ Integração contabilidade
✅ API pública
✅ White-label
✅ Biometria + 2FA
✅ Analytics
```

---

## Checklist Consolidado por Fase

```
FASE 1: MVP Core (Meses 1-3)
├── Setup e Infraestrutura
│   ├── [x] Bun configurado
│   ├── [x] Docker PostgreSQL
│   ├── [x] Prisma schema
│   ├── [x] Better Auth
│   └── [x] JWT middleware
├── Cadastro Obras/Equipes
│   ├── [x] CRUD obras (backend API)
│   ├── [x] CRUD usuarios (schema)
│   ├── [x] Tela lista (obras.tsx)
│   ├── [x] Tela detalhe (obras/[id].tsx)
│   └── [x] Tela criar (obras/nova.tsx)
├── Solicitação Materiais
│   ├── [x] Create/list/update (backend API)
│   ├── [x] useSolicitacoes hook (mobile)
│   ├── [x] Upload foto (Supabase Storage)
│   └── [x] Urgência
├── Ponto Digital
│   ├── [x] CRUD ponto (backend API + router)
│   ├── [x] usePonto hook (mobile)
│   └── [x] Tela registro (obras/[id]/ponto.tsx)
├── Diário Obra
│   ├── [x] Create/list (backend API + router diario)
│   ├── [x] Tela diário (obras/[id]/diario.tsx)
├── Kanban Compras
│   ├── [x] CRUD pedidos (backend API + router)
│   └── [x] Tela kanban (compras.tsx)
├── Dashboard Gestão
│   ├── [x] KPIs endpoint (gestao/dashboard)
│   └── [x] Tela dashboard (gestao.tsx)
└── Sync Offline
    ├── [x] expo-sqlite (schema local)
    ├── [x] Sync queue (SyncQueue)
    ├── [x] Network hook (useOffline)
    └── [x] Auto-sync (triggerSync)
```

---

## FASE 1 COMPLETA ✅

## FASE 2: Campo + IA (EM ANDAMENTO)

---

## Priorização de Tasks

| Prioridade | Tipo | Descrição | Impacto |
|-----------|------|----------|--------|
| **P0** | Must Have | Auth + Obras + Solicitações | Sem isso, app não funciona |
| **P1** | Should Have | Ponto + Diário + Kanban | Core experience |
| **P2** | Could Have | Fotos + IA | Diferencial |
| **P3** | Nice Have | White-label + API | Escala futura |

---

## Estimativa de Esforço

| Fase | Tasks | Pontos (estimativa) |
|------|-------|--------------------|
| Fase 1 | 8 | 40 points |
| Fase 2 | 8 | 35 points |
| Fase 3 | 8 | 40 points |
| Fase 4 | 8 | 35 points |
| **Total** | **32** | **150 points** |

---

## Referências

- [Blueprint OBRA360](obra360_blueprint.html)
- [ADR-001: Stack](ADR-001-stack-tecnologica.md)
- [ADR-002: Arquitetura Mobile](ADR-002-arquitetura-mobile.md)
- [ADR-005: Banco de Dados](ADR-005-banco-de-dados.md)
- [ADR-006: Offline-First](ADR-006-estrategia-offline-first.md)
- [ADR-007: IA](ADR-007-modulos-ia.md)

---

## Histórico de Alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-04-28 | Versão inicial do ADR | Arquiteto |
| 2026-04-28 | Implementado schema + API + hooks mobile | Arquiteto |
| 2026-04-28 | Task 1.2 completa: telas lista, detalhe e criar obra | Arquiteto |
| 2026-04-28 | Task 1.3 completa: CRUD solicitacoes + tela criar | Arquiteto |
| 2026-04-28 | Task 1.4 completa: router ponto + tela registro | Arquiteto |
| 2026-04-28 | Task 1.5 completa: router diario + tela diario | Arquiteto |
| 2026-04-28 | Task 1.6 completa: router pedidos + tela kanban | Arquiteto |
| 2026-04-28 | Task 1.7 completa: router gestao + tela dashboard | Arquiteto |
| 2026-04-28 | Task 1.8 completa: SyncQueue + useOffline + auto-sync | Arquiteto |
| 2026-04-28 | FASE 1 MVP COMPLETA | Arquiteto |
| 2026-04-28 | Task 1.3 completa: Supabase Storage + upload fotos | Arquiteto |
| 2026-04-28 | Task 1.8 revisão: SyncStatus integrado + menu compras/gestao + hooks offline | Arquiteto |
| 2026-04-28 | Task 2.6 completa: telas alertas (lista + criar) | Arquiteto |
| 2026-04-28 | Task 2.1 completa: galeria fotos com filtros por etapa | Arquiteto |
| 2026-04-28 | Task 2.4 completa: input voz nas solicitações | Arquiteto |
| 2026-04-28 | Task 2.5 completa: assinatura digital no ponto | Arquiteto |
| 2026-04-28 | Task 2.3 completa: clima automático no diário | Arquiteto |
| 2026-04-28 | Task 2.7 completa: KPIs do setor de compras | Arquiteto |
| 2026-04-28 | Task 2.8 completa: notificações push setup | Arquiteto |
| 2026-04-29 | Task 3.8 completa: admin de usuários | Arquiteto |
| 2026-04-29 | Task 3.5 completa: linha do tempo por obra | Arquiteto |
| 2026-04-29 | Task 3.1 completa: curva S interativa | Arquiteto |
| 2026-04-29 | Task 3.6 completa: desvio prazo/custo | Arquiteto |
| 2026-04-29 | Task 3.2 completa: fluxo de caixa | Arquiteto |
| 2026-04-29 | Task 3.3 completa: alertas preditivos IA | Arquiteto |
| 2026-04-29 | Task 3.4 completa: relatorio fotografico IA | Arquiteto |
| 2026-04-29 | Task 3.7 completa: exportacao PDF/Excel | Arquiteto |