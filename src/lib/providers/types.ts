export interface GenerationParams {
  prompt: string
  modelId: string
  aspectRatio?: string
  duration?: number
  imageUrl?: string
  style?: string
}

export interface GenerationResult {
  url: string
  duration: number
  metadata: Record<string, unknown>
}

export interface ProviderJob {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: GenerationResult
  error?: string
}

export interface VideoProvider {
  id: string
  name: string
  generate(params: GenerationParams): Promise<{ jobId: string }>
  checkStatus(jobId: string): Promise<ProviderJob>
  costPerSecond: number
}

export interface ModelConfig {
  id: string
  provider: string
  displayName: string
  description: string | null
  creditsPerSecond: number
  isActive: boolean
  sortOrder: number
  capabilities: {
    aspectRatios: string[]
    maxDuration: number
    styles?: string[]
  }
}
