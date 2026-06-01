import { Building, CreditCard, MapPin, Phone, FileText, UtensilsCrossed, ArrowRight, Loader2, Mail, ArrowLeft, Home, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { formatPhone } from "@/lib/utils";
import AuthLayout from "@/components/AuthLayout";
import LocationPicker from "@/components/LocationPicker";
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
  const [telefone, setTelefone] = useState(isEditing ? userProfile?.telefone || "" : "");
  const [descricao, setDescricao] = useState(isEditing ? userProfile?.descricao || "" : "");
  const [categoria, setCategoria] = useState(isEditing ? userProfile?.categoria || "" : "");
  
  const [address, setAddress] = useState({
    logradouro: isEditing ? userProfile?.logradouro || "" : "",
    bairro: isEditing ? userProfile?.bairro || "" : "",
    cidade: isEditing ? userProfile?.cidade || "São Paulo" : "São Paulo",
    estado: isEditing ? userProfile?.estado || "SP" : "SP",
    numero: isEditing ? userProfile?.numero || "" : "",
    cep: isEditing ? userProfile?.cep || "" : "",
    sem_numero: isEditing ? userProfile?.sem_numero || false : false,
    complemento: isEditing ? userProfile?.complemento || "" : "",
    ponto_referencia: isEditing ? userProfile?.ponto_referencia || "" : "",
  });

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Sync with latest API data
  useEffect(() => {
    const loadLatestData = async () => {
      const restId = userProfile?.id || userProfile?.restaurante_id;
      if (!isEditing || !restId) return;

      setFetchingData(true);
      try {
        const response = await fetchApi(`/restaurantes?id=${restId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            const rest = data[0];
            setAddress({
              logradouro: rest.logradouro || "",
              bairro: rest.bairro || "",
              cidade: rest.cidade || "São Paulo",
              estado: rest.estado || "SP",
              numero: rest.numero || "",
              cep: rest.cep || "",
              sem_numero: rest.sem_numero || false,
              complemento: rest.complemento || "",
              ponto_referencia: rest.ponto_referencia || "",
            });
            
            // Sync email and telephone if they were updated elsewhere
            if (rest.email) setEmail(rest.email);
            if (rest.telefone) setTelefone(rest.telefone);
            if (rest.nome_fantasia) setNomeFantasia(rest.nome_fantasia);
            if (rest.razao_social) setRazaoSocial(rest.razao_social);

            // Update localStorage
            const updatedProfile = { ...userProfile, ...rest };
            localStorage.setItem("user_profile", JSON.stringify(updatedProfile));
          } else {
            // Restaurante não existe mais no back-end (Ghost ID)
            const cleanedProfile = { ...userProfile };
            delete cleanedProfile.restaurante_id;
            delete cleanedProfile.cnpj;
            cleanedProfile.perfil = "CLIENTE";
            localStorage.setItem("user_profile", JSON.stringify(cleanedProfile));
            window.location.reload(); // Recarrega a página para limpar o estado isEditing
          }
        }
      } catch (err) {
        console.error("Erro ao carregar endereço atual", err);
      } finally {
        setFetchingData(false);
      }
    };
    loadLatestData();
  }, [isEditing, userProfile?.id, userProfile?.restaurante_id]);

  const handleLocationSelect = (loc: any) => {
    setAddress(prev => ({
      ...prev,
      logradouro: loc.logradouro || prev.logradouro,
      bairro: loc.bairro || prev.bairro,
      cidade: loc.cidade || prev.cidade,
      estado: loc.estado || prev.estado,
      numero: loc.numero || prev.numero,
      cep: loc.cep || prev.cep,
    }));
  };

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
    if (!email || !nomeFantasia || !razaoSocial || !cnpj || !telefone || !categoria || !address.logradouro) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    // Save to session storage to be sent in the final step with the logo
    const restaurantData = {
      email,
      nome_fantasia: nomeFantasia,
      razao_social: razaoSocial,
      cnpj: cnpj.replace(/\D/g, ""),
      endereco: `${address.logradouro}, ${address.numero || "S/N"} - ${address.bairro}`,
      ...address,
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
        <button type="button" onClick={() => navigate("/restaurante-home")} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} />
          Voltar para o Gerenciamento
        </button>
      )}
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Dados do Restaurante</h1>
      <p className="text-muted-foreground text-sm mb-6">Preencha as informações do seu estabelecimento</p>

      <form className="space-y-3" onSubmit={handleSubmit} autoComplete="off">
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="email" placeholder="E-mail do Restaurante *" aria-label="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} autoComplete="new-password" name="new-email" className={inputClass} />
        </div>
        <div className="relative">
          <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Nome Fantasia *" aria-label="Nome Fantasia" required value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} disabled={loading} autoComplete="new-password" name="new-nome-fantasia" className={inputClass} />
        </div>
        <div className="relative">
          <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Razão Social *" aria-label="Razão Social" required value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} disabled={loading} autoComplete="new-password" name="new-razao-social" className={inputClass} />
        </div>
        <div className="relative">
          <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="CNPJ *" aria-label="CNPJ" required value={cnpj} onChange={(e) => setCnpj(formatCnpj(e.target.value))} disabled={loading} autoComplete="new-password" name="new-cnpj" className={inputClass} />
        </div>

        <div className="py-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-foreground flex items-center gap-2">
              <MapPin size={16} className="text-primary" /> Endereço do Estabelecimento
            </p>
            {isEditing && (userProfile?.endereco) && !address.logradouro && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                DADOS ANTIGOS
              </span>
            )}
          </div>

          {isEditing && userProfile?.endereco && (
            <div className="mb-4 p-3 rounded-xl bg-muted/40 border border-border/50 group relative">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider opacity-70">Endereço Atual Cadastrado</p>
              <p className="text-sm font-semibold text-foreground leading-snug">{userProfile.endereco}</p>
              <div className="absolute top-2 right-2 flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
              </div>
            </div>
          )}

          <LocationPicker onLocationSelect={handleLocationSelect} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Rua *" required value={address.logradouro} onChange={(e) => setAddress({...address, logradouro: e.target.value})} disabled={loading} className={inputClass} />
          </div>
          <div className="relative">
            <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Bairro *" required value={address.bairro} onChange={(e) => setAddress({...address, bairro: e.target.value})} disabled={loading} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Número *" required={!address.sem_numero} disabled={address.sem_numero || loading} value={address.numero} onChange={(e) => setAddress({...address, numero: e.target.value})} className={inputClass} />
          </div>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="CEP *" required value={address.cep} onChange={(e) => setAddress({...address, cep: e.target.value})} disabled={loading} className={inputClass} />
          </div>
        </div>

        <div className="flex items-center gap-2 px-1">
          <input type="checkbox" id="sem_numero" checked={address.sem_numero} onChange={(e) => setAddress({...address, sem_numero: e.target.checked, numero: e.target.checked ? "" : address.numero})} />
          <label htmlFor="sem_numero" className="text-xs text-muted-foreground cursor-pointer font-medium">Estabelecimento sem número oficial</label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Complemento" value={address.complemento} onChange={(e) => setAddress({...address, complemento: e.target.value})} disabled={loading} className={inputClass} />
          </div>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Ponto de referência" value={address.ponto_referencia} onChange={(e) => setAddress({...address, ponto_referencia: e.target.value})} disabled={loading} className={inputClass} />
          </div>
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
