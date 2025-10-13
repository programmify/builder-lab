
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Loader2, FolderCode, AlertCircle, FileText, Search, Filter, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const EXAMPLE_FILES = [
  "ai-chatbot-with-supabase.md",
  "analytics-dashboard.md",
  "file-uploader-app.md",
  "image-generator-app.md",
  "personal-dashboard.md",
  "sample-projects.md",
  "ecommerce-store.md",
  "social-media-app.md",
  "blog-platform.md"
];

const EXAMPLE_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "ai", label: "AI & Machine Learning" },
  { value: "analytics", label: "Analytics & Data" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "social", label: "Social Media" },
  { value: "content", label: "Content Management" },
  { value: "dashboard", label: "Dashboards" },
  { value: "storage", label: "File Storage" }
];

const EXAMPLE_TAGS = [
  "Next.js", "React", "Supabase", "Clerk", "Stripe", "PostHog", "OpenAI", "Replicate",
  "Tailwind CSS", "TypeScript", "Authentication", "Database", "Payments", "Analytics",
  "Real-time", "File Upload", "Image Generation", "Social Media", "Blog", "E-commerce"
];

interface ExampleMetadata {
  title: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  techStack: string[];
}

const ExampleProjects = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exampleTitles, setExampleTitles] = useState<Record<string, string>>({});
  const [exampleMetadata, setExampleMetadata] = useState<Record<string, ExampleMetadata>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  // Define metadata for each example
  const exampleData: Record<string, ExampleMetadata> = {
    "ai-chatbot-with-supabase.md": {
      title: "AI Chatbot with Supabase",
      description: "Build a full-stack AI chatbot with authentication, real-time chat, and message history using OpenAI and Supabase.",
      category: "ai",
      tags: ["Next.js", "Supabase", "OpenAI", "Authentication", "Real-time"],
      difficulty: "intermediate",
      estimatedTime: "2-3 hours",
      techStack: ["Next.js", "Supabase", "OpenAI", "Clerk", "Tailwind CSS"]
    },
    "analytics-dashboard.md": {
      title: "Analytics Dashboard",
      description: "Create a comprehensive analytics dashboard with real-time data, charts, and user insights using PostHog and Vercel Analytics.",
      category: "analytics",
      tags: ["Next.js", "PostHog", "Supabase", "Recharts", "Analytics"],
      difficulty: "advanced",
      estimatedTime: "4-5 hours",
      techStack: ["Next.js", "PostHog", "Supabase", "Recharts", "Clerk", "Stripe"]
    },
    "file-uploader-app.md": {
      title: "File Uploader App",
      description: "Build a modern file upload application with drag-and-drop, progress tracking, and cloud storage using UploadThing and EdgeStore.",
      category: "storage",
      tags: ["Next.js", "UploadThing", "Supabase", "File Upload", "Storage"],
      difficulty: "intermediate",
      estimatedTime: "2-3 hours",
      techStack: ["Next.js", "UploadThing", "Supabase", "Clerk", "Tailwind CSS"]
    },
    "image-generator-app.md": {
      title: "AI Image Generator App",
      description: "Create an AI image generation app with multiple AI providers, image gallery, and cloud storage using DALL-E and Replicate.",
      category: "ai",
      tags: ["Next.js", "OpenAI", "Replicate", "Supabase", "Image Generation"],
      difficulty: "intermediate",
      estimatedTime: "3-4 hours",
      techStack: ["Next.js", "OpenAI", "Replicate", "Supabase", "Clerk"]
    },
    "personal-dashboard.md": {
      title: "Personal Dashboard",
      description: "Build a comprehensive personal dashboard with analytics, notes, task management, and habit tracking using Supabase and PostHog.",
      category: "dashboard",
      tags: ["Next.js", "Supabase", "PostHog", "Dashboard", "Analytics"],
      difficulty: "advanced",
      estimatedTime: "4-6 hours",
      techStack: ["Next.js", "Supabase", "PostHog", "Recharts", "Tailwind CSS"]
    },
    "ecommerce-store.md": {
      title: "E-commerce Store",
      description: "Build a modern e-commerce store with product catalog, shopping cart, payments, and order management using Stripe and Supabase.",
      category: "ecommerce",
      tags: ["Next.js", "Stripe", "Supabase", "E-commerce", "Payments"],
      difficulty: "advanced",
      estimatedTime: "5-7 hours",
      techStack: ["Next.js", "Stripe", "Supabase", "Clerk", "Tailwind CSS"]
    },
    "social-media-app.md": {
      title: "Social Media App",
      description: "Build a modern social media platform with posts, comments, likes, follows, and real-time updates using Supabase Realtime.",
      category: "social",
      tags: ["Next.js", "Supabase", "Real-time", "Social Media", "Authentication"],
      difficulty: "advanced",
      estimatedTime: "6-8 hours",
      techStack: ["Next.js", "Supabase", "Clerk", "Tailwind CSS", "Real-time"]
    },
    "blog-platform.md": {
      title: "Blog Platform",
      description: "Build a modern blog platform with content management, SEO optimization, and reader engagement features using Next.js and Supabase.",
      category: "content",
      tags: ["Next.js", "Supabase", "Blog", "SEO", "Content Management"],
      difficulty: "intermediate",
      estimatedTime: "4-5 hours",
      techStack: ["Next.js", "Supabase", "Clerk", "Markdown", "SEO"]
    },
    "sample-projects.md": {
      title: "Sample Projects",
      description: "Quick overview of sample projects including AI chatbot, file uploader, and analytics dashboard implementations.",
      category: "all",
      tags: ["Overview", "Samples", "Quick Start"],
      difficulty: "beginner",
      estimatedTime: "30 minutes",
      techStack: ["Multiple"]
    }
  };

  useEffect(() => {
    setExampleMetadata(exampleData);
    
    // Fetch titles from GitHub for fallback
    const fetchTitles = async () => {
      const titles: Record<string, string> = {};
      await Promise.all(EXAMPLE_FILES.map(async (file) => {
        try {
          const res = await fetch(`https://raw.githubusercontent.com/programmify/builder-lab/main/examples/${file}`);
          if (res.ok) {
            const text = await res.text();
            const match = text.match(/^#\s+(.*)/m);
            titles[file] = match ? match[1] : exampleData[file]?.title || file.replace(/\.md$/, "");
          } else {
            titles[file] = exampleData[file]?.title || file.replace(/\.md$/, "");
          }
        } catch {
          titles[file] = exampleData[file]?.title || file.replace(/\.md$/, "");
        }
      }));
      setExampleTitles(titles);
    };
    fetchTitles();
  }, []);

  // Filter examples based on search and filters
  const filteredExamples = EXAMPLE_FILES.filter((file) => {
    const metadata = exampleMetadata[file];
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
            <FolderCode className="w-8 h-8 text-accent-secondary" />
            <div>
              <h1 className="text-3xl font-bold">Example Projects</h1>
              <p className="text-muted-foreground">Explore detailed project examples with step-by-step guides</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search examples by title, description, or tech stack..."
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
                  {EXAMPLE_CATEGORIES.map((category) => (
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
                  {EXAMPLE_TAGS.map((tag) => (
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
              Showing {filteredExamples.length} of {EXAMPLE_FILES.length} examples
            </p>
          </div>

          {/* Examples Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExamples.map((file) => {
              const slug = file.replace(/\.md$/, "");
              const metadata = exampleMetadata[file];
              const title = exampleTitles[file] || metadata?.title || slug;
              
              return (
                <Link to={`/examples/${slug}`} key={file} className="block">
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
                          {metadata?.description || "Detailed project example with step-by-step implementation guide."}
                        </p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{metadata?.estimatedTime || "2-3 hours"}</span>
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
                          <span className="text-accent-secondary">View Guide →</span>
                        </div>
                    </div>
                    </Card>
                  </Card>
                </Link>
              );
            })}
          </div>

          {filteredExamples.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No examples found</h3>
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

export default ExampleProjects;
