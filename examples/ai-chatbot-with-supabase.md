# AI Chatbot with Supabase

Build a full-stack AI chatbot with authentication, real-time chat, and message history.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **AI**: OpenAI API or Groq API
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key or Groq API key

## 🚀 Quick Start

### 1. Create Next.js App

```bash
npx create-next-app@latest ai-chatbot --typescript --tailwind --app
cd ai-chatbot
```

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install openai
```

### 3. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key
3. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 4. Database Schema

Run this SQL in your Supabase SQL editor:

```sql
-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 5. Supabase Client Setup

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### 6. AI Service

Create `lib/ai.ts`:

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateResponse(messages: Array<{role: string, content: string}>) {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages as any,
    max_tokens: 500,
  })

  return completion.choices[0].message.content
}
```

### 7. Chat Component

Create `app/chat/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { generateResponse } from '@/lib/ai'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (data) setMessages(data)
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = {
      content: input,
      role: 'user' as const
    }

    setLoading(true)
    setInput('')

    // Save user message
    const { data: userMsg } = await supabase
      .from('messages')
      .insert([userMessage])
      .select()
      .single()

    if (userMsg) {
      setMessages(prev => [...prev, userMessage])

      // Generate AI response
      const conversationHistory = [...messages, userMessage]
      const aiResponse = await generateResponse(conversationHistory)

      // Save AI message
      const { data: aiMsg } = await supabase
        .from('messages')
        .insert([{
          content: aiResponse,
          role: 'assistant'
        }])
        .select()
        .single()

      if (aiMsg) {
        setMessages(prev => [...prev, { content: aiResponse, role: 'assistant', id: aiMsg.id, created_at: aiMsg.created_at }])
      }
    }

    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Chatbot</h1>
      
      <div className="border rounded-lg p-4 h-96 overflow-y-auto mb-4">
        {messages.map((message) => (
          <div key={message.id} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded ${
              message.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-black'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-500">AI is typing...</div>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
```

### 8. Authentication

Add to `app/layout.tsx`:

```typescript
import { AuthProvider } from './auth-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

Create `app/auth-provider.tsx`:

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

const AuthContext = createContext<{
  user: User | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}>({
  user: null,
  signIn: async () => {},
  signOut: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
  }, [])

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google'
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

## 🚀 Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 🎯 Features Added

- ✅ User authentication with Google OAuth
- ✅ Real-time chat interface
- ✅ Message history persistence
- ✅ AI response generation
- ✅ Responsive design
- ✅ Loading states

## 🔧 Customization

- **Different AI models**: Switch to Groq, Anthropic, or local models
- **Streaming responses**: Use OpenAI's streaming API
- **File uploads**: Add image/document support
- **Voice chat**: Integrate speech-to-text
- **Custom prompts**: Add system messages for different personalities

## 📚 Next Steps

- Add message search
- Implement conversation threads
- Add typing indicators
- Create chat rooms
- Add file sharing capabilities