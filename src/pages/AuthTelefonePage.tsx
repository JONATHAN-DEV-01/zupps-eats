import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import foodImage from "@/assets/food-auth-telefone.jpg";

const AuthTelefonePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    const telefone = sessionStorage.getItem("register_telefone");
    if (!telefone) {
      toast({ title: "Erro", description: "Telefone não encontrado. Volte para a tela anterior.", variant: "destructive" });
      navigate("/telefone-cadastro-cliente");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchApi("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ telefone, codigo: code }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.proxima_etapa === "DATA") navigate("/cadastro-cliente");
        else if (data.proxima_etapa === "ADDRESS") navigate("/cadastro-endereco-cliente");
        else navigate("/cadastro-cliente");
      } else {
        toast({ title: "Erro", description: data.message || data.error || "Código inválido.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro de conexão", description: "Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 5000.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      backgroundImage={foodImage}
      panelTitle="Verifique seu telefone"
      panelSubtitle="Enviamos um código SMS/WhatsApp para o seu número."
    >
      <h1 className="text-2xl font-extrabold text-foreground mb-2">
        Código SMS
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Digite o código enviado
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="000000"
            aria-label="Código SMS"
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={loading}
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all tracking-[0.3em] text-center disabled:opacity-50"
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

export default AuthTelefonePage;
