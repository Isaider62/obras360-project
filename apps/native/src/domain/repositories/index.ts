import type {
	Alerta,
	DiarioObra,
	Foto,
	Obra,
	RegistroPonto,
	SolicitacaoMaterial,
} from "../entities";

export interface IObraRepository {
	findAll(): Promise<Obra[]>;
	findById(id: string): Promise<Obra | null>;
	create(data: Partial<Obra>): Promise<Obra>;
	update(id: string, data: Partial<Obra>): Promise<Obra>;
	delete(id: string): Promise<void>;
}

export interface ISolicitacaoRepository {
	findByObra(obraId: string): Promise<SolicitacaoMaterial[]>;
	findById(id: string): Promise<SolicitacaoMaterial | null>;
	create(data: Partial<SolicitacaoMaterial>): Promise<SolicitacaoMaterial>;
	updateStatus(id: string, status: string): Promise<SolicitacaoMaterial>;
}

export interface IAlertaRepository {
	findByObra(obraId: string): Promise<Alerta[]>;
	create(data: Partial<Alerta>): Promise<Alerta>;
	resolve(id: string): Promise<Alerta>;
}

export interface IDiarioRepository {
	findByObra(obraId: string): Promise<DiarioObra[]>;
	findByDate(obraId: string, date: Date): Promise<DiarioObra | null>;
	create(data: Partial<DiarioObra>): Promise<DiarioObra>;
}

export interface IFotoRepository {
	findByObra(obraId: string): Promise<Foto[]>;
	create(data: Partial<Foto>): Promise<Foto>;
}

export interface IPontoRepository {
	findByObra(obraId: string): Promise<RegistroPonto[]>;
	findByDate(obraId: string, date: Date): Promise<RegistroPonto | null>;
	create(data: Partial<RegistroPonto>): Promise<RegistroPonto>;
}
