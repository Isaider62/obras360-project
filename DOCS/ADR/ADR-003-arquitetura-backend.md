# ADR-003: Arquitetura Backend

## Metadata

| Campo | Valor |
|-------|-------|
| **ID** | ADR-003 |
| **Título** | Arquitetura do Backend API |
| **Status** | ✅ Aceito |
| **Data de Criação** | 2026-04-28 |
| **Autor** | Arquiteto de Software |
| **Dernière Update** | 2026-04-28 |

---

## Contexto

Este ADR define a arquitetura utilizada no backend API do OBRA360. A escolha foi baseada nos seguintes requisitos:

- **Type-Safety**: End-to-end type safety entre backend e mobile
- **Performance**: API rápido para tempo real
- **Escalabilidade**: Suporte a múltiplas instâncias
- **Simplicidade**: Easy de manter e extender

---

## Decisões de Arquitetura

### Decisão 1: Estrutura de Diretórios

```
apps/server/
├── src/
│   ├── index.ts                 # Entry point (Elysia)
│   ├── app.ts                   # Configuração app
│   │
│   ├── plugins/                 # Elysia plugins
│   │   ├── cors.ts
│   │   ├── jwt.ts
│   │   └── sentry.ts
│   │
│   ├── routers/                 # Routers (oRPC)
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── obras.ts
│   │   ├── solicitacoes.ts
│   │   ├── compras.ts
│   │   ├── DiarioObra.ts
│   │   ├── Ponto.ts
│   │   └── gestao.ts
│   │
│   ├── services/                # Business logic
│   │   ├── obra.service.ts
│   │   ├── solicitacao.service.ts
│   │   └── alerta.service.ts
│   │
│   ├── middleware/             # Custom middleware
│   │   ├── auth.ts
│   │   └── rate-limit.ts
│   │
│   ├── utils/                  # Utilities
│   │   └── helpers.ts
│   │
│   └── types/                  # Type definitions
│       └── index.ts
│
├── .env                        # Environment variables
├── prisma/
│   └── schema.prisma           # Database schema
│
└── dist/                       # Built files (tsdown)
```

### Decisão 2: Padrão de API

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **Protocol** | oRPC (tRPC) | REST, GraphQL |
| **Validation** | Zod | ArkType, runtype |
| **Error Handling** | Custom error class | Built-in |
| **Response Format** | JSON only | - |
| **Status** | ✅ Implementado | Routers + Services |

### Decisão 3: Estrutura de Router (Exemplo)

```typescript
// apps/server/src/routers/obras.ts
import { ORPCError, os } from "@orpc/server";
import { z } from "zod";
import { obraService } from "~/services/obra.service";

const obraInputSchema = z.object({
  nome: z.string().min(1).max(200),
  endereco: z.string().optional(),
  dataInicio: z.string().datetime().optional(),
  dataPrevFim: z.string().datetime().optional(),
  orcamentoTotal: z.number().positive().optional(),
  geolocalizacao: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

const obraOutputSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  endereco: z.string().nullable(),
  status: z.enum(["PLANEJAMENTO", "EM_ANDAMENTO", "CONCLUIDO", "ARQUIVADO"]),
  dataInicio: z.string().datetime().nullable(),
  dataPrevFim: z.string().datetime().nullable(),
  orcamentoTotal: z.number().nullable(),
  geolocalizacao: z.object({
    lat: z.number(),
    lng: z.number(),
  }).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const obrasRouter = os.router({
  // Listar todas as obras
  list: os.handler(
    async ({ context }) => {
      return obraService.findMany({
        where: { deletadoEm: null },
        orderBy: { createdAt: "desc" },
      });
    },
    {
      output: z.array(obraOutputSchema),
    }
  ),

  // Criar nova obra
  create: os.handler(
    async ({ input, context }) => {
      // Validações de negócio
      if (!context.user) {
        throw new ORPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      // Verifica permissão
      if (context.user.perfil !== "GESTAO") {
        throw new ORPCError({
          code: "FORBIDDEN",
          message: "Apenas gestão pode criar obras",
        });
      }

      return obraService.create({
        data: {
          ...input,
          encarregadoId: input.encarregadoId,
        },
      });
    },
    {
      input: obraInputSchema,
      output: obraOutputSchema,
    }
  ),

  // Atualizar obra
  update: os.handler(
    async ({ input, context }) => {
      const { id, ...data } = input;

      // Verificar existência
      const obra = await obraService.findUnique({ where: { id } });
      if (!obra) {
        throw new ORPCError({
          code: "NOT_FOUND",
          message: "Obra não encontrada",
        });
      }

      return obraService.update({
        where: { id },
        data,
      });
    },
    {
      input: obraInputSchema.extend({
        id: z.string().uuid(),
      }),
      output: obraOutputSchema,
    }
  ),

  // Detalhe de obra
  get: os.handler(
    async ({ input, context }) => {
      const obra = await obraService.findUnique({
        where: { id: input.id },
        include: {
          encarregado: true,
          solicitacoes: {
            where: { deletadoEm: null },
            take: 10,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!obra) {
        throw new ORPCError({
          code: "NOT_FOUND",
          message: "Obra não encontrada",
        });
      }

      return obra;
    },
    {
      input: z.object({ id: z.string().uuid() }),
      output: obraOutputSchema.extend({
        encarregado: z.object({
          id: z.string().uuid(),
          nome: z.string(),
          email: z.string().email(),
        }),
        solicitacoes: z.array(z.any()),
      }),
    }
  ),
});
```

### Decisão 4: Context de Autenticação

```typescript
// apps/server/src/context.ts
import type { Context as oRPCContext } from "@orpc/server";
import type { FastifyRequest } from "fastify";
import { db } from "@obras360-project/db";

export interface AuthUser {
  id: string;
  email: string;
  nome: string;
  perfil: "ENCARREGADO" | "COMPRAS" | "GESTAO";
  obraId?: string | null;
}

export interface AppContext extends oRPCContext {
  user: AuthUser | null;
  request: FastifyRequest;
  db: typeof db;
}

export const appContext = os.context<AppContext>().build(async ({ request }) => {
  // Extrai token JWT
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return { user: null, request, db };
  }

  // Valida token e busca usuário
  try {
    const session = await db.session.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return { user: null, request, db };
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        nome: session.user.nome,
        perfil: session.user.perfil as AuthUser["perfil"],
        obraId: session.user.encarregadoObraId,
      },
      request,
      db,
    };
  } catch {
    return { user: null, request, db };
  }
});
```

### Decisão 5: Error Handling

```typescript
// apps/server/src/utils/error.ts
import { ORPCError } from "@orpc/server";

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleError(error: unknown) {
  if (error instanceof ORPCError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  // Erro desconhecido
  console.error("Erro não tratado:", error);
  return {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Erro interno do servidor",
    },
  };
}
```

### Decisão 6: Logging e Monitoring

| Aspecto | Decisão | Detalhes |
|---------|--------|----------|
| **Logs** | Bun.std | Console + file |
| **Monitoring** | Sentry | Error tracking |
| **Metrics** | Custom | Request duration, error rate |
| **Status** | ⏳ Parcial | Sentry configurado |

---

## API Endpoints (Planejados)

### Auth
- `POST /auth/sign-in` - Login
- `POST /auth/sign-up` - Registro
- `POST /auth/sign-out` - Logout
- `POST /auth/refresh` - Refresh token

### Obras
- `GET /obras` - Listar obras
- `POST /obras` - Criar obra
- `GET /obras/:id` - Detalhe obra
- `PUT /obras/:id` - Atualizar obra
- `DELETE /obras/:id` - Deletar obra

### Solicitações
- `GET /solicitacoes` - Listar solicitações
- `POST /solicitacoes` - Criar solicitação
- `GET /solicitacoes/:id` - Detalhe solicitação
- `PUT /solicitacoes/:id` - Atualizar status

### Compras
- `GET /compras` - Listar pedidos
- `POST /compras` - Criar pedido
- `GET /compras/:id` - Detalhe pedido

### Ponto
- `POST /ponto` - Registrar ponto
- `GET /ponto/obras/:id` - Pontos da obra

### Diablo
- `GET /diario/obras/:id` - Diários da obra
- `POST /diario` - Criar diário

### Gestão
- `GET /gestao/dashboard` - Dashboard geral
- `GET /gestao/obras/:id/curva-s` - Curva S
- `GET /gestao/obras/:id/fluxo-caixa` - Fluxo de caixa

---

## Check-list de Implementação

### Fase 1: Setup (JÁ IMPLEMENTADO)
- [x] ElysiaJS configurado
- [x] Bun como runtime
- [x] TypeScript 6 configurado
- [x] tsdown configurado
- [x] CORS configurado

### Fase 2: API Layer (✅ IMPLEMENTADO)
- [x] oRPC configurado
- [x] Zod configurado
- [x] Routers implementados (obras, solicitacoes, alertas)
- [x] Context with Better Auth

### Fase 3: Services (✅ IMPLEMENTADO)
- [x] Context configurado
- [x] obra.service.ts implementado
- [x] solicitacao.service.ts implementado
- [x] alerta.service.ts implementado
- [x] gestao.service.ts implementado

### Fase 4: Security (✅ IMPLEMENTADO)
- [x] Better Auth configurado
- [x] Rate limiting (100 requests/60s, 5 para sign-in)
- [x] Session security (7 dias, refresh 24h, jwe encryption)
- [x] IP address configuration
- [x] Audit logging (databaseHooks)
- [x] CSRF protection
- [x] Cookie security

### Fase 5: Monitoring (⏳ PENDENTE)
- [ ] Setup Sentry
- [ ] Logging estruturado
- [ ] Métricas customizadas

---

## Referências

- [ElysiaJS Documentation](https://elysiajs.com)
- [oRPC Documentation](https://orpc.dev)
- [Zod Documentation](https://zod.dev)
- [Sentry for Node.js](https://docs.sentry.io/platforms/node/)
- Blueprint técnico: obra360_blueprint.html

---

## Histórico de Alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-04-28 | Versão inicial do ADR | Arquiteto |
| 2026-04-28 | Implementação Services Layer | Arquiteto |
| 2026-04-28 | Implementação Security (rate limit, session, audit) | Arquiteto |