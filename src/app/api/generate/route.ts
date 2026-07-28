import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, handleApiError } from '@/lib/require-auth'
import { getProviderByModel, MODEL_CONFIGS } from '@/lib/providers/registry'
import { createGeneration } from '@/lib/generation-store'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await req.json()
    const { modelId, prompt, params } = body

    if (!modelId || !prompt) {
      return NextResponse.json(
        { error: 'missing_fields', message: '请填写模型和 Prompt' },
        { status: 400 },
      )
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: 'prompt_too_long', message: 'Prompt 不能超过 2000 字符' },
        { status: 400 },
      )
    }

    // Validate model exists
    const modelConfig = MODEL_CONFIGS.find((m) => m.id === modelId)
    if (!modelConfig || !modelConfig.isActive) {
      return NextResponse.json(
        { error: 'invalid_model', message: '模型不可用' },
        { status: 400 },
      )
    }

    // Calculate credit cost
    const duration = params?.duration ?? 10
    const creditsCost = modelConfig.creditsPerSecond * duration

    // Check user credits
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    const userCredits = (userProfile as unknown as { credits: number } | null)?.credits

    if (typeof userCredits === 'number' && userCredits < creditsCost) {
      return NextResponse.json(
        { error: 'insufficient_credits', message: 'Credits 不足，去充值', credits: userCredits, required: creditsCost },
        { status: 402 },
      )
    }

    // Call provider
    const provider = getProviderByModel(modelId)
    await provider.generate({
      prompt,
      modelId,
      aspectRatio: params?.aspectRatio,
      duration,
      style: params?.style,
    })

    // Create generation record
    const generationId = crypto.randomUUID()
    const now = new Date().toISOString()

    createGeneration({
      id: generationId,
      userId: user.id,
      modelId,
      prompt,
      status: 'processing',
      creditsCost,
      resultUrl: null,
      durationMs: null,
      errorMessage: null,
      createdAt: now,
      completedAt: null,
      params: {
        aspectRatio: params?.aspectRatio,
        duration,
        style: params?.style,
      },
    })

    // Deduct credits from user profile
    if (typeof userCredits === 'number') {
      await supabase
        .from('users')
        .update({ credits: userCredits - creditsCost })
        .eq('id', user.id)
    }

    return NextResponse.json(
      {
        id: generationId,
        status: 'processing',
        creditsCost,
        estimatedSeconds: duration + 10,
      },
      { status: 201 },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
