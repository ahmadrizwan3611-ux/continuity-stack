import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/Navigation'
import SafetyBanner from '@/components/SafetyBanner'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="app-shell">
      <Navigation email={user.email} />
      <main className="main-panel">
        <SafetyBanner />
        <div className="page-container">{children}</div>
      </main>
    </div>
  )
}
