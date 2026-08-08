export type TopicPerf = {
  topicKey: string
  class: 'WINNER' | 'PROMISING' | 'NORMAL' | 'LOSER'
  score: number
}

export type DailyAllocation = {
  topicKey: string
  quantity: number
  formats: string[]
  recommendedHook?: string
}

/**
 * Adaptive planner: winners get more slots; losers get reduced/zero.
 */
export function planDailyContent(
  history: TopicPerf[],
  dailyQty: number,
  budgetCents: number,
  costPerContentCents = 15,
): { allocations: DailyAllocation[]; estimatedCostCents: number; notes: string[] } {
  const notes: string[] = []
  const maxByBudget = Math.max(0, Math.floor(budgetCents / costPerContentCents))
  let qty = Math.min(dailyQty, maxByBudget)
  if (qty < dailyQty) notes.push(`Budget capped quantity to ${qty}`)

  if (history.length === 0) {
    return {
      allocations: [
        {
          topicKey: 'default',
          quantity: qty,
          formats: ['lista', 'tutorial', 'comparativo', 'erro'],
          recommendedHook: 'Você está fazendo isso manualmente sem perceber...',
        },
      ],
      estimatedCostCents: qty * costPerContentCents,
      notes: [...notes, 'No history — using default allocation'],
    }
  }

  const winners = history.filter((h) => h.class === 'WINNER' || h.class === 'PROMISING')
  const normals = history.filter((h) => h.class === 'NORMAL')
  const losers = history.filter((h) => h.class === 'LOSER')

  const weights = new Map<string, number>()
  for (const w of winners) weights.set(w.topicKey, (weights.get(w.topicKey) ?? 0) + 3)
  for (const n of normals) weights.set(n.topicKey, (weights.get(n.topicKey) ?? 0) + 1)
  for (const l of losers) {
    weights.set(l.topicKey, 0)
    notes.push(`Reducing loser topic: ${l.topicKey}`)
  }

  const totalWeight = [...weights.values()].reduce((a, b) => a + b, 0) || 1
  const allocations: DailyAllocation[] = []
  let assigned = 0

  for (const [topicKey, weight] of weights) {
    if (weight <= 0) continue
    const q = Math.max(1, Math.round((weight / totalWeight) * qty))
    allocations.push({
      topicKey,
      quantity: q,
      formats: topicKey.toLowerCase().includes('ferrament')
        ? ['lista', 'comparacao', 'tutorial', 'caso']
        : ['lista', 'tutorial', 'erro', 'faq'],
      recommendedHook: 'Você está fazendo isso manualmente sem perceber...',
    })
    assigned += q
  }

  // normalize to qty
  while (assigned > qty && allocations.length) {
    const richest = allocations.sort((a, b) => b.quantity - a.quantity)[0]
    if (richest.quantity > 1) {
      richest.quantity -= 1
      assigned -= 1
    } else break
  }

  return {
    allocations,
    estimatedCostCents: Math.min(assigned, qty) * costPerContentCents,
    notes,
  }
}
