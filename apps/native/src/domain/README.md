# Domain Layer

Esta camada contém a lógica de negócio pura do OBRA360, sem dependências de frameworks ou infraestrutura.

## O que faz esta camada

- **Entities**: Definições de tipos e interfaces do domínio
- **Value Objects**: Tipos imutáveis com validação (Urgencia, Status, etc)
- **Repository Interfaces**: Contratos que a Infrastructure deve implementar

## Estrutura

```
domain/
├── entities/
│   └── index.ts          # Tipos: User, Obra, SolicitacaoMaterial, etc
└── repositories/
    └── index.ts         # Interfaces: IObraRepository, ISolicitacaoRepository, etc
```

## O que já está implementado

- ✅ entities/index.ts - Todos os tipos do domínio
- ✅ repositories/index.ts - Interfaces de repositório

## Como usar

```typescript
import type { Obra, SolicitacaoMaterial } from "~/domain/entities";
import type { IObraRepository } from "~/domain/repositories";
```

## Para adicionar nova entidade

1. Adicionar tipo em `entities/index.ts`
2. Adicionar interface em `repositories/index.ts`
3. Implementar em Infrastructure Layer