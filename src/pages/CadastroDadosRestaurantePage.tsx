import { Building, CreditCard, MapPin, Phone, FileText, UtensilsCrossed, ArrowRight, Loader2, Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";
import { formatPhone } from "@/lib/utils";
import AuthLayout from "@/components/AuthLayout";
import foodImage from "@/assets/food-cadastro-restaurante.jpg";

const categorias = [
  "Brasileira", "Italiana", "Japonesa", "Mexicana", "Hamburgueria",
  "Pizzaria", "Árabe", "Chinesa", "Doces & Sobremesas", "Saudável", "Outra"
];

const CadastroDadosRestaurantePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const userProfile = localStorage.getItem("user_profile") ? JSON.parse(localStorage.getItem("user_profile")!) : null;
  const isEditing = Boolean(userProfile?.cnpj || userProfile?.perfil === "RESTAURANTE");

  const [email, setEmail] = useState(isEditing ? userProfile?.email || "" : "");
  const [nomeFantasia, setNomeFantasia] = useState(isEditing ? userProfile?.nome_fantasia || "" : "");
  const [razaoSocial, setRazaoSocial] = useState(isEditing ? userProfile?.razao_social || "" : "");
  const [cnpj, setCnpj] = useState(isEditing ? userProfile?.cnpj || "" : "");
  const [endereco, setEndereco] = useState(isEditing ? userProfile?.endereco || "" : "");
  const [telefone, setTelefone] = useState(isEditing ? userProfile?.telefone || "" : "");
  const [descricao, setDescricao] = useState(isEditing ? userProfile?.descricao || "" : "");
  const [categoria, setCategoria] = useState(isEditing ? userProfile?.categoria || "" : "");
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
    if (!email || !nomeFantasia || !razaoSocial || !cnpj || !endereco || !telefone || !categoria) return;

    // Save to session storage to be sent in the final step with the logo
    const restaurantData = {
      email,
      nome_fantasia: nomeFantasia,
      razao_social: razaoSocial,
      cnpj: cnpj.replace(/\D/g, ""),
      endereco,
      telefone: telefone.replace(/\D/g, ""),
      descricao,
      categoria,
    };
    
    sessionStorage.setItem("pending_restaurant_data", JSON.stringify(restaurantData));
    navigate("/cadastro-logo-restaurante");
  };

  const inputClass = "w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50";

  return (
    <AuthLayout
      backgroundImage={foodImage}
      panelTitle="Cadastre seu restaurante"
      panelSubtitle="Preencha os dados do seu estabelecimento para começar a vender no Zupps."
    >
      {isEditing && (
        <button type="button" onClick={() => navigate("/gerencia-restaurante")} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} />
          Voltar para o Gerenciamento
        </button>
      )}
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Dados do Restaurante</h1>
      <p className="text-muted-foreground text-sm mb-6">Preencha as informações do seu estabelecimento</p>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="email" placeholder="E-mail do Restaurante *" aria-label="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className={inputClass} />
        </div>
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
          <input type="tel" placeholder="Telefone *" aria-label="Telefone" required value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} disabled={loading} className={inputClass} />
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
          {loading ? <Loader2 size={16} className="animate-spin" /> : (<>{isEditing ? "Salvar Alterações" : "Avançar"} <ArrowRight size={16} /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default CadastroDadosRestaurantePage;
