import Fastify from 'fastify'
import cors from '@fastify/cors'
import { config } from './config.js'
import { getDb } from './db/client.js'
import { automationRoutes } from './routes/automation.js'
import { webhookRoutes } from './routes/webhooks.js'
import { promptRoutes } from './routes/prompts.js'
import { workspaceRoutes } from './routes/workspaces.js'
import { researchRoutes } from './routes/research.js'
import { scriptRoutes } from './routes/scripts.js'
import { productionRoutes } from './routes/production.js'

export async function buildServer() {
  getDb()
  const app = Fastify({ logger: true })
  await app.register(cors, { origin: true })

  app.get('/health', async () => ({
    ok: true,
    service: 'cwm-api',
    automationMode: config.automationMode,
  }))

  await app.register(automationRoutes)
  await app.register(webhookRoutes)
  await app.register(promptRoutes)
  await app.register(workspaceRoutes)
  await app.register(researchRoutes)
  await app.register(scriptRoutes)
  await app.register(productionRoutes)

  return app
}

const isDirect = process.argv[1] && import.meta.url.includes(process.argv[1].split('/').pop()!)
if (isDirect) {
  const app = await buildServer()
  await app.listen({ port: config.port, host: '0.0.0.0' })
}
