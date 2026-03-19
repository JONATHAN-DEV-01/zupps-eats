import { motion } from "framer-motion";
import { Plus, Search, Edit2, Trash2, Package, Loader2, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const GerenciaCardapioPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const restaurantId = localStorage.getItem("user_profile") ? JSON.parse(localStorage.getItem("user_profile")!).restaurante_id : null;

  useEffect(() => {
    const loadProducts = async () => {
      if (!restaurantId) {
        toast({ title: "Erro", description: "Restaurante não identificado.", variant: "destructive" });
        navigate("/gerencia-restaurante");
        return;
      }

      try {
        const response = await fetchApi(`/produtos?restaurante_id=${restaurantId}`);
        const data = await response.json();
        if (response.ok) {
          setProducts(data);
        }
      } catch {
        toast({ title: "Erro", description: "Falha ao carregar cardápio.", variant: "destructive" });
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
        toast({ title: "Produto excluído" });
      } else {
        toast({ title: "Erro", description: "Não foi possível excluir o produto.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Falha ao falar com o servidor.", variant: "destructive" });
    }
  };

  const filteredProducts = products.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/gerencia-restaurante")} className="p-2 hover:bg-muted rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-extrabold text-xl text-foreground">Gerenciar Cardápio</h1>
          </div>
          <Link to="/criar-produto" className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-float hover:opacity-95 transition-opacity">
            <Plus size={18} />
            <span className="hidden sm:inline">Novo Produto</span>
          </Link>
        </div>
      </header>

      <div className="container py-6">
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar no cardápio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-card border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground text-sm">Comece adicionando itens ao seu cardápio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-card-hover transition-all flex flex-col"
              >
                <div className="aspect-video bg-muted relative">
                  {product.imagem ? (
                    <img src={`http://localhost:5000/uploads/${product.imagem}`} alt={product.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package size={40} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button onClick={() => navigate(`/editar-produto/${product.id}`)} className="p-2 bg-card/90 backdrop-blur rounded-lg text-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 bg-card/90 backdrop-blur rounded-lg text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all shadow-sm">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-foreground line-clamp-1">{product.nome}</h4>
                    <span className="font-extrabold text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{product.descricao}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-muted rounded-md text-muted-foreground">
                      {product.categoria || "Geral"}
                    </span>
                    <Link to={`/adicionais-produto/${product.id}`} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      Adicionais <Edit2 size={10} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GerenciaCardapioPage;
