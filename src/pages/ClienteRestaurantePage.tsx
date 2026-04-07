import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Package, Store, Search, X } from "lucide-react";
import { fetchApi, API_BASE_URL } from "@/lib/api";

const ClienteRestaurantePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState<any[]>([]);
  const [restaurante, setRestaurante] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para a busca no cardápio
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, restRes] = await Promise.all([
          fetchApi(`/produtos?restaurante_id=${id}`),
          fetchApi(`/restaurantes?id=${id}`)
        ]);

        if (prodRes.ok) {
          const data = await prodRes.json();
          // Mantemos apenas os itens ativos no cardápio do cliente
          setProdutos(data.filter((p: any) => p.disponivel !== false));
        }

        if (restRes.ok) {
          const data = await restRes.json();
          if (data.length > 0) setRestaurante(data[0]);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do restaurante", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id]);

  // Lógica de filtragem de produtos
  const filteredProdutos = produtos.filter((p) => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center h-14 gap-3">
          <button onClick={() => navigate("/cliente-home")} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-base font-extrabold text-foreground">Produtos</h1>
        </div>
      </header>

      {/* Cover Image */}
      {!loading && restaurante?.capa && (
        <div className="w-full h-48 md:h-64 relative">
          <img 
            src={`${API_BASE_URL}/${restaurante.capa.replace(/\\/g, '/')}`} 
            alt="Capa do restaurante" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
      )}

      <div className="container py-6 max-w-2xl -mt-12 relative z-10">
        {/* Restaurant Header */}
        {!loading && restaurante && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex items-center justify-center border border-border shadow-sm flex-shrink-0">
              {restaurante.logotipo ? (
                <img 
                  src={`${API_BASE_URL}/${restaurante.logotipo.replace(/\\/g, '/')}`} 
                  alt={restaurante.nome_fantasia} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Store size={32} className="text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">{restaurante.nome_fantasia}</h2>
              <p className="text-sm text-muted-foreground font-medium">{restaurante.categoria || "Restaurante"}</p>
            </div>
          </motion.div>
        )}

        {/* Campo de Busca no Cardápio */}
        <div className="relative mb-8">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar no cardápio..."
            className="w-full h-11 pl-11 pr-11 rounded-xl bg-card border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider opacity-60">
          {searchTerm ? `Resultados para "${searchTerm}"` : "Escolha seus itens"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 w-full text-center sm:col-span-2">Carregando cardápio...</p>
          ) : filteredProdutos.length > 0 ? (
            filteredProdutos.map((produto) => (
              <motion.div
                key={produto.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover cursor-pointer transition-all"
              >
                <div className="flex-1 min-w-0 flex flex-col h-full">
                  <h3 className="text-sm font-bold text-foreground mb-1 pr-2">{produto.nome}</h3>
                  {produto.descricao && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                      {produto.descricao}
                    </p>
                  )}
                  <div className="mt-auto pt-2">
                     <span className="font-extrabold text-sm text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
                    </span>
                  </div>
                </div>
                <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center border border-border shadow-sm">
                  {produto.imagem ? (
                    <img
                      src={`${API_BASE_URL}/uploads/produtos/${produto.imagem}`}
                      alt={produto.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={24} className="text-muted-foreground" />
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-12 w-full text-center sm:col-span-2 border-2 border-dashed border-border rounded-3xl">
               <Package size={32} className="mx-auto text-muted-foreground mb-2 opacity-20" />
               <p className="text-sm font-bold text-foreground">Nenhum item encontrado</p>
               <p className="text-xs text-muted-foreground">Tente outro nome ou limpe a busca.</p>
               {searchTerm && (
                 <button 
                   onClick={() => setSearchTerm("")}
                   className="mt-4 text-xs font-bold text-primary underline"
                 >
                   Ver cardápio completo
                 </button>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClienteRestaurantePage;