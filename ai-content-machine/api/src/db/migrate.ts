import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { config } from '../config.js'
import { getDb, uid } from './client.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function migrate(database?: Database.Database): void {
  const db = database ?? getDb()
  const sqlPath = path.join(config.root, 'db/migrations/001_init.sqlite.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')
  db.exec(sql)
  seedPrompts(db)
}

function seedPrompts(db: Database.Database): void {
  const prompts: Array<{ name: string; body: string }> = [
    {
      name: 'script_generator',
      body: `Você é roteirista dark da NEXUS/CWM.
Gere roteiro curto HOOK→PROBLEMA→INSIGHT→SOLUÇÃO→CTA.
CTA padrão: Peguei os prompts que uso e deixei no link da bio.
Nunca copie propriedade intelectual; transforme substancialmente.`,
    },
    {
      name: 'hook_generator',
      body: `Gere 5 hooks de 3 segundos para conteúdo curto de IA + renda/produtividade.
Seja específico, sem clickbait vazio.`,
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
