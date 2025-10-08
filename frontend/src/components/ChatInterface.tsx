import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, X, Send, Loader2, Settings, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tool } from "@/types/tool";

interface Message {
  role: "user" | "assistant";
  content: string;
  model?: string;
}

interface ChatInterfaceProps {
  tools: Tool[];
}

const AVAILABLE_MODELS = {
  auto: "Auto",
  gemini: "Gemini",
  deepseek: "DeepSeek",
  gpt_oss: "GPT-OSS"
};

export const ChatInterface = ({ tools }: ChatInterfaceProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm here to help you find AI tools and resources. Ask me anything!" }
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
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    }
    setIsLoading(true);

    try {
      const toolsContext = tools.map(tool => 
        `${tool.name} (${tool.category}): ${tool.description}. Status: ${tool.status}. Link: ${tool.link}`
      ).join("\n");

  const systemPrompt = `You are the AI assistant for Builders Lab by Programmify.\n\nContext (tools database):\n${toolsContext}\n\nInstructions:\n- Answer based ONLY on the tools context when relevant.\n- Be concise and practical. Prefer bullet points and numbered steps.\n- Include links if available in the context. If a tool is missing, say so and suggest close alternatives.\n- Avoid speculation. If unsure, ask a brief clarifying question.`;

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
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
              ],
              temperature: 0.6,
              max_tokens: 800,
            }),
          })
        : await supabase.functions.invoke("chat-with-tool", {
            body: { message: userMessage, toolsContext, modelPreference: selectedModelKey, provider: "lovable" }
          }).then(({ data, error }) => {
            if (error) {
              return new Response(JSON.stringify({ error: error.message }), { status: 500 });
            }
            return new Response(JSON.stringify({ choices: [{ message: { content: data?.reply } }] }), { status: 200 });
          });

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
      const reply = data.choices[0].message.content;

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
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-50"
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
            className="fixed bottom-24 right-6 z-50 w-[380px] sm:w-[420px] max-h-[calc(100vh-8rem)]"
          >
            <Card className="flex flex-col h-[400px] max-h-[calc(100vh-8rem)] gradient-card border-accent-secondary/30 shadow-accent">
              <div className="p-3 border-b border-border/50 bg-accent-secondary">
                <div className="flex items-center justify-between whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-sm">AI Assistant</h3>
                    {!userApiKey.trim() && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="API key required" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!userApiKey.trim()}>
                      <SelectTrigger className="w-[80px] h-6 text-xs bg-white/10 border-white/20 text-white disabled:opacity-50 shrink-0">
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
                      <DialogContent className="sm:max-w-md">
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
                    placeholder={"Ask about tools..."}
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