import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { config } from '../config.js'
import { getDb, uid } from './client.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
void __dirname

export function migrate(database?: Database.Database): void {
  const db = database ?? getDb()
  const root = config.root
  execSqlFile(db, path.join(root, 'db/migrations/001_init.sqlite.sql'))
  execSqlFileSafe(db, path.join(root, 'db/migrations/002_research_script_runs.sqlite.sql'))
  execSqlFileSafe(db, path.join(root, 'db/migrations/003_production.sqlite.sql'))
  execSqlFileSafe(db, path.join(root, 'db/migrations/004_publishing.sqlite.sql'))
  execSqlFileSafe(db, path.join(root, 'db/migrations/005_youtube_controlled.sqlite.sql'))
  execSqlFileSafe(db, path.join(root, 'db/migrations/006_production_validation.sqlite.sql'))
  seedPrompts(db)
}

function execSqlFile(db: Database.Database, sqlPath: string): void {
  const sql = fs.readFileSync(sqlPath, 'utf8')
  db.exec(sql)
}

/** Apply statements one-by-one; ignore duplicate-column / duplicate-index errors on re-run. */
function execSqlFileSafe(db: Database.Database, sqlPath: string): void {
  if (!fs.existsSync(sqlPath)) return
  const sql = fs.readFileSync(sqlPath, 'utf8')
  const parts = sql
    .split(';')
    .map((s) =>
      s
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim(),
    )
    .filter(Boolean)
  for (const stmt of parts) {
    try {
      db.exec(stmt)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (
        /duplicate column name/i.test(msg) ||
        /already exists/i.test(msg) ||
        /duplicate column/i.test(msg)
      ) {
        continue
      }
      throw err
    }
  }
}

function seedPrompts(db: Database.Database): void {
  const prompts: Array<{ name: string; body: string }> = [
    {
      name: 'script_generator',
      body: `Você é roteirista dark da NEXUS/CWM.
Gere roteiro estruturado JSON: hook, setup, problem, insight, value, proof, cta.
CTA padrão: Peguei os prompts que uso e deixei no link da bio.
Nunca copie propriedade intelectual; transforme substancialmente.`,
    },
    {
      name: 'hook_generator',
      body: `Gere 5 hooks de 3 segundos com tipos CURIOSITY/QUESTION/CONTRARIAN/WARNING/RESULT/LIST/SECRET/MISTAKE/COMPARISON/STORY.
Cada hook: text, type, score, reason.`,
    },
    {
      name: 'cta_generator',
      body: `Gere CTA curto adaptado à plataforma (bio/descrição/pin) sem promessas proibidas.`,
    },
    {
      name: 'caption_generator',
      body: `Gere caption curta + hashtags leves alinhadas ao hook e à plataforma.`,
    },
    {
      name: 'visual_brief_generator',
      body: `Gere brief visual dark: shots com timing, estilo screen+captions, endcard de oferta.`,
    },
    {
      name: 'script_qa',
      body: `Valide roteiro: seções, CTA, duração, claims proibidos, marcadores de alucinação. Retorne pass|requires_review|fail + notes.`,
    },
    {
      name: 'research_topic_extractor',
      body: `Extraia tópicos rastreáveis a partir de fontes normalizadas. Preserve sourceUrl e provider.`,
    },
    {
      name: 'content_recycler',
      body: `A partir de um conteúdo vencedor, gere derivações com newAngle, newHook e newScript.
Tipos: PART_2, TUTORIAL, FAQ, COMPARISON, MYTH, MISTAKE, CASE_STUDY, NEW_HOOK, NEW_CTA, NEW_AVATAR, NEW_PLATFORM.`,
    },
    {
      name: 'strategy_agent',
      body: `Analise performance 7/14/30 dias e produza recomendações acionáveis:
Top Topics, Hooks, Formats, Platforms, CTAs, Offers, Worst Content, Gaps, Recommended Actions.`,
    },
    {
      name: 'idea_generator',
      body: `Gere 10 ideias de conteúdo dark a partir do tópico, com angles e formats (lista, tutorial, comparativo, erro, mito).`,
    },
  ]

  const insert = db.prepare(
    `INSERT OR IGNORE INTO prompt_versions (id, name, version, body, active) VALUES (?, ?, 1, ?, 1)`,
  )
  for (const p of prompts) {
    insert.run(uid(), p.name, p.body)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
  console.log('Migrated', config.dbPath)
}
