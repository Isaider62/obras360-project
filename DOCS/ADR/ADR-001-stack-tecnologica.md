# ADR-001: Stack Tecnológica do Projeto OBRA360

## Metadata

| Campo | Valor |
|-------|-------|
| **ID** | ADR-001 |
| **Título** | Definição da Stack Tecnológica |
| **Status** | ✅ Aceito |
| **Data de Criação** | 2026-04-28 |
| **Autor** | Arquiteto de Software |
| **Dernière Update** | 2026-04-28 |

---

## Contexto

Este ADR estabelece a fundamentos tecnológicas que serão utilizadas para construir o sistema OBRA360. A decisão foi baseada nos seguintes requisitos críticos do projeto:

- **Offline-First Real**: Funcionamento completo sem conexão internet no canteiro de obras
- ** cross-platform**: Suporte para iOS e Android a partir de uma única base de código
- **Escalabilidade**: Capacidade de crescer de MVP para produto enterprise
- **DX Superior**: Experiência de desenvolvimento que permita entregas rápidas
- **IA Integrada**: Módulos de inteligência artificial para classification automática

---

## Decisões de Stack

### Decisão 1: Framework Mobile

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **Framework** | Expo SDK 55 com React Native 0.83 | Kotlin + Jetpack Compose, Flutter, React Native puro |
| **Linguagem** | TypeScript 5.9 | Kotlin, Dart |
| **UI Engine** | Expo Router + React Native | Navigation Native, Flutter Widgets |
| **Status** | ✅ Implementado | - |

**Motivo da Escolha**: O ecossistema Expo oferece a melhor combinação de DX e capacidades nativas. O build rápido, o expo-sqlite para offline, e a integração nativa com câmera, localização e sensores fazem dele a escolha ideal para o contexto de canteiro de obras.

### Decisão 2: Backend

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **Runtime** | Bun | Node.js, Deno |
| **Framework** | ElysiaJS | Express, Fastify, Hono |
| **Linguagem** | TypeScript | Go, Rust, Python |
| **Build** | tsdown | tsc, esbuild |
| **Status** | ✅ Implementado | - |

**Motivo da Escolha**: ElysiaJS oferece type-safety end-to-end com performance 10x superior ao Express. Bun como runtime complementa com speed de inicialização e execução.

### Decisão 3: Autenticação

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **Provider** | Better Auth | Clerk, Auth.js, Firebase Auth |
| **2FA** | Configurável (TOTP) | SMS, Email |
| **OAuth** | Google | Apple, Microsoft |
| **Status** | ✅ Implementado | - |

**Motivo da Escolha**: Better Auth já está configurado no projeto com suporte completo a email/password, OAuth, e 2FA. Oferece flexibility para customização de sessions.

### Decisão 4: Banco de Dados

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **ORM** | Prisma ORM | Drizzle, Knex |
| **Primary DB** | PostgreSQL (port 5432) | MySQL, MongoDB |
| **Local Cache** | expo-sqlite | WatermelonDB, Realm |
| **Cache** | Redis | None, Memory |
| **Status** | ✅ Implementado | - |

**Motivo da Escolha**: PostgreSQL oferece robustness e suporte a JSONB para dados flexíveis. Prisma ORM provê type-safety. Redis para caching de sessions e queries quente.

### Decisão 5: API Layer

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **Protocol** | tRPC / oRPC | REST, GraphQL |
| **Validation** | Zod | Yup, ArkType |
| **Status** | ✅ Implementado | - |

**Motivo da Escolha**: oRPC oferece type-safety end-to-end entre server e client, eliminando necessidade de generated clients.

### Decisão 6: AI e ML

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **SDK** | Vercel AI SDK | OpenAI SDK |
| **Providers** | Google AI (gemini-2.0-flash) | OpenAI, Anthropic |
| **On-device ML** | ML Kit (Expo compatible) | TensorFlow Lite |
| **Vision** | Google Vision API | AWS Rekognition |
| **Status** | ✅ Implementado | - |

**Motivo da Escolha**: Google AI oferece o melhor custo-benefício para os módulos de IA planejados. ML Kit permite classification de fotos on-device (offline).

### Decisão 7: Styling

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **CSS** | Tailwind CSS v4 | Styled Components, Vanilla CSS |
| **Runtime** | NativeWind v5 (uniwind) | pure RN (no runtime) |
| **Components** | HeroUI Native | Tamagui, Ark UI |
| **Status** | ✅ Implementado | - |

**Motivo da Escolha**: Tailwind + uniwind oferece DX superior com a possibilidade de usar Tailwind breakpoints no React Native.

### Decisão 8: Sync e Real-time

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **Push** | Firebase FCM | OneSignal, Pusher |
| **Background** | Expo Background Tasks | react-native-background-fetch |
| **Offline Queue** | expo-sqlite + custom | WatermelonDB |
| **Real-time** | WebSocket (Elysia) | Socket.io, Pusher |

**Motivo da Escolha**: Firebase FCM é gratuito e confiável. WebSocket com Elysia permite real-time sem dependência adicional.

### Decisão 9: DevOps

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **Runtime Package** | Bun | npm, pnpm |
| **CI/CD** | GitHub Actions | GitLab CI, CircleCI |
| **Monitoring** | Sentry | Crashlytics, Datadog |
| **Infra** | AWS EC2/RDS | Vercel, Railway |
| **Status** | ⏳ Pendente | - |

---

## Stack Completa resumida

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MOBILE APP (apps/native)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Framework:    Expo SDK 55 (expo-router)                               │
│  Language:     TypeScript 5.9                                         │
│  UI:            React Native 0.83 + Tailwind v4 (uniwind)              │
│  Components:   HeroUI Native                                          │
│  State:        TanStack Query + Zustand                              │
│  Storage:      expo-sqlite (offline) + expo-secure-store               │
│  Sync:         WorkManager + Firebase FCM                           │
│  AI:           Vercel AI SDK + Google AI                              │
│  Auth:         Better Auth (expo adapter)                            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (apps/server)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Runtime:      Bun                                                    │
│  Framework:    ElysiaJS (type-safe)                                   │
│  Language:     TypeScript 6                                          │
│  API:          oRPC (tRPC)                                           │
│  Validation:   Zod                                                   │
│  ORM:          Prisma ORM                                             │
│  Database:     PostgreSQL (5432)                                     │
│  Cache:        Redis                                                  │
│  Auth:         Better Auth                                           │
│  AI:           Vercel AI SDK + Google AI                             │
│  Build:        tsdown → dist/                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     MONOREPO STRUCTURE                                │
├─────────────────────────────────────────────────────────────────────────┤
│  packages/                                                           │
│  ├── api/         # Routers econtextos oRPC                          │
│  ├── auth/        # Configuração Better Auth                         │
│  ├── db/          # Prisma client eschemas                           │
│  ├── env/         # Variáveis de ambiente typed                     │
│  └── config/     # Configurações compartilhadas                    │
│                                                                   │
│  apps/                                                            │
│  ├── native/      # App mobile Expo                                 │
│  └── server/      # API ElysiaJS                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Consequências

### Positive

- Stack type-safe end-to-end reduz erros em runtime
- Expo permite build rápido e easy debugging
- Bun + Elysia = 10x mais rápido que Node/Express
- Prisma ORM facilita migrations e schema changes
- Better Auth cobre todos os cenários de auth necessários
- Tailwind + uniwind DX superior para styling

### Negative

- Expo adiciona uma camada de abstração (manageável)
- expo-sqlite requer custom sync logic (a implementar)
- HeroUI Native ainda está em beta (primeiros ajustes necessários)

### Trade-offs Considerados

| Trade-off | Resolução |
|-----------|-----------|
| Performance nativa vs DX | Expoaccepted — DX mais importante para MVP |
| Kotlin vs TypeScript | TypeScript — unifica com backend |
| Room vs expo-sqlite | expo-sqlite (menos overhead) |

---

### Fase 1: Setup (JÁ IMPLEMENTADO)
- [x] Expo SDK 55 configurado em apps/native
- [x] React Native 0.83 funcionando
- [x] TypeScript 5.9 configurado
- [x] ElysiaJS configurado em apps/server
- [x] Bun como package manager
- [x] Better Auth configurado
- [x] Prisma ORM configurado
- [x] PostgreSQL connection funcionando
- [x] oRPC configurado
- [x] Zod para validation
- [x] Tailwind CSS v4 configurado
- [x] HeroUI Native instalado
- [x] TanStack Query configurado
- [x] Vercel AI SDK configurado
- [x] Google AI provider configurado

### Fase 2: Sync/Real-time (⏳ PENDENTE)
- [ ] Firebase FCM configurado
- [ ] Expo Background Tasks
- [ ] WebSocket implementation

### Fase 3: DevOps (⏳ PENDENTE)
- [ ] GitHub Actions CI/CD
- [ ] Sentry monitoring
- [ ] AWS deployment

---

## Referências

- [Expo SDK Documentation](https://docs.expo.dev)
- [ElysiaJS Documentation](https://elysiajs.com)
- [Better Auth Documentation](https://www.better-auth.com)
- [Prisma ORM Documentation](https://prisma.io/docs)
- [HeroUI Native](https://heroui.com)
- [Vercel AI SDK](https://sdk.vercel.ai)
- Blueprint técnico: obra360_blueprint.html

---

## Histórico de Alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-04-28 | Versão inicial do ADR | Arquiteto |