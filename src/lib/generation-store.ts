interface GenerationRecord {
  id: string
  userId: string
  modelId: string
  prompt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  creditsCost: number
  resultUrl: string | null
  durationMs: number | null
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
  params: {
    aspectRatio?: string
    duration?: number
    style?: string
  }
}

const generations = new Map<string, GenerationRecord>()

export function createGeneration(record: GenerationRecord): void {
  generations.set(record.id, record)
}

export function getGeneration(id: string): GenerationRecord | null {
  return generations.get(id) ?? null
}

export function updateGeneration(
  id: string,
  updates: Partial<GenerationRecord>,
): GenerationRecord | null {
  const existing = generations.get(id)
  if (!existing) return null
  const updated = { ...existing, ...updates }
  generations.set(id, updated)
  return updated
}

export function listGenerations(
  userId: string,
  page: number = 1,
  limit: number = 20,
): { items: GenerationRecord[]; total: number; hasMore: boolean } {
  const userGens = Array.from(generations.values())
    .filter((g) => g.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = userGens.length
  const offset = (page - 1) * limit
  const items = userGens.slice(offset, offset + limit)
  const hasMore = offset + limit < total

  return { items, total, hasMore }
}

export function deleteGeneration(id: string): boolean {
  return generations.delete(id)
}
