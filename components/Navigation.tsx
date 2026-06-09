'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Brain,
  User,
  Database,
  MessageSquare,
  Clock,
  FileText,
  Settings,
  FlaskConical,
  Network,
  HelpCircle,
  LogOut,
} from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: Brain },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/memories', label: 'Memory Vault', icon: Database },
  { href: '/relationships', label: 'Relations', icon: Network },
  { href: '/questions', label: 'AI Questions', icon: HelpCircle },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/timeline', label: 'Timeline', icon: Clock },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/lab', label: 'Lab', icon: FlaskConical },
]

export default function Navigation({ email }: { email?: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="brand" aria-label="Continuity Stack dashboard">
        <span className="brand-title">CONTINUITY</span>
        <span className="brand-subtitle">STACK v1.6</span>
      </Link>

      <nav className="nav-list" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
              <Icon size={20} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="mini-panel account-panel">
          <p className="mini-label">SYNCED ACCOUNT</p>
          <p className="mini-text truncate-text">{email || 'Local session'}</p>
          <button type="button" className="ghost-danger" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
        <div className="mini-panel">
          <p className="mini-label">SAFE MODE ACTIVE</p>
          <p className="mini-text">No consciousness transfer. Software memory only.</p>
        </div>
      </div>
    </aside>
  )
}
