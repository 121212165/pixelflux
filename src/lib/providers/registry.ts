import type { VideoProvider } from './types'
import { FalProvider } from './fal'

let providers: Map<string, VideoProvider> | null = null

function initProviders(): Map<string, VideoProvider> {
  const map = new Map<string, VideoProvider>()
  const fal = new FalProvider()
  map.set('fal', fal)
  return map
}

export function getProvider(id: string): VideoProvider {
  if (!providers) {
    providers = initProviders()
  }
  const provider = providers.get(id)
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`)
  }
  return provider
}

export function getProviderByModel(modelId: string): VideoProvider {
  // Map model IDs to providers
  const modelProvider: Record<string, string> = {
    'kling-2.5': 'fal',
    'veo-3.1': 'fal',
    'seedance-2': 'fal',
    'hailuo-02': 'fal',
    'wan-2.6': 'fal',
    'sora': 'fal',
  }

  const providerId = modelProvider[modelId]
  if (!providerId) {
    throw new Error(`Unknown model: ${modelId}`)
  }
  return getProvider(providerId)
}

export const MODEL_CONFIGS = [
  {
    id: 'kling-2.5',
    provider: 'Kling',
    displayName: 'Kling 2.5',
    description: 'High-quality text-to-video generation with realistic motion.',
    creditsPerSecond: 15,
    isActive: true,
    sortOrder: 1,
    capabilities: {
      aspectRatios: ['16:9', '9:16', '1:1'],
      maxDuration: 30,
      styles: ['Realistic', 'Cinematic', 'Anime'],
    },
  },
  {
    id: 'veo-3.1',
    provider: 'Google',
    displayName: 'Veo 3.1',
    description: 'Google\'s most capable video generation model with cinematic quality.',
    creditsPerSecond: 25,
    isActive: true,
    sortOrder: 2,
    capabilities: {
      aspectRatios: ['16:9', '9:16', '4:3', '21:9'],
      maxDuration: 60,
      styles: ['Cinematic', 'Realistic', 'Fantasy'],
    },
  },
  {
    id: 'seedance-2',
    provider: 'Seedance',
    displayName: 'Seedance 2',
    description: 'Fast video generation with good quality-to-speed ratio.',
    creditsPerSecond: 5,
    isActive: true,
    sortOrder: 3,
    capabilities: {
      aspectRatios: ['16:9', '9:16', '1:1'],
      maxDuration: 15,
      styles: ['Realistic', 'Anime'],
    },
  },
  {
    id: 'hailuo-02',
    provider: 'Hailuo',
    displayName: 'Hailuo 02',
    description: 'Specialized in artistic and stylized video content.',
    creditsPerSecond: 12,
    isActive: true,
    sortOrder: 4,
    capabilities: {
      aspectRatios: ['16:9', '9:16'],
      maxDuration: 20,
      styles: ['Artistic', 'Cinematic', 'Anime'],
    },
  },
  {
    id: 'wan-2.6',
    provider: 'Wan',
    displayName: 'Wan 2.6',
    description: 'Efficient video generation optimized for social media content.',
    creditsPerSecond: 8,
    isActive: true,
    sortOrder: 5,
    capabilities: {
      aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
      maxDuration: 25,
      styles: ['Realistic', 'Cinematic'],
    },
  },
  {
    id: 'sora',
    provider: 'OpenAI',
    displayName: 'Sora',
    description: 'OpenAI\'s state-of-the-art video generation model with stunning visual quality.',
    creditsPerSecond: 30,
    isActive: true,
    sortOrder: 6,
    capabilities: {
      aspectRatios: ['16:9', '9:16', '1:1', '4:3', '21:9'],
      maxDuration: 60,
      styles: ['Cinematic', 'Realistic', 'Fantasy', 'Anime'],
    },
  },
] as const
