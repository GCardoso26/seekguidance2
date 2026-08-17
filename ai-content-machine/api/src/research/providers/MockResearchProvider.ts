import type { ResearchInput, ResearchProvider, ResearchResult } from '../types.js'

export class MockResearchProvider implements ResearchProvider {
  name = 'mock'
  status = 'READY' as const

  async search(input: ResearchInput): Promise<ResearchResult[]> {
    const base = input.nicheName || 'IA produtividade'
    const kw = input.keywords.length ? input.keywords : ['ia', 'produtividade']
    const items: ResearchResult[] = [
      {
        provider: this.name,
        sourceType: 'trend',
        sourceUrl: `mock://trends/${encodeURIComponent(base)}/tools`,
        sourceTitle: `${base}: ferramentas que economizam 2h/dia`,
        sourceAuthor: 'mock-trends',
        publishedAt: new Date().toISOString(),
        title: `${base}: ferramentas que economizam 2h/dia`,
        description: 'Pessoas buscam automações práticas sem aparecer no vídeo.',
        keywords: [...kw, 'ferramentas', 'tempo'],
        engagement: { views: 12000, likes: 900, comments: 140, score: 0.86 },
        metadata: { questions: ['Qual ferramenta usar primeiro?'] },
        license: 'mock',
        rawReference: 'mock:trends',
        reality: 'MOCK',
      },
      {
        provider: this.name,
        sourceType: 'forum',
        sourceUrl: `mock://forums/${encodeURIComponent(base)}/chatgpt-vs-claude`,
        sourceTitle: `${base}: ChatGPT vs Claude para roteiros`,
        sourceAuthor: 'mock-forums',
        publishedAt: new Date().toISOString(),
        title: `${base}: ChatGPT vs Claude para roteiros`,
        description: 'Comparativos de modelos para geração de roteiros curtos.',
        keywords: [...kw, 'chatgpt', 'claude'],
        engagement: { views: 8000, likes: 500, comments: 90, score: 0.78 },
        metadata: { questions: ['Qual gera melhor hook?'] },
        license: 'mock',
        rawReference: 'mock:forums',
        reality: 'MOCK',
      },
      {
        provider: this.name,
        sourceType: 'search',
        sourceUrl: `mock://search/${encodeURIComponent(base)}/n8n-dark`,
        sourceTitle: `${base}: automação n8n para publicar dark content`,
        sourceAuthor: 'mock-search',
        publishedAt: new Date().toISOString(),
        title: `${base}: automação n8n para publicar dark content`,
        description: 'Demandas sobre orquestração multiplataforma com n8n.',
        keywords: [...kw, 'n8n', 'automacao'],
        engagement: { views: 9500, likes: 700, comments: 110, score: 0.81 },
        metadata: { questions: ['Como agendar em 3 plataformas?'] },
        license: 'mock',
        rawReference: 'mock:search',
        reality: 'MOCK',
      },
    ]

    // Extra items for volume tests (deterministic)
    for (let i = 1; i <= 7; i++) {
      items.push({
        provider: this.name,
        sourceType: 'search',
        sourceUrl: `mock://search/${encodeURIComponent(base)}/extra-${i}`,
        sourceTitle: `${base}: oportunidade extra ${i}`,
        title: `${base}: oportunidade extra ${i}`,
        description: `Item mock ${i} para volume/dedup.`,
        keywords: kw,
        engagement: { views: 1000 * i, likes: 50 * i, score: 0.5 + i * 0.03 },
        metadata: {},
        license: 'mock',
        rawReference: `mock:extra:${i}`,
        reality: 'MOCK',
      })
    }

    return items
  }
}
