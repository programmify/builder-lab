
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Loader2, BookOpen, AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

const Guides = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guideTitles, setGuideTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    // Optionally, fetch the first heading from each guide for display
    const fetchTitles = async () => {
      const titles: Record<string, string> = {};
      await Promise.all(GUIDE_FILES.map(async (file) => {
        try {
          const res = await fetch(`/guides/${file}`);
          if (res.ok) {
            const text = await res.text();
            const match = text.match(/^#\s+(.*)/m);
            titles[file] = match ? match[1] : file.replace(/\.md$/, "");
          } else {
            titles[file] = file.replace(/\.md$/, "");
          }
        } catch {
          titles[file] = file.replace(/\.md$/, "");
        }
      }));
      setGuideTitles(titles);
    };
    fetchTitles();
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

          <div className="space-y-4">
            {GUIDE_FILES.map((file) => {
              const slug = file.replace(/\.md$/, "");
              return (
                <Link to={`/guides/${slug}`} key={file} className="block">
                  <Card className="p-4 flex items-center gap-4 hover:bg-accent-secondary/10 transition">
                    <FileText className="w-6 h-6 text-accent-secondary" />
                    <div>
                      <h2 className="text-lg font-semibold mb-1">{guideTitles[file] || slug}</h2>
                      <span className="text-xs text-muted-foreground">{file}</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Guides;
