import Link from 'next/link'
import {
  Brain,
  Database,
  Eye,
  LockKeyhole,
  MessageSquare,
  Network,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import SafetyBanner from '@/components/SafetyBanner'
import SignalCore from '@/components/SignalCore'

const highlights = [
  {
    icon: Database,
    title: 'Private memory vault',
    text: 'Stores memories, personal facts, goals, and dated life context under each user account.',
  },
  {
    icon: MessageSquare,
    title: 'AI chat with history',
    text: 'Groq-powered chat reads saved profile, memories, relations, facts, insights, and recent chats.',
  },
  {
    icon: Network,
    title: 'Identity graph direction',
    text: 'Designed to grow into a visual structure of the person, relationships, timeline, and personality patterns.',
  },
]

const futureItems = [
  'Public demo mode for visitors',
  'Visual identity graph',
  'Voice memories',
  'Document-based memory extraction',
  'Confidence-based memory system',
  'Smarter personality and behavior insights',
]

export default function LandingPage() {
  return (
    <main className="public-shell">
      <nav className="public-topbar" aria-label="Public navigation">
        <Link href="/" className="public-brand" aria-label="Continuity Stack home">
          <span>CONTINUITY</span>
          <small>STACK v1.7</small>
        </Link>
        <div className="public-actions">
          <Link href="/demo" className="secondary-btn">
            <Eye size={17} /> View Demo
          </Link>
          <Link href="/login" className="primary-btn">
            <LockKeyhole size={17} /> Login
          </Link>
        </div>
      </nav>

      <section className="public-hero">
        <div className="public-hero-copy">
          <p className="section-eyebrow">PERSONAL AI MEMORY SYSTEM</p>
          <h1 className="public-title">PRIVATE DIGITAL IDENTITY FOR AI</h1>
          <p className="public-lead">
            Continuity Stack is a private AI memory archive where a logged-in user can save profile data,
            memories, relationships, chat history, personal facts, goals, and dated life context so the AI can
            understand the person over time.
          </p>
          <div className="public-cta-row">
            <Link href="/demo" className="primary-btn">
              <Eye size={18} /> Explore Public Demo
            </Link>
            <Link href="/signup" className="secondary-btn">
              <UserPlus size={18} /> Create Account
            </Link>
            <a
              href="https://github.com/ahmadrizwan3611-ux/continuity-stack"
              target="_blank"
              rel="noreferrer"
              className="secondary-btn"
            >
              GitHub
            </a>
          </div>
          <p className="public-note">
            Login is required only for the real memory experience because each person owns private data in Supabase.
          </p>
        </div>
        <div className="public-hero-panel panel">
          <SignalCore label="AI" />
          <h2 className="panel-title center">IDENTITY CORE PREVIEW</h2>
          <p>
            Demo visitors can view the concept without signing in. Real users login to save private memories and chat
            history securely.
          </p>
        </div>
      </section>

      <SafetyBanner />

      <section className="public-card-grid">
        {highlights.map((item) => {
          const Icon = item.icon
          return (
            <article key={item.title} className="panel public-feature-card">
              <Icon size={26} />
              <h3 className="panel-title">{item.title}</h3>
              <p>{item.text}</p>
            </article>
          )
        })}
      </section>

      <section className="public-split-grid">
        <div className="panel spacious">
          <p className="section-eyebrow">WHY LOGIN EXISTS</p>
          <h2 className="panel-title">PRIVATE MEMORY NEEDS USER ACCOUNTS</h2>
          <p>
            Removing login would make the project easier to open, but it would remove the main purpose of Continuity
            Stack. The system needs a user ID so memories, facts, relationships, chats, and insights belong to the
            correct person.
          </p>
        </div>
        <div className="panel spacious">
          <p className="section-eyebrow">ROADMAP</p>
          <h2 className="panel-title pink">FUTURE IMPROVEMENTS</h2>
          <div className="demo-chip-grid">
            {futureItems.map((item) => <span key={item} className="chip">{item}</span>)}
          </div>
        </div>
      </section>

      <section className="public-final panel">
        <Sparkles size={28} />
        <h2 className="panel-title center">AI SHOULD UNDERSTAND THE PERSON, NOT JUST THE PROMPT</h2>
        <p>
          This project explores a future where AI responds from a user-owned memory layer instead of starting from zero
          every time.
        </p>
        <div className="public-cta-row center-row">
          <Link href="/demo" className="primary-btn">View Demo</Link>
          <Link href="/login" className="secondary-btn">Login to Real App</Link>
        </div>
      </section>
    </main>
  )
}
