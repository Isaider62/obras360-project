# ADR-006: Estratégia Offline-First

## Metadata

| Campo | Valor |
|-------|-------|
| **ID** | ADR-006 |
| **Título** | Estratégia Offline-First para Mobile |
| **Status** | ✅ Aceito |
| **Data de Criação** | 2026-04-28 |
| **Autor** | Arquiteto de Software |
| **Dernière Update** | 2026-04-28 |

---

## Contexto

Este ADR define a estratégia offline-first do OBRA360. O canteiro de obras frequentemente não tem conexão internet estável, e o app precisa funcionar 100% offline:

- **Registro de ponto**: Deve funcionar sem internet
- **Solicitação de materiais**: Com foto e voz
- **Diário de obra**: Com condições climáticas
- **Relatório fotográfico**: Com classificação IA on-device

---

## Decisões de Arquitetura

### Decisão 1: Padrão de Dados

| Aspecto | Decisão | Alternativas Consideradas |
|---------|--------|-------------------------|
| **Strategy** | Cache-First + Write-Through | Read-Through, Write-Behind |
| **Local DB** | expo-sqlite | WatermelonDB, Realm |
| **Cache** | TanStack Query | Manual |
| **Sync** | FIFO Queue + Retry | Event-based |
| **Status** | ⏳ Pendente Implementação | - |

### Decisão 2: Arquitetura de Dados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA OFFLINE-FIRST                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │                   APP MOBILE                          │      │
│  └─────────────────────────────────────────────────────────┘      │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                   │
│         ▼                 ▼                 ▼                   │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐              │
│  │  Presentation │   │ Application │   │ Domain    │              │
│  │   Layer    │   │   Layer    │   │  Layer    │              │
│  └────────────┘   └────────────┘   └────────────┘              │
│         │                 │                 │                     │
│         └─────────────────┼─────────────────┘                   │
│                           ▼                                     │
│  ┌────────────────────────────────────────────────────────┐         │
│  │             REPOSITORY LAYER                       │         │
│  │                                                  │         │
│  │  ┌──────────────────────────────────��───────┐    │         │
│  │  │        Repository Pattern                  │    │         │
│  │  │  ┌─────────┐     ┌───────────────┐       │    │         │
│  │  │  │ Local  │────►│  Hybrid    │◄─────│ Remote │    │         │
│  │  │  │(SQLite)│     │  (Cache)   │     │ (API)  │    │         │
│  │  │  └─────────┘     └───────────────┘       │    │         │
│  │  └──────────────────────────────────────────┘    │         │
│  └────────────────────────────────────────────────────────┘         │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────────┐
              │    BACKEND (Cloud)         │
              │  PostgreSQL + Redis      │
              └────────────────────────────┘
```

---

## Fluxo de Dados

### Decisão 3: Escrita (Write-Through)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              FLUXO DE ESCRITA OFFLINE-FIRST                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Usuário cria solicitação                                  │
│                           │                                 │
│                           ▼                                 │
│  2. Repository.save(data)                                   │
│                           │                                 │
│                           ▼                                 │
│  3. Salva LOCAL ──► expo-sqlite                             │
│     │              │                                        │
│     │   ┌─────────┴─────────┐                              │
│     │   │                  │                               │
│     │   ▼                  ▼                              │
│  4. Adiciona    │                              │
│     │ SYNC_QUEUE   │                              │
│     │ (pending)  │                              │
│     │            │                              │
│     │   ┌───────┴───────┐                                  │
│     │   │              │                                  │
│     ▼   ▼              ▼                                  │
│  5. RETORNA              │                                 │
│     │                  │                                 │
│     │         ONLINE? ──► SIM ──► Envia para API        │
│     │                  │                                 │
│     │                  ▼                                 │
│     │         Remove da SYNC_QUEUE                    │
│     │                  │                                 │
│     │         atualiza status local                     │
│     │                  │                                 │
│     └──────────────────┘                              │
│                           │                                 │
│                           ▼                                 │
│  6. SUCCESS 返回 UI (com pending indicator)               │
│                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Decisão 4: Leitura (Cache-First)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              FLUXO DE LEITURA OFFLINE-FIRST                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Componente solicita useQuery                              │
│                           │                                 │
│                           ▼                                 │
│  2. Repository.findMany({ cache: true })                       │
│                           │                                 │
│                           ▼                                 │
│  3. Verifica cache em memória                               │
│                           │                                 │
│              ┌────────────────┴────────────────┐             │
│              │                                 │             │
│              ▼                                 ▼             │
│         HIT (dados       │                    MISS              │
│          cache         │                     │                 │
│              │         │                    ▼                 │
│              │         │         Verifica SQLite           │
│              │         │                    │                 │
│              │    ┌────┴──────────┐     │              │
│              │    │               │     ▼              │
│              │    │ DADOS         │    OFFLINE?        │
│              │    │ LOCAIS        │    │               │
│              │    │              │    │ Sim ──► Erro  │
│              │    └──────────────┘    │               │
│              │                       ▼                 │
│              │                NÃO ──►                 │
│              │                       │                  │
│              │                       ▼                  │
│              │              REQUEST API                 │
│              │                       │                  │
│              │         ┌───────────┴───────────┐       │
│              │         │                       │       │
│              │         ▼                       ▼       │
│              │     SUCESSO              FALHA           │
│              │         │                       │         │
│              │         ▼                       ▼         │
│              │   Salva cache            Retorna erro       │
│              │   SQLite                                   │
│              │         │                                │
│              └─────────┘                                │
│                           │                             │
│                           ▼                             │
│  5. RETORNA dados para UI                                │
│                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sync Queue

### Decisão 5: Implementação da Queue

```typescript
// apps/native/src/infrastructure/sync/SyncQueue.ts
import * as SQLite from "expo-sqlite";

export interface SyncItem {
  id: string;
  entidade: "obra" | "solicitacao" | "diario" | "ponto" | "foto";
  entidadeId: string;
  operacao: "CREATE" | "UPDATE" | "DELETE";
  payload: any;
  tentativas: number;
  ultimaErro?: string;
  sincronizadoEm?: string;
  createdAt: string;
}

export class SyncQueue {
  private db: SQLite.SQLiteDatabase;

  async initialize() {
    this.db = await SQLite.openDatabaseAsync("obra360.db");
    
    await this.db.execAsync(`
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
    `);
  }

  async enqueue(item: Omit<SyncItem, "id" | "tentativas" | "createdAt">) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await this.db.runAsync(
      `INSERT INTO sync_queue (id, entidade, entidade_id, operacao, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, item.entidade, item.entidadeId, item.operacao, JSON.stringify(item.payload), now]
    );

    // Tenta sync imediato se online
    if (await this.isOnline()) {
      this.processQueue();
    }
  }

  async processQueue() {
    const pending = await this.db.getAllAsync<SyncItem>(
      `SELECT * FROM sync_queue 
       WHERE tentativas < 3 
       ORDER BY created_at ASC`
    );

    for (const item of pending) {
      try {
        await this.syncItem(item);
        
        await this.db.runAsync(
          `UPDATE sync_queue SET sincronizado_em = ? WHERE id = ?`,
          [new Date().toISOString(), item.id]
        );
      } catch (error) {
        await this.db.runAsync(
          `UPDATE sync_queue 
           SET tentativas = tentativas + 1, ultima_erro = ? 
           WHERE id = ?`,
          [(error as Error).message, item.id]
        );
      }
    }
  }

  async getPendingCount(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sync_queue WHERE sincronizado_em IS NULL`
    );
    return result?.count ?? 0;
  }
}

export const syncQueue = new SyncQueue();
```

---

## Repository Pattern Híbrido

### Decisão 6: Interface de Repository

```typescript
// apps/native/src/domain/repositories/ISolicitacaoRepository.ts
export interface ISolicitacaoRepository {
  // Leituras
  findById(id: string): Promise<SolicitacaoMaterial | null>;
  findByObra(obraId: string): Promise<SolicitacaoMaterial[]>;
  findPending(): Promise<SolicitacaoMaterial[]>;
  findByStatus(status: StatusSolicitacao): Promise<SolicitacaoMaterial[]>;
  
  // Escritas
  create(data: CreateSolicitacaoDTO): Promise<SolicitacaoMaterial>;
  update(id: string, data: UpdateSolicitacaoDTO): Promise<SolicitacaoMaterial>;
  delete(id: string): Promise<void>;
  
  // Cache
  invalidateCache(obraId?: string): Promise<void>;
}
```

### Decisão 7: Implementação Híbrida

```typescript
// apps/native/src/infrastructure/local/SolicitacaoRepository.ts
import { db } from "~/infrastructure/local/database";
import { api } from "~/infrastructure/api/client";
import { syncQueue } from "~/infrastructure/sync/SyncQueue";
import type { ISolicitacaoRepository } from "~/domain/repositories/ISolicitacaoRepository";

export class SolicitacaoRepository implements ISolicitacaoRepository {
  async findByObra(obraId: string): Promise<SolicitacaoMaterial[]> {
    // 1. Tenta cache local primeiro
    const cached = await db.getAllAsync(
      "SELECT * FROM solicitacao_material WHERE obra_id = ? ORDER BY created_at DESC",
      [obraId]
    );
    
    if (cached.length > 0) {
      // 2. Background refresh se online
      this.refreshIfOnline(obraId);
      return cached;
    }

    // 3. Se não tem cache, tenta API
    if (await isOnline()) {
      const remote = await api.solicitacoes.list({ obraId });
      await this.cacheMany(remote);
      return remote;
    }

    return cached;
  }

  async create(data: CreateSolicitacaoDTO): Promise<SolicitacaoMaterial> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const localData = { ...data, id, createdAt: now, sincronizado: false };
    
    // 1. Salva local
    await db.runAsync(
      `INSERT INTO solicitacao_material (id, obra_id, solicitante_id, item, quantidade, urgencia, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.obraId, data.solicitanteId, data.item, data.quantidade, data.urgencia, "ABERTA", now]
    );

    // 2. Adiciona à queue de sync
    await syncQueue.enqueue({
      entidade: "solicitacao",
      entidadeId: id,
      operacao: "CREATE",
      payload: localData,
    });

    return localData;
  }

  private async refreshIfOnline(obraId: string) {
    if (await isOnline()) {
      try {
        const remote = await api.solicitacoes.list({ obraId });
        await this.cacheMany(remote, obraId);
      } catch (error) {
        console.log("Background refresh failed:", error);
      }
    }
  }
}
```

---

## Conflict Resolution

### Decisão 8: Estratégia de Conflicts

| Cenário | Estratégia | Ação |
|--------|----------|------|
| **Same field, different value** | Last-Write-Wins | Mais recente sobrescreve |
| **Create local + Create remote** | Last-Write-Wins | Uma das duas é ignorada |
| **Delete local + Update remote** | remote wins | Mantém remote |
| **Update local + Delete remote** | local wins | Recria no server |

```typescript
// Conflict resolver
export function resolveConflict<T>(local: T, remote: T, localUpdatedAt: Date, remoteUpdatedAt: Date): T {
  // Last-write-wins strategy
  if (localUpdatedAt > remoteUpdatedAt) {
    return local;
  }
  return remote;
}
```

---

## Network Detection

### Decisão 9: Hook de Offline

```typescript
// apps/native/src/presentation/hooks/useOffline.ts
import { useNetInfo } from "expo-network";
import { create } from "zustand";

interface OfflineState {
  isOnline: boolean;
  lastOnline: Date | null;
  pendingSyncCount: number;
  setOnline: (online: boolean) => void;
  setPendingCount: (count: number) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: true,
  lastOnline: null,
  pendingSyncCount: 0,
  setOnline: (isOnline) => set({ 
    isOnline, 
    lastOnline: isOnline ? new Date() : undefined 
  }),
  setPendingCount: (pendingSyncCount) => set({ pendingSyncCount }),
}));

export function useOffline() {
  const netInfo = useNetInfo();
  const { isOnline, pendingSyncCount, setOnline, setPendingCount } = useOfflineStore();

  // Monitor network changes
  useEffect(() => {
    setOnline(netInfo.isConnected ?? false);
  }, [netInfo.isConnected]);

  // Check pending sync on mount
  useEffect(() => {
    if (isOnline) {
      syncQueue.processQueue().then(setPendingCount);
    }
  }, [isOnline]);

  return {
    isOnline,
    pendingSyncCount,
    isSyncing: pendingSyncCount > 0 && isOnline,
  };
}
```

---

## UI Indicators

### Decisão 10: Componentes de Status

```tsx
// Offline indicator component
export function SyncStatus() {
  const { isOnline, pendingSyncCount, isSyncing } = useOffline();

  if (isOnline && pendingSyncCount === 0) {
    return null; // Silent when everything is synced
  }

  return (
    <View style={styles.container}>
      {!isOnline && <Badge mode="warning">Offline</Badge>}
      {isSyncing && <Badge mode="info">Sync: {pendingSyncCount}</Badge>}
    </View>
  );
}
```

---

## Check-list de Implementação

### Fase 1: Setup Local (✅ IMPLEMENTADO)
- [x] Configurar expo-sqlite
- [x] Criar schema local
- [x] Implementar database.ts

### Fase 2: Repository Pattern (⏳ PENDENTE)
- [x] Criar interfaces de repository
- [ ] Implementar repositories locais
- [ ] Implementar cache híbrida

### Fase 3: Sync Queue (✅ IMPLEMENTADO)
- [x] Implementar SyncQueue
- [x] Implementar processQueue
- [x] Implementar retry logic

### Fase 4: Network Hooks (✅ IMPLEMENTADO)
- [x] Implementar useOffline hook
- [x] Implementar network detection
- [x] Auto-sync ao reconectar

### Fase 5: UI Integration (✅ IMPLEMENTADO)
- [x] Adicionar SyncStatus component
- [x] Implementar offline indicators
- [ ] Testar fluxos offline

---

## Referências

- [expo-sqlite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [expo-network](https://docs.expo.dev/versions/latest/sdk/network/)
- [TanStack Query - Offline Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-sutations)
- Blueprint técnico: obra360_blueprint.html

---

## Histórico de Alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-04-28 | Versão inicial do ADR | Arquiteto |
| 2026-04-28 | Implementado useOffline com auto-sync + SyncStatus component | Arquiteto |