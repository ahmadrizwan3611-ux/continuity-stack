'use client'

import { FormEvent, useEffect, useState } from 'react'
import type { Relationship } from '@/lib/types'

const empty = { name: '', relation_type: 'friend', phone: '', notes: '', closeness: 3 }

export default function RelationshipsManager() {
  const [items, setItems] = useState<Relationship[]>([])
  const [form, setForm] = useState(empty)
  const [message, setMessage] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch('/api/relationships')
    const data = await res.json()
    setItems(data.relationships || [])
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    const res = await fetch('/api/relationships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(data.error || 'Unable to save relationship.')
      return
    }
    setForm(empty)
    setMessage('Relationship saved. AI can now understand this person in your life.')
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this relationship?')) return
    await fetch(`/api/relationships?id=${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="memory-layout">
      <form onSubmit={submit} className="panel stack-form">
        <h2 className="panel-title">ADD PERSON</h2>
        <div className="form-grid two">
          <label className="field-label">Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Example: Ali" required /></label>
          <label className="field-label">Relation<select value={form.relation_type} onChange={(e) => setForm({ ...form, relation_type: e.target.value })}><option value="father">Father</option><option value="mother">Mother</option><option value="sibling">Sibling</option><option value="friend">Friend</option><option value="colleague">Colleague</option><option value="mentor">Mentor</option><option value="other">Other</option></select></label>
          <label className="field-label">Phone or contact<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Optional" /></label>
          <label className="field-label">Closeness<select value={form.closeness} onChange={(e) => setForm({ ...form, closeness: Number(e.target.value) })}><option value={1}>1 Low</option><option value={2}>2</option><option value={3}>3 Medium</option><option value={4}>4</option><option value={5}>5 Very Close</option></select></label>
        </div>
        <label className="field-label">Notes<textarea className="large" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="How this person is connected to the user, trust level, history, etc." /></label>
        <button className="primary-btn">Save Relation</button>
        {message ? <p className="form-message">{message}</p> : null}
      </form>

      <section className="panel">
        <h2 className="panel-title">RELATIONSHIP MAP</h2>
        {items.length === 0 ? <p className="muted">No people saved yet.</p> : (
          <div className="memory-grid">
            {items.map((item) => (
              <article key={item.id} className="memory-card">
                <div className="card-meta"><span>{item.relation_type}</span><span>closeness {item.closeness}/5</span></div>
                <h3>{item.name}</h3>
                <p>{item.notes || 'No notes saved yet.'}</p>
                {item.phone ? <p className="muted">Contact: {item.phone}</p> : null}
                <button className="text-danger" onClick={() => remove(item.id)}>Delete</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
