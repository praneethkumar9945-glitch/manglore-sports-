import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "./components/layout/Layout.tsx";
import Index from "./pages/Index.tsx";
import BGMI from "./pages/BGMI.tsx";
import Marathon from "./pages/Marathon.tsx";
import Intercollege from "./pages/Intercollege.tsx";
import Contact from "./pages/Contact.tsx";
import Registration from "./pages/Registration.tsx";
import Collaboration from "./pages/Collaboration.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      < HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/bgmi" element={<BGMI />} />
            <Route path="/marathon" element={<Marathon />} />
            <Route path="/intercollege" element={<Intercollege />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/collaboration" element={<Collaboration />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
