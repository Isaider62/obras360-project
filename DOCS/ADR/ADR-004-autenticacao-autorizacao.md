# ADR-004: Autenticação e Autorização

## Metadata

| Campo | Valor |
|-------|-------|
| **ID** | ADR-004 |
| **Título** | Sistema de Autenticação e Autorização |
| **Status** | ✅ Aceito |
| **Data de Criação** | 2026-04-28 |
| **Autor** | Arquiteto de Software |
| **Dernière Update** | 2026-04-28 |

---

## Contexto

Este ADR define o sistema de autenticação e autorização do OBRA360. A escolha foi baseada nos seguintes requisitos:

- **Perfis múltiplos**: Encarregado, Compras, Gestão
- **Operação offline**: Auth deve funcionar offline
- **Segurança**: Tokens seguros, 2FA opcional
- **Integração**: Sistema de compras integrado

---

## Decisões de Autenticação

### Decisão 1: Provider de Auth

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **Provider** | Better Auth | Clerk Firebase Auth |
| **Session** | JWT + Database | JWT-only, Session-only |
| **2FA** | TOTP (Google Authenticator) | SMS, Email |
| **OAuth** | Google | Apple, Microsoft |
| **Status** | ✅ Implementado | - |

### Decisão 2: Fluxo de Login

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE LOGIN                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────────┐       │
│  │ Mobile │───►│ Login Form │───►│ Better Auth API │       │
│  └─────────┘    └─────────────┘    └─────────────────┘       │
│                                            │                │
│                                    ┌───────┴────────┐      │
│                                    ▼                ▼       │
│                            ┌─────────────┐  ┌───────────┐ │
│                            │  Sucesso   │  │  Erro    │ │
│                            │  + Token  │  │ + Motivo │ │
│                            └─────────────┘  └───────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Decisão 3: Perfis de Usuário

| Perfil | Descrição | Permissão Principal |
|-------|-----------|---------------------|
| **ENCARREGADO** | Campo / Obra | Solicitar materiais, registrar ponto, diário |
| **COMPRAS** | Setor de Compras | Processar solicitações, gerenciar fornecedores |
| **GESTÃO** | Diretoria | Dashboard, gestão de obras, relatórios |

---

## Estrutura de Dados de Usuário

### Schema Prisma

```prisma
// packages/db/prisma/schema.prisma

model User {
  id              String    @id @default(cuid())
  nome           String
  email          String    @unique
  emailVerified  DateTime?
  imagem        String?
  
  // Dados OBRA360
  perfil         Perfil    @default(ENCARREGADO)
  encarregadoObraId String? @unique // Para ENCARREGADO
  biometriaHash  String?   // Hash de biometria
  
  // Better Auth fields
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  ativo          Boolean   @default(true)

  // Relations
  conta          Account[]
  session        Session[]
  obra           Obra?     @relation("ObraEncarregado", fields: [encarregadoObraId], references: [id])
  solicitacoes   SolicitacaoMaterial[]
  diarios       DiarioObra[]
  fotos         Foto[]
  alertas       Alerta[]
}

enum Perfil {
  ENCARREGADO
  COMPRAS
  GESTAO
}
```

---

## Sistema de Autorização (RBAC)

### Decisão 4: Matriz de Permissões

| Módulo | ENCARREGADO | COMPRAS | GESTÃO |
|-------|:----------:|:------:|:-----:|
| **Dados da obra (própria)** | ✓ LE + ES | ◑ LE | ✓ TOTAL |
| **Dados de outras obras** | ✗ | ◑ LE | ✓ TOTAL |
| **Solicitação de materiais** | ✓ CRIA | ✓ PROC | ◑ VIS |
| **Folha de ponto** | ✓ REG | ✗ | ◑ REL |
| **Diário de obra** | ✓ CRIA | ✗ | ◑ VIS |
| **Dashboard e KPIs** | ◑ OBRA | ◑ KPIs | ✓ GLOBAL |
| **Alertas inteligentes** | ◑ CRIA | ◑ REC | ✓ TODOS |
| **Admin de usuários** | ✗ | ✗ | ✓ TOTAL |
| **Relatórios exportáveis** | ✗ | ◑ REL | ✓ TODOS |

**Legenda**: ✓ = Total | ◑ = Parcial | ✗ = Sem acesso | LE = Leitura | ES = Escrita | CRIA = Criar | PROC = Processar

### Decisão 5: Implementação RBAC

```typescript
// apps/server/src/middleware/auth.ts
import type { AppContext } from "~/context";
import { ORPCError } from "@orpc/server";

export type Perfil = "ENCARREGADO" | "COMPRAS" | "GESTAO";
export type Permissao = 
  | "OBRA:LEitura" | "OBRA:Escrita"
  | "SOLICITACAO:Criar" | "SOLICITACAO:Processar"
  | "PONTO:Registrar" | "PONTO:Relatorio"
  | "DIARIO:Criar"
  | "DASHBOARD:GLOBAL"
  | "ADMIN:Usuarios";

const PERMISSOES: Record<Perfil, Permissao[]> = {
  ENCARREGADO: [
    "OBRA:Leitura",
    "OBRA:Escrita", // própria obra
    "SOLICITACAO:Criar",
    "PONTO:Registrar",
    "DIARIO:Criar",
  ],
  COMPRAS: [
    "OBRA:Leitura",
    "SOLICITACAO:Processar",
    "DASHBOARD:KPIs",
  ],
  GESTAO: [
    "OBRA:Leitura",
    "OBRA:Escrita",
    "SOLICITACAO:Criar",
    "SOLICITACAO:Processar",
    "PONTO:Registrar",
    "PONTO:Relatorio",
    "DIARIO:Criar",
    "DASHBOARD:GLOBAL",
    "ADMIN:Usuarios",
  ],
};

export function temPermissao(perfil: Perfil, permissao: Permissao): boolean {
  return PERMISSOES[perfil]?.includes(permissao) ?? false;
}

export function requerPermissao(...permissoes: Permissao[]) {
  return async ({ context }: { context: AppContext }) => {
    if (!context.user) {
      throw new ORPCError({
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado",
      });
    }

    const temAlguma = permissoes.some((p) =>
      temPermissao(context.user!.perfil, p)
    );

    if (!temAlguma) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Permissão insuficiente",
      });
    }
  };
}
```

### Decisão 6: Uso nos Routers

```typescript
// Exemplo de uso em router
import { os } from "@orpc/server";
import { requerPermissao, temPermissao } from "~/middleware/auth";

export const obrasRouter = os.router({
  create: os.handler(
    async ({ input, context }) => {
      requerPermissao("OBRA:Escrita")({ context });
      
      return obraService.create({ data: input });
    },
    { output: obraOutputSchema }
  ),
});
```

---

## Offline Authentication

### Decisão 7: Auth Offline

| Aspecto | Decisão | Detalhes |
|---------|--------|----------|
| **Storage** | expo-secure-store | Token + Refresh token |
| **Cache Local** | expo-sqlite | Dados do usuário logado |
| **Validação** | Token local | Verifica expiração localmente |
| **Reauth** | Ao reconectar | Automaticamente |
| **Status** | ✅ Parcial Implementado | SecureStorage configurado |

### Fluxo Offline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO OFFLINE AUTH                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                             │
│  App Iniciando                                                 │
│       │                                                       │
│       ▼                                                       │
│  Verifica SecureStorage                                         │
│       │                                                       │
│       ├─► Token existe? ──► Não ──► Tela Login               │
│       │                                                      │
│       ▼                                                      │
│       Sim                                                     │
│       │                                                       │
│       ▼                                                       │
│  Token válido localmente?                                       │
│       │                                                       │
│       ├─► Expirado ──► Tenta refresh ──► Falha ──► Login      │
│       │                                                      │
│       ▼                                                      │
│       Sim                                                     │
│       │                                                       │
│       ▼                                                       │
│  Carrega dados locais                                         │
│  (expo-sqlite)                                               │
│       │                                                       │
│       ▼                                                       │
│  App pronta (modo offline ou online)                          │
│                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integração Better Auth

### Decisão 8: Configuração

```typescript
// packages/auth/src/index.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/drizzle/adapter";
import { db } from "@obras360-project/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  },
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24, // 1 dia
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutos
    },
  },
  
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
});
```

### Decisão 9: Adapter Mobile

```typescript
// apps/native/lib/auth-client.ts
import { createAuthClient } from "@better-auth/expo";
import { authClient } from "@obras360-project/api";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL!,
  ...authClient.config,
});

export const useAuth = () => {
  const session = authClient.useSession;
  
  return {
    session,
    signIn: authClient.signIn,
    signOut: authClient.signOut,
    signUp: authClient.signUp,
  };
};
```

---

## Check-list de Implementação

### Fase 1: Setup (✅ IMPLEMENTADO)
- [x] Better Auth instalado
- [x] Database adapter configurado
- [x] Email/password enabled
- [x] Social login (Google) configurado
- [x] Rate limiting configurado
- [x] Session security (jwe encryption)
- [x] Audit logging
- [x] Cookie security

### Fase 2: Schema (✅ IMPLEMENTADO)
- [x] Adicionar campo perfil ao schema
- [x] Adicionar biometriaHash
- [x] Adicionar encarregadoObraId

### Fase 3: RBAC (✅ IMPLEMENTADO)
- [x] Implementar middleware auth
- [x] Criar matriz de permissões
- [x] Aplicar em routers (obras, solicitacoes)

### Fase 4: Mobile (✅ IMPLEMENTADO)
- [x] Implementar SecureStorage
- [x] Implementar auth client
- [ ] Implementar redirect por perfil (pendente)

### Fase 5: 2FA (⏳ PENDENTE)
- [ ] Configurar TOTP
- [ ] Implementar QR code setup
- [ ] Implementar validação 2FA

---

## Referências

- [Better Auth Documentation](https://www.better-auth.com)
- [Better Auth Expo](https://github.com/better-auth/better-auth)
- [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)
- Blueprint técnico: obra360_blueprint.html

---

## Histórico de Alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-04-28 | Versão inicial do ADR | Arquiteto |
| 2026-04-28 | Implementação security features (rate limiting, session security, audit logging) | Arquiteto |
| 2026-04-28 | Implementação RBAC (middleware, matriz permissões, routers) | Arquiteto |
| 2026-04-28 | Implementação Auth Client mobile | Arquiteto |