'use client'

import { FormEvent, useEffect, useState } from 'react'

type Question = { key: string; category: string; question: string }

export default function QuestionsPanel() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch('/api/questions')
    const data = await res.json()
    setQuestions(data.questions || [])
  }

  async function submit(e: FormEvent, item: Question) {
    e.preventDefault()
    const answer = answers[item.key]
    if (!answer?.trim()) return
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, answer }),
    })
    setMessage(res.ok ? 'Answer saved as personal knowledge.' : 'Unable to save answer.')
    setAnswers((prev) => ({ ...prev, [item.key]: '' }))
    load()
  }

  return (
    <section className="panel">
      <h2 className="panel-title">HUMAN-LIKE QUESTIONS</h2>
      <p className="muted wide-text">The AI asks small questions over time so it can understand your preferences, behaviour, relationships, and goals without guessing.</p>
      {message ? <p className="form-message">{message}</p> : null}
      {questions.length === 0 ? <p className="muted">No new questions right now. Add more profile details or memories.</p> : (
        <div className="question-list">
          {questions.map((item) => (
            <form key={item.key} className="question-card" onSubmit={(e) => submit(e, item)}>
              <span className="chip">{item.category}</span>
              <h3>{item.question}</h3>
              <div className="inline-field">
                <input value={answers[item.key] || ''} onChange={(e) => setAnswers({ ...answers, [item.key]: e.target.value })} placeholder="Type your answer..." />
                <button className="secondary-btn small">Save</button>
              </div>
            </form>
          ))}
        </div>
      )}
    </section>
  )
}
