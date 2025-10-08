import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <motion.div 
      className="relative max-w-xl w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search tools by name or tag..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 h-12 shadow-soft border-border/50 focus:shadow-hover transition-all duration-300"
      />
    </motion.div>
  );
};
