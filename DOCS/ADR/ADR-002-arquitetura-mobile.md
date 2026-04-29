# ADR-002: Arquitetura Mobile (Clean Architecture + DDD)

## Metadata

| Campo | Valor |
|-------|-------|
| **ID** | ADR-002 |
| **Título** | Arquitetura de Aplicativo Mobile |
| **Status** | ✅ Aceito |
| **Data de Criação** | 2026-04-28 |
| **Autor** | Arquiteto de Software |
| **Dernière Update** | 2026-04-28 |

---

## Contexto

Este ADR define a arquitetura utilizada no aplicativo mobile (OBRA360), combinando princípios de **Clean Architecture** com **Domain-Driven Design (DDD)**. A escolha foi baseada nos seguintes requisitos:

- **Separação de preocupações**: UI, lógica de negócio e acesso a dados devem estar isolados
- **Testabilidade**: Cada camada deve ser testável independentemente
- **Manutenibilidade**: Mudanças localizam-se facilmente
- **Offline-First**: Dados locais e remotos devem coexistir
- **Escalabilidade**: Arquitetura suporta crescimento de funcionalidades

---

## Decisões de Arquitetura

### Decisão 1: Padrão Arquitetural

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **Padrão** | Clean Architecture + DDD | MVC, MVP, MVVM |
| **UI Layer** | Expo Router + React | React Navigation |
| **State Management** | TanStack Query + Zustand | Redux, Jotai, Context API |
| **Dependency Injection** | Manual ( factories) | inversed, tsyringe |
| **Status** | ✅ Implementado | Todas as camadas implementadas |

**Motivo da Escolha**: Clean Architecture com DDD permite isolamento total de regras de negócio, facilitando testes unitários e mudanças de implementação de banco de dados ou API.

### Decisão 2: Estrutura de Diretórios

```
apps/native/src/
├── app/                           # Expo Router ( entrypoint)
│   ├── (drawer)/                  # Navigation drawer wrapper
│   │   ├── (tabs)/                # Navigation tabs wrapper
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx          # Tab inicial
│   │   │   └── two.tsx            # Tab secundária
│   │   ├── _layout.tsx
│   │   ├── index.tsx               # Drawer inicial
│   │   └── ai.tsx                 # AI chat screen
│   ├── _layout.tsx                # Root layout
│   ├── modal.tsx                  # Modal wrapper
│   └── +not-found.tsx              # 404
│
├── features/                      # Módulos por contexto (DDD)
│   ├── auth/                      # Autenticação
│   │   ├── components/            # Componentes específicos
│   │   ├── hooks/                 # Custom hooks
│   │   ├── screens/               # Telas
│   │   └── utils/                 # Utilitários
│   ├── obras/                     # Gestão de obras
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   └── $obraId.tsx
│   ├── compras/                   # Setor de compras
│   ├── gestao/                    # Dashboard gestão
│   ├── campo/                    # Encarregado / campo
│   └── shared/                    # Funcionalidades compartilhadas
│
├── domain/                        # Camada de domínio (DDD)
│   ├── entities/                  # Entidades do sistema
│   │   ├── Obra.ts
│   │   ├── SolicitacaoMaterial.ts
│   │   ├── RegistroPonto.ts
│   │   ├── DiarioObra.ts
│   │   ├── Usuario.ts
│   │   ├── Alerta.ts
│   │   ├── PedidoCompra.ts
│   │   └── Foto.ts
│   ├── value-objects/            # Value Objects imutáveis
│   │   ├── Urgencia.ts
│   │   ├── StatusSolicitacao.ts
│   │   ├── EtapaObra.ts
│   │   ├── PerfilUsuario.ts
│   │   └── Geolocalizacao.ts
│   ├── repositories/             # Interfaces de repositório
│   │   ├── IObraRepository.ts
│   │   ├── ISolicitacaoRepository.ts
│   │   └── IPontoRepository.ts
│   └── services/                  # Domain services
│       ├── CalculoAvancoService.ts
│       └── AlertaPreditivoService.ts
│
├── application/                  # Casos de uso (Application Layer)
│   ├── use-cases/
│   │   ├── obra/
│   │   │   ├── CriarObraUseCase.ts
│   │   │   ├── ListarObrasUseCase.ts
│   │   │   └── AtualizarObraUseCase.ts
│   │   ├── solicitacao/
│   │   │   ├── CriarSolicitacaoUseCase.ts
│   │   │   ├── ListarSolicitacoesUseCase.ts
│   │   │   └── AprovarSolicitacaoUseCase.ts
│   │   └── ponto/
│   │       └── RegistrarPontoUseCase.ts
│   └── dto/                       # Data Transfer Objects
│
├── infrastructure/              # Implementações concretas
│   ├── api/                      # Cliente oRPC
│   │   ├── client.ts
│   │   └── queries/              # Query definitions
│   ├── local/                    # Dados locais
│   │   ├── database.ts           # expo-sqlite setup
│   │   ├── repositories/        # SQLite implementations
│   │   └── models/               # Schema local
│   ├── sync/                     # Lógica de sincronização
│   │   ├── SyncQueue.ts
│   │   ├── ConflictResolver.ts
│   │   └── SyncService.ts
│   ├── storage/                  # Storage local
│   │   └── SecureStorage.ts       # expo-secure-store
│   └── auth/                     # Adapter Better Auth
│       └── auth-client.ts
│
├── presentation/                 # UI (Presentation Layer)
│   ├── components/               # Componentes reutilizáveis
│   │   ├── ui/                   # Componentes base
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   ├── form/                 # Componentes de formulário
│   │   └── layout/               # Layout components
│   ├── hooks/                    # Custom hooks globais
│   │   ├── useObras.ts
│   │   ├── useSolicitacoes.ts
│   │   └── useOffline.ts
│   ├── screens/                   # Screens separadas (quando não em features)
│   └── theme/                     # Tema e styling
│       ├── colors.ts
│       ├── spacing.ts
│       └── theme-context.tsx
│
├── shared/                       # Utilitários globais
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── dimensions.ts
│   │   └── config.ts
│   ├── utils/
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── helpers.ts
│   └── types/
│       └── index.ts
│
├── lib/                          # Configurações e clients
│   ├── auth-client.ts           # Client Better Auth
│   ├── api.ts                   # API client
│   └── query-client.ts           # TanStack Query client
│
├── contexts/                    # React contexts
│   └── app-theme-context.tsx
│
└── di/                         # Dependency injection container
    └── container.ts
```

### Decisão 2.1: Estrutura de Uma Feature

```
features/obras/
├── _layout.tsx                  # Layout específico da feature
├── index.tsx                     # Lista de obras
├─�� $obraId.tsx                  # Detalhe de uma obra
├── components/                  # Componentes específicos
│   ├── ObraCard.tsx
│   ├── ObraProgress.tsx
│   └── ObraStatusBadge.tsx
├── hooks/                        # Hooks específicos
│   ├── useObra.ts
│   └── useObras.ts
├── utils/                        # Utilitários específicos
│   └── formatter.ts
└── types/                        # Tipos específicos
    └── index.ts
```

### Decisão 3: Camadas e Responsabilidades

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Responsabilidade: Renderização de UI, gerenciamento de estado local           │
│  Depende de: Application Layer                                            │
│  Principaisartifactos:                                                     │
│    - React Components                                                     │
│    - Expo Router Screens                                                  │
│    - Custom Hooks (useX)                                                  │
│    - TanStack Query hooks (useQuery, useMutation)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Responsabilidade: Casos de uso,orquestração de entidades                  │
│  Depende de: Domain Layer                                                 │
│  Principaisartifactos:                                                    │
│    - Use Cases (CriarXUseCase)                                            │
│    - DTOs (Data Transfer Objects)                                         │
│    - Application Services                                               │
│  Exemplos:                                                                │
│    - CriarSolicitacaoMaterialUseCase                                     │
│    - SyncDadosUseCase                                                    │
│    - GerarRelatorioUseCase                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DOMAIN LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Responsabilidade: Regras de negócio puras,modelagem de domínio          │
│  Depende de: Nada (camada mais interna)                                   │
│  Principaisartifactos:                                                    │
│    - Entities (Obra, Usuario, Solicitacao)                                │
│    - Value Objects (Urgencia, Status)                                      │
│    - Repository Interfaces                                               │
│    - Domain Services                                                    │
│  Exemplos de regras:                                                      │
│    - "Uma obra só pode ser iniciada se tiverem cronograma"                │
│    - "Solicitações urgentes precisam de aprovação em 24h"                 │
│    - "Progresso não pode ser maior que 100%"                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Responsabilidade: Implementações externas, acesso a dados            │
│  Depende de: Domain Layer ( implementa interfaces)                     │
│  Principaisartifactos:                                                   │
│    - API Clients (oRPC)                                                  │
│    - Repositories (SQLite, API)                                         │
│    - Sync Services                                                      │
│    - Storage Adapters                                                   │
│    - Auth Adapters                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Decisão 4: Padrão de Dados Offline

| Aspecto | Decisão | Detalhes |
|---------|--------|----------|
| **Strategy** | Cache-First + Write-Through | Lé dados locals primeiro, synca em background |
| **Local DB** | expo-sqlite | Banco de dados local completo |
| **Sync Queue** | FIFO com retry | Queue de operações pendentes |
| **Conflict Resolution** | Last-Write-Wins + Manual | Resolução automática com override opcional |
| **Status** | ✅ Implementado | Schema + SyncQueue implementados |

### Decisão 5: Gestão de Estado

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **Remote State** | TanStack Query | SWR, Apollo Client |
| **Local State** | Zustand | Context API, Redux |
| **Form State** | TanStack Form | React Hook Form |
| **UI State** | Zustand | Context |
| **Server State** | TanStack Query | - |
| **Status** | ✅ Implementado | TanStack Query + Zustand instalados |

---

## Entidades e Relacionamentos

### Domínio: OBRA360

```
┌──────────────────┐       ┌──────────────────┐
│      Usuario     │       │       Obra        │
├──────────────────┤       ├──────────────────┤
│ id: UUID         │       │ id: UUID         │
│ nome: string    │◄──────┤ encarregadoId:  │
│ email: string   │       │   UUID           │
│ perfil: Enum    │       │ nome: string    │
│ obraId: UUID?    │       │ endereco: text  │
│ biometriaHash?   │       │ status: Enum    │
│ativo: boolean   │       │ dataInicio: date│
└──────────────────┘       │ dataPrevFim: date│
         │                 │ orcamento: dec  │
         │                 │ geolocalizacao  │
         │                 └──────────────────┘
         │
         ▼            ┌─────────────────────────┐
┌──────────────────┐ │  SolicitacaoMaterial   │
│   RegistroPonto  │ ├─────────────────────────┤
├──────────────────┤ │ id: UUID                │
│ id: UUID         │ │ obraId: UUID  (FK)     │
│ obraId: UUID     │ │ solicitanteId: UUID    │
│ encarregadoId    │ │ item: string          │
│ data: date       │ │ quantidade: decimal  │
│colaboradores:JSON│ │ urgencia: Enum        │
│ assinaturaUrl?  │ │ status: Enum           │
│ sincronizado:bool│ │ fotoUrl?: text        │
└──────────────────┘ │ obsVozUrl?: text      │
                     │ createdAt: timestamp │
                     └─────────────────────────┘
                              │
                              ▼
                     ┌─────────────────────────┐
                     │    PedidoCompra       │
                     ├─────────────────────────┤
                     │ id: UUID              │
                     │ solicitacaoId: UUID   │
                     │ fornecedorId: UUID   │
                     │ valorTotal: decimal   │
                     │ prazoEntrega: date   │
                     │ status: Enum          │
                     │ nfUrl?: text          │
                     └─────────────────────────┘
```

---

## Fluxo de Dados (Exemplo: Criar Solicitação)

```
1. UI (Presentation)
   │
   ▼ chama useCriarSolicitacao() hook
2. Use Case (Application)
   │
   ▼ cria DTO → valida → executa lógica
3. Domain Entity (Domain)
   │
   ▼ valida regras de negócio
   → "Urgência só pode ser URGENTE se Justificada"
4. Repository Interface (Domain)
   │
   ▼ define contrato
5. Concrete Repository (Infrastructure)
   │
   ├─► Local (expo-sqlite): Salva localmente
   │
   └─► Remote (oRPC client): Envia para API
       │
       ▼ adiciona à SyncQueue se offline
```

---

## Princípios SOLID Aplicados

| Princípio | Aplicação |
|-----------|-----------|
| **Single Responsibility** | Cada Use Case faz uma coisa; cada Entity tem uma responsabilidade |
| **Open/Closed** | Extendemos via interfaces, não modificamos código existente |
| **Liskov Substitution** | Repositórios são trocáveis (Local ↔ Remote) sem quebrar |
| **Interface Segregation** | Interfaces específicas por Entity (IObraRepository, não IGenericRepository) |
| **Dependency Inversion** | Presentation depends of Application, not Infrastructure |

---

## Check-list de Implementação

### Fase 1: Setup (JÁ IMPLEMENTADO)
- [x] Expo Router configurado em app/
- [x] TanStack Query instalado
- [x] Zustand instalado
- [x] HeroUI Native instalado
- [x] Tailwind/uniwind configurado

### Fase 2: Domain Layer (✅ IMPLEMENTADO)
- [x] Domain entities existem (em domain/entities/index.ts)
- [x] Repository interfaces existem (em domain/repositories/index.ts)
- [x] README.md documentando a camada

### Fase 3: Application Layer (✅ IMPLEMENTADO)
- [x] Use cases implementados (obra, solicitacao, ponto)
- [x] Validações centralizadas nos Use Cases
- [x] README.md documentando a camada

### Fase 4: Infrastructure Layer (✅ IMPLEMENTADO)
- [x] Configurar expo-sqlite
- [x] Database local implementado
- [x] SyncQueue implementado
- [x] README.md documentando a camada

### Fase 5: Presentation Layer (✅ IMPLEMENTADO)
- [x] README.md modelo criado
- [x] Componentes UI implementados
- [x] Hooks implementados (useObras, useSolicitacoes, usePonto, useOffline)
- [ ] Screens de funcionalidades (próximas fases)

---

## Referências

- [Clean Architecture - Martin Fowler](https://martinfowler.com/bliki/CleanArchitecture.html)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)
- Blueprint técnico: obra360_blueprint.html

---

## Histórico de Alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-04-28 | Versão inicial do ADR | Arquiteto |
| 2026-04-28 | Implementação Domain + Application + Infrastructure Layers | Arquiteto |
| 2026-04-28 | Implementação Presentation Layer (hooks + components) | Arquiteto |