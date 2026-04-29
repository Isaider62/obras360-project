# Documentação OBRA360

## Visão Geral

Este diretório contém a documentação técnica do projeto OBRA360, incluindo ADRs (Architecture Decision Records) detalhados para todas as decisões arquiteturais.

---

## Índice de Documentação

### 📋 ADRs (Architecture Decision Records)

| ID | Título | Status | Descrição |
|-----|-------|-------|----------|
| [ADR-001](ADR/ADR-001-stack-tecnologica.md) | Stack Tecnológica | ✅ Aceito | Definição da stack completa |
| [ADR-002](ADR/ADR-002-arquitetura-mobile.md) | Arquitetura Mobile | ✅ Aceito | Clean Architecture + DDD |
| [ADR-003](ADR/ADR-003-arquitetura-backend.md) | Arquitetura Backend | ✅ Aceito | API com oRPC |
| [ADR-004](ADR/ADR-004-autenticacao-autorizacao.md) | Autenticação e Autorização | ✅ Aceito | Better Auth + RBAC |
| [ADR-005](ADR/ADR-005-banco-de-dados.md) | Banco de Dados | ✅ Aceito | Schema Prisma |
| [ADR-006](ADR/ADR-006-estrategia-offline-first.md) | Offline-First | ✅ Aceito | SyncQueue + SQLite |
| [ADR-007](ADR/ADR-007-modulos-ia.md) | Módulos de IA | ✅ Aceito | ML Kit + Gemini |
| [ADR-008](ADR/ADR-008-fases-implementacao.md) | Fases de Implementação | ✅ Aceito | Roadmap 12 meses |

---

## Estrutura do Projeto

```
obras360-project/
├── apps/
│   ├── native/              # App mobile (Expo)
│   └── server/              # Backend API (ElysiaJS)
├── packages/
│   ├── api/                # Routers oRPC
│   ├── auth/               # Better Auth config
│   ├── db/                 # Prisma client
│   ├── env/                # Environment vars
│   └── config/             # Shared configs
├── DOCS/
│   ├── README.md           # Este arquivo
│   └── ADR/               # Architecture Decision Records
│       ├── ADR-001-stack-tecnologica.md
│       ├── ADR-002-arquitetura-mobile.md
│       ├── ADR-003-arquitetura-backend.md
│       ├── ADR-004-autenticacao-autorizacao.md
│       ├── ADR-005-banco-de-dados.md
│       ├── ADR-006-estrategia-offline-first.md
│       ├── ADR-007-modulos-ia.md
│       └── ADR-008-fases-implementacao.md
└── ...
```

---

## Quick Reference

### Comandos Principais

| Comando | Descrição |
|---------|-----------|
| `bun install` | Instalar dependências |
| `bun run dev` | Iniciar desenvolvimento (ambos) |
| `bun run dev:server` | Apenas server (port 3000) |
| `bun run dev:native` | Apenas app (port 3001) |
| `bun run db:push` | Aplicar schema Prisma |
| `bun run db:generate` | Gerar Prisma Client |
| `bun run db:studio` | Abrir Prisma Studio |
| `bun run check` | Lint + Format (Biome) |

### Portas

| Serviço | Porta |
|---------|-------|
| Server API | 3000 |
| App Mobile | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |

---

## Stack resumida

```
┌─────────────────────────────────────────────────┐
│                  MOBILE APP                     │
├─────────────────────────────────────────────────┤
│  Expo SDK 55 · React Native 0.83                │
│  TypeScript 5.9 · Tailwind v4 (uniwind)        │
│  HeroUI Native · TanStack Query                 │
│  expo-sqlite (local) · Better Auth            │
│  Vercel AI SDK + Google AI                    │
└─────────────────────────────────────────────────┘

┌─────────────────��───────────────────────────────┐
│                    BACKEND                   │
├─────────────────────────────────────────────────┤
│  Bun · ElysiaJS · TypeScript 6               │
│  oRPC (tRPC) · Zod                           │
│  Prisma ORM · PostgreSQL                     │
│  Redis · Better Auth                        │
│  Vercel AI SDK + Google AI                  │
└─────────────────────────────────────────────────┘
```

---

## Perfis de Usuário

| Perfil | Funcionalidades |
|--------|--------------|
| **ENCARREGADO** | Solicitar materiais, ponto, diário, alertas, fotos |
| **COMPRAS** | Processar solicitações, kanban, fornecedores |
| **GESTÃO** | Dashboard, curva S, fluxo caixa, relatórios |

---

## Fases de Implementação

| Fase | Duração | Entregáveis |
|------|----------|------------|
| **FASE 1** | Meses 1-3 | MVP Core (auth, obras, solicitações, ponto, kanban, dashboard) |
| **FASE 2** | Meses 4-6 | Campo + IA (fotos classificadas, clima, voz, KPIs) |
| **FASE 3** | Meses 7-9 | Gestão completa (curva S, alertas preditivos, relatórios) |
| **FASE 4** | Meses 10-12 | Escala (multi-empresa, iOS, integrações) |

---

## Resources

- [Blueprint Original](obra360_blueprint.html)
- [Expo Documentation](https://docs.expo.dev)
- [ElysiaJS Documentation](https://elysiajs.com)
- [Better Auth Documentation](https://www.better-auth.com)
- [Prisma ORM Documentation](https://prisma.io/docs)

---

## Contributing

Para adicionar nuovo ADR:

1. Criar arquivo em `DOCS/ADR/ADR-XXX-titulo.md`
2. Preencher metadata table
3. Detalhar contexto, decisões, consequências
4. Adicionar check-list de implementação
5. Atualizar este índice

---

## Licença

MIT License - OBRA360 Project

---

## Histórico

| Data | Versão | Autor |
|------|--------|-------|
| 2026-04-28 | 1.0.0 | Arquiteto |