import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError('unauthorized')
  }

  return user
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: 'unauthorized', message: '请先登录' },
      { status: 401 },
    )
  }

  if (error instanceof Error) {
    if (error.message === 'insufficient_credits') {
      return NextResponse.json(
        { error: 'insufficient_credits', message: 'Credits 不足，去充值' },
        { status: 402 },
      )
    }
    if (error.message === 'rate_limited') {
      return NextResponse.json(
        { error: 'rate_limited', message: '操作太快，请稍后再试', retryAfter: 5 },
        { status: 429 },
      )
    }
    if (error.message === 'invalid_model') {
      return NextResponse.json(
        { error: 'invalid_model', message: '模型不可用' },
        { status: 400 },
      )
    }
  }

  console.error('API error:', error)
  return NextResponse.json(
    { error: 'internal_error', message: '服务器内部错误' },
    { status: 500 },
  )
}
