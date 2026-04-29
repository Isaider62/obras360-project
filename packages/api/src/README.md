# API Layer (Backend)

Esta camada contém os routers oRPC e services do backend OBRA360.

## O que faz esta camada

- **Routers**: Definem os endpoints da API (oRPC)
- **Services**: Lógica de negócio para acesso ao banco de dados
- **Context**: Contexto de requisição com autenticação

## Estrutura

```
packages/api/src/
├── src/
│   ├── index.ts              # Exports utama
│   ├── context.ts           # Contexto c/ auth
│   ├── routers/
│   │   ├── index.ts        # Router utama
│   │   ├── obras.ts       # CRUD de obras
│   │   ├── solicitacoes.ts # CRUD de solicitações
│   │   └── alertas.ts    # CRUD de alertas
│   └── services/
│       ├── index.ts      # Exports de services
│       ├── obra.service.ts      # Lógica de obras
│       ├── solicitacao.service.ts # Lógica de solicitações
│       └── alerta.service.ts   # Lógica de alertas
└── README.md               # Este arquivo
```

## O que já está implementado

- ✅ routers/obras.ts - CRUD + stats de obras
- ✅ routers/solicitacoes.ts - CRUD de solicitações
- ✅ routers/alertas.ts - CRUD de alertas
- ✅ services/obra.service.ts - Lógica de obras
- ✅ services/solicitacao.service.ts - Lógica de solicitações
- ✅ services/alerta.service.ts - Lógica de alertas

## Como usar services

```typescript
import { obraService } from "@obras360-project/api/services";

//.Listar obras
const obras = await obraService.findAll();

//Stats
const stats = await obraService.getStats();

//Criar obra
const obra = await obraService.create({
  name: "Nova Obra",
  status: "PLANEJAMENTO",
});
```

## Routers (oRPC)

Cada router expõe procedures:

### obrasRouter
- `list` - Lista todas as obras
- `get` - Detalhe de uma obra
- `create` - Criar obra
- `update` - Atualizar obra
- `delete` - Deletar obra (soft delete)
- `stats` - Estatísticas

### solicitacoesRouter
- `list` - Lista solicitações
- `get` - Detalhe de uma solicitação
- `create` - Criar solicitação
- `update` - Atualizar solicitação
- `updateStatus` - Atualizar status
- `delete` - Deletar solicitação
- `stats` - Estatísticas

### alertasRouter
- `list` - Lista alertas
- `get` - Detalhe de um alerta
- `create` - Criar alerta
- `resolve` - Resolver alerta
- `delete` - Deletar alerta

## Validação com Zod

Cada router usa Zod para validação de input/output:

```typescript
export const obraInputSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().optional(),
  // ...
});
```

## Context

O contexto é criado em `context.ts` e inclui:

- `session` - Session do Better Auth
- `auth` - Instância do auth

## Para adicionar novo Router

1. Criar arquivo em `routers/<nome>.ts`
2. Exportar router com `os.router({ ... })`
3. Registrar em `routers/index.ts`

## Para adicionar novo Service

1. Criar arquivo em `services/<nome>.service.ts`
2. Criar classe com métodos de acesso ao DB
3. Exportar instância em `services/index.ts`