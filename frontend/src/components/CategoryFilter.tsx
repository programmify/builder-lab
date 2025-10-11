import { Category } from "@/types/tool";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Code, 
  Server, 
  CreditCard, 
  BarChart3, 
  Database,
  Cloud,
  Palette,
  Grid3x3,
  Mail,
  Rocket,
  BookOpen,
  Smartphone,
  Shield,
  Zap,
  Layout,
  Package,
  Bot,
  TrendingUp,
  Settings,
  Globe,
  Users,
  GraduationCap,
  Smartphone as Mobile,
  Lock,
  Coffee,
  Video,
  Wrench
} from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
  categories: Category[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  'All': <Grid3x3 className="w-4 h-4" />,
  'AI & LLM APIs': <Bot className="w-4 h-4" />,
  'Analytics & Tracking': <TrendingUp className="w-4 h-4" />,
  'Articles & Research': <BookOpen className="w-4 h-4" />,
  'Automation': <Settings className="w-4 h-4" />,
  'Backend & Databases': <Database className="w-4 h-4" />,
  'Communication & Email': <Mail className="w-4 h-4" />,
  'Design, Video & Demo Creation': <Video className="w-4 h-4" />,
  'Developer Tools': <Package className="w-4 h-4" />,
  'Frontend Frameworks': <Layout className="w-4 h-4" />,
  'Frontend Tools': <Code className="w-4 h-4" />,
  'Hosting': <Globe className="w-4 h-4" />,
  'Launch & Community Platforms': <Users className="w-4 h-4" />,
  'Learning Resources': <GraduationCap className="w-4 h-4" />,
  'Mobile App Builders': <Mobile className="w-4 h-4" />,
  'Payments & Monetization': <CreditCard className="w-4 h-4" />,
  'Project Management & Productivity': <Zap className="w-4 h-4" />,
  'Security & Privacy': <Lock className="w-4 h-4" />,
  'Vibe Coding Tools': <Coffee className="w-4 h-4" />,
};

export const CategoryFilter = ({ selectedCategory, onSelectCategory, categories }: CategoryFilterProps) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div 
        className="hidden lg:block space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="font-semibold text-sm text-muted-foreground px-3 mb-4 sticky top-0 bg-background z-10">Categories</h3>
        <div className="space-y-1">
          {categories.map((category, index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 transition-all duration-200 ${
                  selectedCategory === category 
                    ? '!bg-[#344b9c] !text-white hover:!bg-[#6cbcec]' 
                    : 'hover:!bg-[#6cbcec] hover:!text-white'
                }`}
                onClick={() => onSelectCategory(category)}
              >
                {categoryIcons[category]}
                {category}
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Mobile Horizontal Scroll */}
      <motion.div 
        className="lg:hidden"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex gap-2 overflow-x-auto pb-4 px-1 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              size="sm"
              className={`shrink-0 gap-2 transition-all duration-200 ${
                selectedCategory === category 
                  ? '!bg-[#344b9c] !text-white hover:!bg-[#6cbcec] border border-[#344b9c]' 
                  : 'hover:!bg-[#6cbcec] hover:!text-white'
              }`}
              onClick={() => onSelectCategory(category)}
            >
              {categoryIcons[category]}
              {category}
            </Button>
          ))}
        </div>
      </motion.div>
    </>
  );
};
