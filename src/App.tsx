import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import EmailPage from "./pages/EmailPage";
import AuthEmailPage from "./pages/AuthEmailPage";
import TelefonePage from "./pages/TelefonePage";
import AuthTelefonePage from "./pages/AuthTelefonePage";
import CadastroPage from "./pages/CadastroPage";
import EnderecoPage from "./pages/EnderecoPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/email" element={<EmailPage />} />
          <Route path="/auth-email" element={<AuthEmailPage />} />
          <Route path="/telefone" element={<TelefonePage />} />
          <Route path="/auth-telefone" element={<AuthTelefonePage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/endereco" element={<EnderecoPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
