
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/programmify/builder-lab/main/guides/";

export const GuideView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scroll, setScroll] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${GITHUB_RAW_BASE}${slug}.md`)
      .then(res => {
        if (!res.ok) throw new Error("Guide not found");
        return res.text();
      })
      .then(setContent)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScroll(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-50">
        <div style={{ width: `${scroll}%` }} className="h-full bg-accent-secondary transition-all duration-75" />
      </div>
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl px-4 py-8 mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-accent-secondary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mt-12" />
          ) : error ? (
            <Alert variant="destructive" className="mt-12">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div ref={contentRef} className="prose prose-invert mx-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};
