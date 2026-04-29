# Auth Package

Este pacote contém a configuração de autenticação do OBRA360 usando Better Auth.

## O que faz

- **Better Auth**: Provider de autenticação completo
- **Security**: Rate limiting, session security, audit logging
- **RBAC**: Sistema de permissões baseado em perfis

## Estrutura

```
packages/auth/src/
└── index.ts              # Configuração principal do Better Auth
```

## Configuração de Security

```typescript
// Rate Limiting
rateLimit: {
  enabled: true,
  window: 60,
  max: 100,
  customRules: {
    "/api/auth/sign-in/email": { window: 60, max: 5 },
  },
}

// Session Security
session: {
  expiresIn: 60 * 60 * 24 * 7,  // 7 dias
  updateAge: 60 * 60 * 24,         // 24h
  freshAge: 60 * 60,               // 1h
  cookieCache: {
    enabled: true,
    maxAge: 300,
    strategy: "jwe",
  },
}
```

## Perfis de Usuário

| Perfil | Descrição |
|--------|-----------|
| ENCARREGADO | Campo / Obra |
| COMPRAS | Setor de Compras |
| GESTAO | Diretoria |

## Matriz de Permissões

Ver ADR-004 para matriz completa. Resumo:

- **ENCARREGADO**: Própria obra, solicitações, ponto, diário
- **COMPRAS**: Leitura obras, processar solicitações, KPIs
- **GESTAO**: Acesso total

## Middleware RBAC

Disponível em `packages/api/src/middleware/auth.ts`:

```typescript
import { requerAutenticacao, requerPermissao, requerPerfil } from "@obras360-project/api/middleware";

export const router = os.router({
  create: os
    .use(requerAutenticacao())
    .use(requerPermissao("OBRA:Criar"))
    .handler(async ({ context }) => { ... }),
});
```

## Mobile Auth

Ver `apps/native/src/lib/auth.ts`:

```typescript
import { authClient, useSession, signIn, signOut } from "~/lib/auth";

// Hook de sessão
const { data: session } = useSession();

// Login
await signIn.email({ email, password });

// Logout
await signOut();
```

## Trusted Origins

Configurado para desenvolvimento:
- `exp://`, `exp://192.168.*.*:*/**`
- `http://localhost:8081`

Produção: configurar `CORS_ORIGIN` no `.env`