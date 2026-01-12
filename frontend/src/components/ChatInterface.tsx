import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, X, Send, Loader2, Settings, Key, BookOpen, FileCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tool } from "@/types/tool";
import { SYSTEM_PROMPTS } from "@/lib/prompts";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  model?: string;
  context?: {
    relatedTools?: Tool[];
    relatedGuides?: string[];
    relatedExamples?: string[];
    userLevel?: "beginner" | "intermediate" | "expert";
  };
}

interface ChatInterfaceProps {
  tools: Tool[];
}

const AVAILABLE_MODELS = {
  auto: "Auto (Recommended)",
  deepseek: "DeepSeek (Reasoning)", // tngtech/deepseek-r1t2-chimera:free
  qwen_coder: "Qwen 3 (Speed)" // qwen/qwen3-4b:free
};

// Helper function to detect user experience level
const detectUserLevel = (message: string): "beginner" | "intermediate" | "expert" => {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("help me understand") ||
    lowerMessage.includes("i'm new") ||
    lowerMessage.includes("beginner") ||
    lowerMessage.includes("getting started")) {
    return "beginner";
  }
  if (lowerMessage.includes("advanced") ||
    lowerMessage.includes("optimize") ||
    lowerMessage.includes("architecture") ||
    lowerMessage.includes("best practice")) {
    return "expert";
  }
  return "intermediate";
};

// Helper function to find related content
const findRelatedContent = (message: string, tools: Tool[]): {
  tools: Tool[],
  guides: string[],
  examples: string[]
} => {
  const lowerMessage = message.toLowerCase();
  const messageWords = lowerMessage.split(/\W+/).filter(word => word.length > 2);

  // Find related tools with better matching
  // Find related tools with better matching and relevance sorting
  const relatedTools = tools.filter(tool => {
    // Create a combined search string from tool attributes
    const searchContent = [
      tool.name.toLowerCase(),
      tool.description.toLowerCase(),
      tool.category.toLowerCase(),
      ...tool.tags.map(tag => tag.toLowerCase())
    ].join(' ');

    // Check for matches using word boundaries for better relevance
    const matches = messageWords.filter(word =>
      searchContent.includes(word)
    );

    // score the match based on number of words matched + exact category match
    const categoryMatch = tool.category.toLowerCase().includes(lowerMessage);
    const score = matches.length + (categoryMatch ? 5 : 0);

    // Attach score to tool for sorting (temporary)
    (tool as any)._score = score;

    return score > 0;
  })
    .sort((a, b) => ((b as any)._score || 0) - ((a as any)._score || 0))
    .slice(0, 8); // Increase to 8 suggestions and better sorted

  // Find related guides with better matching
  const allGuides = [
    "getting-started.md",
    "ai-integration-guide.md",
    "prompt_engineering_guide.md",
    "run-llm-locally.md",
    "accept-payments-with-paystack.md",
    "connect-supabase-vercel.md",
    "free_vibe_coding_guide.md",
    "get-started.md",
    "track-users-privately.md"
  ];

  const guides = allGuides.filter(guide => {
    const guideName = guide.toLowerCase();
    // Check if any word from message appears in guide name
    const matchCount = messageWords.filter(word => guideName.includes(word)).length;
    return matchCount > 0 || lowerMessage.includes(guideName.replace('.md', ''));
  }).sort((a, b) => {
    // Sort by relevance (number of matching words)
    const aCount = messageWords.filter(word => a.toLowerCase().includes(word)).length;
    const bCount = messageWords.filter(word => b.toLowerCase().includes(word)).length;
    return bCount - aCount;
  });

  // Find related examples with better matching
  const allExamples = [
    "ai-chatbot-with-supabase.md",
    "analytics-dashboard.md",
    "blog-platform.md",
    "ecommerce-store.md",
    "file-uploader-app.md",
    "image-generator-app.md",
    "personal-dashboard.md",
    "sample-projects.md",
    "social-media-app.md"
  ];

  const examples = allExamples.filter(example => {
    const exampleName = example.toLowerCase();
    // Check if any word from message appears in example name
    const matchCount = messageWords.filter(word => exampleName.includes(word)).length;
    return matchCount > 0 || lowerMessage.includes(exampleName.replace('.md', ''));
  }).sort((a, b) => {
    // Sort by relevance
    const aCount = messageWords.filter(word => a.toLowerCase().includes(word)).length;
    const bCount = messageWords.filter(word => b.toLowerCase().includes(word)).length;
    return bCount - aCount;
  });

  return { tools: relatedTools, guides, examples };
};

export const ChatInterface = ({ tools }: ChatInterfaceProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi there! 👋 I'm your AI assistant, here to help you discover the best tools and resources for your development projects. Whether you're looking for AI services, backend solutions, or code examples, I'm ready to guide you. What can I help you with today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("auto");
  const [userApiKey, setUserApiKey] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("openrouter_api_key");
    if (savedApiKey) {
      setUserApiKey(savedApiKey);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveApiKey = () => {
    if (userApiKey.trim()) {
      localStorage.setItem("openrouter_api_key", userApiKey.trim());
      toast({
        title: "API Key Saved",
        description: "Your OpenRouter API key has been saved successfully.",
      });
      setIsSettingsOpen(false);
    } else {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid API key.",
        variant: "destructive",
      });
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem("openrouter_api_key");
    setUserApiKey("");
    toast({
      title: "API Key Cleared",
      description: "Your API key has been removed.",
    });
  };

  const sendMessage = async (retryMessage?: string) => {
    const messageToSend = retryMessage || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage = messageToSend;
    if (!retryMessage) {
      setInput("");
      const messageUserLevel = detectUserLevel(userMessage);
      const { tools: relatedTools, guides, examples } = findRelatedContent(userMessage, tools);

      setMessages(prev => [...prev, {
        role: "user",
        content: userMessage,
        context: {
          userLevel: messageUserLevel,
          relatedTools,
          relatedGuides: guides,
          relatedExamples: examples
        }
      }]);
    }
    setIsLoading(true);

    try {
      const toolsContext = tools.map(tool =>
        `${tool.name} (${tool.category}): ${tool.description}. Status: ${tool.status}. Link: ${tool.link}`
      ).join("\n");

      const userLevel = detectUserLevel(userMessage);
      const systemPrompt = userLevel === "beginner"
        ? SYSTEM_PROMPTS.beginner
        : userLevel === "expert"
          ? SYSTEM_PROMPTS.technical
          : SYSTEM_PROMPTS.default;

      // Select the appropriate model
      const modelMap: Record<string, string> = {
        deepseek: "tngtech/deepseek-r1t2-chimera:free",
        qwen_coder: "qwen/qwen3-4b:free",
        auto: "tngtech/deepseek-r1t2-chimera:free"
      };

      const openrouterModel = modelMap[selectedModel] || modelMap.auto;

      // Prepare enhanced context for the AI
      const detectedUserLevel = detectUserLevel(userMessage);
      const { tools: relatedTools, guides, examples } = findRelatedContent(userMessage, tools);

      // Enhance the system prompt with context about available tools
      const enhancedSystemPrompt = `${systemPrompt}

Context from our Internal Database:
- User Experience Level: ${detectedUserLevel}
- Available Tools: ${relatedTools.length > 0
          ? relatedTools.map(t => `${t.name} (${t.category}): ${t.description}`).join('; ')
          : 'None directly matching, use general knowledge but mention we have a catalog.'}
- Guides: ${guides.length > 0
          ? guides.map(g => g.replace('.md', '')).join(', ')
          : 'None'}
- Examples: ${examples.length > 0
          ? examples.map(e => e.replace('.md', '')).join(', ')
          : 'None'}

INSTRUCTIONS: 
1. PRIORITIZE the Internal Database information above. If the user asks about tools, guides, or examples, MUST use the ones listed above if relevant.
2. Only use general knowledge (RAG/External) if the internal data is insufficient or the user asks for something not in our catalog.
3. FLAGGED: Ensure the response is well-formatted using standard Markdown (Tool names in bold, lists for steps, code blocks for code). 
4. Do NOT output the text "Related Tools:" or "Examples:" in the response body, just weave them naturally into the conversation.`;

      const response = userApiKey
        ? await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${userApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://builderlab.programmify.org",
            "X-Title": "Builders Lab by Programmify",
          },
          body: JSON.stringify({
            model: openrouterModel,
            messages: [
              { role: "system", content: enhancedSystemPrompt },
              {
                role: "user", content: `Question: ${userMessage}

Please provide a helpful, well-formatted response. Use Markdown for clarity.` }
            ],
            temperature: 0.7,
            max_tokens: 1200,
            top_p: 0.9,
          }),
        })
        : await (async () => {
          try {
            const { data, error } = await supabase.functions.invoke("chat-with-tool", {
              body: {
                message: `Question: ${userMessage}

Please provide a helpful, well-formatted response. Use Markdown for clarity.`,
                toolsContext: `${toolsContext}

Context from our Internal Database:
- User Experience Level: ${detectedUserLevel}
- Available Tools: ${relatedTools.length > 0
                    ? relatedTools.map(t => `${t.name} (${t.category}): ${t.description}`).join('; ')
                    : 'None directly matching'}
- Guides: ${guides.length > 0
                    ? guides.map(g => g.replace('.md', '')).join(', ')
                    : 'None'}
- Examples: ${examples.length > 0
                    ? examples.map(e => e.replace('.md', '')).join(', ')
                    : 'None'}`,
                modelPreference: selectedModel,
                provider: "lovable",
                systemPrompt: enhancedSystemPrompt
              }
            });

            if (error) {
              console.error("Supabase function error:", error);
              // If it's a connection error, try to use the free model directly
              if (error.message.includes("Failed to send a request")) {
                toast({
                  title: "Connection Error",
                  description: "Falling back to free model. Consider adding your API key in settings for better reliability.",
                  duration: 5000,
                });

                // Fallback to free model with enhanced context
                const fallbackResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    "Authorization": "Bearer " + import.meta.env.VITE_OPEN_ROUTER_API,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://builderlab.programmify.org",
                    "X-Title": "Builders Lab by Programmify",
                  },
                  body: JSON.stringify({
                    model: "google/gemini-2.0-flash-exp:free",
                    messages: [
                      { role: "system", content: enhancedSystemPrompt },
                      {
                        role: "user", content: `Question: ${userMessage}

Please provide a helpful, well-formatted response. Use Markdown for clarity.` }
                    ],
                    temperature: 0.7,
                    max_tokens: 1200,
                    top_p: 0.9,
                  }),
                });

                if (!fallbackResponse.ok) {
                  throw new Error("Fallback model also failed: " + fallbackResponse.statusText);
                }

                return fallbackResponse;
              }
              throw error;
            }

            return new Response(JSON.stringify({ choices: [{ message: { content: data?.reply } }] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (err) {
            console.error("Edge function error:", err);
            throw new Error(err.message || "Failed to process request");
          }
        })()

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;

        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error response, use the status
          if (response.status === 429) {
            errorMessage = "Rate limit exceeded. Please try again in a few minutes.";
          } else if (response.status === 401) {
            errorMessage = "Invalid API key. Please check your OpenRouter API key.";
          } else if (response.status === 402) {
            errorMessage = "Payment required. Please add credits to your OpenRouter account.";
          } else if (response.status === 403) {
            errorMessage = "Access forbidden. Please check your API key permissions.";
          } else if (response.status === 500) {
            errorMessage = "Server error. The AI provider is temporarily unavailable. Please try again later.";
          } else if (response.status === 502) {
            errorMessage = "Bad gateway. The AI provider is experiencing issues. Please try again later.";
          } else if (response.status === 503) {
            errorMessage = "Service unavailable. The AI provider is temporarily down. Please try again later.";
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      let reply = data.choices[0].message.content;

      // Post-process response if needed (currently passing through markdown)
      // reply = reply.replace(...);

      setMessages(prev => [...prev, {
        role: "assistant",
        content: reply,
        model: selectedModel
      }]);

      // Reset retry count on successful message
      setRetryCount(0);
    } catch (error) {
      console.error("Chat error:", error);

      let errorMessage = "Failed to send message. Please try again.";
      let errorTitle = "Error";

      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes("provider returned error")) {
          errorTitle = "AI Provider Error";
          if (retryCount < 1 && selectedModel !== "auto") {
            // Auto-retry with a different model
            setRetryCount(prev => prev + 1);
            setRetryCount(prev => prev + 1);
            setSelectedModel("deepseek");

            toast({
              title: "Model Unavailable",
              description: "Switched to Auto mode and retrying...",
              duration: 2000,
            });

            // Auto-retry the message
            setTimeout(() => {
              sendMessage(userMessage);
            }, 1000);
            return; // Don't show error toast for auto-retry
          } else {
            errorMessage = "The AI model is temporarily unavailable. Try switching to a different model or try again later.";
          }
        } else if (message.includes("rate limit")) {
          errorTitle = "Rate Limit";
          errorMessage = "Too many requests. Please wait a few minutes before trying again.";
        } else if (message.includes("invalid api key")) {
          errorTitle = "Invalid API Key";
          errorMessage = "Please check your OpenRouter API key in settings.";
        } else if (message.includes("payment required")) {
          errorTitle = "Payment Required";
          errorMessage = "Please add credits to your OpenRouter account.";
        } else if (message.includes("server error") || message.includes("bad gateway") || message.includes("service unavailable")) {
          errorTitle = "Service Unavailable";
          errorMessage = "The AI service is temporarily down. Please try again later.";
        } else {
          errorMessage = error.message;
        }
      }

      // Special handling for edge function errors
      if (error instanceof Error && error.message.includes("Edge Function")) {
        toast({
          title: "Connection Error",
          description: "Unable to reach AI service. Please try again or add your API key in settings.",
          variant: "destructive",
          duration: 5000,
        });

        // Automatically open settings if no API key is set
        if (!userApiKey) {
          setIsSettingsOpen(true);
        }
      } else {
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-4 sm:right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full shadow-accent bg-accent-secondary hover:bg-accent-secondary/90"
          size="icon"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-24 right-2 left-2 sm:right-6 sm:left-auto z-50 w-auto sm:w-[420px] max-h-[calc(100vh-8rem)]"
          >
            <Card className="flex flex-col h-[400px] max-h-[calc(100vh-8rem)] gradient-card border-accent-secondary/30 shadow-accent">
              <div className="p-3 border-b border-border/50 bg-accent-secondary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">AI Assistant</h3>
                    {!userApiKey.trim() && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse flex-shrink-0" title="API key required" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!userApiKey.trim()}>
                      <SelectTrigger className="w-[70px] sm:w-[80px] h-6 text-xs bg-white/10 border-white/20 text-white disabled:opacity-50 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AVAILABLE_MODELS).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="text-xs py-1">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 hover:bg-white/10 shrink-0 ${!userApiKey.trim()
                            ? "text-yellow-300 hover:text-yellow-200"
                            : "text-white/80 hover:text-white"
                            }`}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            OpenRouter API Key
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">API Key</label>
                            <Input
                              type="password"
                              placeholder="sk-or-v1-..."
                              value={userApiKey}
                              onChange={(e) => setUserApiKey(e.target.value)}
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Get your free API key from{" "}
                              <a
                                href="https://openrouter.ai/keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                openrouter.ai
                              </a>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={saveApiKey} className="flex-1">
                              Save
                            </Button>
                            <Button variant="outline" onClick={clearApiKey}>
                              Clear
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {/* No gating UI; Lovable is default when no key */}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === "user"
                        ? "bg-accent-secondary text-white"
                        : "bg-muted text-foreground"
                        }`}
                    >
                      {message.role === "user" ? (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="text-sm prose prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              pre: ({ node, ...props }) => (
                                <div className="overflow-auto w-full my-2 bg-black/10 p-2 rounded-lg">
                                  <pre {...props} />
                                </div>
                              ),
                              code: ({ node, ...props }) => (
                                <code className="bg-black/10 rounded px-1" {...props} />
                              ),
                              p: ({ node, ...props }) => (
                                <p className="mb-2 last:mb-0" {...props} />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul className="list-disc pl-4 mb-2" {...props} />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol className="list-decimal pl-4 mb-2" {...props} />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      {message.role === "assistant" && message.model && (
                        <p className="text-[10px] opacity-50 mt-1">
                          {AVAILABLE_MODELS[message.model] || message.model}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-[10px] opacity-50">
                        {AVAILABLE_MODELS[selectedModel]}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-border/50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={"Ask me about tools, guides, examples, or anything development-related..."}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="bg-accent-secondary hover:bg-accent-secondary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};