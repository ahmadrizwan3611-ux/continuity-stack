import Link from 'next/link'
import { ArrowLeft, Brain, Database, LockKeyhole, MessageSquare, Network, Sparkles } from 'lucide-react'
import SafetyBanner from '@/components/SafetyBanner'
import SectionHeader from '@/components/SectionHeader'
import SignalCore from '@/components/SignalCore'

const demoMemories = [
  {
    title: 'Career direction',
    tag: 'Goal',
    text: 'User wants to become a strong software developer and build serious AI-powered web applications.',
  },
  {
    title: 'Learning style',
    tag: 'Behavior',
    text: 'User prefers practical, step-by-step guidance and dislikes vague instructions.',
  },
  {
    title: 'Project identity',
    tag: 'Vision',
    text: 'User is building Continuity Stack as a digital identity and personal AI memory system.',
  },
]

const demoRelations = [
  { name: 'AhmadZia', type: 'Important person', note: 'Positive emotional connection. Relationship type should be confirmed by the user.' },
  { name: 'Recruiters', type: 'Career network', note: 'User is building professional visibility and outreach.' },
  { name: 'Developers', type: 'Learning circle', note: 'User wants skills to be seen by real technical people.' },
]

const demoTimeline = [
  { date: '2026', title: 'Continuity Stack v1.7', text: 'Public demo layer added so visitors can understand the product without login.' },
  { date: '2026', title: 'Smart Memory Direction', text: 'Confidence-based memory, relationship confirmation, and relevant memory retrieval planned.' },
  { date: 'Future', title: 'Visual Identity Graph', text: 'A structured visual map of profile, memory, relationships, timeline, and personality insights.' },
]

export default function DemoPage() {
  return (
    <div className="app-shell demo-app-shell">
      <aside className="sidebar demo-sidebar">
        <Link href="/" className="brand" aria-label="Continuity Stack public home">
          <span className="brand-title">CONTINUITY</span>
          <span className="brand-subtitle">PUBLIC DEMO</span>
        </Link>
        <div className="nav-list">
          <a href="#overview" className="nav-item active"><Brain size={20} /> <span>Overview</span></a>
          <a href="#memories" className="nav-item"><Database size={20} /> <span>Memories</span></a>
          <a href="#relationships" className="nav-item"><Network size={20} /> <span>Relations</span></a>
          <a href="#chat-preview" className="nav-item"><MessageSquare size={20} /> <span>Chat Preview</span></a>
        </div>
        <div className="sidebar-bottom">
          <div className="mini-panel">
            <p className="mini-label">DEMO MODE</p>
            <p className="mini-text">Sample data only. No private user data is shown.</p>
          </div>
          <Link href="/login" className="primary-btn small"><LockKeyhole size={16} /> Real Login</Link>
          <Link href="/" className="secondary-btn small"><ArrowLeft size={16} /> Landing Page</Link>
        </div>
      </aside>

      <main className="main-panel demo-main-panel">
        <SafetyBanner />
        <div className="page-container demo-page-container">
          <section id="overview">
            <SectionHeader eyebrow="PUBLIC DEMO" title="IDENTITY PREVIEW" />
            <section className="dashboard-grid">
              <div className="panel core-panel">
                <SignalCore />
                <h2 className="panel-title center">DEMO IDENTITY CORE</h2>
                <p>This public preview shows how the real logged-in system can structure memory, relations, and AI guidance.</p>
              </div>
              <div className="stat-card panel"><span>MEMORIES STORED</span><strong>17</strong></div>
              <div className="stat-card panel"><span>CHAT MESSAGES</span><strong>54</strong></div>
              <div className="stat-card panel"><span>RELATIONSHIPS</span><strong>4</strong></div>
              <div className="stat-card panel"><span>IDENTITY INSIGHTS</span><strong>8</strong></div>
              <div className="stat-card panel"><span>PROFILE STATUS</span><strong className="green">DEMO</strong></div>
            </section>
          </section>

          <section className="demo-section" id="memories">
            <SectionHeader eyebrow="SAMPLE MEMORY VAULT" title="MEMORY STRUCTURE" />
            <div className="memory-grid demo-three-grid">
              {demoMemories.map((memory) => (
                <article key={memory.title} className="memory-card">
                  <div className="tag-row"><span className="chip">{memory.tag}</span><span className="chip">Confidence: High</span></div>
                  <h3>{memory.title}</h3>
                  <p>{memory.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="demo-section" id="relationships">
            <SectionHeader eyebrow="SAMPLE RELATION MAP" title="PEOPLE CONTEXT" />
            <div className="memory-grid demo-three-grid">
              {demoRelations.map((relation) => (
                <article key={relation.name} className="memory-card">
                  <div className="tag-row"><span className="chip">{relation.type}</span></div>
                  <h3>{relation.name}</h3>
                  <p>{relation.note}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="demo-section demo-chat-grid" id="chat-preview">
            <div className="panel demo-chat-card">
              <p className="section-eyebrow">AI CHAT PREVIEW</p>
              <div className="chat-bubble user">
                <span className="bubble-role">YOU</span>
                <p>What do you know about me?</p>
              </div>
              <div className="chat-bubble">
                <span className="bubble-role">AI</span>
                <p>Based on the demo profile, you are a junior full-stack developer building an AI memory system. You prefer practical guidance, step-by-step progress, and want the AI to remember personal context through a private account.</p>
              </div>
              <div className="chat-bubble user">
                <span className="bubble-role">YOU</span>
                <p>What should I improve next?</p>
              </div>
              <div className="chat-bubble">
                <span className="bubble-role">AI</span>
                <p>The next improvement should be a visual identity graph, because it will make the saved memories, relationships, goals, and timeline easier for visitors and users to understand.</p>
              </div>
            </div>

            <div className="panel demo-timeline-card">
              <p className="section-eyebrow">TIMELINE PREVIEW</p>
              <div className="timeline-list">
                {demoTimeline.map((item) => (
                  <article key={item.title} className="timeline-item">
                    <time>{item.date}</time>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="public-final panel">
            <Sparkles size={28} />
            <h2 className="panel-title center">READY TO TRY THE REAL MEMORY SYSTEM?</h2>
            <p>The real app requires login so each user can safely own and save private memory data in Supabase.</p>
            <div className="public-cta-row center-row">
              <Link href="/signup" className="primary-btn">Create Account</Link>
              <Link href="/login" className="secondary-btn">Login</Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
