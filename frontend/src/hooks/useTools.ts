import { useQuery } from "@tanstack/react-query";
import { Tool } from "@/types/tool";

// Import all JSON files from the data directory
const toolModules = import.meta.glob('../../../data/*.json', { eager: true });

export const useTools = () => {
  return useQuery<Tool[]>({
    queryKey: ["tools"],
    queryFn: async () => {
      const allTools: Tool[] = [];

      Object.values(toolModules).forEach((module: any) => {
        // Handle both default export and direct array content
        const data = module.default || module;
        const tools = data.tools || data;

        if (Array.isArray(tools)) {
          allTools.push(...tools);
        }
      });

      return allTools;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};
