#!/bin/bash
# Run this inside your continuity-stack project folder

# ── Directories ──────────────────────────────────────────────
mkdir -p app/\(auth\)/login
mkdir -p app/\(auth\)/signup
mkdir -p app/\(protected\)/dashboard
mkdir -p app/\(protected\)/profile
mkdir -p app/\(protected\)/memories
mkdir -p app/\(protected\)/chat
mkdir -p app/\(protected\)/timeline
mkdir -p app/\(protected\)/relationships
mkdir -p app/\(protected\)/settings
mkdir -p app/api/chat
mkdir -p app/api/memories
mkdir -p app/api/profile
mkdir -p app/api/questions/next
mkdir -p app/api/export
mkdir -p app/api/delete-account
mkdir -p lib/supabase
mkdir -p components

# ── lib files ────────────────────────────────────────────────
cat > lib/supabase/client.ts << 'INNER'
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
INNER

cat > lib/supabase/server.ts << 'INNER'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}
INNER

cat > lib/groq.ts << 'INNER'
import Groq from 'groq-sdk'
export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
export const AI_MODEL = 'llama-3.3-70b-versatile'
INNER

cat > lib/types.ts << 'INNER'
export type MemoryType = 'life' | 'work' | 'learning' | 'personal'
export type MoodType = 'happy' | 'neutral' | 'sad' | 'anxious'
export type ToneType = 'direct' | 'soft' | 'detailed'

export interface Profile {
  id: string
  user_id: string
  full_name?: string
  birth_year?: number
  country?: string
  city?: string
  profession?: string
  life_summary?: string
  tone_preference: ToneType
  language_preference: string
}

export interface Memory {
  id: string
  user_id: string
  title: string
  content: string
  memory_type: MemoryType
  mood: MoodType
  date?: string
  tags: string[]
  importance: number
  privacy_level: string
  hidden_from_ai: boolean
}

export interface Relationship {
  id: string
  user_id: string
  name: string
  relation_type: string
  notes?: string
  closeness: number
}
INNER

cat > lib/memory-retrieval.ts << 'INNER'
import { createClient } from '@/lib/supabase/server'

export async function getUserContext(userId: string) {
  const supabase = createClient()
  const [profile, memories, facts, relationships] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).single(),
    supabase.from('memories').select('*').eq('user_id', userId)
      .eq('hidden_from_ai', false).order('importance', { ascending: false }).limit(12),
    supabase.from('personal_facts').select('*').eq('user_id', userId).limit(25),
    supabase.from('relationships').select('*').eq('user_id', userId).limit(10),
  ])
  return {
    profile: profile.data,
    memories: memories.data || [],
    facts: facts.data || [],
    relationships: relationships.data || [],
  }
}
INNER

# ── middleware ────────────────────────────────────────────────
cat > middleware.ts << 'INNER'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const isProtected = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/memories') ||
    request.nextUrl.pathname.startsWith('/chat') ||
    request.nextUrl.pathname.startsWith('/timeline') ||
    request.nextUrl.pathname.startsWith('/relationships') ||
    request.nextUrl.pathname.startsWith('/settings')
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
INNER

# ── Page stubs ────────────────────────────────────────────────
pages=("app/(auth)/login/page.tsx" "app/(auth)/signup/page.tsx" "app/(protected)/dashboard/page.tsx" "app/(protected)/profile/page.tsx" "app/(protected)/memories/page.tsx" "app/(protected)/chat/page.tsx" "app/(protected)/timeline/page.tsx" "app/(protected)/relationships/page.tsx" "app/(protected)/settings/page.tsx")

labels=("Login" "Signup" "Dashboard" "Profile" "Memories" "Chat" "Timeline" "Relationships" "Settings")

for i in "${!pages[@]}"; do
cat > "${pages[$i]}" << INNER
export default function ${labels[$i]}Page() {
  return <main><h1>${labels[$i]}</h1></main>
}
INNER
done

# ── API route stubs ───────────────────────────────────────────
api_routes=("app/api/chat/route.ts" "app/api/memories/route.ts" "app/api/profile/route.ts" "app/api/questions/next/route.ts" "app/api/export/route.ts" "app/api/delete-account/route.ts")

for route in "${api_routes[@]}"; do
cat > "$route" << 'INNER'
import { NextRequest, NextResponse } from 'next/server'
export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Route stub — implement me' })
}
export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'Route stub — implement me' })
}
INNER
done

echo ""
echo "✅ Structure created successfully!"
echo ""
echo "Next steps:"
echo "  1. npm install @supabase/supabase-js @supabase/ssr groq-sdk"
echo "  2. Replace app/api/chat/route.ts with the chat-route.ts file Claude gave you"
echo "  3. npm run dev"
