export type ResearchHit = {
  title: string
  source: string
  questions: string[]
  trendScore: number
  gapScore: number
}

export async function mockResearch(nicheName: string): Promise<{ hits: ResearchHit[]; reality: 'MOCK' }> {
  const base = nicheName || 'IA produtividade'
  return {
    reality: 'MOCK',
    hits: [
      {
        title: `${base}: ferramentas que economizam 2h/dia`,
        source: 'mock:trends',
        questions: ['Qual ferramenta usar primeiro?', 'Funciona sem aparecer no vídeo?'],
        trendScore: 0.86,
        gapScore: 0.72,
      },
      {
        title: `${base}: ChatGPT vs Claude para roteiros`,
        source: 'mock:forums',
        questions: ['Qual gera melhor hook?', 'Qual é mais barato?'],
        trendScore: 0.78,
        gapScore: 0.65,
      },
      {
        title: `${base}: automação n8n para publicar dark content`,
        source: 'mock:search',
        questions: ['Como agendar em 3 plataformas?', 'Preciso de API paga?'],
        trendScore: 0.81,
        gapScore: 0.7,
      },
    ],
  }
}
