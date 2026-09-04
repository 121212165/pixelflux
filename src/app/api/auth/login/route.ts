import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { url } } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
    },
  })

  if (!url) {
    return NextResponse.json({ error: 'Auth initiation failed' }, { status: 500 })
  }

  return NextResponse.redirect(url)
}
