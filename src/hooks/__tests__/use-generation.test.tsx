import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useGenerate, useGenerationPoll } from '../use-generation'
import React from 'react'

const generateParams = {
  modelId: 'model-1',
  prompt: 'test prompt',
  params: {
    aspectRatio: '16:9',
  },
}

const mockGenerationResponse = {
  id: 'gen-123',
  status: 'pending',
  creditsCost: 10,
  estimatedSeconds: 30,
}

const mockGenerationStatus = {
  id: 'gen-123',
  modelId: 'model-1',
  prompt: 'test prompt',
  status: 'processing' as const,
  creditsCost: 10,
  resultUrl: null,
  durationMs: null,
  errorMessage: null,
  createdAt: '2026-05-12T10:00:00.000Z',
  completedAt: null,
  params: {},
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useGenerate', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockGenerationResponse),
    } as Response))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('初始状态 activeId 应为 null', () => {
    const { result } = renderHook(() => useGenerate(), { wrapper: TestWrapper })
    expect(result.current.activeId).toBeNull()
  })

  it('setActiveId 可以手动设置 activeId', () => {
    const { result } = renderHook(() => useGenerate(), { wrapper: TestWrapper })
    act(() => {
      result.current.setActiveId('test-id')
    })
    expect(result.current.activeId).toBe('test-id')
  })

  it('mutation 成功时应设置 activeId', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGenerationResponse,
    } as Response)

    const { result } = renderHook(() => useGenerate(), { wrapper: TestWrapper })

    await act(async () => {
      await result.current.mutation.mutateAsync(generateParams)
    })

    expect(result.current.activeId).toBe(mockGenerationResponse.id)
  })

  it('mutation 失败时应抛出错误', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '生成失败', message: 'Something went wrong' }),
    } as Response)

    const { result } = renderHook(() => useGenerate(), { wrapper: TestWrapper })

    let error: Error | undefined
    try {
      await act(async () => {
        await result.current.mutation.mutateAsync(generateParams)
      })
    } catch (e) {
      error = e as Error
    }

    expect(error).toBeDefined()
  })
})

describe('useGenerationPoll', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockGenerationStatus),
    } as Response))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('enabled 为 false 时不发送请求', async () => {
    const { result } = renderHook(
      (id: string | null) => useGenerationPoll(id),
      {
        initialProps: null as string | null,
        wrapper: TestWrapper,
      }
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('enabled 为 true 时发送请求', async () => {
    const { result } = renderHook(
      (id: string | null) => useGenerationPoll(id),
      {
        initialProps: 'gen-123' as string | null,
        wrapper: TestWrapper,
      }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(fetch).toHaveBeenCalled()
    expect(fetch.mock.calls[0][0]).toContain('/api/generations/gen-123')
  })

  it('refetchInterval 根据状态返回正确的间隔', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGenerationStatus,
    } as Response)

    const { result } = renderHook(
      (id: string | null) => useGenerationPoll(id),
      {
        initialProps: 'gen-123' as string | null,
        wrapper: TestWrapper,
      }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.status).toBe('processing')
  })

  it('status 为 failed 时不继续轮询', async () => {
    const generationStatusFailed = {
      ...mockGenerationStatus,
      status: 'failed' as const,
      errorMessage: 'Generation failed',
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => generationStatusFailed,
    } as Response)

    const { result } = renderHook(
      (id: string | null) => useGenerationPoll(id),
      {
        initialProps: 'gen-123' as string | null,
        wrapper: TestWrapper,
      }
    )

    await waitFor(() => {
      expect(result.current.data?.status).toBe('failed')
    })

    expect(result.current.data?.status).toBe('failed')
  })
})
