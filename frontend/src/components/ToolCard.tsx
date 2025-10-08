import { Tool } from "@/types/tool";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, BookOpen, Code2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface ToolCardProps {
  tool: Tool;
  index: number;
}

export const ToolCard = ({ tool, index }: ToolCardProps) => {
  const statusColors = {
    free: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    paid: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    freemium: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  };

  const getPreviewUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return null;
    }
  };

  const previewUrl = getPreviewUrl(tool.link);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className="group p-6 h-full flex flex-col gap-4 gradient-card shadow-soft hover:shadow-accent transition-all duration-300 border-border/50 hover:border-accent-secondary/50">
        <div className="flex items-start gap-4">
          {previewUrl && (
            <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0 overflow-hidden border border-border/30 group-hover:border-accent-secondary/50 transition-colors">
              <img 
                src={previewUrl} 
                alt={`${tool.name} icon`}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-semibold line-clamp-1 group-hover:text-accent-secondary transition-colors">{tool.name}</h3>
              {tool.popularity && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md flex-shrink-0">
                  <TrendingUp className="w-3 h-3" />
                  <span className="whitespace-nowrap">{tool.popularity}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {tool.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={statusColors[tool.status]}>
            {tool.status}
          </Badge>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            {tool.category}
          </Badge>
        </div>

        {tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tool.tags.slice(0, 4).map((tag) => (
              <span 
                key={tag} 
                className="text-xs px-2 py-1 rounded-md bg-muted/50 text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-border/50">
          <Button 
            size="sm" 
            className="gap-2 flex-1 lg:flex-none lg:max-w-[120px] bg-accent-secondary hover:bg-accent-secondary/80" 
            asChild
          >
            <a href={tool.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3" />
              Use
            </a>
          </Button>
          
          {tool.tutorial && (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 hover:bg-accent-secondary/10 hover:border-accent-secondary/50"
              asChild
            >
              <a href={tool.tutorial} target="_blank" rel="noopener noreferrer">
                <BookOpen className="w-3 h-3" />
                Tutorial
              </a>
            </Button>
          )}
          
          {tool.exampleProjectLink && (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 hover:bg-accent-secondary/10 hover:border-accent-secondary/50"
              asChild
            >
              <a href={tool.exampleProjectLink} target="_blank" rel="noopener noreferrer">
                <Code2 className="w-3 h-3" />
                Example
              </a>
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
