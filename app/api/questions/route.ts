import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const questionBank = [
  { key: 'food_taste', category: 'Taste', question: 'What food taste do you enjoy most, spicy, sweet, simple, or something else?' },
  { key: 'favorite_fruit', category: 'Preference', question: 'What is your favorite fruit?' },
  { key: 'favorite_animal', category: 'Preference', question: 'What is your favorite animal, and why?' },
  { key: 'closest_friend', category: 'Relationships', question: 'Who is your closest friend right now?' },
  { key: 'anger_trigger', category: 'Behavior', question: 'What type of situation makes you angry quickly?' },
  { key: 'life_goal', category: 'Goals', question: 'What kind of life do you want to build in the next three years?' },
  { key: 'work_style', category: 'Work', question: 'Do you work better alone, with a team, or with clear step-by-step guidance?' },
  { key: 'communication_style', category: 'Language', question: 'How should your AI talk to you: direct, soft, detailed, motivational, or mixed?' },
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: facts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('personal_facts').select('key').eq('user_id', user.id),
  ])

  const savedKeys = new Set((facts || []).map((f) => f.key))
  const questions = questionBank.filter((item) => {
    if (item.key in (profile || {}) && profile?.[item.key]) return false
    return !savedKeys.has(item.key)
  }).slice(0, 5)

  return NextResponse.json({ questions })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.key || !body.answer?.trim()) {
    return NextResponse.json({ error: 'Question key and answer are required' }, { status: 400 })
  }

  const answer = body.answer.trim()
  const category = body.category || 'Personal'
  const key = body.key

  await supabase.from('personal_facts').upsert({
    user_id: user.id,
    category,
    key,
    value: answer,
    confidence: 5,
    source: 'ai_question',
  }, { onConflict: 'user_id,key' })

  await supabase.from('memories').insert({
    user_id: user.id,
    title: `AI learned: ${category}`,
    content: `${body.question || key}: ${answer}`,
    memory_type: category === 'Relationships' ? 'relationship' : 'personal',
    memory_format: 'written',
    mood: 'neutral',
    tags: ['ai-question', String(category).toLowerCase()],
    importance: 3,
    privacy_level: 'private',
    hidden_from_ai: false,
  })

  return NextResponse.json({ ok: true })
}
