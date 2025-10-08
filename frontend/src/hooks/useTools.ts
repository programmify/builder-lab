import { useQuery } from "@tanstack/react-query";
import { Tool } from "@/types/tool";

const GITHUB_BASE_URL = "https://raw.githubusercontent.com/programmify/builder-lab/main/data/";

const DATA_FILES = [
  "ai_tools.json",
  "analytics.json",
  "articles_research.json",
  "automation.json",
  "backend_tools.json",
  "communication_email.json",
  "design_tools.json",
  "dev_tools.json",
  "frontend_frameworks.json",
  "frontend_tools.json",
  "hosting.json",
  "launch_community.json",
  "learning.json",
  "mobile_builders.json",
  "payments.json",
  "privacy.json",
  "productivity.json",
  "vibe_coding_tools.json"
];

export const useTools = () => {
  return useQuery<Tool[]>({
    queryKey: ["tools"],
    queryFn: async () => {
      const allTools: Tool[] = [];
      
      await Promise.all(
        DATA_FILES.map(async (file) => {
          try {
            const response = await fetch(`${GITHUB_BASE_URL}${file}`);
            if (response.ok) {
              const data = await response.json();
              const tools = data.tools || data;
              if (Array.isArray(tools)) {
                allTools.push(...tools);
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch ${file}:`, error);
          }
        })
      );
      
      return allTools;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};
