import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function parseTags(value: any) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((t) => t.trim()).filter(Boolean)
  return []
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const search = req.nextUrl.searchParams.get('search')?.trim()
  let query = supabase.from('memories').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ memories: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.title?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
  }

  const payload = {
    user_id: user.id,
    title: body.title.trim(),
    content: body.content.trim(),
    memory_type: body.memory_type || 'life',
    memory_format: body.memory_format || 'written',
    mood: body.mood || 'neutral',
    event_date: body.event_date || null,
    tags: parseTags(body.tags),
    importance: Number(body.importance || 3),
    privacy_level: body.privacy_level || 'private',
    hidden_from_ai: Boolean(body.hidden_from_ai),
    media_url: body.media_url || null,
  }

  const { data, error } = await supabase.from('memories').insert(payload).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ memory: data })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'Memory ID required' }, { status: 400 })

  const payload: Record<string, any> = { ...body, tags: parseTags(body.tags), updated_at: new Date().toISOString() }
  delete payload.id
  delete payload.user_id

  const { data, error } = await supabase
    .from('memories')
    .update(payload)
    .eq('id', body.id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ memory: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Memory ID required' }, { status: 400 })

  const { error } = await supabase.from('memories').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
