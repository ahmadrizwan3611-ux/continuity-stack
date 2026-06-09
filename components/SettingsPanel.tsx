'use client'

import { useState } from 'react'

export default function SettingsPanel() {
  const [message, setMessage] = useState('')

  async function exportData() {
    const res = await fetch('/api/export')
    const data = await res.json()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `continuity-stack-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Export downloaded.')
  }

  async function deleteData() {
    if (!confirm('This deletes your profile, memories, relationships, facts, and chat history. Continue?')) return
    const res = await fetch('/api/delete-account', { method: 'POST' })
    setMessage(res.ok ? 'Your local Supabase data was deleted. Please login again.' : 'Unable to delete data.')
    if (res.ok) window.location.href = '/login'
  }

  return (
    <div className="settings-grid">
      <section className="panel">
        <h2 className="panel-title">PRIVACY CONTROLS</h2>
        <p className="wide-text">You own the archive. Export all saved profile data, memories, relationships, personal facts, personality insights, AI questions, and chat history, or delete everything from your Supabase tables.</p>
        <div className="button-row">
          <button className="secondary-btn" onClick={exportData}>Export All Data</button>
          <button className="danger-btn" onClick={deleteData}>Delete All Data</button>
        </div>
        {message ? <p className="form-message">{message}</p> : null}
      </section>

      <section className="panel safety-list">
        <h2 className="panel-title pink">SAFETY DECLARATION</h2>
        <p>✓ Software-only digital memory archive.</p>
        <p>✓ No consciousness transfer or mind uploading.</p>
        <p>✓ No implants, medical devices, or body control.</p>
        <p>✓ AI answers from saved data only.</p>
        <p>✓ Missing memories are reported, not invented.</p>
      </section>

      <section className="panel full-width">
        <h2 className="panel-title orange">GROQ + SUPABASE SETUP CHECK</h2>
        <p className="wide-text">Save your keys in <code>.env.local</code>: <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and <code>GROQ_API_KEY</code>. Supabase stores the memory stack, chat history, and identity graph. Groq powers the personalized AI guide and automatic knowledge extraction.</p>
      </section>
    </div>
  )
}
