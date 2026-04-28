import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, fetchApi, setAuthToken, setUserProfile } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import foodImage from "@/assets/food-login-restaurante.jpg";

const LoginRestaurantePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetchApi("/auth/restaurant/request-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      
      if (response.ok) {
        sessionStorage.setItem("restaurant_login_email", email);
        toast({ title: "Verifique seu e-mail", description: data.message });
        navigate("/auth-login-restaurante");
      } else {
        toast({ title: "Erro", description: data.error || data.message || "Erro ao solicitar código.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao comunicar com o servidor.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      backgroundImage={foodImage}
      panelTitle="Área do Restaurante"
      panelSubtitle="Gerencie seu restaurante, cardápio e pedidos em um só lugar."
    >
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Login do Restaurante</h1>
      <p className="text-muted-foreground text-sm mb-8">Informe o e-mail do seu estabelecimento</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            placeholder="E-mail do restaurante"
            aria-label="E-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
          />
        </div>

        <button type="submit" disabled={loading} className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <Loader2 size={16} className="animate-spin" /> : (<>Receber código por e-mail <ArrowRight size={16} /></>)}
        </button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Não tem uma conta?{" "}
          <Link to="/cadastro-dados-restaurante" className="text-primary font-semibold hover:underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginRestaurantePage;
