import { db } from "@obras360-project/db";
import type { Severity, TipoAlerta } from "@prisma/client";

export class AlertaService {
	async findMany(args?: Parameters<typeof db.alerta.findMany>[0]) {
		return db.alerta.findMany(args);
	}

	async findUnique(args: Parameters<typeof db.alerta.findUnique>[0]) {
		return db.alerta.findUnique(args);
	}

	async findById(id: string) {
		return db.alerta.findUnique({ where: { id } });
	}

	async findByObra(obraId: string, opts?: { unresolved?: boolean }) {
		return db.alerta.findMany({
			where: {
				obraId,
				...(opts?.unresolved ? { resolved: false } : {}),
			},
			orderBy: { createdAt: "desc" },
		});
	}

	async findUnresolved() {
		return db.alerta.findMany({
			where: { resolved: false },
			orderBy: { createdAt: "desc" },
		});
	}

	async create(data: {
		obraId: string;
		type: TipoAlerta;
		severity: Severity;
		title: string;
		description?: string;
		data?: Record<string, unknown>;
		userId?: string;
	}) {
		return db.alerta.create({
			data: {
				...data,
				source: data.userId ? "USUARIO" : "SISTEMA",
			},
		});
	}

	async resolve(id: string, resolution?: string) {
		return db.alerta.update({
			where: { id },
			data: {
				resolved: true,
				resolvedAt: new Date(),
				resolution,
			},
		});
	}

	async delete(id: string) {
		return db.alerta.delete({ where: { id } });
	}

	async count(args?: Parameters<typeof db.alerta.count>[0]) {
		return db.alerta.count(args);
	}

	async getNaoResolvidos() {
		return db.alerta.count({ where: { resolved: false } });
	}

	async getPorTipo() {
		const [faltaMaterial, atraso, interferencia, custo, prazo] =
			await Promise.all([
				db.alerta.count({ where: { type: "FALTA_MATERIAL", resolved: false } }),
				db.alerta.count({ where: { type: "ATRASO", resolved: false } }),
				db.alerta.count({ where: { type: "INTERFERENCIA", resolved: false } }),
				db.alerta.count({ where: { type: "CUSTO", resolved: false } }),
				db.alerta.count({ where: { type: "PRAZO", resolved: false } }),
			]);
		return { faltaMaterial, atraso, interferencia, custo, prazo };
	}

	async getPorSeveridade() {
		const [info, warning, alert, critical] = await Promise.all([
			db.alerta.count({ where: { severity: "INFO", resolved: false } }),
			db.alerta.count({ where: { severity: "WARNING", resolved: false } }),
			db.alerta.count({ where: { severity: "ALERT", resolved: false } }),
			db.alerta.count({ where: { severity: "CRITICAL", resolved: false } }),
		]);
		return { info, warning, alert, critical };
	}
}

export const alertaService = new AlertaService();
