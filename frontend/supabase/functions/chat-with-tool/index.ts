import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Available OpenRouter models
const AVAILABLE_MODELS = {
  qwen: "qwen/qwen3-coder:free",
  gemini: "google/gemini-2.0-flash-exp:free",
  deepseek: "deepseek/deepseek-r1:free",
  gemma: "google/gemma-3-27b-it:free",
  deepseek_chat: "deepseek/deepseek-chat-v3-0324:free",
  gpt_oss: "openai/gpt-oss-20b:free"
};

// Function to select the best model based on message content
function selectModel(message: string, userPreference?: string): string {
  // If user specifies a preference, use it
  if (userPreference && AVAILABLE_MODELS[userPreference]) {
    return AVAILABLE_MODELS[userPreference];
  }

  // Auto-select based on message content
  const lowerMessage = message.toLowerCase();

  // For coding-related queries, prefer Qwen or DeepSeek
  if (lowerMessage.includes('code') || lowerMessage.includes('programming') ||
    lowerMessage.includes('function') || lowerMessage.includes('api') ||
    lowerMessage.includes('debug') || lowerMessage.includes('error')) {
    return AVAILABLE_MODELS.qwen;
  }

  // For general chat, prefer Gemini or DeepSeek Chat
  if (lowerMessage.includes('explain') || lowerMessage.includes('what is') ||
    lowerMessage.includes('how does') || lowerMessage.includes('tell me')) {
    return AVAILABLE_MODELS.gemini;
  }

  // Default to DeepSeek Chat for general assistance
  return AVAILABLE_MODELS.deepseek_chat;
}

// naive in-memory rate limiter (per cold start instance)
const rateMap = new Map<string, number[]>();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, toolsContext, modelPreference, provider } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("VITE_OPEN_ROUTER_API");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    // Use original working Lovable gateway endpoint
    const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

    if (!OPENROUTER_API_KEY && provider !== 'lovable') {
      throw new Error("OpenRouter API key is missing. Please add it in the project settings or use the client-side API key option.");
    }

    // Select the appropriate model
    const selectedModel = selectModel(message, modelPreference);
    console.log(`Using model: ${selectedModel}`);

    const systemPrompt = `You are the AI assistant for Builders Lab by Programmify.

Context (tools database):\n${toolsContext}

Instructions:
- Answer based ONLY on the tools context when relevant.
- Be concise and practical. Prefer bullet points and numbered steps.
- Include links if available in the context. If a tool is missing, say so and suggest close alternatives.
- Avoid speculation. If unsure, ask a brief clarifying question.`;
    const targetUrl = provider === 'lovable' ? LOVABLE_API_URL : "https://openrouter.ai/api/v1/chat/completions";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (provider === 'lovable') {
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
      headers["Authorization"] = `Bearer ${LOVABLE_API_KEY}`;
    } else {
      headers["Authorization"] = `Bearer ${OPENROUTER_API_KEY}`;
      headers["HTTP-Referer"] = "https://builderlab.programmify.org";
      headers["X-Title"] = "Builders Lab by Programmify";
    }

    // Apply rate limiting only when using server Lovable key (no user key provided on server)
    if (provider === 'lovable') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
      const now = Date.now();
      const windowMs = 10 * 60 * 1000; // 10 minutes
      const timestamps = (rateMap.get(ip) || []).filter(t => now - t < windowMs);
      // policy: allow 2 free messages; hard cap 3 per 10 minutes
      if (timestamps.length >= 3) {
        return new Response(
          JSON.stringify({ error: "Trial limit reached (3 per 10 min). Add your OpenRouter API key in settings to continue." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      timestamps.push(now);
      rateMap.set(ip, timestamps);
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        // For Lovable, use Gemini
        model: provider === 'lovable' ? AVAILABLE_MODELS.gemini : selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        // Keep defaults minimal to mirror original behavior
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Chat provider error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Chat provider error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || data.reply || data.message || "";

    return new Response(
      JSON.stringify({
        reply,
        model: provider === 'lovable' ? 'lovable' : selectedModel,
        availableModels: Object.keys(AVAILABLE_MODELS)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in chat-with-tool:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});