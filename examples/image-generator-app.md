# AI Image Generator App

Build a modern AI image generation app with multiple AI providers, image gallery, and cloud storage.

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **AI Models**: OpenAI DALL-E, Replicate, Stability AI
- **Storage**: Supabase Storage
- **Database**: Supabase PostgreSQL
- **Auth**: Clerk
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+
- OpenAI API key
- Replicate API key (optional)
- Supabase account
- Clerk account

## Quick Start

### 1. Create Next.js App

```bash
npx create-next-app@latest ai-image-generator --typescript --tailwind --app
cd ai-image-generator
```

### 2. Install Dependencies

```bash
npm install openai replicate @supabase/supabase-js @clerk/nextjs
npm install lucide-react @radix-ui/react-progress
npm install @radix-ui/react-select @radix-ui/react-tabs
```

### 3. Environment Setup

Create `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key
REPLICATE_API_TOKEN=your_replicate_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

### 4. Database Schema

Run this SQL in Supabase:

```sql
-- Create images table
CREATE TABLE images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their own images" ON images
  FOR ALL USING (auth.uid()::text = user_id);
```

### 5. AI Service

Create `lib/ai.ts`:

```typescript
import OpenAI from 'openai'
import Replicate from 'replicate'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export interface ImageGenerationOptions {
  prompt: string
  model: 'dalle-3' | 'dalle-2' | 'stable-diffusion' | 'midjourney'
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
}

export async function generateImage(options: ImageGenerationOptions) {
  const { prompt, model, size = '1024x1024', quality = 'standard', style = 'vivid' } = options

  switch (model) {
    case 'dalle-3':
      return await generateWithDALLE3(prompt, size, quality, style)
    case 'dalle-2':
      return await generateWithDALLE2(prompt, size)
    case 'stable-diffusion':
      return await generateWithStableDiffusion(prompt)
    case 'midjourney':
      return await generateWithMidjourney(prompt)
    default:
      throw new Error('Unsupported model')
  }
}

async function generateWithDALLE3(prompt: string, size: string, quality: string, style: string) {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: size as any,
    quality: quality as any,
    style: style as any,
    n: 1,
  })

  return {
    url: response.data[0].url,
    revised_prompt: response.data[0].revised_prompt,
  }
}

async function generateWithDALLE2(prompt: string, size: string) {
  const response = await openai.images.generate({
    model: 'dall-e-2',
    prompt,
    size: size as any,
    n: 1,
  })

  return {
    url: response.data[0].url,
    revised_prompt: prompt,
  }
}

async function generateWithStableDiffusion(prompt: string) {
  const output = await replicate.run(
    "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
    {
      input: {
        prompt,
        width: 1024,
        height: 1024,
        num_inference_steps: 20,
      }
    }
  )

  return {
    url: output[0] as string,
    revised_prompt: prompt,
  }
}

async function generateWithMidjourney(prompt: string) {
  const output = await replicate.run(
    "prompthero/openjourney:9936c2001faa2194a261c01381f90e65261879985476014a0a37a334593a05eb",
    {
      input: {
        prompt,
        width: 1024,
        height: 1024,
      }
    }
  )

  return {
    url: output[0] as string,
    revised_prompt: prompt,
  }
}
```

### 6. Image Generation Component

Create `components/image-generator.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { generateImage, ImageGenerationOptions } from '@/lib/ai'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import { Wand2, Download, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState<ImageGenerationOptions['model']>('dalle-3')
  const [size, setSize] = useState<ImageGenerationOptions['size']>('1024x1024')
  const [quality, setQuality] = useState<ImageGenerationOptions['quality']>('standard')
  const [style, setStyle] = useState<ImageGenerationOptions['style']>('vivid')
  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<{url: string, revised_prompt: string} | null>(null)
  const { user } = useUser()

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) return

    setLoading(true)
    try {
      const result = await generateImage({
        prompt,
        model,
        size,
        quality,
        style,
      })

      setGeneratedImage(result)

      // Save to database
      await supabase.from('images').insert({
        user_id: user.id,
        prompt,
        model,
        image_url: result.url,
      })
    } catch (error) {
      console.error('Error generating image:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `generated-image-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">AI Image Generator</h1>
        <p className="text-muted-foreground">Create stunning images with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A beautiful sunset over mountains..."
              className="w-full p-3 border rounded-lg resize-none h-24"
            />
          </div>

          <Tabs defaultValue="model" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="model">Model</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
            </TabsList>
            
            <TabsContent value="model" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">AI Model</label>
                <Select value={model} onValueChange={(value: any) => setModel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dalle-3">DALL-E 3 (OpenAI)</SelectItem>
                    <SelectItem value="dalle-2">DALL-E 2 (OpenAI)</SelectItem>
                    <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                    <SelectItem value="midjourney">Midjourney Style</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Size</label>
                <Select value={size} onValueChange={(value: any) => setSize(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                    <SelectItem value="1792x1024">Landscape (1792x1024)</SelectItem>
                    <SelectItem value="1024x1792">Portrait (1024x1792)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {model === 'dalle-3' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Quality</label>
                  <Select value={quality} onValueChange={(value: any) => setQuality(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="hd">HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              {model === 'dalle-3' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Style</label>
                  <Select value={style} onValueChange={(value: any) => setStyle(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vivid">Vivid</SelectItem>
                      <SelectItem value="natural">Natural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Button 
            onClick={handleGenerate} 
            disabled={loading || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </div>

        {/* Output Panel */}
        <div className="space-y-4">
          {generatedImage ? (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={generatedImage.url}
                  alt="Generated"
                  className="w-full rounded-lg shadow-lg"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={downloadImage}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Revised Prompt</h3>
                <p className="text-sm text-muted-foreground">
                  {generatedImage.revised_prompt}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-96 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Your generated image will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 7. Image Gallery Component

Create `components/image-gallery.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import { Download, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageRecord {
  id: string
  prompt: string
  model: string
  image_url: string
  created_at: string
}

export function ImageGallery() {
  const [images, setImages] = useState<ImageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      fetchImages()
    }
  }, [user])

  const fetchImages = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching images:', error)
    } else {
      setImages(data || [])
    }
    setLoading(false)
  }

  const deleteImage = async (id: string) => {
    const { error } = await supabase
      .from('images')
      .delete()
      .eq('id', id)

    if (!error) {
      setImages(prev => prev.filter(img => img.id !== id))
    }
  }

  const downloadImage = async (url: string, prompt: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `${prompt.slice(0, 30)}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading your images...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Your Generated Images</h2>
      
      {images.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No images generated yet</p>
          <p className="text-sm">Create your first AI image to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div key={image.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative">
                <img
                  src={image.image_url}
                  alt={image.prompt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(image.image_url, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadImage(image.image_url, image.prompt)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteImage(image.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-sm font-medium mb-2 line-clamp-2">
                  {image.prompt}
                </p>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="capitalize">{image.model}</span>
                  <span>{new Date(image.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 8. Main Page

Update `app/page.tsx`:

```typescript
import { ImageGenerator } from '@/components/image-generator'
import { ImageGallery } from '@/components/image-gallery'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <ImageGenerator />
      <div className="mt-12">
        <ImageGallery />
      </div>
    </main>
  )
}
```

## Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

## Features Added

- Multiple AI model support (DALL-E 3, DALL-E 2, Stable Diffusion, Midjourney)
- Advanced generation options (size, quality, style)
- Image gallery with history
- Download functionality
- User authentication
- Responsive design
- Real-time generation status

## Customization

- **More models**: Add support for Midjourney, Leonardo AI
- **Batch generation**: Generate multiple images at once
- **Image editing**: Add inpainting and outpainting
- **Style presets**: Pre-defined style templates
- **Community sharing**: Share images with other users
- **Advanced prompts**: Prompt engineering tools

## Next Steps

- Add image upscaling capabilities
- Implement image-to-image generation
- Create prompt templates and presets
- Add collaborative features
- Build image editing tools
- Add social sharing features
