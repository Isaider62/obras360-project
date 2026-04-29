import { db } from "@obras360-project/db";
import type { SolicitacaoStatus, Urgency } from "@prisma/client";

export class SolicitacaoService {
	async findMany(args?: Parameters<typeof db.solicitacaoMaterial.findMany>[0]) {
		return db.solicitacaoMaterial.findMany(args);
	}

	async findUnique(
		args: Parameters<typeof db.solicitacaoMaterial.findUnique>[0],
	) {
		return db.solicitacaoMaterial.findUnique(args);
	}

	async findById(id: string) {
		return db.solicitacaoMaterial.findUnique({ where: { id } });
	}

	async findByObra(obraId: string) {
		return db.solicitacaoMaterial.findMany({
			where: { obraId, deletedAt: null },
			orderBy: { createdAt: "desc" },
		});
	}

	async findByStatus(status: SolicitacaoStatus) {
		return db.solicitacaoMaterial.findMany({
			where: { status, deletedAt: null },
			orderBy: { createdAt: "desc" },
		});
	}

	async create(
		data: Parameters<typeof db.solicitacaoMaterial.create>[0]["data"],
	) {
		return db.solicitacaoMaterial.create({ data });
	}

	async update(
		id: string,
		data: Parameters<typeof db.solicitacaoMaterial.update>[0]["data"],
	) {
		return db.solicitacaoMaterial.update({
			where: { id },
			data,
		});
	}

	async updateStatus(id: string, status: SolicitacaoStatus) {
		return db.solicitacaoMaterial.update({
			where: { id },
			data: { status, updatedAt: new Date() },
		});
	}

	async delete(id: string) {
		return db.solicitacaoMaterial.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}

	async deletePermanently(id: string) {
		return db.solicitacaoMaterial.delete({ where: { id } });
	}

	async count(args?: Parameters<typeof db.solicitacaoMaterial.count>[0]) {
		return db.solicitacaoMaterial.count(args);
	}

	async getStats() {
		const [total, urgentes, pendentes, emAnalise] = await Promise.all([
			db.solicitacaoMaterial.count({ where: { deletedAt: null } }),
			db.solicitacaoMaterial.count({
				where: { urgency: "URGENTE", deletedAt: null },
			}),
			db.solicitacaoMaterial.count({
				where: { status: "ABERTA", deletedAt: null },
			}),
			db.solicitacaoMaterial.count({
				where: { status: "EM_ANALISE", deletedAt: null },
			}),
		]);
		return { total, urgentes, pendentes, emAnalise };
	}

	async getByUrgency() {
		const [normal, urgente, critical] = await Promise.all([
			db.solicitacaoMaterial.count({
				where: { urgency: "NORMAL", deletedAt: null },
			}),
			db.solicitacaoMaterial.count({
				where: { urgency: "URGENTE", deletedAt: null },
			}),
			db.solicitacaoMaterial.count({
				where: { urgency: "CRITICAL", deletedAt: null },
			}),
		]);
		return { normal, urgente, critical };
	}

	async getAbertasPorTempo() {
		const tresDiasAtras = new Date();
		tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

		return db.solicitacaoMaterial.findMany({
			where: {
				status: { in: ["ABERTA", "EM_ANALISE", "EM_COTACAO"] },
				deletedAt: null,
				createdAt: { lt: tresDiasAtras },
			},
		});
	}
}

export const solicitacaoService = new SolicitacaoService();
