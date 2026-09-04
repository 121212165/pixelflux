import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, handleApiError } from '@/lib/require-auth'
import {
  getGeneration,
  updateGeneration,
  deleteGeneration,
} from '@/lib/generation-store'
import { getProviderByModel } from '@/lib/providers/registry'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const generation = getGeneration(id)
    if (!generation) {
      return NextResponse.json(
        { error: 'not_found', message: '生成记录不存在' },
        { status: 404 },
      )
    }

    if (generation.userId !== user.id) {
      return NextResponse.json(
        { error: 'forbidden', message: '无权访问' },
        { status: 403 },
      )
    }

    // If still processing, check provider for updates
    if (generation.status === 'processing' || generation.status === 'pending') {
      try {
        const provider = getProviderByModel(generation.modelId)
        const providerJob = await provider.checkStatus(generation.id)

        if (providerJob.status === 'completed' && providerJob.result) {
          const updated = updateGeneration(id, {
            status: 'completed',
            resultUrl: providerJob.result.url,
            durationMs: providerJob.result.duration * 1000,
            completedAt: new Date().toISOString(),
          })
          return NextResponse.json(serializeGeneration(updated!))
        }

        if (providerJob.status === 'failed') {
          const updated = updateGeneration(id, {
            status: 'failed',
            errorMessage: providerJob.error ?? '生成失败',
            completedAt: new Date().toISOString(),
          })
          return NextResponse.json(serializeGeneration(updated!))
        }
      } catch {
        // Provider check failed — keep current status
      }
    }

    return NextResponse.json(serializeGeneration(generation))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const generation = getGeneration(id)
    if (!generation) {
      return NextResponse.json(
        { error: 'not_found', message: '生成记录不存在' },
        { status: 404 },
      )
    }

    if (generation.userId !== user.id) {
      return NextResponse.json(
        { error: 'forbidden', message: '无权操作' },
        { status: 403 },
      )
    }

    deleteGeneration(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

function serializeGeneration(g: NonNullable<ReturnType<typeof getGeneration>>) {
  return {
    id: g.id,
    modelId: g.modelId,
    prompt: g.prompt,
    status: g.status,
    creditsCost: g.creditsCost,
    resultUrl: g.resultUrl,
    durationMs: g.durationMs,
    errorMessage: g.errorMessage,
    createdAt: g.createdAt,
    completedAt: g.completedAt,
    params: g.params,
  }
}
