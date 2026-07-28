import { NextResponse } from 'next/server'
import { MODEL_CONFIGS } from '@/lib/providers/registry'

export async function GET() {
  const models = MODEL_CONFIGS.map((m) => ({
    id: m.id,
    provider: m.provider,
    displayName: m.displayName,
    description: m.description,
    creditsPerSecond: m.creditsPerSecond,
    isActive: m.isActive,
    sortOrder: m.sortOrder,
    capabilities: m.capabilities,
  }))

  return NextResponse.json({ items: models })
}

export async function POST() {
  return NextResponse.json(
    { error: 'method_not_allowed' },
    { status: 405 },
  )
}
