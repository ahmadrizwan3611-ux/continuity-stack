import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedFields = [
  'full_name', 'birth_year', 'age', 'address', 'city', 'country', 'current_position', 'profession',
  'phone_model', 'phone_health_status', 'phone_battery_percent', 'food_taste', 'social_status',
  'financial_status', 'behavior_notes', 'language_preference', 'communication_style', 'life_summary',
  'personality_notes', 'tone_preference'
]

function cleanBody(body: Record<string, any>) {
  const clean: Record<string, any> = {}
  for (const key of allowedFields) {
    if (body[key] !== undefined) clean[key] = body[key] === '' ? null : body[key]
  }
  return clean
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!data) {
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({ user_id: user.id, full_name: user.user_metadata?.full_name || null })
      .select('*')
      .single()
    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })
    return NextResponse.json({ profile: created })
  }

  return NextResponse.json({ profile: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const payload = cleanBody(body)

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ ...payload, user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
