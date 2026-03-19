import { User, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import foodImage from "@/assets/food-cadastro.jpg";

const CadastroPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !sobrenome) return;

    const userId = sessionStorage.getItem("register_usuario_id");
    if (!userId) {
      toast({ title: "Erro", description: "Sessão expirada. Volte para o início.", variant: "destructive" });
      navigate("/email-cadastro-cliente");
      return;
    }

    setLoading(true);
    try {
      const cleanCpf = cpf.replace(/\D/g, "");
      const response = await fetchApi("/auth/register/data", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, nome, sobrenome, cpf: cleanCpf }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/cadastro-endereco-cliente");
      } else {
        toast({ title: "Erro", description: data.message || data.error || "Erro ao salvar dados pessoais.", variant: "destructive" });
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
      panelTitle="Seus dados pessoais"
      panelSubtitle="Precisamos de algumas informações para completar seu cadastro."
    >
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Dados pessoais</h1>
      <p className="text-muted-foreground text-sm mb-8">Preencha seus dados para continuar</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Nome *" aria-label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} disabled={loading} className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50" />
        </div>
        <div className="relative">
          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Sobrenome *" aria-label="Sobrenome" required value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} disabled={loading} className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50" />
        </div>
        <div className="relative">
          <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="CPF (opcional)" aria-label="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} disabled={loading} className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50" />
        </div>

        <button type="submit" disabled={loading} className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <Loader2 size={16} className="animate-spin" /> : (<>Avançar <ArrowRight size={16} /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default CadastroPage;
