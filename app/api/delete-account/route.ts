import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await Promise.all([
    supabase.from('personality_insights').delete().eq('user_id', user.id),
    supabase.from('ai_questions').delete().eq('user_id', user.id),
    supabase.from('chat_messages').delete().eq('user_id', user.id),
    supabase.from('chat_sessions').delete().eq('user_id', user.id),
    supabase.from('memories').delete().eq('user_id', user.id),
    supabase.from('relationships').delete().eq('user_id', user.id),
    supabase.from('personal_facts').delete().eq('user_id', user.id),
    supabase.from('profiles').delete().eq('user_id', user.id),
  ])

  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
