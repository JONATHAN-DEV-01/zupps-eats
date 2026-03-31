import { motion } from "framer-motion";
import { ArrowLeft, ImageIcon, Plus, Loader2, Save, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";

const CriarProdutoPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoria_id: "",
    disponivel: true,
  });

  const userProfile = localStorage.getItem("user_profile") ? JSON.parse(localStorage.getItem("user_profile")!) : null;
  const restaurantId = userProfile?.id || userProfile?.restaurante_id;

  useEffect(() => {
    if (id) {
      const loadProduct = async () => {
        setFetching(true);
        try {
          const response = await fetchApi(`/produtos/${id}`);
          const data = await response.json();
          if (response.ok) {
            setFormData({
              nome: data.nome,
              descricao: data.descricao || "",
              preco: data.preco.toString(),
              categoria_id: data.categoria_id || "",
              disponivel: data.disponivel,
            });
            if (data.imagem) setImagePreview(`${API_BASE_URL}/${data.imagem.replace(/\\/g, '/')}`);
          }
        } catch {
          toast({ title: "Erro", description: "Falha ao carregar produto." });
        } finally {
          setFetching(false);
        }
      };
      loadProduct();
    }
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar Tamanho Máximo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "A imagem deve ter no máximo 5MB.", variant: "destructive" });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // Validar Resolução Mínima (800x800)
        const img = new Image();
        img.onload = () => {
          if (img.width < 800 || img.height < 800) {
            toast({ title: "Baixa resolução", description: "A imagem deve ter no mínimo 800x800 pixels.", variant: "destructive" });
            return;
          }
          // Passou em todas as validações
          setImagePreview(img.src);
          setImageFile(file);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.preco || !restaurantId) return;

    setLoading(true);
    try {
      const data = new FormData();
      data.append("nome", formData.nome);
      data.append("descricao", formData.descricao);
      data.append("preco", formData.preco);
      data.append("disponivel", String(formData.disponivel));
      data.append("restaurante_id", restaurantId);
      
      const categoryName = formData.categoria_id || "Geral";
      data.append("categoria_id", categoryName);
      
      if (imageFile) data.append("imagem", imageFile);

      const endpoint = id ? `/produtos/${id}` : "/produtos";
      const method = id ? "PATCH" : "POST";

      const response = await fetchApi(endpoint, {
        method,
        body: data,
      });

      if (response.ok) {
        toast({ title: id ? "Produto atualizado" : "Produto criado!" });
        navigate("/gerencia-cardapio");
      } else {
        const error = await response.json();
        toast({ title: "Erro", description: error.message || "Falha ao salvar produto.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Falha ao falar com o servidor.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/gerencia-cardapio")} className="p-2 hover:bg-muted rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-extrabold text-xl text-foreground">{id ? "Editar" : "Novo"} Produto</h1>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-float hover:opacity-95 transition-opacity disabled:opacity-70">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Salvar
          </button>
        </div>
      </header>

      <div className="container py-8 max-w-2xl">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Image Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center bg-card group relative"
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Plus className="text-white" size={32} />
                </div>
              </>
            ) : (
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ImageIcon size={24} className="text-primary" />
                </div>
                <p className="text-sm font-bold text-foreground">Clique para adicionar imagem</p>
                <p className="text-xs text-muted-foreground mt-1">Sugerido: 1000x1000px (Max 5MB)</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleImageChange} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">Nome do Produto *</label>
              <input 
                type="text" 
                required 
                maxLength={100}
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: Burger de Costela" 
                className="w-full h-12 px-4 rounded-xl bg-card border border-border text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all" 
              />
            </div>

            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">Descrição</label>
              <textarea 
                rows={3}
                maxLength={500}
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Conte o que tem no seu produto..." 
                className="w-full p-4 rounded-xl bg-card border border-border text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all resize-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">Preço (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  value={formData.preco}
                  onChange={(e) => setFormData({...formData, preco: e.target.value})}
                  placeholder="29.90" 
                  className="w-full h-12 px-4 rounded-xl bg-card border border-border text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">Categoria</label>
                <select 
                  className="w-full h-12 px-4 rounded-xl bg-card border border-border text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all appearance-none"
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                >
                  <option value="">Geral</option>
                  <option value="burgers">Burgers</option>
                  <option value="bebidas">Bebidas</option>
                  <option value="sobremesas">Sobremesas</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Disponibilidade no Cardápio</span>
                <span className="text-xs text-muted-foreground">
                  Se desmarcado, aparecerá para os clientes como <strong>"Esgotado"</strong>
                </span>
              </div>
              <input 
                type="checkbox" 
                checked={formData.disponivel}
                onChange={(e) => setFormData({...formData, disponivel: e.target.checked})}
                className="w-12 h-6 rounded-full appearance-none bg-border checked:bg-primary transition-all cursor-pointer relative after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all checked:after:left-7" 
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CriarProdutoPage;
