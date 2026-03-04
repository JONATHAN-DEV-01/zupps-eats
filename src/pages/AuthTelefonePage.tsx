import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

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
      toast({
        title: "Erro",
        description: "Telefone não encontrado. Volte para a tela anterior.",
        variant: "destructive",
      });
      navigate("/telefone");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone, codigo: code }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.proxima_etapa === "DATA") {
          navigate("/cadastro");
        } else if (data.proxima_etapa === "ADDRESS") {
          navigate("/endereco");
        } else {
          navigate("/cadastro"); // fallback para os dados pessoais
        }
      } else {
        toast({
          title: "Erro",
          description: data.message || data.error || "Código inválido.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary-foreground"
              style={{
                width: `${60 + i * 40}px`,
                height: `${60 + i * 40}px`,
                top: `${10 + i * 15}%`,
                left: `${5 + i * 12}%`,
                opacity: 0.15 - i * 0.02,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-primary-foreground text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl font-extrabold">Z</span>
          </div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            Verifique seu telefone
          </h2>
          <p className="text-lg opacity-80">
            Enviamos um código SMS/WhatsApp para o seu número.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-extrabold text-lg">Z</span>
            </div>
            <span className="font-extrabold text-xl text-foreground">Zupps</span>
          </Link>

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
        </motion.div>
      </div>
    </div>
  );
};

export default AuthTelefonePage;
