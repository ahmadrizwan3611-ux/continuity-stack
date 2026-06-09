import Groq from 'groq-sdk'

export const AI_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

export function getGroqClient() {
  if (!process.env.GROQ_API_KEY) return null
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}
