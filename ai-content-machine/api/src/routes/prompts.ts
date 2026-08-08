import type { FastifyInstance } from 'fastify'
import { getActivePrompt } from '../services/PromptService.js'

export async function promptRoutes(app: FastifyInstance) {
  app.get('/api/ai/prompts/:promptName', async (req, reply) => {
    const { promptName } = req.params as { promptName: string }
    const prompt = getActivePrompt(promptName)
    if (!prompt) return reply.code(404).send({ error: 'prompt_not_found' })
    return prompt
  })
}
