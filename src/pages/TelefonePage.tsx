import { motion } from "framer-motion";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

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
      toast({
        title: "Erro",
        description: "Sessão expirada. Volte e preencha seu e-mail novamente.",
        variant: "destructive",
      });
      navigate("/email");
      return;
    }

    setLoading(true);
    try {
      // Remover máscara para enviar apenas números, ou enviar como digitado se for numérico apenas
      // O regex deixa apenas os digitos
      const cleanTelefone = telefone.replace(/\D/g, "");

      const response = await fetch(`${API_BASE_URL}/auth/register/phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Enviando telefone limpo
        body: JSON.stringify({ user_id: userId, telefone: cleanTelefone }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("register_telefone", cleanTelefone);
        navigate("/auth-telefone");
      } else {
        toast({
          title: "Erro",
          description: data.message || data.error || "Erro ao registrar telefone.",
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
            Quase lá!
          </h2>
          <p className="text-lg opacity-80">
            Precisamos do seu telefone para garantir a segurança da sua conta.
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

export default TelefonePage;
