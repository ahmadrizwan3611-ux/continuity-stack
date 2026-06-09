'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrainCircuit } from 'lucide-react'

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error

        if (data.user) {
          await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: fullName, language_preference: 'English' }),
          })
        }

        setMessage('Account created. If email confirmation is enabled, confirm your email, then login.')
        if (data.session) {
          router.push('/dashboard')
          router.refresh()
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      setMessage(error?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-orb" aria-hidden="true"><BrainCircuit size={54} /></div>
      <section className="auth-card">
        <p className="section-eyebrow">SECURE MEMORY ACCESS</p>
        <h1 className="auth-title">{mode === 'login' ? 'LOGIN / SYNC' : 'CREATE ID'}</h1>
        <p className="auth-desc">
          {mode === 'login'
            ? 'Login to access your private Continuity Stack profile, memories, relations, and AI guide.'
            : 'Create your private account. Each memory will be stored under your own Supabase user ID.'}
        </p>

        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' ? (
            <label className="field-label">
              Full name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Example: Ahmad Safdar" />
            </label>
          ) : null}

          <label className="field-label">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </label>

          <label className="field-label">
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Minimum 6 characters" />
          </label>

          <button className="primary-btn" disabled={loading} type="submit">
            {loading ? 'Processing...' : mode === 'login' ? 'Login to Stack' : 'Create Stack ID'}
          </button>
        </form>

        {message ? <p className="form-message">{message}</p> : null}

        <p className="auth-switch">
          {mode === 'login' ? 'No account yet?' : 'Already have an account?'}{' '}
          <Link href={mode === 'login' ? '/signup' : '/login'}>
            {mode === 'login' ? 'Create account' : 'Login'}
          </Link>
        </p>

        <p className="safe-note">Software-only memory archive. No mind transfer, no body control, no medical claims.</p>
      </section>
    </main>
  )
}
