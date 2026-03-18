import { Building, CreditCard, MapPin, Phone, FileText, UtensilsCrossed, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import foodImage from "@/assets/food-cadastro-restaurante.jpg";

const categorias = [
  "Brasileira", "Italiana", "Japonesa", "Mexicana", "Hamburgueria",
  "Pizzaria", "Árabe", "Chinesa", "Doces & Sobremesas", "Saudável", "Outra"
];

const CadastroDadosRestaurantePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFantasia || !razaoSocial || !cnpj || !endereco || !telefone || !categoria) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/restaurant/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_fantasia: nomeFantasia,
          razao_social: razaoSocial,
          cnpj: cnpj.replace(/\D/g, ""),
          endereco,
          telefone: telefone.replace(/\D/g, ""),
          descricao,
          categoria,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        sessionStorage.setItem("restaurant_id", data.restaurant_id || "");
        navigate("/cadastro-logo-restaurante");
      } else {
        toast({ title: "Erro", description: data.message || data.error || "Erro ao cadastrar restaurante.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Não foi possível conectar ao servidor.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50";

  return (
    <AuthLayout
      backgroundImage={foodImage}
      panelTitle="Cadastre seu restaurante"
      panelSubtitle="Preencha os dados do seu estabelecimento para começar a vender no Zupps."
    >
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Dados do Restaurante</h1>
      <p className="text-muted-foreground text-sm mb-6">Preencha as informações do seu estabelecimento</p>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="relative">
          <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Nome Fantasia *" aria-label="Nome Fantasia" required value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} disabled={loading} className={inputClass} />
        </div>
        <div className="relative">
          <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Razão Social *" aria-label="Razão Social" required value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} disabled={loading} className={inputClass} />
        </div>
        <div className="relative">
          <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="CNPJ *" aria-label="CNPJ" required value={cnpj} onChange={(e) => setCnpj(formatCnpj(e.target.value))} disabled={loading} className={inputClass} />
        </div>
        <div className="relative">
          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Endereço completo *" aria-label="Endereço" required value={endereco} onChange={(e) => setEndereco(e.target.value)} disabled={loading} className={inputClass} />
        </div>
        <div className="relative">
          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="tel" placeholder="Telefone *" aria-label="Telefone" required value={telefone} onChange={(e) => setTelefone(e.target.value)} disabled={loading} className={inputClass} />
        </div>
        <div className="relative">
          <FileText size={16} className="absolute left-4 top-3.5 text-muted-foreground" />
          <textarea placeholder="Descrição do restaurante" aria-label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} disabled={loading} rows={3} className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50 resize-none" />
        </div>
        <div className="relative">
          <UtensilsCrossed size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <select required value={categoria} onChange={(e) => setCategoria(e.target.value)} disabled={loading} className={`${inputClass} appearance-none`} aria-label="Categoria">
            <option value="" disabled>Categoria de Culinária *</option>
            {categorias.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
          </select>
        </div>

        <button type="submit" disabled={loading} className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <Loader2 size={16} className="animate-spin" /> : (<>Avançar <ArrowRight size={16} /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default CadastroDadosRestaurantePage;
