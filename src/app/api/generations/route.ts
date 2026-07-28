import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, handleApiError } from '@/lib/require-auth'
import { listGenerations } from '@/lib/generation-store'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') ?? '1', 10)
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 50)

    const { items, total, hasMore } = listGenerations(user.id, page, limit)

    return NextResponse.json({
      items: items.map((g) => ({
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
      })),
      total,
      page,
      limit,
      hasMore,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
