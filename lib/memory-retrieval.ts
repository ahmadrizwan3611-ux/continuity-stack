import { createClient } from '@/lib/supabase/server'

export async function getUserContext(userId: string) {
  const supabase = await createClient()

  const [profile, memories, facts, relationships, insights, recentMessages] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('memories').select('*').eq('user_id', userId).eq('hidden_from_ai', false).order('importance', { ascending: false }).order('created_at', { ascending: false }).limit(24),
    supabase.from('personal_facts').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(70),
    supabase.from('relationships').select('*').eq('user_id', userId).order('closeness', { ascending: false }).limit(35),
    supabase.from('personality_insights').select('*').eq('user_id', userId).order('confidence', { ascending: false }).order('updated_at', { ascending: false }).limit(30),
    supabase.from('chat_messages').select('role,content,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(36),
  ])

  return {
    profile: profile.data,
    memories: memories.data || [],
    facts: facts.data || [],
    relationships: relationships.data || [],
    insights: insights.data || [],
    recentMessages: (recentMessages.data || []).reverse(),
  }
}
