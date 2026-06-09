import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [profile, memories, relationships, facts, insights, questions, sessions, chats] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('memories').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('relationships').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('personal_facts').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('personality_insights').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('ai_questions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('chat_sessions').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('chat_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1000),
  ])

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    profile: profile.data,
    memories: memories.data || [],
    relationships: relationships.data || [],
    facts: facts.data || [],
    personality_insights: insights.data || [],
    ai_questions: questions.data || [],
    chat_sessions: sessions.data || [],
    chat_messages: chats.data || [],
  })
}
