import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Loader2, BookOpen, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from "react-markdown";

interface Guide {
  name: string;
  content: string;
  path: string;
}

const Guides = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        // For now, we'll show a placeholder. In production, you'd fetch from GitHub API
        // to list all .md files in the guides folder
        setGuides([
          {
            name: "Getting Started",
            content: "# Getting Started\n\nWelcome to the Builders Lab by Programmify guides!\n\nThis section will contain helpful guides from the repository's `guides` folder.",
            path: "getting-started.md"
          }
        ]);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load guides");
        setIsLoading(false);
      }
    };

    fetchGuides();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-8 h-8 text-accent-secondary" />
            <div>
              <h1 className="text-3xl font-bold">Guides</h1>
              <p className="text-muted-foreground">Learn how to build with AI tools</p>
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

          {!isLoading && !error && (
            <div className="space-y-6">
              {guides.map((guide) => (
                <Card key={guide.path} className="p-6 gradient-card">
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{guide.content}</ReactMarkdown>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Guides;
