# ADR-005: Banco de Dados e Schema

## Metadata

| Campo | Valor |
|-------|-------|
| **ID** | ADR-005 |
| **Título** | Schema de Banco de Dados |
| **Status** | ✅ Aceito |
| **Data de Criação** | 2026-04-28 |
| **Autor** | Arquiteto de Software |
| **Dernière Update** | 2026-04-28 |

---

## Contexto

Este ADR define o schema completo do banco de dados para o OBRA360. Baseado no blueprint técnico, o sistema precisa armazenar:

- Obras e seus dados administrativos
- Usuários com perfis específicos
- Solicitações de materiais com fotos e voz
- Registro de ponto digital
- Fotos clasificadas por IA
- Diário de obras com clima
- Alertas e notificações
- Pedidos de compra
- Sync queue para offline

---

## Schema Prisma

### Decisão 1: Entidades Principais

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// USUÁRIOS E AUTENTICAÇÃO (Better Auth)
// ============================================================

model User {
  id              String    @id @default(cuid())
  nome           String
  email          String    @unique
  emailVerified  DateTime?
  imagem        String?
  
  // Campos OBRA360
  perfil         Perfil    @default(ENCARREGADO)
  encarregadoObraId String? @unique
  biometriaHash  String?
  ativo          Boolean  @default(true)
  
  // Better Auth
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Relations
  conta          Account[]
  session        Session[]
  
  // OBRA360 Relations
  obraEncarregado   Obra?          @relation("ObraEncarregado", fields: [encarregadoObraId], references: [id])
  solicitacoes   SolicitacaoMaterial[]
  diarios       DiarioObra[]
  fotos         Foto[]
  alertas       Alerta[]
  pontos        RegistroPonto[]
}

enum Perfil {
  ENCARREGADO
  COMPRAS
  GESTAO
}

// Better Auth Tables
model Session {
  id           String   @id @default(cuid())
  userId       String
  expiresAt    DateTime?
  token       String?  @unique
  ipAddress    String?
  userAgent   String?
  createdAt    DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider         String
  providerAccountId String
  refresh_token     String?  @db.Text
  access_token      String?  @db.Text
  expires_at       Int?
  token_type       String?
  scope            String?
  id_token         String?  @db.Text
  session_state   String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

// ============================================================
// OBRAS
// ============================================================

model Obra {
  id              String    @id @default(cuid())
  nome           String
  endereco       String?   @db.Text
  status         StatusObra   @default(PLANEJAMENTO)
  dataInicio    DateTime?
  dataPrevFim   DateTime?
  dataFim       DateTime?
  orcamentoTotal Decimal?  @db.Decimal(15, 2)
  orcamentoAtual Decimal?  @db.Decimal(15, 2)
  
  // Geolocalização
  geolocalizacao Json?
  
  // Timestamps
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletadoEm     DateTime?

  // Relations
  encarregado User?  @relation("ObraEncarregado", fields: [encarregadoId], references: [id])
  encarregadoId String?
  
  solicitacoes      SolicitacaoMaterial[]
  diarios           DiarioObra[]
  fotos             Foto[]
  alertas           Alerta[]
  pedidos          PedidoCompra[]
  pontos            RegistroPonto[]

  @@index([encarregadoId])
  @@index([status])
  @@index([deletadoEm])
}

enum StatusObra {
  PLANEJAMENTO
  EM_ANDAMENTO
  CONCLUIDO
  ARQUIVADO
}

// ============================================================
// SOLICITAÇÕES DE MATERIAIS
// ============================================================

model SolicitacaoMaterial {
  id            String              @id @default(cuid())
  obraId        String
  solicitanteId String
  
  item         String
  quantidade  Decimal             @db.Decimal(10, 3)
  unidade     String?              @default("un")
  urgencia    Urgencia             @default(NORMAL)
  observacao  String?              @db.Text
  
  // Mídia
  fotoUrl       String?
  obsVozUrl    String?
  
  // Status workflow
  status       StatusSolicitacao  @default(ABERTA)
  
  // Timestamps
  createdAt    DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletadoEm   DateTime?

  // Relations
  obra        Obra    @relation(fields: [obraId], references: [id])
  solicitante User    @relation(fields: [solicitanteId], references: [id])
  pedido     PedidoCompra?

  @@index([obraId])
  @@index([solicitanteId])
  @@index([status])
  @@index([urgencia])
  @@index([createdAt])
}

enum Urgencia {
  NORMAL
  URGENTE
  CRITICA
}

enum StatusSolicitacao {
  ABERTA
  EM_ANALISE
  EM_COTACAO
  APROVADA
  COMPRADA
  ENVIADA
  ENTREGUE
  CANCELADA
  REJEITADA
}

// ============================================================
// PEDIDOS DE COMPRA
// ============================================================

model PedidoCompra {
  id              String              @id @default(cuid())
  solicitacaoId   String
  fornecedorId   String?
  
  valorTotal    Decimal             @db.Decimal(15, 2)
  prazoEntrega DateTime?
  status       StatusPedido        @default(AGUARDANDO)
  
  // NF
  nfUrl         String?
  nfNumero     String?
  
  // Timestamps
  createdAt    DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  solicitacao SolicitacaoMaterial @relation(fields: [solicitacaoId], references: [id])
  fornecedor   Fornecedor?       @relation(fields: [fornecedorId], references: [id])

  @@index([solicitacaoId])
  @@index([fornecedorId])
  @@index([status])
}

enum StatusPedido {
  AGUARDANDO
  COTANDO
  APROVADO
  COMPRADO
  ENVIADO
  ENTREGUE
  CANCELADO
}

model Fornecedor {
  id          String   @id @default(cuid())
  nome       String
  cnpj        String?  @unique
  contato    String?
  telefone   String?
  email      String?
  endereco   String?
  prazoPadrao Int?     // Dias
  avaliacao  Int?     @default(5) // 1-5
  
  ativo      Boolean  @default(true)
  
  createdAt  DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  pedidos PedidoCompra[]

  @@index([ativo])
}

// ============================================================
// REGISTRO DE PONTO
// ============================================================

model RegistroPonto {
  id            String    @id @default(cuid())
  obraId        String
  encarregadoId String
  
  data         DateTime  @db.Date
  horaEntrada DateTime @db.Time
  horaSaida   DateTime? @db.Time
  
  // Equipe
  colaboradores Json?    // Array de {id, nome, horaEntrada, horaSaida}
  
  // Assinatura digital
  assinaturaUrl String?
  
  // Condições
  clima         String?  // "sol", "chuva", etc
  
  sincronizado Boolean   @default(false)
  syncError    String?
  
  createdAt    DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  obra        Obra  @relation(fields: [obraId], references: [id])
  encarregado User @relation(fields: [encarregadoId], references: [id])

  @@unique([obraId, data]) // Um registro por obra por dia
  @@index([obraId])
  @@index([data])
  @@index([encarregadoId])
  @@index([sincronizado])
}

// ============================================================
// DIÁRIO DE OBRA
// ============================================================

model DiarioObra {
  id          String    @id @default(cuid())
  obraId     String
  usuarioId  String
  
  data       DateTime  @db.Date
  
  // Conteúdo
  atividades   String?   @db.Text
  problemas   String?   @db.Text
  observacoes String?   @db.Text
  
  // Avanço
  avancoPct   Decimal?  @db.Decimal(5, 2)
  
  // Clima (capturado automaticamente)
  clima       Json?     // {temp, condicao, vento, umidade}
  
  sincronizado Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt  DateTime @updatedAt
  deletadoEm  DateTime?

  // Relations
  obra    Obra  @relation(fields: [obraId], references: [id])
  usuario User @relation(fields: [usuarioId], references: [id])

  @@unique([obraId, data])
  @@index([obraId])
  @@index([data])
  @@index([usuarioId])
}

// ============================================================
// FOTOS (com classificação IA)
// ============================================================

model Foto {
  id            String   @id @default(cuid())
  obraId       String
  usuarioId   String
  
  url         String
  thumbnail  String?
  
  // IA Classification
  etapaIa    EtapaObra?
  confiancaIa Decimal? @db.Decimal(5, 4)
 标签Ia      String?   // Tags extras
  
  // Metadata
  geolocalizacao Json?
  capturadaEm  DateTime @default(now())
  
  sincronizado Boolean @default(false)
  
  createdAt   DateTime @default(now())

  // Relations
  obra     Obra  @relation(fields: [obraId], references: [id])
  usuario  User  @relation(fields: [usuarioId], references: [id])

  @@index([obraId])
  @@index([etapaIa])
  @@index([capturadaEm])
}

enum EtapaObra {
  FUNDACAO
  ESTRUTURA
  ALVENARIA
  INSTALACOES
  ACABAMENTO
}

// ============================================================
// ALERTAS
// ============================================================

model Alerta {
  id          String       @id @default(cuid())
  obraId     String
  usuarioId  String?      // Quem criou (opcional)
  
  tipo       TipoAlerta
  origem     OrigemAlerta
  severidade Severidade
  
  titulo     String
  descricao String?     @db.Text
  
  // Dados extras (JSON)
  dados     Json?
  
  resolvido   Boolean     @default(false)
  resolvidoEm DateTime?
  resolucao  String?
  
  createdAt  DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  // Relations
  obra     Obra   @relation(fields: [obraId], references: [id])
  usuario  User?  @relation(fields: [usuarioId], references: [id])

  @@index([obraId])
  @@index([tipo])
  @@index([severidade])
  @@index([resolvido])
  @@index([createdAt])
}

enum TipoAlerta {
  FALTA_MATERIAL
  ATRASO
  INTERFERENCIA
  CUSTO
  PRAZO
  SINCRONIZACAO
  POVO
}

enum OrigemAlerta {
  USUARIO
  SISTEMA
  IA
}

enum Severidade {
  INFO
  AVISO
  ALERTA
  CRITICO
}

// ============================================================
// SYNC QUEUE (Offline-First)
// ============================================================

model SyncQueue {
  id          String     @id @default(cuid())
  entidade   String     // "obra", "solicitacao", etc
  entidadeId String
  
  operacao  OperacaoSync // CREATE, UPDATE, DELETE
  payload   Json       // Dados completos
  
  tentativas Int       @default(0)
  maxTentativas Int     @default(3)
  ultimaErro String?
  
  sincronizadoEm DateTime?
  createdAt   DateTime   @default(now())

  @@unique([entidade, entidadeId, operacao])
  @@index([sincronizadoEm])
  @@index([entidade])
  @@index([tentativas])
}

enum OperacaoSync {
  CREATE
  UPDATE
  DELETE
}

// ============================================================
// CACHE (para dados frequentemente lidos)
// ============================================================

model CacheEntry {
  key     String   @id @unique
  valor   Json
  expired DateTime?
  created DateTime @default(now())

  @@index([expired])
}
```

---

## Índices e Performance

### Decisão 2: Índices

| Tabela | Índice | Colunas | Tipo |
|--------|--------|---------|--------|
| Obra | idx_obra_encarregado | encarregadoId | B-Tree |
| Obra | idx_obra_status | status | B-Tree |
| Solicitacao | idx_sol_obra | obraId | B-Tree |
| Solicitacao | idx_sol_status | status | B-Tree |
| Solicitacao | idx_sol_urgencia | urgencia | B-Tree |
| Solicitacao | idx_sol_created | createdAt | B-Tree |
| Foto | idx_foto_obra_etapa | obraId, etapaIa | B-Tree |
| RegistroPonto | idx_ponto_data | data | B-Tree |
| DiarioObra | idx_diario_data | data | B-Tree |
| Alerta | idx_alerta_severidade | severidade | B-Tree |
| SyncQueue | idx_sync_pending | sincronizadoEm | B-Tree |

### Decisão 3: Migrations

```bash
# Criar migration inicial
bun run db:migrate --name init_schema

# Aplicar schema
bun run db:push

# Gerar client
bun run db:generate
```

---

## Estratégia de Dados Locais (Offline)

### Decisão 4: expo-sqlite Schema

Para offline-first, o schema local deve espelhar as entidades críticas:

```typescript
// apps/native/src/infrastructure/local/schema.ts
export const LOCAL_SCHEMA = `
-- Users (cache)
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  perfil TEXT NOT NULL,
  obra_id TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Obras
CREATE TABLE IF NOT EXISTS obra (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT,
  status TEXT DEFAULT 'PLANEJAMENTO',
  data_inicio TEXT,
  data_prev_fim TEXT,
  orcamento_total REAL,
  geolocalizacao TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT,
  sincronizado INTEGER DEFAULT 0
);

-- Solicitações
CREATE TABLE IF NOT EXISTS solicitacao_material (
  id TEXT PRIMARY KEY,
  obra_id TEXT NOT NULL,
  solicitante_id TEXT NOT NULL,
  item TEXT NOT NULL,
  quantidade REAL,
  unidade TEXT DEFAULT 'un',
  urgencia TEXT DEFAULT 'NORMAL',
  observacao TEXT,
  foto_url TEXT,
  obs_voz_url TEXT,
  status TEXT DEFAULT 'ABERTA',
  created_at TEXT,
  updated_at TEXT,
  sincronizado INTEGER DEFAULT 0
);

-- fotos
CREATE TABLE IF NOT EXISTS foto (
  id TEXT PRIMARY KEY,
  obra_id TEXT NOT NULL,
  url TEXT NOT NULL,
  etapa_ia TEXT,
  confianca_ia REAL,
  geolocalizacao TEXT,
  capturada_em TEXT,
  sincronizado INTEGER DEFAULT 0
);

-- registros_ponto
CREATE TABLE IF NOT EXISTS registro_ponto (
  id TEXT PRIMARY KEY,
  obra_id TEXT NOT NULL,
  data TEXT NOT NULL,
  hora_entrada TEXT,
  hora_saida TEXT,
  colaboradores TEXT,
  assinatura_url TEXT,
  sincronizado INTEGER DEFAULT 0
);

-- diario_obra
CREATE TABLE IF NOT EXISTS diario_obra (
  id TEXT PRIMARY KEY,
  obra_id TEXT NOT NULL,
  data TEXT NOT NULL,
  atividades TEXT,
  problemas TEXT,
  avanco_pct REAL,
  clima TEXT,
  sincronizado INTEGER DEFAULT 0
);

-- sync_queue
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  entidade TEXT NOT NULL,
  entidade_id TEXT NOT NULL,
  operacao TEXT NOT NULL,
  payload TEXT,
  tentativas INTEGER DEFAULT 0,
  ultima_erro TEXT,
  sincronizado_em TEXT,
  created_at TEXT
);
`;
```

---

## Check-list de Implementação

### Fase 1: Schema Base (✅ IMPLEMENTADO)
- [x] Criar schema.prisma completo
- [x]Executar migração inicial (db push)
- [x] Gerar Prisma Client

### Fase 2: Entidades OBRA360 (✅ IMPLEMENTADO)
- [x] Model Obra com geolocalização
- [x] Model SolicitacaoMaterial com urgência
- [x] Model RegistroPonto com equipe
- [x] Model DiarioObra com clima
- [x] Model Foto com classificação IA

### Fase 3: Compras (✅ IMPLEMENTADO)
- [x] Model PedidoCompra
- [x] Model Fornecedor

### Fase 4: Alertas (✅ IMPLEMENTADO)
- [x] Model Alerta com tipos
- [ ] Sistema de notificação

### Fase 5: Offline (✅ IMPLEMENTADO)
- [x] Schema expo-sqlite
- [x] SyncQueue model
- [x] Cache strategy

---

## Referências

- [Prisma ORM Documentation](https://prisma.io/docs)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- Blueprint técnico: obra360_blueprint.html

---

## Histórico de Alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-04-28 | Versão inicial do ADR | Arquiteto |
| 2026-04-28 | Adicionados models PedidoCompra e Fornecedor | Arquiteto |