import { Mail, Phone, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import foodImage from "@/assets/food-login-cliente.jpg";

const LoginClientePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState<"email" | "sms" | null>(null);

  const handleEmailLogin = async () => {
    if (!email) return;
    setLoading("email");
    try {
      const response = await fetchApi("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        sessionStorage.setItem("login_email", email);
        sessionStorage.setItem("login_method", "email");
        navigate("/auth-login-cliente");
      } else {
        toast({ title: "Erro", description: data.message || data.error || "Erro ao enviar código.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Não foi possível conectar ao servidor.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleSmsLogin = async () => {
    if (!telefone) return;
    setLoading("sms");
    try {
      const cleanTelefone = telefone.replace(/\D/g, "");
      const response = await fetchApi("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ telefone: cleanTelefone }),
      });
      const data = await response.json();
      if (response.ok) {
        sessionStorage.setItem("login_telefone", cleanTelefone);
        sessionStorage.setItem("login_method", "sms");
        navigate("/auth-login-cliente");
      } else {
        toast({ title: "Erro", description: data.message || data.error || "Erro ao enviar código.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Não foi possível conectar ao servidor.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <AuthLayout
      backgroundImage={foodImage}
      panelTitle="Bem-vindo de volta!"
      panelSubtitle="Entre na sua conta para pedir suas refeições favoritas."
    >
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Login do Cliente</h1>
      <p className="text-muted-foreground text-sm mb-8">Informe seu e-mail ou telefone para receber um código de acesso</p>

      <div className="space-y-4">
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            placeholder="Endereço de e-mail"
            aria-label="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading !== null}
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
          />
        </div>

        <button
          type="button"
          disabled={!email || loading !== null}
          onClick={handleEmailLogin}
          className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading === "email" ? <Loader2 size={16} className="animate-spin" /> : (<>Receber código por e-mail <ArrowRight size={16} /></>)}
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="relative">
          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="tel"
            placeholder="(00) 00000-0000"
            aria-label="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            disabled={loading !== null}
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
          />
        </div>

        <button
          type="button"
          disabled={!telefone || loading !== null}
          onClick={handleSmsLogin}
          className="w-full h-13 rounded-xl bg-card border border-border text-foreground font-bold text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading === "sms" ? <Loader2 size={16} className="animate-spin" /> : (<>Receber código por SMS <ArrowRight size={16} /></>)}
        </button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Não tem uma conta?{" "}
          <Link to="/email-cadastro-cliente" className="text-primary font-semibold hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginClientePage;
