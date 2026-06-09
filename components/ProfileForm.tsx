'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'

const initialProfile: Record<string, any> = {
  full_name: '',
  birth_year: '',
  age: '',
  address: '',
  city: '',
  country: '',
  current_position: '',
  profession: '',
  phone_model: '',
  phone_health_status: '',
  phone_battery_percent: '',
  food_taste: '',
  social_status: '',
  financial_status: '',
  behavior_notes: '',
  language_preference: 'English',
  communication_style: '',
  life_summary: '',
  personality_notes: '',
  tone_preference: 'direct',
}

export default function ProfileForm() {
  const [profile, setProfile] = useState(initialProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    const res = await fetch('/api/profile')
    const data = await res.json()
    if (data.profile) {
      setProfile({ ...initialProfile, ...Object.fromEntries(Object.entries(data.profile).map(([k, v]) => [k, v ?? ''])) })
    }
    setLoading(false)
  }

  function update(key: string, value: any) {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  async function detectBattery() {
    const nav = navigator as any
    if (!nav.getBattery) {
      setMessage('Battery API is not supported by this browser. You can enter it manually.')
      return
    }
    const battery = await nav.getBattery()
    update('phone_battery_percent', Math.round(battery.level * 100))
    setMessage('Battery level detected. Save profile to store it.')
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const payload = { ...profile }
    ;['birth_year', 'age', 'phone_battery_percent'].forEach((field) => {
      payload[field] = payload[field] === '' ? null : Number(payload[field])
    })

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setSaving(false)
    setMessage(res.ok ? 'Profile saved and synced to Supabase.' : data.error || 'Unable to save profile.')
  }

  const completion = useMemo(() => {
    const keys = ['full_name', 'age', 'country', 'current_position', 'food_taste', 'life_summary', 'behavior_notes', 'language_preference']
    return keys.filter((key) => String(profile[key] || '').trim()).length
  }, [profile])

  if (loading) return <div className="panel spacious">Loading profile...</div>

  return (
    <form onSubmit={save} className="stack-form profile-form">
      <div className="completion-pill">PROFILE COMPLETION: {completion}/8</div>

      <div className="form-grid two">
        <label className="field-label">Full name<input value={profile.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="Example: Ahmad Safdar" /></label>
        <label className="field-label">Age<input type="number" value={profile.age} onChange={(e) => update('age', e.target.value)} placeholder="Example: 25" /></label>
        <label className="field-label">Birth year<input type="number" value={profile.birth_year} onChange={(e) => update('birth_year', e.target.value)} placeholder="Example: 2001" /></label>
        <label className="field-label">Country<input value={profile.country} onChange={(e) => update('country', e.target.value)} placeholder="Example: Pakistan" /></label>
        <label className="field-label">City<input value={profile.city} onChange={(e) => update('city', e.target.value)} placeholder="Example: Gujranwala" /></label>
        <label className="field-label">Current working position<input value={profile.current_position} onChange={(e) => update('current_position', e.target.value)} placeholder="Example: Software Developer / IT Assistant" /></label>
      </div>

      <label className="field-label">Address<textarea value={profile.address} onChange={(e) => update('address', e.target.value)} placeholder="Save only what you are comfortable storing." /></label>

      <div className="form-grid two">
        <label className="field-label">Phone model<input value={profile.phone_model} onChange={(e) => update('phone_model', e.target.value)} placeholder="Example: Samsung S23 Ultra" /></label>
        <label className="field-label">Phone battery %<div className="inline-field"><input type="number" min="0" max="100" value={profile.phone_battery_percent} onChange={(e) => update('phone_battery_percent', e.target.value)} placeholder="Example: 82" /><button type="button" className="secondary-btn small" onClick={detectBattery}>Detect</button></div></label>
        <label className="field-label">Phone condition<input value={profile.phone_health_status} onChange={(e) => update('phone_health_status', e.target.value)} placeholder="Example: Working good" /></label>
        <label className="field-label">Food taste<input value={profile.food_taste} onChange={(e) => update('food_taste', e.target.value)} placeholder="Example: spicy food, rice, tea" /></label>
        <label className="field-label">Social status<input value={profile.social_status} onChange={(e) => update('social_status', e.target.value)} placeholder="Example: private, social, family focused" /></label>
        <label className="field-label">Financial status<input value={profile.financial_status} onChange={(e) => update('financial_status', e.target.value)} placeholder="Example: student, working, building income" /></label>
        <label className="field-label">Preferred language<input value={profile.language_preference} onChange={(e) => update('language_preference', e.target.value)} placeholder="Example: English / Urdu" /></label>
        <label className="field-label">Tone preference<select value={profile.tone_preference} onChange={(e) => update('tone_preference', e.target.value)}><option value="direct">Direct</option><option value="soft">Soft</option><option value="detailed">Detailed</option><option value="motivational">Motivational</option></select></label>
      </div>

      <label className="field-label">Life summary<textarea className="large" value={profile.life_summary} onChange={(e) => update('life_summary', e.target.value)} placeholder="Short story of the person, goals, background, and current life." /></label>
      <label className="field-label">Behaviour and mind notes<textarea className="large" value={profile.behavior_notes} onChange={(e) => update('behavior_notes', e.target.value)} placeholder="How this person behaves, thinks, reacts, learns, gets motivated, or gets distracted." /></label>
      <label className="field-label">Personality notes<textarea className="large" value={profile.personality_notes} onChange={(e) => update('personality_notes', e.target.value)} placeholder="Curious, practical, sensitive, ambitious, step-by-step thinker, etc." /></label>

      <div className="form-footer">
        <button className="primary-btn" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
        {message ? <span className="form-message inline">{message}</span> : null}
      </div>
    </form>
  )
}
