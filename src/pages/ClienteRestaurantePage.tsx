import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Package, Store, Search, X, Plus, Minus, ShoppingCart, Check, Loader2 } from "lucide-react";
import { fetchApi, resolveImageUrl } from "@/lib/api";
import { useCart, CartRestaurant, CartAdditional } from "@/contexts/CartContext";
import FloatingCartButton from "@/components/FloatingCartButton";
import { useToast } from "@/hooks/use-toast";
import { mockRestaurant, mockProdutos, MOCK_RESTAURANT_ID } from "@/lib/mockRestaurant";


const formatCentavos = (centavos: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);

const ClienteRestaurantePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();

  const [produtos, setProdutos] = useState<any[]>([]);
  const [restaurante, setRestaurante] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Add-to-cart modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [selectedAdicionais, setSelectedAdicionais] = useState<CartAdditional[]>([]);
  const [observacao, setObservacao] = useState("");
  const [addedAnimation, setAddedAnimation] = useState<string | null>(null);
  // Adicionais reais do produto selecionado
  const [addedAnimation, setAddedAnimation] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Atalho para o restaurante mockado de testes
      if (id === MOCK_RESTAURANT_ID) {
        setRestaurante(mockRestaurant);
        setProdutos(mockProdutos);
        setLoading(false);
        return;
      }
      try {
        const [prodRes, restRes] = await Promise.all([
          fetchApi(`/produtos?restaurante_id=${id}`),
          fetchApi(`/restaurantes?id=${id}`)
        ]);

        if (prodRes.ok) {
          const data = await prodRes.json();
          // RF-02 / RN-03: mantemos TODOS os produtos, incluindo esgotados.
          // Itens indisponíveis são exibidos com overlay visual em vez de removidos.
          setProdutos(data);
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

  const filteredProdutos = produtos.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddModal = async (produto: any) => {
    setSelectedProduct(produto);
    setQuantidade(1);
    setSelectedAdicionais([]);
    setObservacao("");
    setModalOpen(true);
  };

  const toggleAdicional = (add: CartAdditional) => {
    setSelectedAdicionais((prev) =>
      prev.find((a) => a.id === add.id)
        ? prev.filter((a) => a.id !== add.id)
        : [...prev, add]
    );
  };

  const handleAddToCart = async () => {
    if (!selectedProduct || !restaurante) return;

    const cartRestaurant: CartRestaurant = {
      id: restaurante.id?.toString() || id || "",
      nome_fantasia: restaurante.nome_fantasia,
      logotipo: restaurante.logotipo || null,
      is_open: restaurante.is_open ?? true,
      pedido_minimo_centavos: (restaurante.pedido_minimo || 0) * 100,
      valor_frete_centavos: (restaurante.valor_frete || 0) * 100,
    };

    const precoCentavos = selectedProduct.em_promocao
      ? Math.round((selectedProduct.preco_promocional || selectedProduct.preco) * 100)
      : Math.round(selectedProduct.preco * 100);

    const result = await addItem(cartRestaurant, {
      produto_id: selectedProduct.id.toString(),
      nome: selectedProduct.nome,
      descricao: selectedProduct.descricao || null,
      imagem: selectedProduct.imagem || null,
      preco_unitario_centavos: precoCentavos,
      adicionais: selectedAdicionais,
      observacao: observacao.trim(),
    }, quantidade);

    if (result === "added") {
      setModalOpen(false);
      setAddedAnimation(selectedProduct.id.toString());
      setTimeout(() => setAddedAnimation(null), 1200);
      toast({ title: "Item adicionado ao carrinho!", description: `${quantidade}x ${selectedProduct.nome}` });
    } else if (result === "error") {
      toast({ title: "Erro ao adicionar item", description: "Tente novamente.", variant: "destructive" });
    }
    // "conflict" é tratado pelo CartConflictModal
  };

  const modalSubtotal = () => {
    if (!selectedProduct) return 0;
    const base = selectedProduct.em_promocao
      ? Math.round((selectedProduct.preco_promocional || selectedProduct.preco) * 100)
      : Math.round(selectedProduct.preco * 100);
    const addTotal = selectedAdicionais.reduce((s, a) => s + a.preco_centavos, 0);
    return (base + addTotal) * quantidade;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-2xl flex items-center h-14 gap-3">
          <button onClick={() => navigate("/cliente-home")} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-base font-extrabold text-foreground">Produtos</h1>
        </div>
      </header>

      {/* Cover Image */}
      {!loading && restaurante?.capa && restaurante.capa !== "null" && (
        <div className="w-full h-48 md:h-64 relative">
          <img
            src={resolveImageUrl(restaurante.capa) ?? ''}
            alt="Capa do restaurante"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
      )}

      <div className={`container py-6 max-w-2xl relative z-10${restaurante?.capa && restaurante.capa !== "null" ? " -mt-12" : ""}`}>
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
                  src={resolveImageUrl(restaurante.logotipo) ?? ''}
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

        {/* Search */}
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
            filteredProdutos.map((produto) => {
              const esgotado = produto.disponivel === false || produto.status_disponivel === false;
              return (
                <motion.div
                  key={produto.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative flex items-start justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-card transition-all ${
                    esgotado
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:shadow-card-hover cursor-pointer hover:border-primary/20"
                  }`}
                  onClick={() => !esgotado && openAddModal(produto)}
                >
                  {/* RF-02: overlay + badge de esgotado */}
                  {esgotado && (
                    <div className="absolute inset-0 rounded-2xl z-10 flex items-start justify-end p-2 pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-sm">
                        Esgotado
                      </span>
                    </div>
                  )}

                  {/* Added animation overlay */}
                  <AnimatePresence>
                    {addedAnimation === produto.id.toString() && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-2xl bg-primary/10 flex items-center justify-center z-20"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Check size={16} className="text-primary-foreground" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex-1 min-w-0 flex flex-col h-full">
                    <h3 className={`text-sm font-bold mb-1 pr-2 ${esgotado ? "text-muted-foreground" : "text-foreground"}`}>{produto.nome}</h3>
                    {produto.descricao && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                        {produto.descricao}
                      </p>
                    )}
                    <div className="mt-auto pt-2 flex items-center gap-2 flex-wrap">
                      {produto.em_promocao ? (
                        <>
                          <span className="text-xs line-through text-muted-foreground">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(produto.preco_original)}
                          </span>
                          <span className={`font-extrabold text-sm ${esgotado ? "text-muted-foreground" : "text-primary"}`}>
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(produto.preco_promocional)}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                            OFERTA
                          </span>
                        </>
                      ) : (
                        <span className={`font-extrabold text-sm ${esgotado ? "text-muted-foreground" : "text-primary"}`}>
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(produto.preco)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center border border-border shadow-sm">
                    {produto.imagem ? (
                      <img
                        src={resolveImageUrl(produto.imagem) ?? ''}
                        alt={produto.nome}
                        className={`w-full h-full object-cover ${esgotado ? "grayscale" : ""}`}
                      />
                    ) : (
                      <Package size={24} className="text-muted-foreground" />
                    )}
                  </div>
                </motion.div>
              );
            })
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

      <FloatingCartButton />

      {/* Add to cart modal */}
      <AnimatePresence>
        {modalOpen && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/50 flex items-end sm:items-center justify-center"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-2xl border border-border shadow-lg max-h-[85vh] overflow-y-auto"
            >
              {/* Product header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center border border-border/50">
                    {selectedProduct.imagem ? (
                      <img
                        src={resolveImageUrl(selectedProduct.imagem) ?? ''}
                        alt={selectedProduct.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={24} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-foreground">{selectedProduct.nome}</h3>
                    {selectedProduct.descricao && (
                      <p className="text-xs text-muted-foreground mt-1">{selectedProduct.descricao}</p>
                    )}
                    <p className="text-sm font-extrabold text-primary mt-1">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        selectedProduct.em_promocao ? selectedProduct.preco_promocional : selectedProduct.preco
                      )}
                    </p>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                    <X size={18} className="text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Additionals */}
              {selectedProduct?.adicionais && selectedProduct.adicionais.length > 0 && (
                <div className="p-5 border-b border-border">
                  <h4 className="text-sm font-bold text-foreground mb-3">Adicionais</h4>
                  <div className="space-y-2">
                    {selectedProduct.adicionais.map((add: any) => {
                      // Se tem quantidade_atual, usa ela, senão pega do status legacy (mock)
                      const disponivel = add.quantidade_atual !== undefined ? add.quantidade_atual > 0 : add.disponivel !== false;
                      if (!disponivel) return null; // Não exibe adicionais esgotados na compra
                      
                      const cartAdd: CartAdditional = {
                        id: String(add.id),
                        nome: add.nome,
                        preco_centavos: Math.round(add.preco * 100),
                      };
                      const selected = selectedAdicionais.find((a) => a.id === cartAdd.id);
                      return (
                        <button
                          key={add.id}
                          onClick={() => toggleAdicional(cartAdd)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                selected ? "bg-primary border-primary" : "border-border"
                              }`}
                            >
                              {selected && <Check size={12} className="text-primary-foreground" />}
                            </div>
                            <span className="text-sm font-medium text-foreground">{add.nome}</span>
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground">
                            + {formatCentavos(Math.round(add.preco * 100))}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Observations */}
              <div className="p-5 border-b border-border">
                <h4 className="text-sm font-bold text-foreground mb-2">Observações</h4>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value.slice(0, 200))}
                  placeholder="Ex: sem cebola, bem passado..."
                  className="w-full h-20 p-3 rounded-xl bg-muted border-0 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-[11px] text-muted-foreground text-right mt-1">
                  {observacao.length}/200
                </p>
              </div>

              {/* Quantity + Add button */}
              <div className="p-5 flex items-center gap-4">
                <div className="flex items-center gap-3 bg-muted rounded-xl p-1">
                  <button
                    onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-card transition-colors"
                  >
                    <Minus size={16} className="text-foreground" />
                  </button>
                  <span className="text-sm font-bold text-foreground w-5 text-center">{quantidade}</span>
                  <button
                    onClick={() => setQuantidade((q) => q + 1)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-card transition-colors"
                  >
                    <Plus size={16} className="text-foreground" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <ShoppingCart size={16} />
                  Adicionar {formatCentavos(modalSubtotal())}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClienteRestaurantePage;
