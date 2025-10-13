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
  gemini: "Gemini (General Knowledge)",
  deepseek: "DeepSeek (Technical)",
  gpt_oss: "GPT-OSS (Creative)"
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
    
    // Include tool if it has at least one good match
    return matches.length > 0;
  }).slice(0, 5); // Increase to 5 for more comprehensive suggestions

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
    return lowerMessage.includes(guideName.replace('.md', '')) || 
           messageWords.some(word => guideName.includes(word));
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
    return lowerMessage.includes(exampleName.replace('.md', '')) || 
           messageWords.some(word => exampleName.includes(word));
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

      // Select the appropriate model (without qwen, gemma, deepseek_chat)
      const selectedModelKey = selectedModel === "auto" ? 
        (userMessage.toLowerCase().includes('code') || userMessage.toLowerCase().includes('programming') ? 'deepseek' : 'gemini') :
        selectedModel;

      const modelMap = {
        gemini: "google/gemini-2.0-flash-exp:free", 
        deepseek: "deepseek/deepseek-r1:free",
        gpt_oss: "openai/gpt-oss-20b:free"
      };

      const openrouterModel = modelMap[selectedModelKey] || modelMap.gemini;

      // Prepare enhanced context for the AI
      const detectedUserLevel = detectUserLevel(userMessage);
      const { tools: relatedTools, guides, examples } = findRelatedContent(userMessage, tools);
      
      // Enhance the system prompt with context about available tools
      const enhancedSystemPrompt = `${systemPrompt}

Context about the user's question:
- User's experience level: ${detectedUserLevel}
- Related tools from our catalog: ${relatedTools.length > 0 
    ? relatedTools.map(t => `${t.name} - ${t.description}`).join('; ') 
    : 'None found'}
- Related guides: ${guides.length > 0 
    ? guides.map(g => g.replace('.md', '')).join(', ') 
    : 'None found'}
- Related examples: ${examples.length > 0 
    ? examples.map(e => e.replace('.md', '')).join(', ') 
    : 'None found'}

If the user is asking about specific tools, guides, or examples mentioned above, provide detailed information about them and their appropriate use cases. Always be helpful and encourage exploration of these resources.`;

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
                { role: "user", content: `Question: ${userMessage}

Please provide a detailed, helpful response that addresses the question and mentions relevant tools, guides, or examples from the context provided in the system message if they're applicable. Make sure your response feels natural and conversational. If you're suggesting tools, explain why they might be good choices for this specific scenario.` }
              ],
              temperature: 0.7, // Increased temperature for more creative and natural responses
              max_tokens: 1200, // Increased token limit for more detailed responses
              top_p: 0.9, // Add top_p for more diverse responses
            }),
          })
        : await (async () => {
            try {
              const { data, error } = await supabase.functions.invoke("chat-with-tool", {
                body: { 
                  message: `Question: ${userMessage}

Please provide a detailed, helpful response that addresses the question and mentions relevant tools, guides, or examples from our catalog if they're applicable. Make sure your response feels natural and conversational. If you're suggesting tools, explain why they might be good choices for this specific scenario.

IMPORTANT: Use PLAIN TEXT ONLY - no markdown formatting of any kind. Never use ** for bold, * for italics, # for headers, or []() for links. Use simple quotes like "this" instead of markdown formatting.`,
                  toolsContext: `${toolsContext}

Context about the user's question:
- User's experience level: ${detectedUserLevel}
- Related tools from our catalog: ${relatedTools.length > 0 
    ? relatedTools.map(t => `${t.name} - ${t.description}`).join('; ') 
    : 'None found'}
- Related guides: ${guides.length > 0 
    ? guides.map(g => g.replace('.md', '')).join(', ') 
    : 'None found'}
- Related examples: ${examples.length > 0 
    ? examples.map(e => e.replace('.md', '')).join(', ') 
    : 'None found'}`,
                  modelPreference: selectedModelKey, 
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
                      "Authorization": "Bearer " + process.env.VITE_OPEN_ROUTER_API,
                      "Content-Type": "application/json",
                      "HTTP-Referer": "https://builderlab.programmify.org",
                      "X-Title": "Builders Lab by Programmify",
                    },
                    body: JSON.stringify({
                      model: "google/gemini-2.0-flash-exp:free",
                      messages: [
                        { role: "system", content: enhancedSystemPrompt },
                        { role: "user", content: `Question: ${userMessage}

Please provide a detailed, helpful response that addresses the question and mentions relevant tools, guides, or examples from the context provided in the system message if they're applicable. Make sure your response feels natural and conversational. If you're suggesting tools, explain why they might be good choices for this specific scenario.

IMPORTANT: Use PLAIN TEXT ONLY - no markdown formatting of any kind. Never use ** for bold, * for italics, # for headers, or []() for links. Use simple quotes like "this" instead of markdown formatting.` }
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
      
      // Post-process the response to remove any markdown formatting that slipped through
      reply = reply
        // Remove bold formatting **text**
        .replace(/\*\*(.*?)\*\*/g, '"$1"')
        // Remove italic formatting *text* or _text_
        .replace(/\*(.*?)\*/g, '"$1"')
        .replace(/_(.*?)_/g, '"$1"')
        // Remove headers #, ##, etc.
        .replace(/^#+\s*(.*?)$/gm, '$1')
        // Remove code blocks with ```language and ```
        .replace(/```[\s\S]*?```/g, match => {
          // Extract just the code inside the blocks and indent it
          const code = match.replace(/```[\s\S]*?\n|```/g, '');
          return code.split('\n').map(line => line ? `    ${line}` : '').join('\n');
        })
        // Remove inline code with `code`
        .replace(/`(.*?)`/g, '"$1"')
        // Remove links [text](url) but keep the text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '"$1"')
        // Remove image syntax ![alt](url) but keep alt text
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '"$1"')
        // Remove horizontal rules
        .replace(/^\s*[-*_]{3,}\s*$/gm, '')
        // Clean up extra whitespace that might result from markdown removal
        .replace(/\n\s*\n\s*\n/g, '\n\n');

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: reply,
        model: selectedModelKey
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
            setSelectedModel("auto");
            
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
            errorMessage = "The AI model is temporarily unavailable. Try switching to a different model (like 'Auto' or 'Gemini') or try again later.";
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
                          className={`h-6 w-6 hover:bg-white/10 shrink-0 ${
                            !userApiKey.trim() 
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
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-accent-secondary text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.context && (
                        <div className="mt-2 text-xs space-y-1">
                          {message.context.relatedTools?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Settings className="h-3 w-3" />
                              <span>Related Tools: {message.context.relatedTools.map(t => t.name).join(", ")}</span>
                            </div>
                          )}
                          {message.context.relatedGuides?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              <span>Related Guides: {message.context.relatedGuides.join(", ")}</span>
                            </div>
                          )}
                          {message.context.relatedExamples?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <FileCode className="h-3 w-3" />
                              <span>Examples: {message.context.relatedExamples.join(", ")}</span>
                            </div>
                          )}
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