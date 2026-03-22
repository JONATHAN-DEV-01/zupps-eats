import { ImageIcon, ArrowRight, Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import foodImage from "@/assets/food-cadastro-restaurante.jpg";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];


const CadastroLogoRestaurantePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cover, setCover] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

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
    if (!logo) {
      toast({ title: "Logo obrigatório", description: "Por favor, selecione um logotipo para o seu restaurante.", variant: "destructive" });
      return;
    }

    const pendingData = sessionStorage.getItem("pending_restaurant_data");
    if (!pendingData) {
      toast({ title: "Erro", description: "Dados do restaurante não encontrados. Reinicie o cadastro.", variant: "destructive" });
      navigate("/cadastro-dados-restaurante");
      return;
    }

    const restaurantData = JSON.parse(pendingData);


    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("nome_fantasia", restaurantData.nome_fantasia);
      formData.append("razao_social", restaurantData.razao_social);
      formData.append("cnpj", restaurantData.cnpj);
      formData.append("endereco", restaurantData.endereco);
      formData.append("telefone", restaurantData.telefone);
      formData.append("descricao", restaurantData.descricao);
      formData.append("categoria_id", restaurantData.categoria); // Using name as ID for now or map to ID
      formData.append("email", restaurantData.email);
      formData.append("logotipo", logo);
      if (cover) formData.append("capa", cover);

      const response = await fetchApi("/restaurantes", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        sessionStorage.setItem("restaurant_id", data.id || data.restaurante_id);
        sessionStorage.removeItem("pending_restaurant_data");
        navigate("/cadastro-horario-restaurante");
      } else {
        toast({ title: "Erro", description: data.message || data.error || "Erro ao cadastrar restaurante.", variant: "destructive" });
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
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Imagens</h1>
      <p className="text-muted-foreground text-sm mb-6">Envie a capa e o logo do seu restaurante</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Imagem de Capa</label>
          <UploadArea label="Clique para enviar a capa" preview={coverPreview} inputRef={coverRef as React.RefObject<HTMLInputElement>} onFile={(f) => handleFile(f, "cover")} />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Logo</label>
          <UploadArea label="Clique para enviar o logo" preview={logoPreview} inputRef={logoRef as React.RefObject<HTMLInputElement>} onFile={(f) => handleFile(f, "logo")} />
        </div>

        <button type="submit" disabled={loading} className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <Loader2 size={16} className="animate-spin" /> : (<>Avançar <ArrowRight size={16} /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default CadastroLogoRestaurantePage;
