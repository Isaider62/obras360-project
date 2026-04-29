# Presentation Layer

Esta camada contém a UI (User Interface) do aplicativo - telas, componentes e hooks.

## O que faz esta camada

- **Screens**: Telas do app (via Expo Router)
- **Components**: Componentes React reutilizáveis
- **Hooks**: Lógica de estado e dados

## Estrutura

```
presentation/
├── components/
│   └── ui/
│       └── index.tsx           # Componentes base
├── hooks/
│   ├── index.ts               # Export de todos hooks
│   ├── useObras.ts           # Lista/cria obras
│   ├── useSolicitacoes.ts    # Lista/cria solicitações
│   ├── usePonto.ts          # Registro de ponto
│   └── useOffline.ts        # Detecção online/offline
└── README.md                 # Este arquivo
```

## O que já está implementado

- ✅ components/ui/index.tsx - Button, Card, Spinner, Loader, EmptyState, ErrorState, Badge
- ✅ hooks/useObras.ts - useObras, useObra
- ✅ hooks/useSolicitacoes.ts - useSolicitacoes, useSolicitacao, useSolicitacoesPendentes
- ✅ hooks/usePonto.ts - usePontos, usePontoDoDia
- ✅ hooks/useOffline.ts - useOffline

## Como usar hooks

### useObras
```typescript
const { obras, loading, error, refetch } = useObras();
```

### useSolicitacoes
```typescript
const { solicitacoes, loading, error } = useSolicitacoes(obraId);
```

### useOffline
```typescript
const { isOnline, isOffline, checkConnection } = useOffline();
```

## Componentes UI (HeroUI Native)

O app usa **HeroUI Native** para componentes base:

| Componente | Descrição |
|------------|-----------|
| Button | Botão com loading |
| Card | Container básico |
| Spinner/Loader | Indicador de carregamento |
| EmptyState | Estado vazio |
| ErrorState | Estado de erro |
| Badge | Etiqueta |

## Expo Router

As screens são definidas em `app/` (Expo Router entrypoint). Estrutura de rotas:

- `app/(drawer)/` - Navigation drawer
- `app/(tabs)/` - Navigation tabs
- `app/[...]/` - Rotas dinâmicas

## Para adicionar novo componente

1. Adicionar em `components/ui/index.tsx`
2. Usar HeroUI Native ou componentes React Native
3. Exportar no index

## Para adicionar novo hook

1. Criar arquivo em `hooks/`
2. Implementar lógica com useState/useEffect
3. Exportar em `hooks/index.ts`