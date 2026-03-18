import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import foodImage from "@/assets/food-telefone.jpg";

const TelefonePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefone) return;

    const userId = sessionStorage.getItem("register_usuario_id");
    if (!userId) {
      toast({ title: "Erro", description: "Sessão expirada. Volte e preencha seu e-mail novamente.", variant: "destructive" });
      navigate("/email-cadastro-cliente");
      return;
    }

    setLoading(true);
    try {
      const cleanTelefone = telefone.replace(/\D/g, "");
      const response = await fetch(`${API_BASE_URL}/auth/register/phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, telefone: cleanTelefone }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("register_telefone", cleanTelefone);
        navigate("/auth-cadastro-telefone-cliente");
      } else {
        toast({ title: "Erro", description: data.message || data.error || "Erro ao registrar telefone.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro de conexão", description: "Não foi possível conectar ao servidor.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      backgroundImage={foodImage}
      panelTitle="Quase lá!"
      panelSubtitle="Precisamos do seu telefone para garantir a segurança da sua conta."
    >
      <h1 className="text-2xl font-extrabold text-foreground mb-2">
        Informe seu telefone
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Enviaremos um código por SMS / WhatsApp
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="tel"
            placeholder="(00) 00000-0000"
            aria-label="Telefone"
            required
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            disabled={loading}
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : (<>Avançar <ArrowRight size={16} /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default TelefonePage;
