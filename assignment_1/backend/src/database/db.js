import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure database directory exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(config.dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables if they do not exist
export function initSchema() {
  const schemaCandidates = [
    path.resolve(__dirname, '../../database/schema.sql'),
    path.resolve(__dirname, '../../../database/schema.sql'),
  ];
  for (const schemaPath of schemaCandidates) {
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schemaSql);
      break;
    }
  }
}

// Helper methods for clean SQL execution
export const dbHelper = {
  all(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },

  run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },

  exec(sql) {
    return db.exec(sql);
  }
};

initSchema();
