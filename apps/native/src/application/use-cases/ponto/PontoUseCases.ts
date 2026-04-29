import type { RegistroPonto } from "~/domain/entities";
import type { IPontoRepository } from "~/domain/repositories";

export interface RegistrarPontoInput {
	obraId: string;
	encarregadoId: string;
	team?: Array<{ id: string; name: string }>;
	weather?: string;
}

export interface RegistrarSaidaInput {
	id: string;
	exitTime?: Date;
	signatureUrl?: string;
}

export class RegistrarPontoUseCase {
	constructor(private pontoRepository: IPontoRepository) {}

	async executeEntrada(input: RegistrarPontoInput): Promise<RegistroPonto> {
		if (!input.obraId) {
			throw new Error("ID da obra é obrigatório");
		}

		if (!input.encarregadoId) {
			throw new Error("ID do encargado é obrigatório");
		}

		const hoje = new Date();
		hoje.setHours(0, 0, 0, 0);

		const existingPonto = await this.pontoRepository.findByDate(
			input.obraId,
			hoje,
		);
		if (existingPonto) {
			throw new Error("Já existe registro de ponto para hoje nesta obra");
		}

		return this.pontoRepository.create({
			obraId: input.obraId,
			encarregadoId: input.encarregadoId,
			date: hoje,
			entryTime: new Date(),
			team: input.team,
			weather: input.weather,
			synced: false,
		});
	}
}

export class RegistrarSaidaUseCase {
	constructor(private pontoRepository: IPontoRepository) {}

	async execute(input: RegistrarSaidaInput): Promise<RegistroPonto> {
		const { id, exitTime, signatureUrl } = input;

		const ponto = await this.pontoRepository.findById(id);
		if (!ponto) {
			throw new Error("Registro de ponto não encontrado");
		}

		if (ponto.exitTime) {
			throw new Error("Já foi registrada saída neste ponto");
		}

		return this.pontoRepository.update(id, {
			exitTime: exitTime ?? new Date(),
			signatureUrl,
			synced: false,
		});
	}
}

export class ListarPontosUseCase {
	constructor(private pontoRepository: IPontoRepository) {}

	async execute(obraId: string): Promise<RegistroPonto[]> {
		return this.pontoRepository.findByObra(obraId);
	}
}

export class BuscarPontoDoDiaUseCase {
	constructor(private pontoRepository: IPontoRepository) {}

	async execute(obraId: string, date: Date): Promise<RegistroPonto | null> {
		return this.pontoRepository.findByDate(obraId, date);
	}
}
