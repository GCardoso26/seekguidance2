import { getActivePrompt } from '../services/PromptService.js'
import { routeAi } from '../services/AiRouter.js'

export async function mockGenerateIdeas(topicTitle: string) {
  const route = routeAi('idea_generation')
  getActivePrompt('idea_generator')
  const ideas = Array.from({ length: 10 }, (_, i) => ({
    title: `${topicTitle} — ângulo ${i + 1}`,
    hooks: [
      `Você está fazendo ${topicTitle} errado.`,
      `Ninguém te contou isso sobre ${topicTitle}.`,
      `3 erros fatais em ${topicTitle}.`,
      `Eu parei de fazer ${topicTitle} manualmente.`,
      `Isso muda ${topicTitle} em 30 segundos.`,
    ],
    angles: ['lista', 'erro', 'comparativo', 'tutorial', 'mito'],
    formats: ['short', 'carousel', 'pin'],
    opportunityScore: 0.55 + i * 0.03,
  }))
  return { ideas, route, tokens: 800, costCents: route.estimatedCostCents, reality: 'MOCK' as const }
}

export async function mockGenerateScript(ideaTitle: string, hook: string) {
  const route = routeAi('script_generation')
  getActivePrompt('script_generator')
  return {
    reality: 'MOCK' as const,
    route,
    tokens: 600,
    costCents: route.estimatedCostCents,
    script: {
      hook,
      problem: `A maioria trava em ${ideaTitle} porque improvisa.`,
      insight: 'A unidade é o roteiro, não o vídeo.',
      solution: 'Use um sistema: pesquisa → ideia → roteiro → variantes → CTA.',
      cta: 'Peguei os prompts que uso e deixei no link da bio.',
      caption: `${hook} Link na bio.`,
      hashtags: ['#ia', '#produtividade', '#conteudo'],
      visualBrief: {
        style: 'screen + captions + b-roll tools',
        shots: ['hook text', 'demo UI', 'cta endcard'],
      },
    },
  }
}

export async function mockRecycle(winnerTitle: string) {
  const route = routeAi('recycling')
  getActivePrompt('content_recycler')
  const types = [
    'PART_2',
    'PART_3',
    'TUTORIAL',
    'FAQ',
    'COMPARISON',
    'MYTH',
    'MISTAKE',
    'CASE_STUDY',
    'NEW_HOOK',
    'NEW_CTA',
  ] as const
  return {
    reality: 'MOCK' as const,
    route,
    costCents: route.estimatedCostCents,
    tokens: 900,
    derivatives: types.map((derivationType) => ({
      derivationType,
      newAngle: `${derivationType.toLowerCase()} sobre ${winnerTitle}`,
      newHook: `${derivationType}: o que mudou em ${winnerTitle}`,
      newScriptOutline: `HOOK novo → prova → ${derivationType} → CTA`,
    })),
  }
}
