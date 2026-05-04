import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, Package, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_BASE_URL, fetchApi, resolveImageUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const CATEGORIAS = ["Todos", "Burgers", "Bebidas", "Sobremesas", "Geral"];

const GerenciaCardapioPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const userProfile = localStorage.getItem("user_profile") ? JSON.parse(localStorage.getItem("user_profile")!) : null;
  const restaurantId = userProfile?.id || userProfile?.restaurante_id;

  const MOCK_PRODUCTS = [
    { id: "1", nome: "Smash Burger Clássico", descricao: "Pão brioche, blend 150g, queijo cheddar, alface e tomate", preco: 32.90, categoria: "Burgers", disponivel: true, imagem: null },
    { id: "2", nome: "Smash Burger Bacon", descricao: "Pão brioche, blend 150g, bacon crocante, queijo e molho especial", preco: 38.90, categoria: "Burgers", disponivel: true, imagem: null },
    { id: "3", nome: "Coca-Cola 350ml", descricao: "Lata gelada", preco: 7.00, categoria: "Bebidas", disponivel: true, imagem: null },
    { id: "4", nome: "Suco Natural Laranja", descricao: "500ml - feito na hora", preco: 12.00, categoria: "Bebidas", disponivel: false, imagem: null },
    { id: "5", nome: "Brownie com Sorvete", descricao: "Brownie de chocolate belga com sorvete de baunilha", preco: 22.00, categoria: "Sobremesas", disponivel: true, imagem: null },
    { id: "6", nome: "Batata Frita Grande", descricao: "Porção 400g com cheddar e bacon", preco: 28.00, categoria: "Geral", disponivel: true, imagem: null },
  ];

  useEffect(() => {
    const loadProducts = async () => {
      if (!restaurantId) {
        setProducts(MOCK_PRODUCTS);
        setLoading(false);
        return;
      }

      try {
        const response = await fetchApi(`/produtos?restaurante_id=${restaurantId}`);
        const data = await response.json();
        if (response.ok) {
          setProducts(data);
        } else {
          setProducts(MOCK_PRODUCTS);
        }
      } catch {
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [restaurantId, navigate]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const response = await fetchApi(`/produtos/${id}`, { method: "DELETE" });
      if (response.ok) {
        setProducts(products.filter(p => p.id !== id));
        toast({ title: "Produto excluído com sucesso" });
      } else {
        toast({ title: "Erro", description: "Não foi possível excluir o produto.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Falha ao falar com o servidor.", variant: "destructive" });
    }
  };

  const handleToggleDisponivel = async (product: any) => {
    setTogglingId(product.id);
    try {
      // Usando FormData no lugar do JSON para o backend Python conseguir ler
      const formData = new FormData();
      formData.append("disponivel", String(!product.disponivel));

      const response = await fetchApi(`/produtos/${product.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (response.ok) {
        setProducts(products.map(p => p.id === product.id ? { ...p, disponivel: !p.disponivel } : p));
        toast({ title: product.disponivel ? "Produto desativado" : "Produto ativado" });
      } else {
        toast({ title: "Erro ao atualizar status", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === "Todos" || 
      (p.categoria || "Geral").toLowerCase() === activeCategory.toLowerCase();
    return matchSearch && matchCategory;
  });

  const totalAtivos = products.filter(p => p.disponivel !== false).length;
  const totalInativos = products.filter(p => p.disponivel === false).length;

  if (loading) return (
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
            <button onClick={() => navigate("/restaurante-home")} className="p-2 hover:bg-muted rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-extrabold text-lg text-foreground leading-tight">Cardápio</h1>
              <p className="text-[11px] text-muted-foreground font-medium">
                {products.length} produto{products.length !== 1 ? "s" : ""} • {totalAtivos} ativo{totalAtivos !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Link 
            to="/criar-produto" 
            className="gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-float hover:opacity-95 transition-opacity"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Novo Produto</span>
          </Link>
        </div>
      </header>

      <div className="container py-5 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-card border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold text-foreground">{products.length}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold text-accent">{totalAtivos}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ativos</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold text-destructive">{totalInativos}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Inativos</p>
          </div>
        </div>

        {/* Product List */}
        {filteredProducts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {searchTerm ? "Tente outro termo de busca." : "Comece adicionando itens ao seu cardápio."}
            </p>
            {!searchTerm && (
              <Link 
                to="/criar-produto" 
                className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold shadow-float"
              >
                <Plus size={18} /> Criar Primeiro Produto
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`bg-card border rounded-2xl overflow-hidden hover:shadow-card-hover transition-all flex ${
                    product.disponivel === false ? "border-destructive/20 opacity-70" : "border-border"
                  }`}
                >
                  {/* Image */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-muted relative">
                    {product.imagem ? (
                      <img src={resolveImageUrl(product.imagem) ?? ''} alt={product.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package size={28} />
                      </div>
                    )}
                    {product.disponivel === false && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <EyeOff size={20} className="text-destructive" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-foreground text-sm truncate">{product.nome}</h4>
                        <span className="font-extrabold text-primary text-sm whitespace-nowrap">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{product.descricao || "Sem descrição"}</p>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-muted rounded-md text-muted-foreground">
                        {product.categoria || "Geral"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                      <button
                        onClick={() => handleToggleDisponivel(product)}
                        disabled={togglingId === product.id}
                        className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          product.disponivel !== false
                            ? "text-accent bg-accent/10 hover:bg-accent/20"
                            : "text-muted-foreground bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {togglingId === product.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : product.disponivel !== false ? (
                          <Eye size={12} />
                        ) : (
                          <EyeOff size={12} />
                        )}
                        {product.disponivel !== false ? "Ativo" : "Inativo"}
                      </button>
                      <div className="flex items-center gap-1">
                        <Link 
                          to={`/adicionais-produto/${product.id}`}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all text-[11px] font-bold"
                        >
                          Adicionais
                        </Link>
                        <button 
                          onClick={() => navigate(`/editar-produto/${product.id}`)} 
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)} 
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default GerenciaCardapioPage;