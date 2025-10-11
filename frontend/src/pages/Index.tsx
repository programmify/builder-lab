import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ToolCard } from "@/components/ToolCard";
import { ChatInterface } from "@/components/ChatInterface";
import { useTools } from "@/hooks/useTools";
import { Category } from "@/types/tool";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  
  const { data: tools, isLoading, error } = useTools();

  const categories: Category[] = useMemo(() => {
    if (!tools) return ["All"];
    const uniqueCategories = Array.from(new Set(tools.map(tool => tool.category as Category)));
    return ["All", ...uniqueCategories.sort()];
  }, [tools]);

  const filteredTools = useMemo(() => {
    if (!tools) return [];
    
    return tools.filter(tool => {
      const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
      const matchesSearch = searchQuery === "" || 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [tools, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 lg:py-8">
        {/* Mobile Category Filter */}
        <div className="lg:hidden mb-6">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categories={categories}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                categories={categories}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-6 lg:space-y-8">
            {/* Search */}
            <div className="flex justify-center">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load tools. Please check your connection and try again.
                </AlertDescription>
              </Alert>
            )}

            {/* Results Count */}
            {!isLoading && !error && (
              <motion.div 
                className="flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-sm text-muted-foreground">
                  {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} found
                </p>
              </motion.div>
            )}

            {/* Tools Grid */}
            {!isLoading && !error && filteredTools.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {filteredTools.map((tool, index) => (
                  <ToolCard key={tool.id} tool={tool} index={index} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredTools.length === 0 && (
              <motion.div 
                className="text-center py-20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No tools found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built with 💙 by <a style={{ color: '#6cbcec' }} href="https://programmify.org">Programmify Team</a></p>
        </div>
      </footer>

      {tools && <ChatInterface tools={tools} />}
    </div>
  );
};

export default Index;
