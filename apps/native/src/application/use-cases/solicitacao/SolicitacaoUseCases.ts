import type {
	SolicitacaoMaterial,
	SolicitacaoStatus,
	Urgency,
} from "~/domain/entities";
import type { ISolicitacaoRepository } from "~/domain/repositories";

export interface CriarSolicitacaoInput {
	obraId: string;
	item: string;
	quantity: number;
	unit?: string;
	urgency?: Urgency;
	observation?: string;
	imageUrl?: string;
	voiceUrl?: string;
}

export interface AtualizarSolicitacaoInput {
	id: string;
	status?: SolicitacaoStatus;
	observation?: string;
}

export class CriarSolicitacaoUseCase {
	constructor(private solicitacaoRepository: ISolicitacaoRepository) {}

	async execute(
		input: CriarSolicitacaoInput,
		solicitanteId: string,
	): Promise<SolicitacaoMaterial> {
		if (!input.obraId) {
			throw new Error("ID da obra é obrigatório");
		}

		if (!input.item || input.item.trim().length === 0) {
			throw new Error("Item é obrigatório");
		}

		if (!input.quantity || input.quantity <= 0) {
			throw new Error("Quantidade deve ser maior que zero");
		}

		const validUrgencies: Urgency[] = ["NORMAL", "URGENTE", "CRITICAL"];
		if (input.urgency && !validUrgencies.includes(input.urgency)) {
			throw new Error("Urgência inválida");
		}

		return this.solicitacaoRepository.create({
			obraId: input.obraId,
			solicitanteId,
			item: input.item.trim(),
			quantity: input.quantity,
			unit: input.unit ?? "un",
			urgency: input.urgency ?? "NORMAL",
			observation: input.observation,
			imageUrl: input.imageUrl,
			voiceUrl: input.voiceUrl,
			status: "ABERTA",
		});
	}
}

export class ListarSolicitacoesUseCase {
	constructor(private solicitacaoRepository: ISolicitacaoRepository) {}

	async execute(obraId: string): Promise<SolicitacaoMaterial[]> {
		return this.solicitacaoRepository.findByObra(obraId);
	}
}

export class AprovarSolicitacaoUseCase {
	constructor(private solicitacaoRepository: ISolicitacaoRepository) {}

	async execute(id: string): Promise<SolicitacaoMaterial> {
		const solicitacao = await this.solicitacaoRepository.findById(id);
		if (!solicitacao) {
			throw new Error("Solicitação não encontrada");
		}

		if (
			solicitacao.status !== "ABERTA" &&
			solicitacao.status !== "EM_ANALISE"
		) {
			throw new Error(
				"Apenas solicitações em aberto ou em análise podem ser aprovadas",
			);
		}

		return this.solicitacaoRepository.updateStatus(id, "APROVADA");
	}
}

export class RejeitarSolicitacaoUseCase {
	constructor(private solicitacaoRepository: ISolicitacaoRepository) {}

	async execute(id: string, motivo: string): Promise<SolicitacaoMaterial> {
		const solicitacao = await this.solicitacaoRepository.findById(id);
		if (!solicitacao) {
			throw new Error("Solicitação não encontrada");
		}

		if (
			solicitacao.status !== "ABERTA" &&
			solicitacao.status !== "EM_ANALISE"
		) {
			throw new Error(
				"Apenas solicitações em aberto ou em análise podem ser rejeitadas",
			);
		}

		return this.solicitacaoRepository.updateStatus(id, "REJEITADA");
	}
}

export class AtualizarStatusUseCase {
	constructor(private solicitacaoRepository: ISolicitacaoRepository) {}

	async execute(
		input: AtualizarSolicitacaoInput,
	): Promise<SolicitacaoMaterial> {
		const solicitacao = await this.solicitacaoRepository.findById(input.id);
		if (!solicitacao) {
			throw new Error("Solicitação não encontrada");
		}

		const validTransitions: Record<SolicitacaoStatus, SolicitacaoStatus[]> = {
			ABERTA: ["EM_ANALISE", "CANCELADA"],
			EM_ANALISE: ["EM_COTACAO", "APROVADA", "REJEITADA", "CANCELADA"],
			EM_COTACAO: ["APROVADA", "CANCELADA"],
			APROVADA: ["COMPRADA"],
			COMPRADA: ["ENVIADA"],
			ENVIADA: ["ENTREGUE"],
			ENTREGUE: [],
			CANCELADA: [],
			REJEITADA: [],
		};

		if (
			input.status &&
			!validTransitions[solicitacao.status].includes(input.status)
		) {
			throw new Error(
				`Não é possível alterar de ${solicitacao.status} para ${input.status}`,
			);
		}

		return this.solicitacaoRepository.updateStatus(
			input.id,
			input.status ?? solicitacao.status,
		);
	}
}
