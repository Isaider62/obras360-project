# Application Layer

Esta camada contém os **Use Cases** - casos de uso da aplicação. É responsável por orquestrar a lógica de negócio, validando dados e coordenando entidades.

## O que faz esta camada

- **Use Cases**: Classes que executam uma ação específica (Criar, Listar, Atualizar, etc)
- **DTOs**: Data Transfer Objects para entrada e saída de dados
- **Validações**: Regras de negócio específicas dos use cases

## Estrutura

```
application/
├── use-cases/
│   ├── obra/
│   │   └── ObraUseCases.ts      # CriarObra, ListarObras, etc
│   ├── solicitacao/
│   │   └── SolicitacaoUseCases.ts # CriarSolicitacao, Aprovar, etc
│   └── ponto/
│       └── PontoUseCases.ts     # RegistrarPonto, RegistroSaida
├── dto/                        # DTOs (em construção)
└── index.ts                   # Exporta todos os use cases
```

## O que já está implementado

- ✅ obra/ObraUseCases.ts - CRUD completo de obras
- ✅ solicitacao/SolicitacaoUseCases.ts - CRUD + workflow de aprovação
- ✅ ponto/PontoUseCases.ts - Registro de ponto com entrada/saída
- ✅ use-cases/index.ts - Exports

## Como usar

```typescript
import { CriarObraUseCase, ListarObrasUseCase } from "~/application/use-cases";

// Com injeção de dependência
const criarObra = new CriarObraUseCase(obraRepository);
const obra = await criarObra.execute({ name: "Obra Nova" });
```

## Regras de negócio implementadas

- **Obra**: Nome obrigatório, orçamento positivo
- **Solicitação**: Validações de estado (workflow), transições permitidas
- **Ponto**: Um ponto por dia por obra, registrar saída apenas após entrada

## Para adicionar novo Use Case

1. Criar arquivo em `use-cases/<feature>/<Nome>UseCases.ts`
2. Implementar classe com método `execute()`
3. Adicionar export em `use-cases/index.ts`
4. Documentar regras de negócio