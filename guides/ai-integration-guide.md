# AI Integration Guide

Learn how to integrate various AI services into your applications effectively.

## 🧠 AI Service Overview

### OpenAI API
**Best for**: Text generation, embeddings, fine-tuning
**Pricing**: Pay-per-token
**Models**: GPT-4, GPT-3.5, DALL-E, Whisper

### Groq API
**Best for**: Ultra-fast inference
**Pricing**: Competitive rates
**Models**: Llama, Mixtral, Gemma

### Hugging Face
**Best for**: Open-source models
**Pricing**: Free tier available
**Models**: Thousands of community models

### Replicate
**Best for**: Running models in the cloud
**Pricing**: Pay-per-second
**Models**: Image generation, video processing

## 🚀 Getting Started with AI APIs

### 1. OpenAI Integration

```typescript
// Install OpenAI SDK
npm install openai

// Basic setup
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Text generation
async function generateText(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
  })
  
  return completion.choices[0].message.content
}

// Streaming responses
async function streamText(prompt: string) {
  const stream = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  })
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      console.log(content)
    }
  }
}
```

### 2. Groq Integration

```typescript
// Install Groq SDK
npm install groq-sdk

// Setup
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Ultra-fast inference
async function fastInference(prompt: string) {
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-8b-8192",
    temperature: 0.7,
  })
  
  return completion.choices[0]?.message?.content
}
```

### 3. Hugging Face Integration

```typescript
// Using Hugging Face Inference API
async function hfInference(text: string) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
    {
      headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` },
      method: "POST",
      body: JSON.stringify({ inputs: text }),
    }
  )
  
  const result = await response.json()
  return result[0].generated_text
}
```

## 🎨 Image Generation

### DALL-E Integration

```typescript
// Generate images with DALL-E
async function generateImage(prompt: string) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  })
  
  return response.data[0].url
}
```

### Replicate Image Generation

```typescript
// Using Replicate for image generation
import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

async function generateImageReplicate(prompt: string) {
  const output = await replicate.run(
    "stability-ai/stable-diffusion:db21e45d3f7023abc2a46e38a246633eff2a049af9c8e476b00a3f003694de1f",
    {
      input: {
        prompt: prompt,
        width: 512,
        height: 512,
      }
    }
  )
  
  return output[0]
}
```

## 🔍 Embeddings and Search

### OpenAI Embeddings

```typescript
// Generate embeddings
async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  })
  
  return response.data[0].embedding
}

// Semantic search
async function semanticSearch(query: string, documents: string[]) {
  const queryEmbedding = await generateEmbedding(query)
  
  // Compare with document embeddings
  const similarities = documents.map(doc => {
    const docEmbedding = await generateEmbedding(doc)
    const similarity = cosineSimilarity(queryEmbedding, docEmbedding)
    return { doc, similarity }
  })
  
  return similarities.sort((a, b) => b.similarity - a.similarity)
}
```

## 🤖 AI Agents and Workflows

### Building an AI Agent

```typescript
class AIAgent {
  private openai: OpenAI
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }
  
  async processRequest(request: string, context: any) {
    const systemPrompt = `
      You are an AI assistant that helps users with their requests.
      Context: ${JSON.stringify(context)}
    `
    
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: request }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "search_web",
            description: "Search the web for information",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string" }
              }
            }
          }
        }
      ]
    })
    
    return completion.choices[0].message
  }
}
```

### Workflow Automation

```typescript
// Using n8n-style workflow
class AIWorkflow {
  async executeWorkflow(steps: WorkflowStep[]) {
    for (const step of steps) {
      switch (step.type) {
        case 'ai_generation':
          await this.generateContent(step.prompt)
          break
        case 'data_processing':
          await this.processData(step.data)
          break
        case 'api_call':
          await this.callAPI(step.endpoint)
          break
      }
    }
  }
}
```

## 📊 AI Analytics and Monitoring

### Tracking AI Usage

```typescript
// Track AI API usage
class AIAnalytics {
  async trackUsage(service: string, tokens: number, cost: number) {
    await supabase.from('ai_usage').insert({
      service,
      tokens_used: tokens,
      cost,
      timestamp: new Date().toISOString()
    })
  }
  
  async getUsageStats(timeRange: string) {
    const { data } = await supabase
      .from('ai_usage')
      .select('*')
      .gte('timestamp', getTimeRange(timeRange))
    
    return this.calculateStats(data)
  }
}
```

### Performance Monitoring

```typescript
// Monitor AI response times
class AIPerformanceMonitor {
  async measureResponseTime<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; responseTime: number }> {
    const start = Date.now()
    const result = await operation()
    const responseTime = Date.now() - start
    
    // Log performance metrics
    console.log(`Operation completed in ${responseTime}ms`)
    
    return { result, responseTime }
  }
}
```

## 🔒 Security Best Practices

### API Key Management

```typescript
// Secure API key handling
class SecureAIClient {
  private apiKey: string
  
  constructor() {
    this.apiKey = process.env.AI_API_KEY
    if (!this.apiKey) {
      throw new Error('AI API key not found')
    }
  }
  
  async makeRequest(endpoint: string, data: any) {
    // Add rate limiting
    await this.rateLimit()
    
    // Add request validation
    this.validateRequest(data)
    
    // Make secure request
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }
}
```

### Input Validation

```typescript
// Validate AI inputs
function validateAIInput(input: string): boolean {
  // Check for malicious content
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i
  ]
  
  return !maliciousPatterns.some(pattern => pattern.test(input))
}

// Sanitize outputs
function sanitizeAIOutput(output: string): string {
  return output
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
}
```

## 🚀 Deployment Considerations

### Environment Configuration

```typescript
// Environment-specific AI configuration
const aiConfig = {
  development: {
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7
  },
  production: {
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.5
  }
}

const config = aiConfig[process.env.NODE_ENV] || aiConfig.development
```

### Error Handling

```typescript
// Robust error handling for AI services
class AIErrorHandler {
  async handleAIRequest<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request()
    } catch (error) {
      if (error.code === 'rate_limit_exceeded') {
        // Implement exponential backoff
        await this.exponentialBackoff()
        return this.handleAIRequest(request)
      }
      
      if (error.code === 'insufficient_quota') {
        // Switch to fallback service
        return this.fallbackRequest()
      }
      
      throw new Error(`AI request failed: ${error.message}`)
    }
  }
}
```

## 📈 Cost Optimization

### Token Management

```typescript
// Optimize token usage
class TokenOptimizer {
  optimizePrompt(prompt: string): string {
    // Remove unnecessary whitespace
    const cleaned = prompt.replace(/\s+/g, ' ').trim()
    
    // Truncate if too long
    const maxLength = 4000
    if (cleaned.length > maxLength) {
      return cleaned.substring(0, maxLength) + '...'
    }
    
    return cleaned
  }
  
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }
}
```

### Caching Strategies

```typescript
// Cache AI responses
class AICache {
  private cache = new Map()
  
  async getCachedResponse(prompt: string): Promise<string | null> {
    const key = this.hashPrompt(prompt)
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour
      return cached.response
    }
    
    return null
  }
  
  async cacheResponse(prompt: string, response: string): Promise<void> {
    const key = this.hashPrompt(prompt)
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    })
  }
}
```

## 🎯 Best Practices Summary

1. **Start Simple**: Begin with basic text generation
2. **Handle Errors**: Implement robust error handling
3. **Monitor Usage**: Track costs and performance
4. **Secure Keys**: Never expose API keys
5. **Optimize Costs**: Use caching and token optimization
6. **Test Thoroughly**: Validate all AI outputs
7. **Plan for Scale**: Design for high-volume usage

## 📚 Additional Resources

- [OpenAI Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- [Hugging Face Documentation](https://huggingface.co/docs)
- [Groq Quick Start](https://console.groq.com/docs)
- [Replicate Documentation](https://replicate.com/docs)

---

**Ready to build with AI?** Check out our [examples](../examples/) for complete project implementations!




