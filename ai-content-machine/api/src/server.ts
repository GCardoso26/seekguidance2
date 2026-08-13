import Fastify from 'fastify'
import cors from '@fastify/cors'
import { config } from './config.js'
import { getDb } from './db/client.js'
import { automationRoutes } from './routes/automation.js'
import { webhookRoutes } from './routes/webhooks.js'
import { promptRoutes } from './routes/prompts.js'
import { workspaceRoutes } from './routes/workspaces.js'
import { researchRoutes } from './routes/research.js'
import { ideaRoutes } from './routes/ideas.js'
import { scriptRoutes } from './routes/scripts.js'
import { productionRoutes } from './routes/production.js'
import { publishingRoutes } from './routes/publishing.js'
import { connectionRoutes } from './routes/connections.js'
import { validationRoutes } from './routes/validation.js'
import { factoryRoutes } from './routes/factory.js'

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
  await app.register(ideaRoutes)
  await app.register(scriptRoutes)
  await app.register(productionRoutes)
  await app.register(publishingRoutes)
  await app.register(connectionRoutes)
  await app.register(validationRoutes)
  await app.register(factoryRoutes)

  return app
}

const isDirect = process.argv[1] && import.meta.url.includes(process.argv[1].split('/').pop()!)
if (isDirect) {
  const app = await buildServer()
  await app.listen({ port: config.port, host: '0.0.0.0' })
}
