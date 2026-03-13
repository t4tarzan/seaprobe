import Database from "better-sqlite3";
import type { Device, TelemetryPayload, TelemetryRow } from "../types.js";

let db: Database.Database;

export function initStorage(dbPath: string = "seaprobe.db"): void {
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      last_seen TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS telemetry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      cpu_temp REAL,
      ram_used_pct REAL,
      uptime_sec INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );
  `);
}

export function getDb(): Database.Database {
  return db;
}

export function upsertDevice(id: string, name?: string): void {
  const stmt = db.prepare(`
    INSERT INTO devices (id, name, last_seen)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET last_seen = datetime('now')
  `);
  stmt.run(id, name ?? id);
}

export function getDevices(): Device[] {
  const rows = db.prepare("SELECT id, name, last_seen FROM devices ORDER BY last_seen DESC").all() as Array<{
    id: string;
    name: string;
    last_seen: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    lastSeen: r.last_seen,
    healthScore: null, // computed separately
  }));
}

export function getDevice(id: string): Device | null {
  const row = db.prepare("SELECT id, name, last_seen FROM devices WHERE id = ?").get(id) as {
    id: string;
    name: string;
    last_seen: string | null;
  } | undefined;

  if (!row) return null;
  return { id: row.id, name: row.name, lastSeen: row.last_seen, healthScore: null };
}

export function insertTelemetry(payload: TelemetryPayload): void {
  const stmt = db.prepare(`
    INSERT INTO telemetry (device_id, cpu_temp, ram_used_pct, uptime_sec)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(payload.deviceId, payload.cpuTemp, payload.ramUsedPct, payload.uptimeSec);
}

export function getRecentTelemetry(deviceId: string, limit: number = 60): TelemetryRow[] {
  return db.prepare(`
    SELECT id, device_id as deviceId, cpu_temp as cpuTemp, ram_used_pct as ramUsedPct,
           uptime_sec as uptimeSec, created_at as createdAt
    FROM telemetry
    WHERE device_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(deviceId, limit) as TelemetryRow[];
}

export function closeStorage(): void {
  if (db) db.close();
}
