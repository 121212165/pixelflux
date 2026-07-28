import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FalProvider } from '../fal'

function createProvider() {
  return new FalProvider()
}

describe('FalProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generate', () => {
    it('should return correct jobId in mock mode', async () => {
      const provider = createProvider()
      const result = await provider.generate({
        prompt: 'test prompt',
        modelId: 'kling-2.5',
        aspectRatio: '16:9',
        duration: 10,
      })
      expect(result.jobId).toBeDefined()
      expect(typeof result.jobId).toBe('string')
    })

    it('should create a job in processing state', async () => {
      const provider = createProvider()
      const result = await provider.generate({
        prompt: 'test prompt',
        modelId: 'kling-2.5',
      })
      const status = await provider.checkStatus(result.jobId)
      expect(status.status).toBe('processing')
    })

    it('should store job params correctly', async () => {
      const provider = createProvider()
      const params = {
        prompt: 'test prompt',
        modelId: 'veo-3.1',
        aspectRatio: '9:16',
        duration: 15,
        style: 'Cinematic',
      }
      const result = await provider.generate(params)
      expect(result.jobId).toBeDefined()
    })
  })

  describe('checkStatus', () => {
    it('should return processing state for new job', async () => {
      const provider = createProvider()
      const result = await provider.generate({
        prompt: 'test prompt',
        modelId: 'kling-2.5',
      })
      const status = await provider.checkStatus(result.jobId)
      expect(status.status).toBe('processing')
    })

    it('should return completed state when job completes', async () => {
      const provider = createProvider()
      const result = await provider.generate({
        prompt: 'test prompt',
        modelId: 'kling-2.5',
      })
      vi.advanceTimersByTime(15000)
      const status = await provider.checkStatus(result.jobId)
      expect(status.status).toBe('completed')
    })

    it('should return processing for unknown jobId', async () => {
      const provider = createProvider()
      const status = await provider.checkStatus('unknown-job-id')
      expect(status.status).toBe('processing')
    })
  })

  describe('metadata', () => {
    it('should have correct id', () => {
      const provider = createProvider()
      expect(provider.id).toBe('fal')
    })

    it('should have correct name', () => {
      const provider = createProvider()
      expect(provider.name).toBe('Fal.ai')
    })

    it('should have correct cost per second', () => {
      const provider = createProvider()
      expect(provider.costPerSecond).toBe(0.05)
    })
  })
})
