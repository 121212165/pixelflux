import type { VideoProvider, GenerationParams, ProviderJob } from './types'

interface FalJob {
  jobId: string
  params: GenerationParams
  status: 'pending' | 'processing' | 'completed' | 'failed'
  resultUrl?: string
  error?: string
  createdAt: number
}

const jobs = new Map<string, FalJob>()

const FAL_API_BASE = 'https://fal.run'
const FAL_KEY = process.env.FAL_KEY

export class FalProvider implements VideoProvider {
  id = 'fal'
  name = 'Fal.ai'
  costPerSecond = 0.05

  async generate(params: GenerationParams): Promise<{ jobId: string }> {
    const jobId = crypto.randomUUID()

    if (FAL_KEY) {
      // Real fal.ai integration
      const response = await fetch(`${FAL_API_BASE}/${getFalModel(params.modelId)}`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio ?? '16:9',
          duration: params.duration ?? 10,
          sync_mode: 'async',
          webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/fal`,
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`fal.ai API error: ${err}`)
      }

      const data = await response.json()
      jobs.set(jobId, {
        jobId,
        params,
        status: 'processing',
        createdAt: Date.now(),
      })

      return { jobId: data.request_id }
    }

    // Mock mode for development — simulates async generation
    jobs.set(jobId, {
      jobId,
      params,
      status: 'processing',
      createdAt: Date.now(),
    })

    // Simulate completion after 8-15 seconds
    const delay = 8000 + Math.random() * 7000
    setTimeout(() => {
      const job = jobs.get(jobId)
      if (job && job.status === 'processing') {
        const shouldFail = Math.random() < 0.05 // 5% failure rate for testing
        if (shouldFail) {
          job.status = 'failed'
          job.error = '上游 API 超时'
        } else {
          job.status = 'completed'
          // Use a sample video for preview
          job.resultUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        }
      }
    }, delay)

    return { jobId }
  }

  async checkStatus(jobId: string): Promise<ProviderJob> {
    // Check local job map first
    const job = jobs.get(jobId)
    if (job) {
      if (job.status === 'completed' && job.resultUrl) {
        return {
          jobId,
          status: 'completed',
          result: {
            url: job.resultUrl,
            duration: job.params.duration ?? 10,
            metadata: {},
          },
        }
      }
      if (job.status === 'failed') {
        return { jobId, status: 'failed', error: job.error }
      }
      return { jobId, status: 'processing' }
    }

    // If FAL_KEY is set, query fal.ai API
    if (FAL_KEY) {
      const response = await fetch(`${FAL_API_BASE}/requests/${jobId}/status`, {
        headers: { Authorization: `Key ${FAL_KEY}` },
      })
      if (!response.ok) {
        return { jobId, status: 'failed', error: 'Failed to check status' }
      }
      const data = await response.json()
      if (data.status === 'COMPLETED') {
        return {
          jobId,
          status: 'completed',
          result: {
            url: data.video?.url,
            duration: data.video?.duration ?? 10,
            metadata: data,
          },
        }
      }
      return { jobId, status: 'processing' }
    }

    return { jobId, status: 'processing' }
  }
}

function getFalModel(modelId: string): string {
  const modelMap: Record<string, string> = {
    'kling-2.5': '/fal-ai/kling-video/v2.5/standard',
    'veo-3.1': '/fal-ai/veo-3.1',
    'seedance-2': '/fal-ai/seedance',
    'hailuo-02': '/fal-ai/hailuo',
    'wan-2.6': '/fal-ai/wan',
    'sora': '/fal-ai/sora',
  }
  return modelMap[modelId] || '/fal-ai/kling-video/v2.5/standard'
}
