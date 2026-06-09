import { createClient } from '@/lib/supabase/server'
import SectionHeader from '@/components/SectionHeader'
import SignalCore from '@/components/SignalCore'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profile, memories, chats, relationships, insights] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user!.id).maybeSingle(),
    supabase.from('memories').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('relationships').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('personality_insights').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
  ])

  const isProfileReady = Boolean(profile.data?.full_name && profile.data?.life_summary)

  return (
    <>
      <SectionHeader eyebrow="SYSTEM OVERVIEW" title="STACK DASHBOARD" />
      <section className="dashboard-grid">
        <div className="panel core-panel">
          <SignalCore />
          <h2 className="panel-title center">IDENTITY CORE ACTIVE</h2>
          <p>Build the profile, save memories, add relationships, then let Groq answer from the full personal archive.</p>
        </div>
        <div className="stat-card panel"><span>MEMORIES STORED</span><strong>{memories.count || 0}</strong></div>
        <div className="stat-card panel"><span>CHAT MESSAGES</span><strong>{chats.count || 0}</strong></div>
        <div className="stat-card panel"><span>RELATIONSHIPS</span><strong>{relationships.count || 0}</strong></div>
        <div className="stat-card panel"><span>IDENTITY INSIGHTS</span><strong>{insights.count || 0}</strong></div>
        <div className="stat-card panel"><span>PROFILE STATUS</span><strong className={isProfileReady ? 'green' : 'orange'}>{isProfileReady ? 'READY' : 'EMPTY'}</strong></div>
      </section>
      <section className="info-grid">
        <div className="panel"><h3 className="panel-title">NEXT STEP</h3><p>Add profile details first, then add at least five memories. This gives the AI enough context to guide personally.</p></div>
        <div className="panel"><h3 className="panel-title pink">GROQ MODE</h3><p>The chat route uses your <code>GROQ_API_KEY</code> and keeps the safety system prompt active.</p></div>
        <div className="panel"><h3 className="panel-title orange">BOUNDARY</h3><p>This project stays software only. No implants, no body control, no medical claims.</p></div>
      </section>
    </>
  )
}
