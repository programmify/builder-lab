# Blog Platform

Build a modern blog platform with content management, SEO optimization, and reader engagement features.

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Database**: Supabase PostgreSQL
- **Auth**: Clerk
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS + shadcn/ui
- **SEO**: Next.js built-in SEO
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+
- Supabase account
- Clerk account

## Quick Start

### 1. Create Next.js App

```bash
npx create-next-app@latest blog-platform --typescript --tailwind --app
cd blog-platform
```

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js @clerk/nextjs
npm install lucide-react @radix-ui/react-dialog
npm install @radix-ui/react-select @radix-ui/react-tabs
npm install @radix-ui/react-toast
npm install react-markdown remark-gfm
npm install gray-matter
```

### 3. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

### 4. Database Schema

Run this SQL in Supabase:

```sql
-- Create authors table
CREATE TABLE authors (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website_url TEXT,
  social_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  reading_time INTEGER, -- in minutes
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, author_id)
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authors are viewable by everyone" ON authors
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own author profile" ON authors
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own author profile" ON authors
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Posts are viewable by everyone when published" ON posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can view their own posts" ON posts
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Authors can create their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Comments are viewable when approved" ON comments
  FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON likes
  FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Subscriptions are insertable by everyone" ON subscriptions
  FOR INSERT WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON authors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for counts
CREATE TRIGGER update_likes_count AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER update_comments_count AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Insert default categories
INSERT INTO categories (name, slug, description, color) VALUES
('Technology', 'technology', 'Latest in tech and programming', '#3B82F6'),
('Design', 'design', 'UI/UX and visual design', '#EF4444'),
('Business', 'business', 'Entrepreneurship and business insights', '#10B981'),
('Lifestyle', 'lifestyle', 'Personal development and lifestyle', '#F59E0B'),
('Tutorials', 'tutorials', 'Step-by-step guides and tutorials', '#8B5CF6');
```

### 5. Blog Post Component

Create `components/blog-post.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import { Heart, MessageCircle, Share, BookOpen, Calendar, User, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image_url: string | null
  published_at: string
  reading_time: number
  views_count: number
  likes_count: number
  comments_count: number
  tags: string[]
  author: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
  }
  category: {
    id: string
    name: string
    slug: string
    color: string
  }
  is_liked: boolean
}

interface BlogPostProps {
  post: Post
}

export function BlogPost({ post }: BlogPostProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [viewsCount, setViewsCount] = useState(post.views_count)
  const { user } = useUser()

  useEffect(() => {
    // Increment view count
    incrementViewCount()
  }, [])

  const incrementViewCount = async () => {
    const { error } = await supabase
      .from('posts')
      .update({ views_count: post.views_count + 1 })
      .eq('id', post.id)

    if (!error) {
      setViewsCount(prev => prev + 1)
    }
  }

  const toggleLike = async () => {
    if (!user) return

    if (isLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('author_id', user.id)

      if (!error) {
        setIsLiked(false)
        setLikesCount(prev => prev - 1)
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert([{ post_id: post.id, author_id: user.id }])

      if (!error) {
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <article className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: post.category.color }}
          >
            {post.category.name}
          </span>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        
        <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
        
        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={post.author.avatar_url || ''} />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <span>{post.author.display_name}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.published_at)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{post.reading_time} min read</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span>{viewsCount} views</span>
          </div>
        </div>
        
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Featured Image */}
      {post.featured_image_url && (
        <div className="mb-8">
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none mb-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={toggleLike}
          className={isLiked ? 'text-red-500 border-red-500' : ''}
        >
          <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
          {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
        </Button>
        
        <Button variant="outline">
          <MessageCircle className="w-4 h-4 mr-2" />
          {post.comments_count} {post.comments_count === 1 ? 'Comment' : 'Comments'}
        </Button>
        
        <Button variant="outline">
          <Share className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>

      {/* Author Bio */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={post.author.avatar_url || ''} />
              <AvatarFallback>
                <User className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">{post.author.display_name}</h3>
              <p className="text-muted-foreground">
                Author of this post. Follow for more content like this.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </article>
  )
}
```

### 6. Blog Editor Component

Create `components/blog-editor.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import { Save, Eye, Upload, Tag, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

interface BlogEditorProps {
  postId?: string
  onSave?: () => void
}

export function BlogEditor({ postId, onSave }: BlogEditorProps) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const { user } = useUser()

  useEffect(() => {
    fetchCategories()
    if (postId) {
      fetchPost()
    }
  }, [postId])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
  }

  const fetchPost = async () => {
    if (!postId) return

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (error) {
      console.error('Error fetching post:', error)
    } else {
      setTitle(data.title)
      setSlug(data.slug)
      setExcerpt(data.excerpt)
      setContent(data.content)
      setCategoryId(data.category_id)
      setTags(data.tags?.join(', ') || '')
      setSeoTitle(data.seo_title)
      setSeoDescription(data.seo_description)
      setFeaturedImageUrl(data.featured_image_url)
      setStatus(data.status)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!postId) {
      setSlug(generateSlug(value))
    }
  }

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file)

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName)
    
    return publicUrl
  }

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  const handleSave = async () => {
    if (!user || !title || !content) return

    setLoading(true)
    try {
      let imageUrl = featuredImageUrl

      // Upload new image if provided
      if (featuredImage) {
        imageUrl = await uploadImage(featuredImage)
      }

      const postData = {
        title,
        slug,
        excerpt,
        content,
        featured_image_url: imageUrl,
        author_id: user.id,
        category_id: categoryId,
        status,
        reading_time: calculateReadingTime(content),
        seo_title: seoTitle || title,
        seo_description: seoDescription || excerpt,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        published_at: status === 'published' ? new Date().toISOString() : null
      }

      if (postId) {
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', postId)

        if (error) {
          console.error('Error updating post:', error)
        }
      } else {
        const { error } = await supabase
          .from('posts')
          .insert([postData])

        if (error) {
          console.error('Error creating post:', error)
        }
      }

      onSave?.()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {postId ? 'Edit Post' : 'Create New Post'}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Eye className="w-4 h-4 mr-2" />
            {postId ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter post title"
              className="text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="post-url-slug"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description of the post"
              className="w-full p-3 border rounded-lg resize-none h-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content in Markdown..."
              className="w-full p-3 border rounded-lg resize-none h-96 font-mono"
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">SEO Title</label>
            <Input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="SEO optimized title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">SEO Description</label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Meta description for search engines"
              className="w-full p-3 border rounded-lg resize-none h-20"
            />
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Featured Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)}
              className="w-full p-3 border rounded-lg"
            />
            {featuredImageUrl && (
              <div className="mt-4">
                <img
                  src={featuredImageUrl}
                  alt="Featured"
                  className="w-full max-w-md rounded-lg"
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 7. Blog List Component

Create `components/blog-list.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, BookOpen, Eye, Heart, User } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image_url: string | null
  published_at: string
  reading_time: number
  views_count: number
  likes_count: number
  tags: string[]
  author: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
  }
  category: {
    id: string
    name: string
    slug: string
    color: string
  }
}

export function BlogList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [categories, setCategories] = useState<Array<{id: string, name: string, slug: string, color: string}>>([])

  useEffect(() => {
    fetchPosts()
    fetchCategories()
  }, [])

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:authors!posts_author_id_fkey(id, username, display_name, avatar_url),
        category:categories!posts_category_id_fkey(id, name, slug, color)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
    } else {
      setPosts(data || [])
    }
    setLoading(false)
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category.slug === selectedCategory
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return <div className="text-center py-8">Loading posts...</div>
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded-lg px-3 py-3"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              {post.featured_image_url && (
                <div className="aspect-video relative">
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <Badge
                    className="absolute top-2 left-2"
                    style={{ backgroundColor: post.category.color }}
                  >
                    {post.category.name}
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <h3 className="text-lg font-semibold line-clamp-2">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {post.excerpt}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={post.author.avatar_url || ''} />
                      <AvatarFallback>
                        <User className="w-2 h-2" />
                      </AvatarFallback>
                    </Avatar>
                    <span>{post.author.display_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{post.reading_time} min</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{post.views_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{post.likes_count}</span>
                    </div>
                  </div>
                  
                  {post.tags.length > 0 && (
                    <div className="flex gap-1">
                      {post.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No posts found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
```

### 8. Main Blog Page

Update `app/page.tsx`:

```typescript
import { BlogList } from '@/components/blog-list'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Blog Platform</h1>
          <p className="text-muted-foreground text-lg">
            Discover insights, tutorials, and stories from our community
          </p>
        </div>
        
        <BlogList />
      </div>
    </main>
  )
}
```

## Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Setup Supabase storage bucket for images
5. Deploy!

## Features Added

- Full-featured blog editor with Markdown support
- SEO optimization with meta tags
- Category and tag system
- Author profiles and management
- Reading time calculation
- View and like tracking
- Responsive design
- Search and filtering

## Customization

- **Comments system**: Add threaded comments
- **Newsletter**: Email subscription system
- **Analytics**: Detailed post analytics
- **Multi-author**: Support for multiple authors
- **Content scheduling**: Schedule posts for future publication
- **Rich text editor**: WYSIWYG editor instead of Markdown

## Next Steps

- Add comment system with moderation
- Implement newsletter subscription
- Create author dashboard
- Add post scheduling
- Build analytics dashboard
- Add social sharing features
