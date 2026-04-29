import type { Obra, StatusObra } from "~/domain/entities";
import type { IObraRepository } from "~/domain/repositories";

export interface CriarObraInput {
	name: string;
	address?: string;
	startDate?: string;
	endDate?: string;
	budgetTotal?: number;
	location?: { lat: number; lng: number };
}

export interface AtualizarObraInput extends Partial<CriarObraInput> {
	id: string;
	status?: StatusObra;
}

export class CriarObraUseCase {
	constructor(private obraRepository: IObraRepository) {}

	async execute(input: CriarObraInput): Promise<Obra> {
		if (!input.name || input.name.trim().length === 0) {
			throw new Error("Nome da obra é obrigatório");
		}

		if (input.name.length > 200) {
			throw new Error("Nome deve ter menos de 200 caracteres");
		}

		if (input.budgetTotal && input.budgetTotal <= 0) {
			throw new Error("Orçamento deve ser positivo");
		}

		return this.obraRepository.create({
			name: input.name.trim(),
			address: input.address,
			startDate: input.startDate ? new Date(input.startDate) : undefined,
			endDate: input.endDate ? new Date(input.endDate) : undefined,
			budgetTotal: input.budgetTotal,
			location: input.location,
			status: "PLANEJAMENTO",
		});
	}
}

export class ListarObrasUseCase {
	constructor(private obraRepository: IObraRepository) {}

	async execute(): Promise<Obra[]> {
		return this.obraRepository.findAll();
	}
}

export class AtualizarObraUseCase {
	constructor(private obraRepository: IObraRepository) {}

	async execute(input: AtualizarObraInput): Promise<Obra> {
		const obra = await this.obraRepository.findById(input.id);
		if (!obra) {
			throw new Error("Obra não encontrada");
		}

		if (input.status === "CONCLUIDO" && obra.status === "PLANEJAMENTO") {
			throw new Error("Não é possível concluir uma obra em planejamento");
		}

		return this.obraRepository.update(input.id, input);
	}
}

export class BuscarObraUseCase {
	constructor(private obraRepository: IObraRepository) {}

	async execute(id: string): Promise<Obra | null> {
		return this.obraRepository.findById(id);
	}
}

export class DeletarObraUseCase {
	constructor(private obraRepository: IObraRepository) {}

	async execute(id: string): Promise<void> {
		const obra = await this.obraRepository.findById(id);
		if (!obra) {
			throw new Error("Obra não encontrada");
		}

		return this.obraRepository.delete(id);
	}
}
