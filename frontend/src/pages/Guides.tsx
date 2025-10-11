
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Loader2, BookOpen, AlertCircle, FileText, Search, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const GUIDE_FILES = [
  "accept-payments-with-paystack.md",
  "ai-integration-guide.md",
  "connect-supabase-vercel.md",
  "get-started.md",
  "getting-started.md",
  "run-llm-locally.md",
  "track-users-privately.md"
];

const GUIDE_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "ai", label: "AI & Machine Learning" },
  { value: "payments", label: "Payments" },
  { value: "deployment", label: "Deployment" },
  { value: "getting-started", label: "Getting Started" },
  { value: "privacy", label: "Privacy & Security" }
];

const GUIDE_TAGS = [
  "AI", "Payments", "Supabase", "Vercel", "Paystack", "OpenAI", "Groq", "Hugging Face", 
  "Replicate", "Ollama", "Local LLM", "Authentication", "Database", "Deployment", 
  "Privacy", "Security", "Getting Started", "Tutorial", "Integration"
];

interface GuideMetadata {
  title: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  techStack: string[];
}

const Guides = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guideTitles, setGuideTitles] = useState<Record<string, string>>({});
  const [guideMetadata, setGuideMetadata] = useState<Record<string, GuideMetadata>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  // Define metadata for each guide
  const guideData: Record<string, GuideMetadata> = {
    "accept-payments-with-paystack.md": {
      title: "Accept Payments with Paystack",
      description: "Learn how to integrate Paystack payment gateway into your web application with step-by-step instructions for accepting payments online.",
      category: "payments",
      tags: ["Payments", "Paystack", "Integration", "Tutorial"],
      difficulty: "intermediate",
      estimatedTime: "30-45 minutes",
      techStack: ["Paystack", "JavaScript", "Web Integration"]
    },
    "ai-integration-guide.md": {
      title: "AI Integration Guide",
      description: "Comprehensive guide to integrating various AI services including OpenAI, Groq, Hugging Face, and Replicate into your applications.",
      category: "ai",
      tags: ["AI", "OpenAI", "Groq", "Hugging Face", "Replicate", "Integration"],
      difficulty: "advanced",
      estimatedTime: "1-2 hours",
      techStack: ["OpenAI", "Groq", "Hugging Face", "Replicate", "TypeScript"]
    },
    "connect-supabase-vercel.md": {
      title: "Connect Supabase and Vercel",
      description: "Quick guide to connecting your Supabase database with Vercel deployment for seamless full-stack development.",
      category: "deployment",
      tags: ["Supabase", "Vercel", "Deployment", "Database"],
      difficulty: "beginner",
      estimatedTime: "15-20 minutes",
      techStack: ["Supabase", "Vercel", "Environment Variables"]
    },
    "get-started.md": {
      title: "Getting Started with AI Tools",
      description: "Quick start guide for interns and developers to choose the right AI tool and begin building with the toolkit.",
      category: "getting-started",
      tags: ["Getting Started", "Tutorial", "AI Tools", "Quick Start"],
      difficulty: "beginner",
      estimatedTime: "10-15 minutes",
      techStack: ["Multiple", "Documentation"]
    },
    "getting-started.md": {
      title: "Getting Started",
      description: "Basic getting started guide for new developers to understand the project structure and begin development.",
      category: "getting-started",
      tags: ["Getting Started", "Tutorial", "Documentation"],
      difficulty: "beginner",
      estimatedTime: "10-15 minutes",
      techStack: ["Documentation", "Project Setup"]
    },
    "run-llm-locally.md": {
      title: "Run LLMs Locally (Ollama)",
      description: "Learn how to run large language models locally using Ollama for privacy-focused AI applications.",
      category: "ai",
      tags: ["AI", "Ollama", "Local LLM", "Privacy"],
      difficulty: "intermediate",
      estimatedTime: "20-30 minutes",
      techStack: ["Ollama", "Local Models", "Privacy"]
    },
    "track-users-privately.md": {
      title: "Track Users Privately",
      description: "Guide to implementing privacy-focused user tracking and analytics without compromising user data.",
      category: "privacy",
      tags: ["Privacy", "Analytics", "User Tracking", "Security"],
      difficulty: "intermediate",
      estimatedTime: "30-45 minutes",
      techStack: ["Analytics", "Privacy", "Data Protection"]
    }
  };

  useEffect(() => {
    setGuideMetadata(guideData);
    
    // Fetch titles from GitHub for fallback
    const fetchTitles = async () => {
      const titles: Record<string, string> = {};
      await Promise.all(GUIDE_FILES.map(async (file) => {
        try {
          const res = await fetch(`https://raw.githubusercontent.com/programmify/builder-lab/main/guides/${file}`);
          if (res.ok) {
            const text = await res.text();
            const match = text.match(/^#\s+(.*)/m);
            titles[file] = match ? match[1] : guideData[file]?.title || file.replace(/\.md$/, "");
          } else {
            titles[file] = guideData[file]?.title || file.replace(/\.md$/, "");
          }
        } catch {
          titles[file] = guideData[file]?.title || file.replace(/\.md$/, "");
        }
      }));
      setGuideTitles(titles);
    };
    fetchTitles();
  }, []);

  // Filter guides based on search and filters
  const filteredGuides = GUIDE_FILES.filter((file) => {
    const metadata = guideMetadata[file];
    if (!metadata) return true;

    const matchesSearch = searchTerm === "" || 
      metadata.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      metadata.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      metadata.techStack.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || metadata.category === selectedCategory;
    const matchesTag = selectedTag === "all" || metadata.tags.includes(selectedTag);
    const matchesDifficulty = selectedDifficulty === "all" || metadata.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesTag && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-8 h-8 text-accent-secondary" />
            <div>
              <h1 className="text-3xl font-bold">Guides</h1>
              <p className="text-muted-foreground">Learn how to build with AI tools and modern web technologies</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search guides by title, description, or tech stack..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {GUIDE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Technology" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technologies</SelectItem>
                  {GUIDE_TAGS.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {filteredGuides.length} of {GUIDE_FILES.length} guides
            </p>
          </div>

          {/* Guides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((file) => {
              const slug = file.replace(/\.md$/, "");
              const metadata = guideMetadata[file];
              const title = guideTitles[file] || metadata?.title || slug;
              
              return (
                <Link to={`/guides/${slug}`} key={file} className="block">
                  <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                    <Card className="p-6 h-full flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <FileText className="w-6 h-6 text-accent-secondary flex-shrink-0 mt-1" />
                        <Badge className={getDifficultyColor(metadata?.difficulty || 'beginner')}>
                          {metadata?.difficulty || 'beginner'}
                        </Badge>
                      </div>
                      
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold mb-2 line-clamp-2">{title}</h2>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {metadata?.description || "Step-by-step guide to help you learn and implement new technologies."}
                        </p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{metadata?.estimatedTime || "15-30 minutes"}</span>
                          </div>
                          
                          {metadata?.techStack && (
                            <div className="flex flex-wrap gap-1">
                              {metadata.techStack.slice(0, 3).map((tech) => (
                                <Badge key={tech} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                              {metadata.techStack.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{metadata.techStack.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{file}</span>
                          <span className="text-accent-secondary">Read Guide →</span>
                        </div>
                      </div>
                    </Card>
                  </Card>
                </Link>
              );
            })}
          </div>

          {filteredGuides.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No guides found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Guides;
