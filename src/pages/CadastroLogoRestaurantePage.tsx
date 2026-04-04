import { ImageIcon, ArrowRight, Loader2, Upload, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import foodImage from "@/assets/food-cadastro-restaurante.jpg";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];


const CadastroLogoRestaurantePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const userProfile = localStorage.getItem("user_profile") ? JSON.parse(localStorage.getItem("user_profile")!) : null;
  const isEditing = Boolean(userProfile?.cnpj || userProfile?.perfil === "RESTAURANTE");

  const [cover, setCover] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    isEditing && userProfile?.capa ? `${API_BASE_URL}/${userProfile.capa.replace(/\\/g, '/')}` : null
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(
    isEditing && userProfile?.logotipo ? `${API_BASE_URL}/${userProfile.logotipo.replace(/\\/g, '/')}` : null
  );
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  // Sync with latest API data on mount
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
            if (rest.logotipo) setLogoPreview(`${API_BASE_URL}/${rest.logotipo.replace(/\\/g, '/')}`);
            if (rest.capa) setCoverPreview(`${API_BASE_URL}/${rest.capa.replace(/\\/g, '/')}`);
            
            // Update localStorage to keep it fresh
            const updatedProfile = { ...userProfile, ...rest };
            localStorage.setItem("user_profile", JSON.stringify(updatedProfile));
          }
        }
      } catch (err) {
        console.error("Erro ao atualizar dados prévios", err);
      } finally {
        setFetchingData(false);
      }
    };
    loadLatestData();
  }, [isEditing, userProfile?.id, userProfile?.restaurante_id]);

  const handleFile = (file: File | null, type: "cover" | "logo") => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Aceita apenas JPG, JPEG, PNG ou WEBP.", variant: "destructive" });
      return;
    }

    const url = URL.createObjectURL(file);
    if (type === "cover") { setCover(file); setCoverPreview(url); }
    else { setLogo(file); setLogoPreview(url); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !logo) {
      toast({ title: "Logo obrigatório", description: "Por favor, selecione um logotipo para o seu restaurante.", variant: "destructive" });
      return;
    }

    const pendingData = sessionStorage.getItem("pending_restaurant_data");
    if (!isEditing && !pendingData) {
      toast({ title: "Erro", description: "Dados do restaurante não encontrados. Reinicie o cadastro.", variant: "destructive" });
      navigate("/cadastro-dados-restaurante");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // If pending data exists, append text fields (for both Create mode and bulk Edit mode)
      if (pendingData) {
        const restaurantData = JSON.parse(pendingData);
        formData.append("nome_fantasia", restaurantData.nome_fantasia);
        formData.append("razao_social", restaurantData.razao_social);
        formData.append("cnpj", restaurantData.cnpj);
        formData.append("endereco", restaurantData.endereco);
        // Structured address fields
        if (restaurantData.logradouro) formData.append("logradouro", restaurantData.logradouro);
        if (restaurantData.bairro) formData.append("bairro", restaurantData.bairro);
        if (restaurantData.cidade) formData.append("cidade", restaurantData.cidade);
        if (restaurantData.estado) formData.append("estado", restaurantData.estado);
        if (restaurantData.numero) formData.append("numero", restaurantData.numero);
        if (restaurantData.cep) formData.append("cep", restaurantData.cep);
        if (restaurantData.ponto_referencia) formData.append("ponto_referencia", restaurantData.ponto_referencia);
        if (restaurantData.sem_numero !== undefined) formData.append("sem_numero", String(restaurantData.sem_numero));
        if (restaurantData.complemento) formData.append("complemento", restaurantData.complemento);

        formData.append("telefone", restaurantData.telefone);
        if (restaurantData.descricao) formData.append("descricao", restaurantData.descricao);
        formData.append("categoria_id", restaurantData.categoria);
        formData.append("email", restaurantData.email);
      }

      if (logo) formData.append("logotipo", logo);
      if (cover) formData.append("capa", cover);

      const endpoint = isEditing ? `/restaurantes/${userProfile.id || userProfile.restaurante_id}` : "/restaurantes";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetchApi(endpoint, {
        method,
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        const newProfile = { ...userProfile, ...data, perfil: "RESTAURANTE" };
        localStorage.setItem("user_profile", JSON.stringify(newProfile));
        sessionStorage.setItem("restaurant_id", data.id || data.restaurante_id);
        sessionStorage.removeItem("pending_restaurant_data");
        
        toast({ title: "Sucesso!", description: isEditing ? "Dados atualizados com sucesso." : "Restaurante criado com sucesso." });
        if (isEditing) {
          navigate("/gerencia-restaurante");
        } else {
          navigate("/cadastro-horario-restaurante");
        }
      } else {
        toast({ title: "Erro", description: data.message || data.error || "Erro ao salvar dados.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Não foi possível conectar ao servidor.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const UploadArea = ({ label, preview, inputRef, onFile }: { label: string; preview: string | null; inputRef: React.RefObject<HTMLInputElement>; onFile: (f: File | null) => void }) => (
    <div
      onClick={() => inputRef.current?.click()}
      className="relative w-full h-40 rounded-xl border-2 border-dashed border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden"
    >
      {preview ? (
        <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
      ) : (
        <>
          <Upload size={24} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <span className="text-xs text-muted-foreground/60">JPG, JPEG, PNG ou WEBP</span>
        </>
      )}
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
    </div>
  );

  return (
    <AuthLayout
      backgroundImage={foodImage}
      panelTitle="Imagens do restaurante"
      panelSubtitle="Adicione a capa e logo do seu estabelecimento para atrair mais clientes."
    >
      {isEditing && (
        <button type="button" onClick={() => navigate("/gerencia-restaurante")} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} />
          Voltar para o Gerenciamento
        </button>
      )}
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Imagens</h1>
      <p className="text-muted-foreground text-sm mb-6">Envie a capa e o logo do seu restaurante</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Imagem de Capa</label>
          <UploadArea label={fetchingData ? "Carregando..." : "Clique para enviar a capa"} preview={coverPreview} inputRef={coverRef as React.RefObject<HTMLInputElement>} onFile={(f) => handleFile(f, "cover")} />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Logo</label>
          <UploadArea label={fetchingData ? "Carregando..." : "Clique para enviar o logo"} preview={logoPreview} inputRef={logoRef as React.RefObject<HTMLInputElement>} onFile={(f) => handleFile(f, "logo")} />
        </div>

        <button type="submit" disabled={loading} className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <Loader2 size={16} className="animate-spin" /> : (<>{isEditing ? "Salvar Alterações" : "Avançar"} <ArrowRight size={16} /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default CadastroLogoRestaurantePage;
