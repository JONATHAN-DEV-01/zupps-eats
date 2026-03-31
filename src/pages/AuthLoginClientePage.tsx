import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchApi, setAuthToken, setUserProfile } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import foodImage from "@/assets/food-login-cliente.jpg";

const AuthLoginClientePage = () => {
  const navigate = useNavigate();
  const { token: urlToken } = useParams();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verifyLink = async () => {
      if (urlToken) {
        setLoading(true);
        try {
          const response = await fetchApi(`/auth/verify-link/${urlToken}`);
          const data = await response.json();
          if (response.ok) {
            handleLoginSuccess(data);
          } else {
            toast({ title: "Erro", description: "Link de acesso inválido ou expirado.", variant: "destructive" });
          }
        } catch {
          toast({ title: "Erro", description: "Falha na verificação do link.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      }
    };
    verifyLink();
  }, [urlToken]);

  const handleLoginSuccess = (data: any) => {
    if (data.token) setAuthToken(data.token);
    if (data.user) setUserProfile(data.user);
    toast({ title: "Login realizado", description: `Bem-vindo, ${data.user?.nome || "usuário"}!` });
    
    // Redirect based on profile
    if (data.user?.perfil === "RESTAURANTE") navigate("/restaurante-home");
    else navigate("/cliente-home");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    const method = sessionStorage.getItem("login_method");
    const email = sessionStorage.getItem("login_email");
    const telefone = sessionStorage.getItem("login_telefone");

    if (!method || (!email && !telefone)) {
      toast({ title: "Erro", description: "Sessão expirada. Faça login novamente.", variant: "destructive" });
      navigate("/login-cliente");
      return;
    }

    setLoading(true);
    try {
      const body = method === "email"
        ? { email, codigo: code }
        : { telefone, codigo: code };

      const response = await fetchApi("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.removeItem("login_method");
        sessionStorage.removeItem("login_email");
        sessionStorage.removeItem("login_telefone");
        handleLoginSuccess(data);
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
      panelSubtitle="Digite o código que enviamos para confirmar seu acesso."
    >
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Código de verificação</h1>
      <p className="text-muted-foreground text-sm mb-8">Digite o código recebido</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="000000"
            aria-label="Código de verificação"
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={loading}
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all tracking-[0.3em] text-center disabled:opacity-50"
          />
        </div>

        <button type="submit" disabled={loading} className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <Loader2 size={16} className="animate-spin" /> : (<>Continuar <ArrowRight size={16} /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default AuthLoginClientePage;
