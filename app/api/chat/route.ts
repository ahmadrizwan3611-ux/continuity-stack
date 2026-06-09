import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGroqClient, AI_MODEL } from '@/lib/groq'

type ChatRole = 'user' | 'assistant' | 'system'

type RecentMessage = {
  role: ChatRole
  content: string
  created_at?: string
}

type ExtractedKnowledge = {
  facts?: Array<{
    category?: string
    key?: string
    value?: string
    confidence?: number
    needs_confirmation?: boolean
    is_sensitive?: boolean
    evidence?: string
  }>
  relationships?: Array<{
    name?: string
    relation_type?: string
    closeness?: number
    confidence?: number
    needs_confirmation?: boolean
    emotional_tone?: string
    notes?: string
    evidence?: string
  }>
  memories?: Array<{
    title?: string
    content?: string
    memory_type?: string
    mood?: string
    importance?: number
    confidence?: number
    tags?: string[]
    evidence?: string
  }>
  insights?: Array<{
    insight_type?: string
    title?: string
    content?: string
    confidence?: number
    evidence?: string
  }>
  questions?: Array<{
    category?: string
    question?: string
  }>
}

const MAX_HISTORY_FOR_PROMPT = 28
const MAX_MESSAGES_FOR_UI = 100

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const requestedSessionId = req.nextUrl.searchParams.get('session_id')
    let sessionId = requestedSessionId

    if (!sessionId) {
      const { data: latestSession } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      sessionId = latestSession?.id || null
    }

    if (!sessionId) return NextResponse.json({ session_id: null, messages: [] })

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(MAX_MESSAGES_FOR_UI)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      session_id: sessionId,
      messages: (messages || []).reverse(),
    })
  } catch (error: any) {
    console.error('Chat GET error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, session_id } = await req.json()
    const userMessage = String(message || '').trim()

    if (!userMessage) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    const sessionId = await getOrCreateSession(supabase, user.id, session_id, userMessage)

    const [
      profileResult,
      memoriesResult,
      factsResult,
      relationshipsResult,
      insightsResult,
      identitySummaryResult,
      recentMessagesResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('memories')
        .select('id, title, content, event_date, tags, memory_type, mood, importance, confidence, evidence, created_at')
        .eq('user_id', user.id)
        .eq('hidden_from_ai', false)
        .order('importance', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(60),
      supabase.from('personal_facts')
        .select('category, key, value, confidence, needs_confirmation, is_sensitive, evidence, source, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(120),
      supabase.from('relationships')
        .select('name, relation_type, closeness, confidence, needs_confirmation, emotional_tone, phone, notes, evidence, updated_at')
        .eq('user_id', user.id)
        .order('closeness', { ascending: false })
        .limit(70),
      supabase.from('personality_insights')
        .select('insight_type, title, content, confidence, evidence, source, updated_at')
        .eq('user_id', user.id)
        .order('confidence', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(60),
      supabase.from('identity_summaries')
        .select('summary_text, strengths, growth_areas, caution_rules, communication_rules, next_questions, updated_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('chat_messages')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(MAX_HISTORY_FOR_PROMPT),
    ])

    const profile = profileResult.data
    const allMemories = memoriesResult.data || []
    const allFacts = factsResult.data || []
    const allRelationships = relationshipsResult.data || []
    const allInsights = insightsResult.data || []
    const identitySummary = identitySummaryResult.data
    const recentMessages = ((recentMessagesResult.data || []) as RecentMessage[]).reverse()

    const memories = rankByRelevance(allMemories, userMessage, (m) => `${m.title || ''} ${m.content || ''} ${m.tags?.join(' ') || ''}`, 18)
    const facts = rankByRelevance(allFacts, userMessage, (f) => `${f.category || ''} ${f.key || ''} ${f.value || ''}`, 55)
    const relationships = rankByRelevance(allRelationships, userMessage, (r) => `${r.name || ''} ${r.relation_type || ''} ${r.notes || ''}`, 30)
    const insights = rankByRelevance(allInsights, userMessage, (i) => `${i.insight_type || ''} ${i.title || ''} ${i.content || ''}`, 25)

    const systemPrompt = buildSystemPrompt({
      profile,
      memories,
      facts,
      relationships,
      insights,
      identitySummary,
      recentMessages,
      userMessage,
    })

    let aiResponse = ''
    const groq = getGroqClient()

    if (!groq) {
      aiResponse = fallbackAnswer(userMessage, profile, memories, facts, relationships, recentMessages)
    } else {
      const completion = await groq.chat.completions.create({
        model: AI_MODEL,
        max_tokens: 950,
        temperature: 0.28,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      })
      aiResponse = completion.choices[0]?.message?.content || 'I could not generate a response. Please try again.'
    }

    const { data: inserted, error: insertError } = await supabase.from('chat_messages').insert([
      {
        user_id: user.id,
        session_id: sessionId,
        role: 'user',
        content: userMessage,
        metadata: { v: '1.6', purpose: 'raw_user_message' },
      },
      {
        user_id: user.id,
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
        metadata: { v: '1.6', purpose: 'assistant_response' },
      },
    ]).select('id, role')

    if (insertError) throw insertError

    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id)

    const userMessageId = inserted?.find((row: any) => row.role === 'user')?.id || null
    await extractAndStoreKnowledge(supabase, user.id, userMessage, aiResponse, userMessageId)
    await refreshIdentitySummary(supabase, user.id)

    return NextResponse.json({
      response: aiResponse,
      session_id: sessionId,
      memoriesUsed: memories.length,
      factsUsed: facts.length,
      relationshipsUsed: relationships.length,
      recentMessagesUsed: recentMessages.length,
      version: '1.6',
    })
  } catch (error: any) {
    console.error('Chat API error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getOrCreateSession(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, sessionId: string | null, message: string) {
  if (sessionId) {
    const { data } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (data?.id) return data.id
  }

  const { data: latestSession } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestSession?.id) return latestSession.id

  const { data: session, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: userId, title: message.slice(0, 70) || 'New chat' })
    .select('id')
    .single()

  if (error) throw error
  return session.id
}

function buildSystemPrompt(input: {
  profile: any
  memories: any[]
  facts: any[]
  relationships: any[]
  insights: any[]
  identitySummary: any
  recentMessages: RecentMessage[]
  userMessage: string
}) {
  const { profile, memories, facts, relationships, insights, identitySummary, recentMessages, userMessage } = input
  const name = profile?.full_name || factValue(facts, 'name') || 'the user'
  const tone = profile?.tone_preference || 'direct'
  const language = profile?.language_preference || 'English'

  const confirmedFacts = facts.filter((f) => !f.needs_confirmation && !f.is_sensitive)
  const sensitiveFacts = facts.filter((f) => f.is_sensitive)
  const unconfirmedFacts = facts.filter((f) => f.needs_confirmation)
  const confirmedRelationships = relationships.filter((r) => !r.needs_confirmation && r.relation_type !== 'unknown')
  const unconfirmedRelationships = relationships.filter((r) => r.needs_confirmation || r.relation_type === 'unknown')

  const memorySummary = memories.length
    ? memories.map((m) => `[${m.event_date || m.created_at?.slice(0, 10) || 'undated'}] ${m.title}: ${String(m.content).slice(0, 420)} (importance ${m.importance || 3}/5, confidence ${m.confidence || 3}/5)`).join('\n')
    : 'No relevant saved memories found.'

  const factSummary = confirmedFacts.length
    ? confirmedFacts.map((f) => `${f.category || 'Personal'} / ${f.key}: ${f.value} (confidence ${f.confidence || 3}/5)`).join('\n')
    : 'No confirmed relevant facts found.'

  const sensitiveSummary = sensitiveFacts.length
    ? sensitiveFacts.map((f) => `${f.category || 'Sensitive'} / ${f.key}: ${f.value} (confidence ${f.confidence || 3}/5)`).join('\n')
    : 'No sensitive facts loaded.'

  const unconfirmedFactSummary = unconfirmedFacts.length
    ? unconfirmedFacts.map((f) => `${f.category || 'Unconfirmed'} / ${f.key}: ${f.value} (needs confirmation)`).join('\n')
    : 'No unconfirmed facts loaded.'

  const relSummary = confirmedRelationships.length
    ? confirmedRelationships.map((r) => `${r.name} is ${r.relation_type}. Closeness ${r.closeness || 3}/5. Notes: ${r.notes || 'none'}`).join('\n')
    : 'No confirmed relationships loaded.'

  const unconfirmedRelSummary = unconfirmedRelationships.length
    ? unconfirmedRelationships.map((r) => `${r.name}: relation type ${r.relation_type || 'unknown'}, tone ${r.emotional_tone || 'unknown'}, notes: ${r.notes || 'mentioned but not confirmed'}`).join('\n')
    : 'No unconfirmed relationships loaded.'

  const insightSummary = insights.length
    ? insights.map((i) => `${i.insight_type || 'insight'} / ${i.title}: ${i.content} (confidence ${i.confidence || 3}/5)`).join('\n')
    : 'No personality insights loaded.'

  const chatSummary = recentMessages.length
    ? recentMessages.map((m) => `[${m.created_at?.slice(0, 16) || 'recent'}] ${m.role.toUpperCase()}: ${String(m.content).slice(0, 460)}`).join('\n')
    : 'No previous chat messages saved yet.'

  return `You are Continuity AI v1.6, a private personal memory guide for ${name}.

CORE PRODUCT VISION:
You understand the user through saved profile, memories, relationships, personal facts, previous chats, and personality insights. You should feel continuous after login, but you must not over-repeat saved data.

CRITICAL RESPONSE STYLE:
- Answer the user's current question first.
- Do NOT start every reply with "Hello", "I remember", "I recall", or "As we discussed".
- Use memory silently and naturally. Mention saved memory only when it directly improves the answer.
- Do not repeat unrelated personal details just to show memory.
- Give practical, step-by-step guidance when the user asks for help.
- Ask at most ONE short follow-up question at the end, only if useful.
- Preferred tone: ${tone}. Preferred language: ${language}.

MEMORY QUALITY RULES:
- Confirmed facts can be used normally.
- Unconfirmed facts and unclear relationships must NOT be stated as truth.
- If a person is mentioned with emotion, do not assume romantic/family/friend relation unless the user clearly said it. Ask for confirmation.
- Sensitive data such as health, religion, finance, mental state, and identity details should only be mentioned when directly relevant to the user question.
- If making an interpretation, label it as "Inference" and keep it careful.
- Never invent facts, history, people, diagnosis, or relationship types.
- If the user asks whether you remember previous chats, answer from RECENT CHAT HISTORY and saved data.
- Never claim mind transfer, consciousness copy, implants, body control, medical device ability, or hidden monitoring.

CURRENT USER MESSAGE:
${userMessage}

PROFILE:
Name: ${profile?.full_name || 'not saved'}
Age: ${profile?.age || 'not saved'}
Birth Year: ${profile?.birth_year || 'not saved'}
Address/City/Country: ${profile?.address || ''} ${profile?.city || ''} ${profile?.country || ''}
Current Position: ${profile?.current_position || profile?.profession || 'not saved'}
Phone: ${profile?.phone_model || 'not saved'} | Health: ${profile?.phone_health_status || 'not saved'} | Battery: ${profile?.phone_battery_percent || 'not saved'}
Food Taste: ${profile?.food_taste || 'not saved'}
Social Status: ${profile?.social_status || 'not saved'}
Financial Status: ${profile?.financial_status || 'not saved'}
Communication Style: ${profile?.communication_style || 'not saved'}
Behavior Notes: ${profile?.behavior_notes || 'not saved'}
Life Summary: ${profile?.life_summary || 'not saved'}
Personality Notes: ${profile?.personality_notes || 'not saved'}

IDENTITY SUMMARY:
${identitySummary?.summary_text || 'No identity summary yet.'}
Strengths: ${jsonShort(identitySummary?.strengths)}
Growth Areas: ${jsonShort(identitySummary?.growth_areas)}
Communication Rules: ${jsonShort(identitySummary?.communication_rules)}
Caution Rules: ${jsonShort(identitySummary?.caution_rules)}

CONFIRMED FACTS:
${factSummary}

UNCONFIRMED FACTS:
${unconfirmedFactSummary}

SENSITIVE FACTS LOADED ONLY FOR RELEVANCE:
${sensitiveSummary}

CONFIRMED RELATIONSHIPS:
${relSummary}

UNCONFIRMED RELATIONSHIPS:
${unconfirmedRelSummary}

PERSONALITY INSIGHTS:
${insightSummary}

RELEVANT SAVED MEMORIES:
${memorySummary}

RECENT CHAT HISTORY:
${chatSummary}

FINAL OUTPUT RULE:
Be useful, direct, personal, and safe. Do not show internal labels unless needed.`
}

async function extractAndStoreKnowledge(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userMessage: string,
  aiResponse: string,
  sourceMessageId: string | null
) {
  const groq = getGroqClient()
  let extracted: ExtractedKnowledge | null = null

  if (groq) {
    try {
      const extractionPrompt = `Extract durable personal knowledge from this user message. Return ONLY valid JSON. Do not include markdown.

Rules:
- Save exact user-shared details.
- Do not infer sensitive facts that were not stated.
- Do not infer romantic, family, medical, religious, financial, or mental-health details unless the user clearly states them.
- If a relationship type is unclear, use relation_type "unknown" and needs_confirmation true.
- If a fact is sensitive, set is_sensitive true.
- If a fact is unclear, set needs_confirmation true.
- Health-related details can be saved if the user clearly shared them, but mark is_sensitive true.
- Avoid saving generic assistant advice as a user fact.
- Extract user goals, preferences, device details, relationships, behavior patterns, and dated memories.

JSON shape:
{
  "facts": [{"category":"Identity|Preference|Behavior|Goal|Device|Work|Social|Financial|Language|Health|Other", "key":"snake_case_key", "value":"short value", "confidence":1-5, "needs_confirmation":true/false, "is_sensitive":true/false, "evidence":"short quote"}],
  "relationships": [{"name":"person name", "relation_type":"father|mother|sibling|friend|colleague|mentor|partner|unknown|other", "closeness":1-5, "confidence":1-5, "needs_confirmation":true/false, "emotional_tone":"positive|neutral|negative|mixed|unknown", "notes":"short note", "evidence":"short quote"}],
  "memories": [{"title":"short title", "content":"what happened or what was shared", "memory_type":"chat|life|work|relationship|goal|health|personal", "mood":"neutral|happy|sad|anxious|excited|angry", "importance":1-5, "confidence":1-5, "tags":["tag"], "evidence":"short quote"}],
  "insights": [{"insight_type":"strength|growth_area|behavior_pattern|communication_style|decision_pattern|risk_pattern|goal_pattern", "title":"short title", "content":"careful pattern based on the text", "confidence":1-5, "evidence":"short quote"}],
  "questions": [{"category":"Profile|Preference|Relationship|Goal|Health|Work|Other", "question":"one helpful question to clarify missing or unclear user data"}]
}

User message:
${userMessage}

AI response:
${aiResponse.slice(0, 1000)}`

      const completion = await groq.chat.completions.create({
        model: AI_MODEL,
        max_tokens: 900,
        temperature: 0.08,
        messages: [{ role: 'user', content: extractionPrompt }],
      })

      extracted = safeJsonParse(completion.choices[0]?.message?.content || '')
    } catch (error: any) {
      console.error('Knowledge extraction error:', error?.message || error)
    }
  }

  if (!extracted) extracted = heuristicExtract(userMessage)

  const now = new Date().toISOString()

  const facts = (extracted.facts || [])
    .filter((f) => f.key && f.value)
    .slice(0, 14)
    .map((f) => ({
      user_id: userId,
      category: normalizeText(f.category, 'Personal'),
      key: toSnakeKey(f.key!),
      value: String(f.value).slice(0, 700),
      confidence: clampNumber(f.confidence, 1, 5, 3),
      needs_confirmation: Boolean(f.needs_confirmation),
      is_sensitive: Boolean(f.is_sensitive) || isSensitiveCategory(f.category),
      evidence: String(f.evidence || userMessage).slice(0, 700),
      source: 'chat_auto_v1_6',
      source_message_id: sourceMessageId,
      last_seen_at: now,
      updated_at: now,
    }))

  if (facts.length) {
    await supabase.from('personal_facts').upsert(facts, { onConflict: 'user_id,key' })
  }

  const relationships = (extracted.relationships || [])
    .filter((r) => r.name)
    .slice(0, 8)
    .map((r) => {
      const cleanName = String(r.name || '').trim().slice(0, 120)
      const relationType = normalizeRelationshipType(r.relation_type, userMessage, cleanName)
      return {
        user_id: userId,
        name: cleanName,
        relation_type: relationType.value,
        closeness: clampNumber(r.closeness, 1, 5, 3),
        confidence: clampNumber(r.confidence, 1, 5, relationType.needsConfirmation ? 2 : 3),
        needs_confirmation: Boolean(r.needs_confirmation) || relationType.needsConfirmation,
        emotional_tone: normalizeText(r.emotional_tone, 'unknown'),
        notes: String(r.notes || `Mentioned in chat on ${now.slice(0, 10)}`).slice(0, 1200),
        evidence: String(r.evidence || userMessage).slice(0, 700),
        last_mentioned_at: now,
        updated_at: now,
      }
    })

  if (relationships.length) {
    await supabase.from('relationships').upsert(relationships, { onConflict: 'user_id,name' })
  }

  const memories = (extracted.memories || [])
    .filter((m) => m.title && m.content)
    .filter((m) => clampNumber(m.importance, 1, 5, 3) >= 3)
    .slice(0, 4)
    .map((m) => ({
      user_id: userId,
      title: String(m.title).slice(0, 160),
      content: String(m.content).slice(0, 2000),
      memory_type: normalizeText(m.memory_type, 'chat'),
      memory_format: 'chat',
      mood: normalizeText(m.mood, 'neutral'),
      event_date: now.slice(0, 10),
      tags: Array.isArray(m.tags) ? m.tags.map((tag) => String(tag).slice(0, 40)).slice(0, 8) : ['chat-auto'],
      importance: clampNumber(m.importance, 1, 5, 3),
      confidence: clampNumber(m.confidence, 1, 5, 3),
      evidence: String(m.evidence || userMessage).slice(0, 700),
      source_message_id: sourceMessageId,
      privacy_level: 'private',
      hidden_from_ai: false,
    }))

  if (memories.length) {
    await supabase.from('memories').insert(memories)
  }

  const insights = (extracted.insights || [])
    .filter((i) => i.title && i.content)
    .slice(0, 7)
    .map((i) => ({
      user_id: userId,
      insight_type: normalizeText(i.insight_type, 'behavior_pattern'),
      title: String(i.title).slice(0, 140),
      content: String(i.content).slice(0, 1400),
      confidence: clampNumber(i.confidence, 1, 5, 3),
      evidence: String(i.evidence || userMessage).slice(0, 700),
      source: 'chat_auto_v1_6',
      last_seen_at: now,
      updated_at: now,
    }))

  if (insights.length) {
    await supabase.from('personality_insights').upsert(insights, { onConflict: 'user_id,insight_type,title' })
  }

  const questions = (extracted.questions || [])
    .filter((q) => q.question)
    .slice(0, 2)
    .map((q) => ({
      user_id: userId,
      category: normalizeText(q.category, 'Personal'),
      question: String(q.question).slice(0, 500),
      status: 'open',
    }))

  if (questions.length) {
    await supabase.from('ai_questions').insert(questions)
  }
}

async function refreshIdentitySummary(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const groq = getGroqClient()
  if (!groq) return

  try {
    const [profileResult, factsResult, relationshipsResult, insightsResult, memoriesResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('personal_facts').select('category, key, value, confidence, needs_confirmation, is_sensitive').eq('user_id', userId).order('updated_at', { ascending: false }).limit(50),
      supabase.from('relationships').select('name, relation_type, closeness, confidence, needs_confirmation, notes').eq('user_id', userId).order('updated_at', { ascending: false }).limit(30),
      supabase.from('personality_insights').select('insight_type, title, content, confidence').eq('user_id', userId).order('updated_at', { ascending: false }).limit(30),
      supabase.from('memories').select('title, content, event_date, memory_type, importance').eq('user_id', userId).eq('hidden_from_ai', false).order('created_at', { ascending: false }).limit(20),
    ])

    const summaryPrompt = `Create a concise private identity summary for this user. Return ONLY valid JSON.

Rules:
- Summarize only supported data.
- Do not turn unconfirmed relationships into confirmed facts.
- Sensitive facts should be summarized carefully and only as user-shared context.
- Focus on how the AI should treat, guide, and communicate with the user.

JSON shape:
{
  "summary_text":"short paragraph",
  "strengths":["..."],
  "growth_areas":["..."],
  "communication_rules":["..."],
  "caution_rules":["..."],
  "next_questions":["..."]
}

Profile:
${JSON.stringify(profileResult.data || {}, null, 2)}
Facts:
${JSON.stringify(factsResult.data || [], null, 2)}
Relationships:
${JSON.stringify(relationshipsResult.data || [], null, 2)}
Insights:
${JSON.stringify(insightsResult.data || [], null, 2)}
Recent memories:
${JSON.stringify(memoriesResult.data || [], null, 2)}`

    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 800,
      temperature: 0.12,
      messages: [{ role: 'user', content: summaryPrompt }],
    })

    const parsed = safeJsonParse(completion.choices[0]?.message?.content || '') as any
    if (!parsed?.summary_text) return

    await supabase.from('identity_summaries').upsert({
      user_id: userId,
      summary_text: String(parsed.summary_text).slice(0, 2500),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 12) : [],
      growth_areas: Array.isArray(parsed.growth_areas) ? parsed.growth_areas.slice(0, 12) : [],
      communication_rules: Array.isArray(parsed.communication_rules) ? parsed.communication_rules.slice(0, 12) : [],
      caution_rules: Array.isArray(parsed.caution_rules) ? parsed.caution_rules.slice(0, 12) : [],
      next_questions: Array.isArray(parsed.next_questions) ? parsed.next_questions.slice(0, 12) : [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  } catch (error: any) {
    console.error('Identity summary refresh error:', error?.message || error)
  }
}

function fallbackAnswer(
  message: string,
  profile: any,
  memories: any[],
  facts: any[],
  relationships: any[],
  recentMessages: RecentMessage[]
) {
  const lower = message.toLowerCase()
  const name = profile?.full_name || factValue(facts, 'name')

  if (lower.includes('previous chat') || lower.includes('remember')) {
    if (recentMessages.length) {
      const lastUserMessages = recentMessages.filter((m) => m.role === 'user').slice(-4).map((m) => `"${m.content.slice(0, 120)}"`)
      return `Yes, I can see saved chat history under your login. Recently you discussed: ${lastUserMessages.join(', ')}. Add your Groq key for deeper personal analysis.`
    }
    return 'I do not have previous chat messages saved yet. Start chatting and I will save the conversation under your login.'
  }

  if (lower.includes('name')) {
    return name ? `Your saved name is ${name}.` : 'I do not have your name saved yet. What name should I save in your profile?'
  }

  if (lower.includes('friend') || lower.includes('relationship')) {
    if (relationships.length) {
      return `Saved relationships I know: ${relationships.map((r) => `${r.name} (${r.relation_type || 'unknown'}, closeness ${r.closeness || 3}/5)`).join(', ')}.`
    }
    return 'I do not have confirmed relationship information yet. Who is the most important person in your life right now?'
  }

  if (memories.length === 0 && facts.length === 0 && !profile && recentMessages.length === 0) {
    return 'I do not have enough saved data about you yet. Add your profile and first memory, then I can guide you more personally.'
  }

  return `I found ${memories.length} relevant memories, ${facts.length} personal facts, ${relationships.length} relationships, and ${recentMessages.length} recent chat messages. Add GROQ_API_KEY in .env.local for full personalized AI replies.`
}

function heuristicExtract(message: string): ExtractedKnowledge {
  const facts: NonNullable<ExtractedKnowledge['facts']> = []
  const relationships: NonNullable<ExtractedKnowledge['relationships']> = []
  const insights: NonNullable<ExtractedKnowledge['insights']> = []
  const text = message.trim()
  const lower = text.toLowerCase()

  const nameMatch = text.match(/(?:my name is|i am|i'm)\s+([a-zA-Z\s]{2,60})/i)
  if (nameMatch) facts.push({ category: 'Identity', key: 'name', value: nameMatch[1].trim(), confidence: 3, needs_confirmation: false, is_sensitive: false, evidence: nameMatch[0] })

  const liveMatch = text.match(/(?:i live in|from|i am from)\s+([a-zA-Z\s,]{2,80})/i)
  if (liveMatch) facts.push({ category: 'Identity', key: 'location', value: liveMatch[1].trim(), confidence: 3, needs_confirmation: false, is_sensitive: false, evidence: liveMatch[0] })

  const likeMatch = text.match(/(?:i like|i love|my favorite|my favourite)\s+(.{2,90})/i)
  if (likeMatch) facts.push({ category: 'Preference', key: 'preference_' + toSnakeKey(likeMatch[1].slice(0, 24)), value: likeMatch[1].trim(), confidence: 3, needs_confirmation: false, is_sensitive: false, evidence: likeMatch[0] })

  const goalMatch = text.match(/(?:i want to|my goal is|i need to)\s+(.{2,120})/i)
  if (goalMatch) facts.push({ category: 'Goal', key: 'current_goal', value: goalMatch[1].trim(), confidence: 3, needs_confirmation: false, is_sensitive: false, evidence: goalMatch[0] })

  const healthMatch = text.match(/(?:my health|i have|i suffer from|doctor told me|diagnosed with)\s+(.{2,120})/i)
  if (healthMatch && /health|pain|disease|disorder|doctor|diagnosed|medicine|anxiety|depression|bp|blood|heart/i.test(text)) {
    facts.push({ category: 'Health', key: 'health_context', value: healthMatch[1].trim(), confidence: 3, needs_confirmation: false, is_sensitive: true, evidence: healthMatch[0] })
  }

  const fatherMatch = text.match(/father(?:'s)? name is\s+([a-zA-Z\s]{2,80})/i)
  if (fatherMatch) relationships.push({ name: fatherMatch[1].trim(), relation_type: 'father', closeness: 4, confidence: 4, needs_confirmation: false, emotional_tone: 'neutral', notes: 'Father mentioned in chat.', evidence: fatherMatch[0] })

  const friendMatch = text.match(/(?:my friend is|closest friend is|friend named|best friend is)\s+([a-zA-Z\s]{2,80})/i)
  if (friendMatch) relationships.push({ name: friendMatch[1].trim(), relation_type: 'friend', closeness: 4, confidence: 4, needs_confirmation: false, emotional_tone: 'positive', notes: 'Friend mentioned in chat.', evidence: friendMatch[0] })

  const namedPerson = text.match(/\b([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})?)\b/)
  if (namedPerson && !relationships.length && /(loving|kind|special|important|close|trust)/i.test(text)) {
    relationships.push({
      name: namedPerson[1],
      relation_type: 'unknown',
      closeness: 3,
      confidence: 2,
      needs_confirmation: true,
      emotional_tone: 'positive',
      notes: 'Person was mentioned with positive emotion, but relationship type was not confirmed.',
      evidence: text.slice(0, 200),
    })
  }

  if (lower.includes('frustrated') || lower.includes('angry') || lower.includes('not fair')) {
    insights.push({ insight_type: 'behavior_pattern', title: 'Frustration when continuity breaks', content: 'The user cares strongly about continuity and becomes frustrated when the AI behaves like it has no previous context.', confidence: 3, evidence: text.slice(0, 200) })
  }

  if (lower.includes('step by step') || lower.includes('don\'t break') || lower.includes('one by one')) {
    insights.push({ insight_type: 'communication_style', title: 'Prefers careful step-by-step help', content: 'The user prefers controlled, step-by-step guidance and wants changes that do not break the project.', confidence: 4, evidence: text.slice(0, 200) })
  }

  return {
    facts,
    relationships,
    insights,
    memories: text.length > 35 ? [{ title: 'Chat memory', content: text, memory_type: 'chat', mood: 'neutral', importance: 3, confidence: 3, tags: ['chat-auto'], evidence: text.slice(0, 200) }] : [],
  }
}

function rankByRelevance<T>(rows: T[], query: string, textGetter: (row: T) => string, limit: number): T[] {
  const q = keywordSet(query)
  return [...rows]
    .map((row, index) => {
      const text = textGetter(row).toLowerCase()
      const score = [...q].reduce((sum, word) => sum + (text.includes(word) ? 3 : 0), 0) + Math.max(0, 2 - index * 0.02)
      return { row, score, index }
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((item) => item.row)
}

function keywordSet(text: string) {
  const stop = new Set(['the', 'and', 'you', 'your', 'that', 'this', 'with', 'what', 'when', 'where', 'how', 'why', 'are', 'is', 'am', 'have', 'want', 'need'])
  return new Set(String(text).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !stop.has(w)).slice(0, 25))
}

function normalizeRelationshipType(value: any, source: string, name: string) {
  const v = String(value || '').toLowerCase().trim()
  const allowed = new Set(['father', 'mother', 'sibling', 'friend', 'colleague', 'mentor', 'partner', 'unknown', 'other'])
  const relation = allowed.has(v) ? v : 'unknown'
  if (relation === 'unknown') return { value: 'unknown', needsConfirmation: true }

  const sourceLower = source.toLowerCase()
  const relationEvidenceMap: Record<string, string[]> = {
    father: ['father', 'dad', 'abbu'],
    mother: ['mother', 'mom', 'ammi'],
    sibling: ['sibling', 'brother', 'sister'],
    friend: ['friend', 'best friend', 'close friend'],
    colleague: ['colleague', 'coworker', 'co-worker'],
    mentor: ['mentor', 'teacher', 'ustad'],
    partner: ['wife', 'husband', 'girlfriend', 'boyfriend', 'partner', 'spouse'],
    other: [],
  }
  const relationEvidence = relationEvidenceMap[relation] || []

  const explicitlyStated = relationEvidence.some((word) => sourceLower.includes(word)) || sourceLower.includes(`${name.toLowerCase()} is my ${relation}`)
  if (!explicitlyStated && relation !== 'other') return { value: 'unknown', needsConfirmation: true }
  return { value: relation, needsConfirmation: false }
}

function isSensitiveCategory(value: any) {
  return ['health', 'financial', 'religion', 'mental_health', 'medical'].includes(String(value || '').toLowerCase())
}

function safeJsonParse(raw: string): ExtractedKnowledge | any | null {
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
    return JSON.parse(cleaned)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

function factValue(facts: any[], key: string) {
  return facts.find((f) => String(f.key).toLowerCase() === key.toLowerCase())?.value
}

function normalizeText(value: any, fallback: string) {
  const text = String(value || '').trim()
  return text || fallback
}

function toSnakeKey(value: string) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'personal_note'
}

function clampNumber(value: any, min: number, max: number, fallback: number) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(min, Math.min(max, Math.round(num)))
}

function jsonShort(value: any) {
  if (!value) return 'not saved'
  try {
    const arr = Array.isArray(value) ? value : JSON.parse(value)
    if (!Array.isArray(arr) || arr.length === 0) return 'not saved'
    return arr.slice(0, 8).join('; ')
  } catch {
    return String(value).slice(0, 700)
  }
}
