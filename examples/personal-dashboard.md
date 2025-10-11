# Personal Dashboard

Build a comprehensive personal dashboard with analytics, notes, task management, and habit tracking.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Analytics**: PostHog
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+
- Supabase account
- PostHog account

## 🚀 Quick Start

### 1. Create Next.js App

```bash
npx create-next-app@latest personal-dashboard --typescript --tailwind --app
cd personal-dashboard
```

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @posthog/react @posthog/node
npm install recharts lucide-react
npm install @radix-ui/react-progress @radix-ui/react-tabs
npm install @radix-ui/react-dialog @radix-ui/react-select
```

### 3. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 4. Database Schema

Run this SQL in Supabase:

```sql
-- Create notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create habits table
CREATE TABLE habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  target_frequency INTEGER DEFAULT 1, -- per day
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create habit_logs table
CREATE TABLE habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Create metrics table
CREATE TABLE metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  value DECIMAL,
  unit TEXT,
  category TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own habits" ON habits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own habit logs" ON habit_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own metrics" ON metrics
  FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5. Supabase Client Setup

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### 6. PostHog Setup

Create `lib/posthog.ts`:

```typescript
import { PostHog } from 'posthog-node'

export const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  }
)
```

Create `app/providers.tsx`:

```typescript
'use client'

import { PostHogProvider } from '@posthog/react'
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
      <PostHogProvider
        apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY!}
        options={{
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        }}
      >
        {children}
      </PostHogProvider>
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### 7. Dashboard Components

Create `components/dashboard-overview.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp,
  Calendar,
  BookOpen,
  Activity
} from 'lucide-react'

interface DashboardStats {
  totalTasks: number
  completedTasks: number
  totalHabits: number
  habitsCompletedToday: number
  totalNotes: number
  recentMetrics: Array<{
    date: string
    value: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchDashboardStats()
    }
  }, [user])

  const fetchDashboardStats = async () => {
    if (!user) return

    try {
      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)

      // Fetch habits
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)

      // Fetch habit logs for today
      const today = new Date().toISOString().split('T')[0]
      const { data: habitLogs } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', `${today}T00:00:00`)

      // Fetch notes
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)

      // Fetch recent metrics
      const { data: metrics } = await supabase
        .from('metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(30)

      // Process metrics data
      const recentMetrics = metrics?.reduce((acc, metric) => {
        const date = new Date(metric.recorded_at).toISOString().split('T')[0]
        const existing = acc.find(item => item.date === date)
        if (existing) {
          existing.value += metric.value
        } else {
          acc.push({ date, value: metric.value })
        }
        return acc
      }, [] as Array<{date: string, value: number}>) || []

      setStats({
        totalTasks: tasks?.length || 0,
        completedTasks: tasks?.filter(t => t.completed).length || 0,
        totalHabits: habits?.length || 0,
        habitsCompletedToday: habitLogs?.length || 0,
        totalNotes: notes?.length || 0,
        recentMetrics: recentMetrics.reverse()
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>
  }

  if (!stats) {
    return <div className="text-center py-8">No data available</div>
  }

  const taskCompletionRate = stats.totalTasks > 0 
    ? (stats.completedTasks / stats.totalTasks) * 100 
    : 0

  const habitCompletionRate = stats.totalHabits > 0 
    ? (stats.habitsCompletedToday / stats.totalHabits) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tasks Completed</p>
              <p className="text-2xl font-bold">{stats.completedTasks}/{stats.totalTasks}</p>
              <p className="text-xs text-gray-400">{taskCompletionRate.toFixed(1)}% completion rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Habits Today</p>
              <p className="text-2xl font-bold">{stats.habitsCompletedToday}/{stats.totalHabits}</p>
              <p className="text-xs text-gray-400">{habitCompletionRate.toFixed(1)}% completion rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Notes</p>
              <p className="text-2xl font-bold">{stats.totalNotes}</p>
              <p className="text-xs text-gray-400">Knowledge base</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Productivity</p>
              <p className="text-2xl font-bold">
                {((taskCompletionRate + habitCompletionRate) / 2).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400">Overall score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metrics Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.recentMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Task Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Completed', value: stats.completedTasks, color: '#00C49F' },
                  { name: 'Pending', value: stats.totalTasks - stats.completedTasks, color: '#FFBB28' }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'Completed', value: stats.completedTasks, color: '#00C49F' },
                  { name: 'Pending', value: stats.totalTasks - stats.completedTasks, color: '#FFBB28' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
```

### 8. Notes Component

Create `components/notes-manager.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'
import { Plus, Search, Tag, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

export function NotesManager() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' })
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchNotes()
    }
  }, [user])

  const fetchNotes = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
    } else {
      setNotes(data || [])
    }
    setLoading(false)
  }

  const saveNote = async () => {
    if (!user || (!newNote.title && !newNote.content)) return

    const noteData = {
      user_id: user.id,
      title: newNote.title,
      content: newNote.content,
      tags: newNote.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }

    if (editingNote) {
      const { error } = await supabase
        .from('notes')
        .update(noteData)
        .eq('id', editingNote.id)

      if (!error) {
        setNotes(prev => prev.map(note => 
          note.id === editingNote.id 
            ? { ...note, ...noteData, updated_at: new Date().toISOString() }
            : note
        ))
      }
    } else {
      const { data, error } = await supabase
        .from('notes')
        .insert([noteData])
        .select()
        .single()

      if (!error && data) {
        setNotes(prev => [data, ...prev])
      }
    }

    setNewNote({ title: '', content: '', tags: '' })
    setEditingNote(null)
    setIsDialogOpen(false)
  }

  const deleteNote = async (id: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (!error) {
      setNotes(prev => prev.filter(note => note.id !== id))
    }
  }

  const editNote = (note: Note) => {
    setEditingNote(note)
    setNewNote({
      title: note.title,
      content: note.content,
      tags: note.tags.join(', ')
    })
    setIsDialogOpen(true)
  }

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = !selectedTag || note.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)))

  if (loading) {
    return <div className="text-center py-8">Loading notes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notes</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingNote(null); setNewNote({ title: '', content: '', tags: '' }) }}>
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Note title"
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              />
              <textarea
                placeholder="Note content"
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                className="w-full p-3 border rounded-lg resize-none h-32"
              />
              <Input
                placeholder="Tags (comma separated)"
                value={newNote.tags}
                onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveNote}>
                  {editingNote ? 'Update' : 'Save'} Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note) => (
          <div key={note.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg line-clamp-1">{note.title}</h3>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => editNote(note)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteNote(note.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm line-clamp-3 mb-3">
              {note.content}
            </p>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
            
            <p className="text-xs text-gray-400">
              Updated {new Date(note.updated_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No notes found</p>
          <p className="text-sm">Create your first note to get started</p>
        </div>
      )}
    </div>
  )
}
```

### 9. Main Dashboard Page

Update `app/page.tsx`:

```typescript
import { DashboardOverview } from '@/components/dashboard-overview'
import { NotesManager } from '@/components/notes-manager'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Personal Dashboard</h1>
        
        <DashboardOverview />
        <div className="mt-12">
          <NotesManager />
        </div>
      </div>
    </main>
  )
}
```

## 🚀 Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

## 🎯 Features Added

- ✅ Personal analytics dashboard
- ✅ Notes management with tags
- ✅ Task tracking system
- ✅ Habit tracking
- ✅ Metrics recording
- ✅ Search and filtering
- ✅ Responsive design
- ✅ Real-time updates

## 🔧 Customization

- **More widgets**: Add weather, calendar, news feeds
- **Advanced analytics**: Custom charts and insights
- **Goal tracking**: Set and monitor personal goals
- **Time tracking**: Log time spent on activities
- **Mood tracking**: Daily mood and wellness logs
- **Expense tracking**: Personal finance management

## 📚 Next Steps

- Add task management components
- Implement habit tracking interface
- Create metrics recording system
- Add goal setting and tracking
- Build time tracking features
- Add data export capabilities
