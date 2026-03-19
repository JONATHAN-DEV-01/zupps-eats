import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import foodImage from "@/assets/food-email.jpg";

const EmailPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetchApi("/auth/register/start", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("register_usuario_id", data.user_id);
        sessionStorage.setItem("register_email", email);
        navigate("/auth-cadastro-cliente");
      } else {
        toast({
          title: "Erro",
          description: data.message || data.error || "Erro ao iniciar registro.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 5000.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      backgroundImage={foodImage}
      panelTitle="Sua comida favorita, entregue rápido."
      panelSubtitle="Junte-se a milhares de amantes da gastronomia que confiam no Zupps para refeições premium."
    >
      <h1 className="text-2xl font-extrabold text-foreground mb-2">
        Informe seu e-mail
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Enviaremos um código de verificação
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            placeholder="Endereço de e-mail"
            aria-label="E-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Avançar
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default EmailPage;
