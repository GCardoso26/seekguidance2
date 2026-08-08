import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { config } from '../config.js'
import { migrate } from './migrate.js'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true })
  db = new Database(config.dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  return db
}

export function resetDbForTests(tmpPath: string): Database.Database {
  if (db) {
    db.close()
    db = null
  }
  process.env.CWM_DB_PATH = tmpPath
  config.dbPath = tmpPath
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
  return getDb()
}

export function uid(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}
