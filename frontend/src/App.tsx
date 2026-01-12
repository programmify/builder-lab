import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Guides from "./pages/Guides";
import { ChatInterface } from "@/components/ChatInterface";
import ExampleProjects from "./pages/ExampleProjects";
import NotFound from "./pages/NotFound";
import { GuideView } from "./pages/GuideView";
import { ExampleView } from "./pages/ExampleView";
import { Analytics } from '@vercel/analytics/react';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="dark">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/guides/:slug" element={<GuideView />} />
            <Route path="/examples" element={<ExampleProjects />} />
            <Route path="/examples/:slug" element={<ExampleView />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Analytics />
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
