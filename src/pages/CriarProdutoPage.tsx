import { motion } from "framer-motion";
import { ArrowLeft, ImageIcon, Plus, Loader2, Save, X, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { API_BASE_URL, fetchApi, resolveImageUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const CATEGORIAS = [
  { value: "", label: "Geral" },
  { value: "burgers", label: "Burgers" },
  { value: "bebidas", label: "Bebidas" },
  { value: "sobremesas", label: "Sobremesas" },
];

const CriarProdutoPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  type FichaItem = { ingrediente_id: string; ingrediente_nome?: string; ingrediente_unidade?: string; quantidade_necessaria: number };
  const [fichaTecnica, setFichaTecnica] = useState<FichaItem[]>([]);
  const [ingredientesDisponiveis, setIngredientesDisponiveis] = useState<any[]>([]);
  const [selectedIngrediente, setSelectedIngrediente] = useState("");
  const [selectedQuantidade, setSelectedQuantidade] = useState("");

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoria_id: "",
    disponivel: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const userProfile = localStorage.getItem("user_profile") ? JSON.parse(localStorage.getItem("user_profile")!) : null;
  const restaurantId = userProfile?.restaurante_id || userProfile?.id;

  useEffect(() => {
    const loadIngredientes = async () => {
      try {
        const response = await fetchApi("/ingredientes");
        if (response.ok) setIngredientesDisponiveis(await response.json());
      } catch (e) {
        console.error("Erro ao carregar ingredientes", e);
      }
    };
    loadIngredientes();

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
              disponivel: data.disponivel !== false,
            });
            if (data.imagem) setImagePreview(resolveImageUrl(data.imagem));
            if (data.ficha_tecnica) {
              setFichaTecnica(data.ficha_tecnica.map((item: any) => ({
                ingrediente_id: item.ingrediente_id,
                ingrediente_nome: item.ingrediente_nome,
                ingrediente_unidade: item.ingrediente_unidade,
                quantidade_necessaria: item.quantidade_necessaria
              })));
            }
          }
        } catch {
          toast({ title: "Erro", description: "Falha ao carregar produto.", variant: "destructive" });
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addFichaItem = () => {
    if (!selectedIngrediente || !selectedQuantidade) return;
    const ing = ingredientesDisponiveis.find(i => i.id === selectedIngrediente);
    if (!ing) return;
    
    // Check if already added
    if (fichaTecnica.some(f => f.ingrediente_id === selectedIngrediente)) {
      toast({ title: "Ingrediente já adicionado", variant: "destructive" });
      return;
    }

    setFichaTecnica([...fichaTecnica, {
      ingrediente_id: ing.id,
      ingrediente_nome: ing.nome,
      ingrediente_unidade: ing.unidade_medida,
      quantidade_necessaria: parseFloat(selectedQuantidade)
    }]);
    setSelectedIngrediente("");
    setSelectedQuantidade("");
  };

  const removeFichaItem = (ingrediente_id: string) => {
    setFichaTecnica(fichaTecnica.filter(f => f.ingrediente_id !== ingrediente_id));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (formData.nome.length > 100) newErrors.nome = "Máximo 100 caracteres";
    if (!formData.preco || parseFloat(formData.preco) <= 0) newErrors.preco = "Informe um preço válido";
    if (formData.descricao.length > 500) newErrors.descricao = "Máximo 500 caracteres";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !restaurantId) return;

    setLoading(true);
    try {
      const data = new FormData();
      data.append("nome", formData.nome.trim());
      data.append("descricao", formData.descricao.trim());
      data.append("preco", formData.preco);
      data.append("disponivel", String(formData.disponivel));
      data.append("restaurante_id", restaurantId);
      const categoryName = formData.categoria_id || "Geral";
      data.append("categoria_id", categoryName);
      if (imageFile) data.append("imagem", imageFile);
      if (fichaTecnica.length > 0) {
        data.append("ficha_tecnica", JSON.stringify(fichaTecnica));
      }

      const endpoint = id ? `/produtos/${id}` : "/produtos";
      const method = id ? "PATCH" : "POST";

      const response = await fetchApi(endpoint, { method, body: data });

      if (response.ok) {
        toast({ title: id ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!" });
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
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/gerencia-cardapio")} className="p-2 hover:bg-muted rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-extrabold text-lg text-foreground">{id ? "Editar Produto" : "Novo Produto"}</h1>
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-float hover:opacity-95 transition-opacity disabled:opacity-70"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {id ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </header>

      <div className="container py-6 max-w-2xl">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Image Upload */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <label className="text-sm font-bold text-foreground mb-2 block">Foto do Produto</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[16/9] w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center bg-card group relative"
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-bold bg-foreground/60 px-4 py-2 rounded-xl">Trocar Imagem</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                    className="absolute top-3 right-3 p-1.5 bg-card/90 backdrop-blur rounded-lg text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all shadow-sm"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="text-center p-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <ImageIcon size={24} className="text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground">Toque para adicionar foto</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WEBP</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>
          </motion.div>

          {/* Form Fields */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">
                Nome do Produto <span className="text-destructive">*</span>
              </label>
              <input 
                type="text" 
                required
                value={formData.nome}
                onChange={(e) => { setFormData({...formData, nome: e.target.value}); setErrors({...errors, nome: ""}); }}
                placeholder="Ex: X-Burger Especial" 
                maxLength={100}
                className={`w-full h-12 px-4 rounded-xl bg-card border text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all ${
                  errors.nome ? "border-destructive" : "border-border"
                }`}
              />
              {errors.nome && <p className="text-xs text-destructive mt-1 font-medium">{errors.nome}</p>}
              <p className="text-[10px] text-muted-foreground mt-1 text-right">{formData.nome.length}/100</p>
            </div>

            {/* Descrição */}
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">Descrição</label>
              <textarea 
                rows={3}
                value={formData.descricao}
                onChange={(e) => { setFormData({...formData, descricao: e.target.value}); setErrors({...errors, descricao: ""}); }}
                placeholder="Ingredientes, modo de preparo..." 
                maxLength={500}
                className={`w-full p-4 rounded-xl bg-card border text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all resize-none ${
                  errors.descricao ? "border-destructive" : "border-border"
                }`}
              />
              {errors.descricao && <p className="text-xs text-destructive mt-1 font-medium">{errors.descricao}</p>}
              <p className="text-[10px] text-muted-foreground mt-1 text-right">{formData.descricao.length}/500</p>
            </div>

            {/* Preço e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">
                  Preço (R$) <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.preco}
                    onChange={(e) => { setFormData({...formData, preco: e.target.value}); setErrors({...errors, preco: ""}); }}
                    placeholder="0,00" 
                    className={`w-full h-12 pl-10 pr-4 rounded-xl bg-card border text-sm font-bold focus:ring-2 focus:ring-primary/30 outline-none transition-all ${
                      errors.preco ? "border-destructive" : "border-border"
                    }`}
                  />
                </div>
                {errors.preco && <p className="text-xs text-destructive mt-1 font-medium">{errors.preco}</p>}
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">Categoria</label>
                <select 
                  className="w-full h-12 px-4 rounded-xl bg-card border border-border text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all appearance-none"
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ficha Técnica */}
            <div className="p-4 bg-card rounded-xl border border-border space-y-4">
              <div className="flex flex-col">
                <p className="text-sm font-bold text-foreground">Ficha Técnica (Controle de Estoque)</p>
                <p className="text-xs text-muted-foreground">Vincule os ingredientes e a quantidade gasta ao vender este produto.</p>
              </div>

              <div className="flex gap-2">
                <select 
                  className="flex-1 h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                  value={selectedIngrediente}
                  onChange={(e) => setSelectedIngrediente(e.target.value)}
                >
                  <option value="">Selecione o ingrediente...</option>
                  {ingredientesDisponiveis.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.nome} (em {ing.unidade_medida})</option>
                  ))}
                </select>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Qtd gasta"
                  className="w-24 h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                  value={selectedQuantidade}
                  onChange={(e) => setSelectedQuantidade(e.target.value)}
                />
                <button type="button" onClick={addFichaItem} className="px-3 h-10 bg-primary text-primary-foreground rounded-md text-sm font-bold">
                  Add
                </button>
              </div>

              {fichaTecnica.length > 0 && (
                <div className="space-y-2 mt-2">
                  {fichaTecnica.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                      <span>{item.ingrediente_nome}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-bold">{item.quantidade_necessaria} {item.ingrediente_unidade}</span>
                        <button type="button" onClick={() => removeFichaItem(item.ingrediente_id)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disponibilidade */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
              <div className="flex flex-col">
                <p className="text-sm font-bold text-foreground">Disponibilidade no Cardápio</p>
                <p className="text-xs text-muted-foreground">
                  Se desmarcado, aparecerá para os clientes como <strong>"Esgotado"</strong>
                </p>
              </div>
              <Switch 
                checked={formData.disponivel}
                onCheckedChange={(checked) => setFormData({...formData, disponivel: checked})}
              />
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default CriarProdutoPage;
