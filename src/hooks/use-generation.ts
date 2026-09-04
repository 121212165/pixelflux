'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface GenerateParams {
  modelId: string
  prompt: string
  params: {
    aspectRatio?: string
    duration?: number
    style?: string
  }
}

interface GenerationResponse {
  id: string
  status: string
  creditsCost: number
  estimatedSeconds: number
}

interface GenerationStatus {
  id: string
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

export function useGenerate() {
  const queryClient = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (params: GenerateParams): Promise<GenerationResponse> => {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '生成失败')
      }

      return data
    },
    onSuccess: (data) => {
      setActiveId(data.id)
    },
  })

  return { mutation, activeId, setActiveId }
}

export function useGenerationPoll(id: string | null) {
  return useQuery<GenerationStatus>({
    queryKey: ['generations', 'detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/generations/${id}`)
      if (!res.ok) throw new Error('Failed to fetch generation')
      return res.json()
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 2000
      if (data.status === 'completed' || data.status === 'failed') return false
      return 2000
    },
  })
}

export type { GenerationStatus, GenerationResponse, GenerateParams }
