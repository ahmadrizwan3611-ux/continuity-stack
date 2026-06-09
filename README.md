# Continuity Stack

Continuity Stack is a personal AI memory system designed to become a private digital identity layer for each user.

Most AI chat apps forget the person after each session. Continuity Stack is built with a different idea: the AI should understand the user over time through saved profile data, memories, relationships, chat history, personal facts, goals, and timeline events.

The long-term vision is to create a structured digital identity where AI can give more personal, useful, and context-aware guidance instead of generic answers.

## Project Vision

Continuity Stack is not just a chatbot. It is a private AI memory vault and identity intelligence system.

The system is designed to help AI remember:

* User profile and personal details
* Saved memories
* Previous chat history
* Relationships and important people
* Goals and future plans
* Personal facts and preferences
* Timeline events
* Behavior and personality patterns
* Documents and life context

The AI should not randomly guess about the user. It should use saved data, treat uncertain information carefully, and ask useful questions when data is missing.

## Current Features

* Supabase authentication
* Protected user dashboard
* User profile system
* Memory vault
* Relationship tracking
* AI questions module
* Timeline section
* Documents section
* Settings section
* Groq AI powered chat
* Saved chat history
* Personal facts and personality insights
* Confidence-based memory direction
* Futuristic cyber-style user interface

## Smart Memory Direction

Continuity Stack is being developed with a smarter memory system.

The AI should:

* Save raw chat history
* Extract useful facts from conversations
* Separate confirmed facts from assumptions
* Avoid wrong relationship assumptions
* Treat sensitive details carefully
* Use only relevant memories in replies
* Build a user understanding summary over time
* Ask one useful question when important data is missing

## Tech Stack

* Next.js
* React
* TypeScript
* Supabase Auth
* Supabase Database
* Groq AI API
* CSS
* Vercel or Railway for deployment

## Main Modules

* Dashboard
* Profile
* Memory Vault
* Relationships
* AI Questions
* Chat
* Timeline
* Documents
* Settings
* Lab

## Environment Variables

Create a `.env.local` file in the project root.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

Do not upload `.env.local` to GitHub.

## Local Setup

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the app:

```text
http://localhost:3000
```

## Supabase Setup

Run the SQL schema from:

```text
supabase/schema.sql
```

This creates the required tables and policies for user profiles, memories, relationships, chat history, personality insights, and identity summaries.

## Future Improvements

* Visual identity graph
* Voice memories
* Document-based memory extraction
* Smarter long-term memory retrieval
* Advanced personality insights
* Life timeline intelligence
* Better AI question generation
* Memory confidence dashboard
* Exportable personal identity profile
* Safer user-controlled memory editing

## Goal

The goal of Continuity Stack is to build a private AI system that feels continuous.

The user should not feel like they are starting a new chat every time.

The AI should remember through saved user data, understand context over time, and support the user based on their real history, goals, relationships, and personal journey.

## Author

Muhammad Ahmad
Junior Full Stack Developer
React | Next.js | Python | Django | Flask | Supabase | AI Tools
