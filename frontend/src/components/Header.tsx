import { Github, BookOpen, FolderCode, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import iconImage from "@/assets/icon.png";

export const Header = () => {
  const [starCount, setStarCount] = useState<number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch('https://api.github.com/repos/programmify/builder-lab')
      .then(res => res.json())
      .then(data => setStarCount(data.stargazers_count))
      .catch(() => setStarCount(null));
  }, []);

  return (
    <motion.header 
      className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
              <img src={iconImage} alt="Programmify" className="w-8 h-8" />
            </div>
            <div>
            <span className="text-xl font-semibold" style={{ color: '#ffffff' }}>Builder Lab</span>
            <p className="text-sm text-muted-foreground hidden sm:block">
                Build with the best free AI and open source tools
              </p>
            </div>
          
          
            <div>
            
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 hover:bg-accent-secondary/10 hover:text-accent-secondary transition-all duration-300"
              asChild
            >
              <Link to="/guides">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Guides</span>
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 hover:bg-accent-secondary/10 hover:text-accent-secondary transition-all duration-300"
              asChild
            >
              <Link to="/examples">
                <FolderCode className="w-4 h-4" />
                <span className="hidden sm:inline">Examples</span>
              </Link>
            </Button>
            
            <Button 
              variant="default" 
              className="gap-2"
              asChild
            >
              <a 
                href="https://github.com/programmify/builder-lab" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {isMobile ? (
                  <Github className="w-4 h-4" />
                ) : (
                  <>
                    <Star className="w-4 h-4" fill="currentColor" />
                    <span>Star on GitHub</span>
                    {starCount !== null && (
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                        {starCount}
                      </span>
                    )}
                  </>
                )}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
