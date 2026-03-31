import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, setAuthToken, setUserProfile } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import foodImage from "@/assets/food-login-restaurante.jpg";

const AuthLoginRestaurantePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    const email = sessionStorage.getItem("restaurant_login_email");
    if (!email) {
      toast({ title: "Erro", description: "Sessão expirada. Faça login novamente.", variant: "destructive" });
      navigate("/login-restaurante");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/restaurant/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo: code }),
      });
      const data = await response.json();
      if (response.ok) {
        sessionStorage.removeItem("restaurant_login_email");
        if (data.token) setAuthToken(data.token);
        
        const userData = data.restaurante || data.user;
        if (userData) {
          setUserProfile(userData);
        }
        
        toast({ title: "Login realizado", description: `Bem-vindo, ${userData?.nome_fantasia || userData?.nome || "Restaurante"}!` });
        navigate("/restaurante-home");
      } else {
        toast({ title: "Erro", description: data.message || data.error || "Código inválido.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Não foi possível conectar ao servidor.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      backgroundImage={foodImage}
      panelTitle="Verifique sua identidade"
      panelSubtitle="Digite o código enviado para o e-mail do restaurante."
    >
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Código de verificação</h1>
      <p className="text-muted-foreground text-sm mb-8">Digite o código recebido por e-mail</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="000000" aria-label="Código de verificação" required maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} disabled={loading} className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all tracking-[0.3em] text-center disabled:opacity-50" />
        </div>

        <button type="submit" disabled={loading} className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <Loader2 size={16} className="animate-spin" /> : (<>Continuar <ArrowRight size={16} /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default AuthLoginRestaurantePage;
