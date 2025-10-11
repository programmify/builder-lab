# Connect Supabase and Vercel: Complete Guide

Build full-stack applications with Supabase (backend) and Vercel (frontend) in minutes. This guide covers everything from setup to production deployment with real examples.

## Why Supabase + Vercel?

- **Supabase:** Open-source Firebase alternative (PostgreSQL, Auth, Storage, Realtime)
- **Vercel:** Zero-config deployments with edge functions
- **Perfect combo:** Free tiers, automatic HTTPS, global CDN, seamless integration
- **DX:** Deploy in seconds, scale automatically

---

## Prerequisites

- Node.js 18+ installed
- GitHub account (for Vercel)
- Email for Supabase signup

---

## Part 1: Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in details:
   - **Name:** `my-app`
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to your users
   - **Plan:** Free tier (500MB database, 2GB bandwidth)
6. Click "Create new project"
7. Wait 2-3 minutes for provisioning

### Step 2: Get API Keys

1. Go to Project Settings (⚙️ icon)
2. Click "API" in sidebar
3. Copy these values:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGc...` (safe for client-side)
   - **service_role key:** `eyJhbGc...` (SECRET - server-side only!)

**Save these keys securely!**

### Step 3: Create Database Tables

**Option A: SQL Editor (Recommended)**

1. Go to SQL Editor in dashboard
2. Create a sample todos table:

```sql
-- Create todos table
create table todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  task text not null,
  is_complete boolean default false,
  inserted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table todos enable row level security;

-- Create policy: Users can only see their own todos
create policy "Users can view their own todos"
  on todos for select
  using (auth.uid() = user_id);

-- Create policy: Users can insert their own todos
create policy "Users can insert their own todos"
  on todos for insert
  with check (auth.uid() = user_id);

-- Create policy: Users can update their own todos
create policy "Users can update their own todos"
  on todos for update
  using (auth.uid() = user_id);

-- Create policy: Users can delete their own todos
create policy "Users can delete their own todos"
  on todos for delete
  using (auth.uid() = user_id);
```

3. Click "Run" or press `Ctrl/Cmd + Enter`

**Option B: Table Editor (Visual)**

1. Go to Table Editor
2. Click "Create a new table"
3. Configure:
   - **Name:** `todos`
   - **Enable RLS:** ✅
   - **Add columns:**
     - `id` (uuid, primary key, default: `gen_random_uuid()`)
     - `user_id` (uuid, foreign key to auth.users)
     - `task` (text, required)
     - `is_complete` (boolean, default: false)
     - `inserted_at` (timestamptz, default: `now()`)
4. Save table
5. Add RLS policies manually (Settings → Policies)

### Step 4: Configure Authentication

**Enable email auth (enabled by default):**
1. Go to Authentication → Providers
2. Email provider should be enabled
3. Configure settings:
   - ✅ Enable email confirmations (for production)
   - ✅ Secure email change
   - ❌ Disable double opt-in (for development)

**Enable OAuth providers (optional):**

**GitHub:**
```sql
-- No SQL needed, configure in dashboard:
-- 1. Go to Authentication → Providers → GitHub
-- 2. Enable GitHub provider
-- 3. Add GitHub OAuth App credentials:
--    - Create OAuth app at github.com/settings/developers
--    - Callback URL: https://xxxxx.supabase.co/auth/v1/callback
```

**Google:**
```sql
-- 1. Go to Authentication → Providers → Google
-- 2. Enable Google provider
-- 3. Add Google OAuth credentials:
--    - Create app at console.cloud.google.com
--    - Authorized redirect URIs: https://xxxxx.supabase.co/auth/v1/callback
```

---

## Part 2: Vercel Setup

### Step 1: Create Next.js App

```bash
# Create Next.js app with TypeScript
npx create-next-app@latest my-supabase-app

# Options:
# ✅ TypeScript
# ✅ ESLint
# ✅ Tailwind CSS
# ✅ src/ directory
# ✅ App Router
# ❌ Turbopack

cd my-supabase-app
```

### Step 2: Install Supabase Client

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Step 3: Add Environment Variables

Create `.env.local`:
```bash
# Public (safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Secret (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Never commit secrets to git!**

Add to `.gitignore`:
```bash
# Already included by default
.env*.local
```

### Step 4: Create Supabase Client Utils

**For App Router (Recommended):**

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

Create `src/lib/supabase/middleware.ts`:
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}
```

Create `src/middleware.ts`:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Step 5: Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# Set up and deploy? Yes
# Which scope? Your account
# Link to existing project? No
# Project name? my-supabase-app
# Directory? ./
# Override settings? No
```

**Option B: Using GitHub (Recommended)**

1. Create GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/my-supabase-app.git
git push -u origin main
```

2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

5. Add Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

6. Click "Deploy"
7. Wait 1-2 minutes
8. Your app is live! 🎉

### Step 6: Add Vercel URL to Supabase

1. Go to Supabase Dashboard
2. Authentication → URL Configuration
3. Add your Vercel URL:
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:** `https://your-app.vercel.app/**`
4. Save

---

## Part 3: Building Features

### Authentication

**Sign Up Component:**

Create `src/app/auth/signup/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for confirmation link!')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <h2 className="text-3xl font-bold">Sign Up</h2>
        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full rounded border p-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Sign Up'}
          </button>
        </form>
        {message && (
          <p className="text-center text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  )
}
```

**Sign In Component:**

Create `src/app/auth/signin/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleGitHubSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <h2 className="text-3xl font-bold">Sign In</h2>
        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded border p-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGitHubSignIn}
          className="w-full rounded border px-4 py-2 hover:bg-gray-50"
        >
          Sign in with GitHub
        </button>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
```

**Auth Callback Handler:**

Create `src/app/auth/callback/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

**Sign Out:**

Create `src/components/SignOutButton.tsx`:
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      Sign Out
    </button>
  )
}
```

### Database Operations (CRUD)

**Dashboard with Todos:**

Create `src/app/dashboard/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TodoList from '@/components/TodoList'
import SignOutButton from '@/components/SignOutButton'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: todos } = await supabase
    .from('todos')
    .select('*')
    .order('inserted_at', { ascending: false })

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome, {user.email}</p>
        </div>
        <SignOutButton />
      </div>
      <TodoList initialTodos={todos || []} />
    </div>
  )
}
```

**Todo List Component:**

Create `src/components/TodoList.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Todo = {
  id: string
  task: string
  is_complete: boolean
}

export default function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState(initialTodos)
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('todos')
      .insert([{ task: newTask, user_id: user?.id }])
      .select()
      .single()

    if (!error && data) {
      setTodos([data, ...todos])
      setNewTask('')
    }

    setLoading(false)
  }

  const toggleTodo = async (id: string, is_complete: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_complete: !is_complete })
      .eq('id', id)

    if (!error) {
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, is_complete: !is_complete } : todo
      ))
    }
  }

  const deleteTodo = async (id: string) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)

    if (!error) {
      setTodos(todos.filter(todo => todo.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addTodo} className="flex gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 rounded border p-3"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-3 rounded border p-4"
          >
            <input
              type="checkbox"
              checked={todo.is_complete}
              onChange={() => toggleTodo(todo.id, todo.is_complete)}
              className="h-5 w-5"
            />
            <span
              className={`flex-1 ${
                todo.is_complete ? 'text-gray-400 line-through' : ''
              }`}
            >
              {todo.task}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        ))}

        {todos.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No todos yet. Add one above!
          </p>
        )}
      </div>
    </div>
  )
}
```

### Realtime Subscriptions

Create `src/components/RealtimeTodos.tsx`:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Todo = {
  id: string
  task: string
  is_complete: boolean
}

export default function RealtimeTodos({ userId }: { userId: string }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial todos
    const fetchTodos = async () => {
      const { data } = await supabase
        .from('todos')
        .select('*')
        .order('inserted_at', { ascending: false })
      
      if (data) setTodos(data)
    }

    fetchTodos()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('todos-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTodos((current) => [payload.new as Todo, ...current])
          } else if (payload.eventType === 'UPDATE') {
            setTodos((current) =>
              current.map((todo) =>
                todo.id === payload.new.id ? (payload.new as Todo) : todo
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setTodos((current) =>
              current.filter((todo) => todo.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <div key={todo.id} className="p-4 border rounded">
          {todo.task}
        </div>
      ))}
    </div>
  )
}
```

### File Storage

**Upload Component:**

Create `src/components/FileUpload.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FileUpload() {
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const supabase = createClient()

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select a file to upload.')
      }

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath)

      setUrl(data.publicUrl)
    } catch (error) {
      alert('Error uploading file!')
      console.log(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        onChange={uploadFile}
        disabled={uploading}
        className="block w-full text-sm"
      />
      {uploading && <p>Uploading...</p>}
      {url && (
        <div>
          <p className="text-sm text-gray-600">File uploaded!</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View file
          </a>
        </div>
      )}
    </div>
  )
}
```

**Create storage bucket:**
```sql
-- In Supabase SQL Editor
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true);

-- Create policy for uploads
create policy "Anyone can upload files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'uploads');

-- Create policy for viewing files
create policy "Anyone can view files"
on storage.objects for select
to public
using (bucket_id = 'uploads');
```

---

## Part 4: Advanced Features

### Server Actions (Next.js 14+)

Create `src/app/actions.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTodo(formData: FormData) {
  const supabase = await createClient()
  const task = formData.get('task') as string

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('todos')
    .insert([{ task, user_id: user.id }])

  if (error) {
    throw error
  }

  revalidatePath('/dashboard')
}

export async function deleteTodo(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }

  revalidatePath('/dashboard')
}
```

Use in component:
```typescript
import { createTodo } from '@/app/actions'

export default function TodoForm() {
  return (
    <form action={createTodo}>
      <input name="task" type="text" required />
      <button type="submit">Add Todo</button>
    </form>
  )
}
```

### Edge Functions (Vercel)

Create `src/app/api/hello/route.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('todos')
    .select('count')

  return NextResponse.json({ count: data, error })
}
```

### Database Functions

Create in Supabase SQL Editor:
```sql
-- Create a function to get user stats
create or replace function get_user_stats(user_uuid uuid)
returns json
language plpgsql
as $
declare
  result json;
begin
  select json_build_object(
    'total_todos', count(*),
    'completed_todos', count(*) filter (where is_complete = true),
    'pending_todos', count(*) filter (where is_complete = false)
  ) into result
  from todos
  where user_id = user_uuid;
  
  return result;
end;
$;

-- Grant execute permission
grant execute on function get_user_stats to authenticated;
```

Call from your app:
```typescript
const { data, error } = await supabase.rpc('get_user_stats', {
  user_uuid: user.id
})

console.log(data) // { total_todos: 10, completed_todos: 5, pending_todos: 5 }
```

### Middleware Protection

Create `src/middleware.ts`:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  // Update session
  const response = await updateSession(request)
  
  // Protect routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return Response.redirect(new URL('/auth/signin', request.url))
    }
  }
  
  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### TypeScript Types from Database

Generate types automatically:

```bash
# Install Supabase CLI
npm install supabase --save-dev

# Login
npx supabase login

# Link project
npx supabase link --project-ref your-project-ref

# Generate types
npx supabase gen types typescript --linked > src/types/database.types.ts
```

Use types in your app:
```typescript
import { Database } from '@/types/database.types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Now you have full type safety!
const { data, error } = await supabase
  .from('todos')
  .select('*')
  // TypeScript knows all available columns and their types
```

---

## Part 5: Production Optimizations

### Environment Variables per Environment

**Vercel Dashboard:**
1. Go to Project Settings
2. Environment Variables
3. Add separate values for:
   - **Production:** Used for `vercel.app` domain
   - **Preview:** Used for PR deployments
   - **Development:** Used locally with `vercel dev`

**Example:**
```bash
# Production
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key

# Preview
NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-key

# Development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-key
```

### Database Indexing

Add indexes for better performance:
```sql
-- Index for user queries
create index idx_todos_user_id on todos(user_id);

-- Index for filtering completed todos
create index idx_todos_is_complete on todos(is_complete);

-- Composite index for common queries
create index idx_todos_user_complete on todos(user_id, is_complete);

-- Index for date sorting
create index idx_todos_inserted_at on todos(inserted_at desc);
```

### Connection Pooling

Supabase uses PgBouncer automatically. For direct connections:

```typescript
// Use connection pooler for serverless
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false, // For server-side
    },
  }
)
```

### Caching Strategies

**Static Data:**
```typescript
// app/posts/[id]/page.tsx
export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: posts } = await supabase
    .from('posts')
    .select('id')
  
  return posts?.map((post) => ({
    id: post.id,
  })) || []
}

export default async function Post({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', params.id)
    .single()
  
  return <div>{post?.title}</div>
}
```

**ISR (Incremental Static Regeneration):**
```typescript
export const revalidate = 60 // Revalidate every 60 seconds

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('posts').select('*')
  
  return <div>{/* render data */}</div>
}
```

### Error Handling

Create error boundary:
```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-gray-600">{error.message}</p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  )
}
```

### Monitoring & Analytics

**Vercel Analytics:**
```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Supabase Logs:**
1. Go to Supabase Dashboard
2. Logs → Database
3. View slow queries, errors, and usage

---

## Part 6: Security Best Practices

### Row Level Security (RLS)

Always enable RLS on tables with sensitive data:

```sql
-- Enable RLS
alter table todos enable row level security;

-- Policy: Users can only access their own data
create policy "Users can access own todos"
  on todos
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy for public data
create policy "Public posts are viewable by everyone"
  on posts
  for select
  using (is_public = true);

-- Policy with role checking
create policy "Admins can do anything"
  on todos
  for all
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );
```

### Service Role Key Protection

**NEVER expose service role key to client:**
```typescript
// ❌ WRONG - Never do this
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // BAD!
)

// ✅ CORRECT - Only use in server components/API routes
// src/app/api/admin/route.ts
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // OK in API route
  )
  
  // Admin operations
  const { data } = await supabase
    .from('users')
    .select('*')
  
  return Response.json(data)
}
```

### Rate Limiting

Use Vercel's edge middleware:
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response('Too many requests', { status: 429 })
  }
  
  return updateSession(request)
}
```

### Input Validation

Always validate user input:
```typescript
import { z } from 'zod'

const todoSchema = z.object({
  task: z.string().min(1).max(500),
  is_complete: z.boolean().optional(),
})

export async function createTodo(formData: FormData) {
  const parsed = todoSchema.parse({
    task: formData.get('task'),
    is_complete: formData.get('is_complete') === 'true',
  })
  
  // Now safely use parsed.task
}
```

### HTTPS Only Cookies

Already handled by Supabase SSR package, but verify:
```typescript
// Cookies are automatically set with:
// - httpOnly: true
// - secure: true (in production)
// - sameSite: 'lax'
```

---

## Part 7: Testing

### Unit Tests

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Create `src/__tests__/TodoList.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import TodoList from '@/components/TodoList'

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      }),
    },
  }),
}))

describe('TodoList', () => {
  it('renders todos', () => {
    const todos = [
      { id: '1', task: 'Test todo', is_complete: false }
    ]
    
    render(<TodoList initialTodos={todos} />)
    expect(screen.getByText('Test todo')).toBeInTheDocument()
  })
  
  it('adds new todo', async () => {
    render(<TodoList initialTodos={[]} />)
    
    const input = screen.getByPlaceholderText('Add a new task...')
    const button = screen.getByText('Add')
    
    fireEvent.change(input, { target: { value: 'New task' } })
    fireEvent.click(button)
    
    // Add assertions based on your implementation
  })
})
```

### Integration Tests with Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

Create `tests/auth.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

test('user can sign up and sign in', async ({ page }) => {
  await page.goto('http://localhost:3000/auth/signup')
  
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL(/.*dashboard/)
})
```

---

## Part 8: Troubleshooting

### Common Issues

**1. "Invalid API key" error**
```bash
# Check environment variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Restart dev server after adding env vars
npm run dev
```

**2. "User not authenticated" on protected routes**
```typescript
// Make sure middleware is set up correctly
// Check middleware.ts exists and matcher is correct

// Debug in component:
const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()
console.log('User:', user, 'Error:', error)
```

**3. RLS policies blocking queries**
```sql
-- Check if RLS is enabled
select tablename, rowsecurity 
from pg_tables 
where schemaname = 'public';

-- View policies
select * from pg_policies where tablename = 'todos';

-- Temporarily disable for testing (DON'T DO IN PRODUCTION)
alter table todos disable row level security;
```

**4. CORS errors**
```typescript
// Add your Vercel URL to Supabase
// Dashboard → Authentication → URL Configuration
// Add: https://your-app.vercel.app
```

**5. "Failed to fetch" in production**
```bash
# Check environment variables in Vercel
vercel env ls

# Pull env vars locally
vercel env pull .env.local

# Redeploy
vercel --prod
```

**6. Slow queries**
```sql
-- Check query performance in Supabase Dashboard
-- Logs → Database → Slow Queries

-- Add indexes
create index idx_todos_user_id on todos(user_id);

-- Analyze query plan
explain analyze
select * from todos where user_id = 'xxx';
```

---

## Part 9: Migration & Backup

### Database Migrations

```bash
# Initialize Supabase locally
npx supabase init

# Create migration
npx supabase migration new create_profiles_table

# Edit migration file in supabase/migrations/
```

Example migration:
```sql
-- supabase/migrations/20240101000000_create_profiles_table.sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
```

### Backup Database

```bash
# Using Supabase CLI
npx supabase db dump -f backup.sql

# Restore
psql -h db.xxx.supabase.co -U postgres -d postgres -f backup.sql
```

### Export/Import Data

```sql
-- Export table to CSV
copy todos to '/tmp/todos.csv' csv header;

-- Import CSV
copy todos from '/tmp/todos.csv' csv header;
```

---

## Part 10: Deployment Checklist

### Pre-Deploy

- [ ] All environment variables set in Vercel
- [ ] Supabase redirect URLs configured
- [ ] RLS policies enabled on all tables
- [ ] Database indexes created
- [ ] Service role key not exposed in client code
- [ ] Error boundaries implemented
- [ ] Loading states handled
- [ ] TypeScript errors resolved (`npm run build`)
- [ ] Tests passing (`npm test`)

### Post-Deploy

- [ ] Test authentication flow in production
- [ ] Test database operations
- [ ] Check Vercel logs for errors
- [ ] Monitor Supabase dashboard for slow queries
- [ ] Set up analytics (Vercel Analytics)
- [ ] Configure custom domain (optional)
- [ ] Enable Vercel protection (DDoS, etc.)
- [ ] Set up monitoring/alerts

### Performance Checklist

- [ ] Images optimized with Next.js Image component
- [ ] Static pages generated where possible
- [ ] API routes use edge runtime
- [ ] Database queries optimized
- [ ] Unnecessary re-renders prevented
- [ ] Bundle size checked (`npm run build`)
- [ ] Lighthouse score > 90

---

## Quick Reference

### Essential Supabase Methods

```typescript
// Auth
await supabase.auth.signUp({ email, password })
await supabase.auth.signInWithPassword({ email, password })
await supabase.auth.signInWithOAuth({ provider: 'github' })
await supabase.auth.signOut()
const { data: { user } } = await supabase.auth.getUser()

// Database
await supabase.from('todos').select('*')
await supabase.from('todos').select('*, profiles(*)') // Join
await supabase.from('todos').insert({ task })
await supabase.from('todos').update({ is_complete }).eq('id', id)
await supabase.from('todos').delete().eq('id', id)
await supabase.from('todos').select().range(0, 9) // Pagination

// Filters
.eq('column', value)
.neq('column', value)
.gt('column', value)
.lt('column', value)
.like('column', '%pattern%')
.in('column', [value1, value2])
.is('column', null)
.order('column', { ascending: false })
.limit(10)

// Realtime
supabase.channel('channel-name')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, 
    (payload) => console.log(payload)
  )
  .subscribe()

// Storage
await supabase.storage.from('bucket').upload('path', file)
await supabase.storage.from('bucket').download('path')
supabase.storage.from('bucket').getPublicUrl('path')
await supabase.storage.from('bucket').remove(['path'])

// RPC (Database functions)
await supabase.rpc('function_name', { param: value })
```

### Vercel CLI Commands

```bash
vercel                  # Deploy to preview
vercel --prod          # Deploy to production
vercel env pull        # Pull environment variables
vercel env add         # Add environment variable
vercel logs            # View logs
vercel domains         # Manage domains
vercel rollback        # Rollback to previous deployment
```

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase + Next.js Starter](https://github.com/vercel/next.js/tree/canary/examples/with-supabase)
- [Supabase Discord](https://discord.supabase.com)
- [Vercel Discord](https://discord.gg/vercel)
- [Example Apps](https://github.com/supabase/supabase/tree/master/examples)

---

## Cost Breakdown

### Free Tier Limits

**Supabase Free:**
- 500MB database
- 2GB file storage
- 50,000 monthly active users
- 2GB bandwidth
- Social OAuth providers

**Vercel Hobby:**
- 100GB bandwidth
- Unlimited sites
- Automatic HTTPS
- Edge functions

**Upgrade When:**
- Database > 500MB: Supabase Pro ($25/month)
- Bandwidth > 100GB: Vercel Pro ($20/month)
- Need dedicated resources: Supabase Team ($599/month)
- Team collaboration: Vercel Team ($20/month per member)

---

## Next Steps

1. **Add Features:**
   - User profiles
   - File uploads
   - Real-time chat
   - Email notifications

2. **Improve UX:**
   - Loading skeletons
   - Optimistic updates
   - Error toasts
   - Dark mode

3. **Scale:**
   - Add caching (Redis)
   - Implement rate limiting
   - Set up monitoring
   - Configure CDN

4. **Learn More:**
   - Supabase Edge Functions
   - Vercel Edge Middleware
   - Database optimization
   - Security best practices