import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '../config/env.js';

let db;

export function getDatabase() {
  if (!db) {
    fs.mkdirSync(path.dirname(env.databasePath), { recursive: true });
    db = new Database(env.databasePath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }

  return db;
}

export function runMigrations() {
  const schemaPath = new URL('./schema.sql', import.meta.url);
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const database = getDatabase();

  database.exec(schema);
  ensureColumn(database, 'entries', 'entry_time', 'TEXT');
  ensureColumn(database, 'entries', 'writing_started_at', 'TEXT');
  ensureColumn(database, 'entries', 'writing_ended_at', 'TEXT');
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = undefined;
  }
}

function ensureColumn(database, table, column, type) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all();
  const exists = columns.some((currentColumn) => currentColumn.name === column);

  if (!exists) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}
