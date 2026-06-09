export type MemoryType = 'life' | 'work' | 'learning' | 'relationship' | 'goal' | 'health' | 'personal' | 'chat'
export type MemoryFormat = 'written' | 'voice' | 'image' | 'document' | 'chat'
export type MoodType = 'happy' | 'neutral' | 'sad' | 'anxious' | 'excited' | 'angry'
export type ToneType = 'direct' | 'soft' | 'detailed' | 'motivational'

export interface Profile {
  id: string
  user_id: string
  full_name?: string | null
  birth_year?: number | null
  age?: number | null
  address?: string | null
  city?: string | null
  country?: string | null
  current_position?: string | null
  profession?: string | null
  phone_model?: string | null
  phone_health_status?: string | null
  phone_battery_percent?: number | null
  food_taste?: string | null
  social_status?: string | null
  financial_status?: string | null
  behavior_notes?: string | null
  language_preference?: string | null
  communication_style?: string | null
  life_summary?: string | null
  personality_notes?: string | null
  tone_preference: ToneType
  created_at?: string
  updated_at?: string
}

export interface Memory {
  id: string
  user_id: string
  title: string
  content: string
  memory_type: MemoryType
  memory_format?: MemoryFormat
  mood: MoodType
  event_date?: string | null
  tags: string[]
  importance: number
  confidence?: number
  evidence?: string | null
  source_message_id?: string | null
  privacy_level: string
  hidden_from_ai: boolean
  media_url?: string | null
  created_at?: string
  updated_at?: string
}

export interface Relationship {
  id: string
  user_id: string
  name: string
  relation_type: string
  phone?: string | null
  notes?: string | null
  closeness: number
  confidence?: number
  needs_confirmation?: boolean
  emotional_tone?: string | null
  evidence?: string | null
  last_mentioned_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface PersonalFact {
  id: string
  user_id: string
  category: string
  key: string
  value: string
  confidence: number
  needs_confirmation?: boolean
  is_sensitive?: boolean
  evidence?: string | null
  source_message_id?: string | null
  last_seen_at?: string | null
  source: string
  created_at?: string
  updated_at?: string
}

export interface PersonalityInsight {
  id: string
  user_id: string
  insight_type: string
  title: string
  content: string
  confidence: number
  evidence?: string | null
  last_seen_at?: string | null
  source: string
  created_at?: string
  updated_at?: string
}

export interface IdentitySummary {
  id: string
  user_id: string
  summary_text?: string | null
  strengths?: string[]
  growth_areas?: string[]
  communication_rules?: string[]
  caution_rules?: string[]
  next_questions?: string[]
  created_at?: string
  updated_at?: string
}

export interface ChatMessage {
  id: string
  user_id: string
  session_id?: string | null
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: Record<string, unknown>
  created_at?: string
}
