import { MapPin, Home, Hash, Building, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchApi, setAuthToken, setUserProfile } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import LocationPicker from "@/components/LocationPicker";
import foodImage from "@/assets/food-endereco.jpg";

const EnderecoPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [address, setAddress] = useState({
    logradouro: "",
    bairro: "",
    cidade: "São Paulo", // Default per guide info
    estado: "SP",
    numero: "",
    cep: "",
    sem_numero: false,
    complemento: "",
    ponto_referencia: "",
  });
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.logradouro || !address.bairro || (!address.numero && !address.sem_numero)) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" });
      return;
    }

    const userId = sessionStorage.getItem("register_usuario_id");
    if (!userId) {
      toast({ title: "Erro", description: "Sessão expirada. Volte para o início.", variant: "destructive" });
      navigate("/email-cadastro-cliente");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchApi("/auth/register/address", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          endereco: `${address.logradouro}, ${address.numero} - ${address.bairro}`,
          ...address,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: "Cadastro concluído", description: "Bem-vindo ao Zupps!" });
        sessionStorage.clear();
        if (data.token) {
          setAuthToken(data.token);
        }
        if (data.user) {
          setUserProfile(data.user);
        }
        navigate("/cliente-home");
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
      <p className="text-muted-foreground text-sm mb-6">Última etapa! Informe seu endereço de entrega</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <LocationPicker onLocationSelect={handleLocationSelect} />

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Rua *" 
              required 
              value={address.logradouro} 
              onChange={(e) => setAddress({...address, logradouro: e.target.value})} 
              disabled={loading} 
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium" 
            />
          </div>
          <div className="relative">
            <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Bairro *" 
              required 
              value={address.bairro} 
              onChange={(e) => setAddress({...address, bairro: e.target.value})} 
              disabled={loading} 
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Número *" 
              required={!address.sem_numero} 
              disabled={address.sem_numero || loading} 
              value={address.numero} 
              onChange={(e) => setAddress({...address, numero: e.target.value})} 
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium" 
            />
          </div>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="CEP *" 
              required 
              value={address.cep} 
              onChange={(e) => setAddress({...address, cep: e.target.value})} 
              disabled={loading} 
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium" 
            />
          </div>
        </div>

        <div className="flex items-center gap-2 px-2">
          <input 
            type="checkbox" 
            id="sem_numero" 
            checked={address.sem_numero} 
            onChange={(e) => setAddress({...address, sem_numero: e.target.checked, numero: e.target.checked ? "" : address.numero})} 
          />
          <label htmlFor="sem_numero" className="text-sm text-muted-foreground cursor-pointer">Sem número</label>
        </div>

        <div className="relative">
          <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Complemento" 
            value={address.complemento} 
            onChange={(e) => setAddress({...address, complemento: e.target.value})} 
            disabled={loading} 
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium" 
          />
        </div>

        <div className="relative">
          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Ponto de referência" 
            value={address.ponto_referencia} 
            onChange={(e) => setAddress({...address, ponto_referencia: e.target.value})} 
            disabled={loading} 
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium" 
          />
        </div>

        <button type="submit" disabled={loading} className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <Loader2 size={16} className="animate-spin" /> : (<>Finalizar <ArrowRight size={16} /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default EnderecoPage;
