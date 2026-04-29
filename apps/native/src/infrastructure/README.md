# Infrastructure Layer

Esta camada contém as implementações concretas que conectam o app ao mundo exterior (banco local, API, storage, etc).

## O que faz esta camada

- **LocalDB**: Banco SQLite local (expo-sqlite)
- **SyncQueue**: Fila de sincronização offline
- **API Client**: Chamadas ao backend (oRPC)

## Estrutura

```
infrastructure/
├── local/
│   └── database.ts          # expo-sqlite setup + schema
├── sync/
│   └── SyncQueue.ts          # Queue de sincronização
└── (api/ em construção)     # Cliente oRPC
```

## O que já está implementado

- ✅ local/database.ts - Schema SQLite completo (7 tabelas)
- ✅ sync/SyncQueue.ts - FIFO queue com retry (max 3 tentativas)

## Schema SQLite (database.ts)

| Tabela | Descrição |
|-------|-----------|
| obra | Dados das obras |
| solicitacao_material | Solicitações de materiais |
| registro_ponto | Registros de ponto |
| diario_obra | Diários de obra |
| foto | Fotos com classificação IA |
| alerta | Alertas |
| sync_queue | Fila de sincronização |

## Como funciona a SyncQueue

```typescript
import { syncQueue } from "~/infrastructure/sync/SyncQueue";

// Adicionar item na fila
await syncQueue.enqueue("obra", obraId, "CREATE", { ... });

// Processar queue (chamarperiodicamente)
await syncQueue.processQueue();

// Verificar pendências
const count = await syncQueue.getPendingCount();
```

## Para implementar um Repository Local

1. Usar a interface de `domain/repositories`
2. Implementar em `infrastructure/local/repositories/` (futuro)
3. Usar `getDatabase()` para executar queries

## Conexão com Backend

O backend usa `@obras360-project/api` (oRPC). A implementação do cliente API será adicionada em `infrastructure/api/`.