import type { SyncQueueItem } from "~/domain/entities";
import { getDatabase } from "./database";

export class SyncQueue {
	async enqueue(
		entity: string,
		entityId: string,
		operation: "CREATE" | "UPDATE" | "DELETE",
		payload: Record<string, unknown>,
	) {
		const db = await getDatabase();
		const id = crypto.randomUUID();
		const now = new Date().toISOString();

		await db.runAsync(
			`INSERT INTO sync_queue (id, entity, entity_id, operation, payload, attempts, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
			[id, entity, entityId, operation, JSON.stringify(payload), now],
		);

		return id;
	}

	async processQueue() {
		const db = await getDatabase();

		const pending = await db.getAllAsync<SyncQueueItem & { payload: string }>(
			"SELECT * FROM sync_queue WHERE attempts < 3 ORDER BY created_at ASC LIMIT 50",
		);

		for (const item of pending) {
			try {
				// TODO: Implementar chamada API real
				// await api.sync(item);

				await db.runAsync(
					"UPDATE sync_queue SET synced_at = ?, attempts = attempts + 1 WHERE id = ?",
					[new Date().toISOString(), item.id],
				);
			} catch (error) {
				await db.runAsync(
					"UPDATE sync_queue SET last_error = ?, attempts = attempts + 1 WHERE id = ?",
					[(error as Error).message, item.id],
				);
			}
		}
	}

	async getPendingCount(): Promise<number> {
		const db = await getDatabase();
		const result = await db.getFirstAsync<{ count: number }>(
			"SELECT COUNT(*) as count FROM sync_queue WHERE synced_at IS NULL",
		);
		return result?.count ?? 0;
	}

	async clearSynced() {
		const db = await getDatabase();
		await db.runAsync("DELETE FROM sync_queue WHERE synced_at IS NOT NULL");
	}
}

export const syncQueue = new SyncQueue();
