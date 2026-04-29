import * as SQLite from "expo-sqlite";

const DB_NAME = "obra360.db";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (!db) {
		db = await SQLite.openDatabaseAsync(DB_NAME);
		await initializeSchema();
	}
	return db;
}

async function initializeSchema() {
	if (!db) return;

	await db.execAsync(`
    CREATE TABLE IF NOT EXISTS obra (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      status TEXT DEFAULT 'PLANEJAMENTO',
      start_date TEXT,
      end_date TEXT,
      budget_total REAL,
      budget_current REAL,
      location TEXT,
      encarregado_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS solicitacao_material (
      id TEXT PRIMARY KEY,
      obra_id TEXT NOT NULL,
      solicitante_id TEXT NOT NULL,
      item TEXT NOT NULL,
      quantity REAL,
      unit TEXT DEFAULT 'un',
      urgency TEXT DEFAULT 'NORMAL',
      observation TEXT,
      image_url TEXT,
      voice_url TEXT,
      status TEXT DEFAULT 'ABERTA',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS registro_ponto (
      id TEXT PRIMARY KEY,
      obra_id TEXT NOT NULL,
      encarregado_id TEXT NOT NULL,
      date TEXT NOT NULL,
      entry_time TEXT,
      exit_time TEXT,
      team TEXT,
      signature_url TEXT,
      weather TEXT,
      synced INTEGER DEFAULT 0,
      sync_error TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS diario_obra (
      id TEXT PRIMARY KEY,
      obra_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      activities TEXT,
      problems TEXT,
      notes TEXT,
      progress_pct REAL,
      weather TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS foto (
      id TEXT PRIMARY KEY,
      obra_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail TEXT,
      stage_ia TEXT,
      confidence_ia REAL,
      tags_ia TEXT,
      location TEXT,
      captured_at TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS alerta (
      id TEXT PRIMARY KEY,
      obra_id TEXT NOT NULL,
      user_id TEXT,
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      data TEXT,
      resolved INTEGER DEFAULT 0,
      resolved_at TEXT,
      resolution TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT,
      attempts INTEGER DEFAULT 0,
      last_error TEXT,
      synced_at TEXT,
      created_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_solicitacao_obra ON solicitacao_material(obra_id);
    CREATE INDEX IF NOT EXISTS idx_ponto_obra ON registro_ponto(obra_id);
    CREATE INDEX IF NOT EXISTS idx_diario_obra ON diario_obra(obra_id);
    CREATE INDEX IF NOT EXISTS idx_foto_obra ON foto(obra_id);
    CREATE INDEX IF NOT EXISTS idx_alerta_obra ON alerta(obra_id);
  `);
}

export async function closeDatabase() {
	if (db) {
		await db.closeAsync();
		db = null;
	}
}
