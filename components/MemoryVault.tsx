'use client'

import { FormEvent, useEffect, useState } from 'react'
import type { Memory } from '@/lib/types'

const empty = {
  title: '',
  content: '',
  memory_type: 'life',
  memory_format: 'written',
  mood: 'neutral',
  event_date: '',
  tags: '',
  importance: 3,
  hidden_from_ai: false,
}

export default function MemoryVault() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [listening, setListening] = useState(false)

  useEffect(() => { load() }, [])

  async function load(query = '') {
    setLoading(true)
    const res = await fetch(`/api/memories${query ? `?search=${encodeURIComponent(query)}` : ''}`)
    const data = await res.json()
    setMemories(data.memories || [])
    setLoading(false)
  }

  function update(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setMessage(data.error || 'Unable to save memory.')
      return
    }
    setForm(empty)
    setMessage('Memory saved to Supabase and available to AI.')
    load(search)
  }

  async function remove(id: string) {
    if (!confirm('Delete this memory?')) return
    await fetch(`/api/memories?id=${id}`, { method: 'DELETE' })
    load(search)
  }

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMessage('Voice input is not supported in this browser. Use Chrome if available.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      update('content', `${form.content ? form.content + '\n' : ''}${transcript}`)
      update('memory_format', 'voice')
    }
    recognition.start()
  }

  return (
    <div className="memory-layout">
      <form onSubmit={submit} className="panel stack-form">
        <h2 className="panel-title">ADD MEMORY</h2>
        <div className="form-grid two">
          <label className="field-label">Title<input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Example: First job interview" required /></label>
          <label className="field-label">Date<input type="date" value={form.event_date} onChange={(e) => update('event_date', e.target.value)} /></label>
          <label className="field-label">Type<select value={form.memory_type} onChange={(e) => update('memory_type', e.target.value)}><option value="life">Life</option><option value="work">Work</option><option value="learning">Learning</option><option value="relationship">Relationship</option><option value="goal">Goal</option><option value="health">Health</option><option value="personal">Personal</option></select></label>
          <label className="field-label">Mood<select value={form.mood} onChange={(e) => update('mood', e.target.value)}><option value="neutral">Neutral</option><option value="happy">Happy</option><option value="sad">Sad</option><option value="anxious">Anxious</option><option value="excited">Excited</option><option value="angry">Angry</option></select></label>
        </div>
        <label className="field-label">Memory content<textarea className="large" value={form.content} onChange={(e) => update('content', e.target.value)} placeholder="Write what happened, how you felt, who was involved, and what the AI should remember." required /></label>
        <div className="form-grid two">
          <label className="field-label">Tags<input value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="family, work, lesson" /></label>
          <label className="field-label">Importance<select value={form.importance} onChange={(e) => update('importance', Number(e.target.value))}><option value={1}>1 Low</option><option value={2}>2</option><option value={3}>3 Medium</option><option value={4}>4</option><option value={5}>5 High</option></select></label>
        </div>
        <label className="check-row"><input type="checkbox" checked={form.hidden_from_ai} onChange={(e) => update('hidden_from_ai', e.target.checked)} /> Hide this memory from AI answers</label>
        <div className="form-footer">
          <button className="primary-btn" disabled={saving}>{saving ? 'Saving...' : 'Save Memory'}</button>
          <button type="button" className="secondary-btn" onClick={startVoice}>{listening ? 'Listening...' : 'Voice Memory'}</button>
        </div>
        {message ? <p className="form-message">{message}</p> : null}
      </form>

      <section className="panel memory-list-panel">
        <div className="list-header">
          <h2 className="panel-title">STORED MEMORIES</h2>
          <span className="count-pill">{memories.length}</span>
        </div>
        <div className="search-row">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search memories, tags, type..." />
          <button className="secondary-btn small" onClick={() => load(search)}>Search</button>
        </div>
        {loading ? <p className="muted">Loading...</p> : memories.length === 0 ? <p className="muted">No memories found. Add your first memory to activate the stack.</p> : (
          <div className="memory-grid">
            {memories.map((memory) => (
              <article key={memory.id} className="memory-card">
                <div className="card-meta"><span>{memory.memory_type}</span><span>{memory.event_date || 'undated'}</span></div>
                <h3>{memory.title}</h3>
                <p>{memory.content}</p>
                <div className="tag-row">{(memory.tags || []).map((tag) => <span key={tag}>#{tag}</span>)}</div>
                <button className="text-danger" onClick={() => remove(memory.id)}>Delete</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
