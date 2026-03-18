import { MapPin, Home, Hash, Building, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import foodImage from "@/assets/food-endereco.jpg";

const EnderecoPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [semComplemento, setSemComplemento] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cep || !rua || !bairro || !numero) return;

    const userId = sessionStorage.getItem("register_usuario_id");
    if (!userId) {
      toast({ title: "Erro", description: "Sessão expirada. Volte para o início.", variant: "destructive" });
      navigate("/email-cadastro-cliente");
      return;
    }

    setLoading(true);
    try {
      const enderecoCompleto = `${rua}, ${numero} - ${bairro}, CEP: ${cep}${!semComplemento && complemento ? ' - ' + complemento : ''}`;
      const response = await fetch(`${API_BASE_URL}/auth/register/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, endereco: enderecoCompleto }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: "Cadastro concluído", description: "Bem-vindo ao Zupps!" });
        sessionStorage.clear();
        navigate("/home");
      } else {
        toast({ title: "Erro", description: data.message || data.error || "Erro ao salvar endereço.", variant: "destructive" });
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
      panelTitle="Onde você está?"
      panelSubtitle="Informe seu endereço para encontrarmos os melhores restaurantes perto de você."
    >
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Seu endereço</h1>
      <p className="text-muted-foreground text-sm mb-8">Última etapa! Informe seu endereço de entrega</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="CEP *" aria-label="CEP" required value={cep} onChange={(e) => setCep(e.target.value)} disabled={loading} className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50" />
        </div>
        <div className="relative">
          <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Nome da Rua *" aria-label="Nome da Rua" required value={rua} onChange={(e) => setRua(e.target.value)} disabled={loading} className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50" />
        </div>
        <div className="relative">
          <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Bairro *" aria-label="Bairro" required value={bairro} onChange={(e) => setBairro(e.target.value)} disabled={loading} className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50" />
        </div>
        <div className="relative">
          <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Número *" aria-label="Número" required value={numero} onChange={(e) => setNumero(e.target.value)} disabled={loading} className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50" />
        </div>

        <div>
          <div className="relative">
            <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Complemento"
              aria-label="Complemento"
              disabled={semComplemento || loading}
              value={semComplemento ? "" : complemento}
              onChange={(e) => setComplemento(e.target.value)}
              className={`w-full h-12 pl-11 pr-4 rounded-xl border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${semComplemento || loading ? "bg-muted cursor-not-allowed opacity-60" : "bg-card"}`}
            />
          </div>
          <label className="flex items-center gap-2 mt-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={semComplemento}
              disabled={loading}
              onChange={(e) => { setSemComplemento(e.target.checked); if (e.target.checked) setComplemento(""); }}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 accent-primary"
            />
            <span className="text-sm text-muted-foreground">Não há complemento</span>
          </label>
        </div>

        <button type="submit" disabled={loading} className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <Loader2 size={16} className="animate-spin" /> : (<>Finalizar <ArrowRight size={16} /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default EnderecoPage;
