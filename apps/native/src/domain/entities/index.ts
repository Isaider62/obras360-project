// Enum Types
export type Perfil = "ENCARREGADO" | "COMPRAS" | "GESTAO";
export type StatusObra =
	| "PLANEJAMENTO"
	| "EM_ANDAMENTO"
	| "CONCLUIDO"
	| "ARQUIVADO";
export type Urgency = "NORMAL" | "URGENTE" | "CRITICAL";
export type SolicitacaoStatus =
	| "ABERTA"
	| "EM_ANALISE"
	| "EM_COTACAO"
	| "APROVADA"
	| "COMPRADA"
	| "ENVIADA"
	| "ENTREGUE"
	| "CANCELADA"
	| "REJEITADA";
export type EtapaObra =
	| "FUNDACAO"
	| "ESTRUTURA"
	| "ALVENARIA"
	| "INSTALACOES"
	| "ACABAMENTO";
export type TipoAlerta =
	| "FALTA_MATERIAL"
	| "ATRASO"
	| "INTERFERENCIA"
	| "CUSTO"
	| "PRAZO"
	| "SINCRONIZACAO";
export type Severity = "INFO" | "WARNING" | "ALERT" | "CRITICAL";

export interface User {
	id: string;
	name: string;
	email: string;
	image?: string;
	perfil: Perfil;
	biometriaHash?: string;
	ativo: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Obra {
	id: string;
	name: string;
	address?: string;
	status: StatusObra;
	startDate?: Date;
	endDate?: Date;
	finishedDate?: Date;
	budgetTotal?: number;
	budgetCurrent?: number;
	location?: { lat: number; lng: number };
	encarregadoId?: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export interface SolicitacaoMaterial {
	id: string;
	obraId: string;
	solicitanteId: string;
	item: string;
	quantity: number;
	unit: string;
	urgency: Urgency;
	observation?: string;
	imageUrl?: string;
	voiceUrl?: string;
	status: SolicitacaoStatus;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export interface RegistroPonto {
	id: string;
	obraId: string;
	encarregadoId: string;
	date: Date;
	entryTime?: Date;
	exitTime?: Date;
	team?: Array<{ id: string; name: string; entryTime?: Date; exitTime?: Date }>;
	signatureUrl?: string;
	weather?: string;
	synced: boolean;
	syncError?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface DiarioObra {
	id: string;
	obraId: string;
	userId: string;
	date: Date;
	activities?: string;
	problems?: string;
	notes?: string;
	progressPct?: number;
	weather?: { temp: number; condition: string; wind: number; humidity: number };
	synced: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Foto {
	id: string;
	obraId: string;
	userId: string;
	url: string;
	thumbnail?: string;
	stageIa?: EtapaObra;
	confidenceIa?: number;
	tagsIa?: string;
	location?: { lat: number; lng: number };
	capturedAt: Date;
	synced: boolean;
	createdAt: Date;
}

export interface Alerta {
	id: string;
	obraId: string;
	userId?: string;
	type: TipoAlerta;
	source: "USUARIO" | "SISTEMA" | "IA";
	severity: Severity;
	title: string;
	description?: string;
	data?: Record<string, unknown>;
	resolved: boolean;
	resolvedAt?: Date;
	resolution?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface SyncQueueItem {
	id: string;
	entity: string;
	entityId: string;
	operation: "CREATE" | "UPDATE" | "DELETE";
	payload: Record<string, unknown>;
	attempts: number;
	lastError?: string;
	syncedAt?: Date;
	createdAt: Date;
}
