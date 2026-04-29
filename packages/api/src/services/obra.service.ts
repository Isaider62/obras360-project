import { db } from "@obras360-project/db";
import type { DefaultArgs } from "@prisma/client/runtime/library";

export class ObraService {
	async findMany(args?: Parameters<typeof db.obra.findMany>[0]) {
		return db.obra.findMany(args);
	}

	async findUnique(args: Parameters<typeof db.obra.findUnique>[0]) {
		return db.obra.findUnique(args);
	}

	async findById(id: string) {
		return db.obra.findUnique({ where: { id } });
	}

	async findAll(args?: { status?: string }) {
		const where = args?.status
			? { status: args.status as never, deletedAt: null }
			: { deletedAt: null };
		return db.obra.findMany({
			where,
			orderBy: { createdAt: "desc" },
		});
	}

	async create(data: Parameters<typeof db.obra.create>[0]["data"]) {
		return db.obra.create({ data });
	}

	async update(args: Parameters<typeof db.obra.update>[0]) {
		const { id, ...data } = args;
		return db.obra.update({
			where: { id },
			data,
		});
	}

	async delete(id: string) {
		return db.obra.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}

	async count(args?: Parameters<typeof db.obra.count>[0]) {
		return db.obra.count(args);
	}

	async getStats() {
		const [total, emAndamento, concluidas, pendentes] = await Promise.all([
			db.obra.count({ where: { deletedAt: null } }),
			db.obra.count({ where: { status: "EM_ANDAMENTO", deletedAt: null } }),
			db.obra.count({ where: { status: "CONCLUIDO", deletedAt: null } }),
			db.solicitacaoMaterial.count({
				where: { status: "ABERTA", deletedAt: null },
			}),
		]);
		return { total, emAndamento, concluidas, pendentes };
	}
}

export const obraService = new ObraService();
