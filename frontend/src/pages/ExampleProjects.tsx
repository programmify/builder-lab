import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Loader2, FolderCode, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from "react-markdown";

interface Example {
  name: string;
  content: string;
  path: string;
}

const ExampleProjects = () => {
  const [examples, setExamples] = useState<Example[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExamples = async () => {
      try {
        // For now, we'll show a placeholder. In production, you'd fetch from GitHub API
        // to list all .md files in the examples folder
        setExamples([
          {
            name: "Example Projects",
            content: "# Example Projects\n\nExplore real-world projects built with the tools in this toolkit!\n\nThis section will contain example projects from the repository's `examples` folder.",
            path: "example-projects.md"
          }
        ]);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load examples");
        setIsLoading(false);
      }
    };

    fetchExamples();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <FolderCode className="w-8 h-8 text-accent-secondary" />
            <div>
              <h1 className="text-3xl font-bold">Example Projects</h1>
              <p className="text-muted-foreground">Explore projects built by the community</p>
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
              {examples.map((example) => (
                <Card key={example.path} className="p-6 gradient-card">
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{example.content}</ReactMarkdown>
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

export default ExampleProjects;
