import { describe, it, expect, beforeEach } from 'vitest'
import {
  createGeneration,
  getGeneration,
  updateGeneration,
  listGenerations,
  deleteGeneration,
} from '../generation-store'

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

function createMockRecord(overrides: Partial<GenerationRecord> = {}): GenerationRecord {
  return {
    id: 'gen-1',
    userId: 'user-1',
    modelId: 'model-1',
    prompt: 'test prompt',
    status: 'pending',
    creditsCost: 10,
    resultUrl: null,
    durationMs: null,
    errorMessage: null,
    createdAt: '2026-05-12T10:00:00.000Z',
    completedAt: null,
    params: {},
    ...overrides,
  }
}

describe('GenerationStore', () => {
  beforeEach(() => {
    const records = listGenerations('user-1', 1, 1000)
    records.items.forEach(item => deleteGeneration(item.id))
  })

  describe('createGeneration', () => {
    it('should create a new generation record', () => {
      const record = createMockRecord()
      createGeneration(record)
      const result = getGeneration(record.id)
      expect(result).toEqual(record)
    })
  })

  describe('getGeneration', () => {
    it('should return generation record by id', () => {
      const record = createMockRecord()
      createGeneration(record)
      const result = getGeneration(record.id)
      expect(result).toEqual(record)
    })

    it('should return null for non-existent id', () => {
      const result = getGeneration('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('updateGeneration', () => {
    it('should update generation record status', () => {
      const record = createMockRecord()
      createGeneration(record)
      const updated = updateGeneration(record.id, { status: 'completed' })
      expect(updated?.status).toBe('completed')
      expect(updated?.id).toBe(record.id)
    })

    it('should return null when updating non-existent record', () => {
      const result = updateGeneration('non-existent-id', { status: 'completed' })
      expect(result).toBeNull()
    })
  })

  describe('listGenerations', () => {
    it('should return paginated list of user generations', () => {
      for (let i = 1; i <= 5; i++) {
        createGeneration(createMockRecord({
          id: `gen-${i}`,
          createdAt: new Date(2026, 4, 12, i).toISOString(),
        }))
      }
      const result = listGenerations('user-1', 1, 3)
      expect(result.items.length).toBe(3)
      expect(result.total).toBe(5)
    })

    it('should set hasMore flag correctly when more records exist', () => {
      for (let i = 1; i <= 5; i++) {
        createGeneration(createMockRecord({ id: `gen-${i}` }))
      }
      const result = listGenerations('user-1', 1, 3)
      expect(result.hasMore).toBe(true)
    })

    it('should set hasMore to false when on last page', () => {
      for (let i = 1; i <= 3; i++) {
        createGeneration(createMockRecord({ id: `gen-${i}` }))
      }
      const result = listGenerations('user-1', 1, 3)
      expect(result.hasMore).toBe(false)
    })
  })

  describe('deleteGeneration', () => {
    it('should delete existing generation record', () => {
      const record = createMockRecord()
      createGeneration(record)
      const result = deleteGeneration(record.id)
      expect(result).toBe(true)
      expect(getGeneration(record.id)).toBeNull()
    })

    it('should return false when deleting non-existent record', () => {
      const result = deleteGeneration('non-existent-id')
      expect(result).toBe(false)
    })
  })
})
