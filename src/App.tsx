import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import EmailPage from "./pages/EmailPage";
import AuthEmailPage from "./pages/AuthEmailPage";
import TelefonePage from "./pages/TelefonePage";
import AuthTelefonePage from "./pages/AuthTelefonePage";
import CadastroPage from "./pages/CadastroPage";
import EnderecoPage from "./pages/EnderecoPage";
import LoginClientePage from "./pages/LoginClientePage";
import AuthLoginClientePage from "./pages/AuthLoginClientePage";
import LoginRestaurantePage from "./pages/LoginRestaurantePage";
import AuthLoginRestaurantePage from "./pages/AuthLoginRestaurantePage";
import CadastroDadosRestaurantePage from "./pages/CadastroDadosRestaurantePage";
import CadastroLogoRestaurantePage from "./pages/CadastroLogoRestaurantePage";
import CadastroHorarioRestaurantePage from "./pages/CadastroHorarioRestaurantePage";
import GerenciaRestaurantePage from "./pages/GerenciaRestaurantePage";
import GerenciaCardapioPage from "./pages/GerenciaCardapioPage";
import CriarProdutoPage from "./pages/CriarProdutoPage";
import AdicionaisProdutoPage from "./pages/AdicionaisProdutoPage";
import ClienteHomePage from "./pages/ClienteHomePage";
import ClientePerfilPage from "./pages/ClientePerfilPage";
import ClienteRestaurantePage from "./pages/ClienteRestaurantePage";
import RestauranteHomePage from "./pages/RestauranteHomePage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Index />} />

          {/* Customer Registration */}
          <Route path="/email-cadastro-cliente" element={<EmailPage />} />
          <Route path="/auth-cadastro-cliente" element={<AuthEmailPage />} />
          <Route path="/telefone-cadastro-cliente" element={<TelefonePage />} />
          <Route path="/auth-cadastro-telefone-cliente" element={<AuthTelefonePage />} />
          <Route path="/cadastro-cliente" element={<CadastroPage />} />
          <Route path="/cadastro-endereco-cliente" element={<EnderecoPage />} />

          {/* Customer Login & Dashboard */}
          <Route path="/login-cliente" element={<LoginClientePage />} />
          <Route path="/auth-login-cliente" element={<AuthLoginClientePage />} />
          <Route path="/auth-login-cliente/:token" element={<AuthLoginClientePage />} />
          <Route path="/cliente-home" element={<ClienteHomePage />} />
          <Route path="/cliente-perfil" element={<ClientePerfilPage />} />
          <Route path="/restaurante/:id" element={<ClienteRestaurantePage />} />

          {/* Restaurant Login */}
          <Route path="/login-restaurante" element={<LoginRestaurantePage />} />
          <Route path="/auth-login-restaurante" element={<AuthLoginRestaurantePage />} />

          {/* Restaurant Onboarding */}
          <Route path="/cadastro-dados-restaurante" element={<CadastroDadosRestaurantePage />} />
          <Route path="/cadastro-logo-restaurante" element={<CadastroLogoRestaurantePage />} />
          <Route path="/cadastro-horario-restaurante" element={<CadastroHorarioRestaurantePage />} />

          {/* Restaurant Home & Management */}
          <Route path="/restaurante-home" element={<RestauranteHomePage />} />
          <Route path="/gerencia-restaurante" element={<GerenciaRestaurantePage />} />
          <Route path="/gerencia-cardapio" element={<GerenciaCardapioPage />} />
          <Route path="/criar-produto" element={<CriarProdutoPage />} />
          <Route path="/editar-produto/:id" element={<CriarProdutoPage />} />
          <Route path="/adicionais-produto/:id" element={<AdicionaisProdutoPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
