'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'

type ChatMessage = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

type ChatLoadResponse = {
  session_id?: string | null
  messages?: ChatMessage[]
  error?: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const chatWindowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPreviousChat()
  }, [])

  useEffect(() => {
    const node = chatWindowRef.current
    if (!node) return

    node.scrollTo({
      top: node.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, loading, initialLoading])

  async function loadPreviousChat() {
    setInitialLoading(true)
    setStatus('')

    try {
      const res = await fetch('/api/chat', { cache: 'no-store' })
      const data: ChatLoadResponse = await res.json()

      if (!res.ok) {
        setStatus(data.error || 'Unable to load previous chat.')
        return
      }

      setSessionId(data.session_id || null)
      setMessages(data.messages || [])
    } catch {
      setStatus('Unable to connect with chat history.')
    } finally {
      setInitialLoading(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setStatus('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      })

      const data = await res.json()
      if (data.session_id) setSessionId(data.session_id)

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response || data.error || 'No response.' },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="chat-shell">
      <div className="chat-panel chat-panel-wide panel">
        <div className="chat-window" ref={chatWindowRef}>
          {initialLoading ? (
            <div className="empty-chat">Loading saved chat history and identity context...</div>
          ) : messages.length === 0 ? (
            <div className="empty-chat">No chat yet. Try: What do you know about me?</div>
          ) : messages.map((msg, index) => (
            <div key={msg.id || `${msg.role}-${index}`} className={`chat-bubble ${msg.role}`}>
              <span className="bubble-role">{msg.role === 'user' ? 'YOU' : 'AI'}</span>
              <p>{msg.content}</p>
            </div>
          ))}

          {loading ? (
            <div className="chat-bubble assistant">
              <span className="bubble-role">AI</span>
              <p>Reading relevant memories, previous chat, facts, relationships, and identity summary...</p>
            </div>
          ) : null}
        </div>

        <form className="chat-input-row" onSubmit={submit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your memory stack..."
            aria-label="Chat message"
          />
          <button className="primary-btn" disabled={loading || initialLoading}>{loading ? 'WAIT' : 'SEND'}</button>
        </form>

        {status ? <p className="chat-status">{status}</p> : null}
      </div>
    </section>
  )
}
