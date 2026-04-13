import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Minus, Plus, Trash2, Store, ShoppingCart, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart, CartItem } from "@/contexts/CartContext";
import { API_BASE_URL } from "@/lib/api";

const formatCentavos = (centavos: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);

const CarrinhoPage = () => {
  const navigate = useNavigate();
  const {
    restaurante,
    itens,
    totalItens,
    subtotalCentavos,
    freteCentavos,
    totalCentavos,
    faltaParaMinimo,
    pedidoMinimoCentavos,
    congelado,
    updateQuantity,
    removeItem,
    clearCart,
    freezeCart,
  } = useCart();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const canCheckout = faltaParaMinimo === 0 && itens.length > 0;

  const handleCheckout = () => {
    if (!canCheckout) return;
    freezeCart();
    // Navigate to payment page (to be implemented)
    navigate("/checkout");
  };

  const itemTotalCentavos = (item: CartItem) => {
    const addTotal = item.adicionais.reduce((s, a) => s + a.preco_centavos, 0);
    return (item.preco_unitario_centavos + addTotal) * item.quantidade;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <h1 className="text-base font-extrabold text-foreground">
              Carrinho {totalItens > 0 && `(${totalItens})`}
            </h1>
          </div>
          {itens.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs font-bold text-destructive hover:underline"
            >
              Limpar
            </button>
          )}
        </div>
      </header>

      {/* Restaurant closed banner */}
      {restaurante && !restaurante.is_open && (
        <motion.div
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          className="bg-destructive text-destructive-foreground text-center py-2 text-xs font-bold flex items-center justify-center gap-2"
        >
          <AlertTriangle size={14} />
          Este restaurante está fechado no momento
        </motion.div>
      )}

      <div className="container py-6 max-w-2xl">
        {/* Restaurant info */}
        {restaurante && itens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-card border border-border"
          >
            <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden flex items-center justify-center flex-shrink-0 border border-border/50">
              {restaurante.logotipo ? (
                <img
                  src={`${API_BASE_URL}/${restaurante.logotipo.replace(/\\/g, "/")}`}
                  alt={restaurante.nome_fantasia}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store size={18} className="text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{restaurante.nome_fantasia}</p>
              <p className="text-[11px] text-muted-foreground">
                Frete: {freteCentavos === 0 ? "Grátis" : formatCentavos(freteCentavos)}
              </p>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {itens.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-3 opacity-20" />
            <p className="text-base font-bold text-foreground mb-1">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground mb-6">
              Adicione itens de um restaurante para começar
            </p>
            <button
              onClick={() => navigate("/cliente-home")}
              className="px-6 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Explorar restaurantes
            </button>
          </motion.div>
        )}

        {/* Cart items */}
        <AnimatePresence>
          {itens.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              className="flex gap-3 p-4 mb-3 rounded-2xl bg-card border border-border shadow-card"
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center border border-border/50">
                {item.imagem ? (
                  <img
                    src={`${API_BASE_URL}/uploads/produtos/${item.imagem}`}
                    alt={item.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingCart size={18} className="text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-foreground truncate">{item.nome}</h3>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0"
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </button>
                </div>

                {/* Additionals */}
                {item.adicionais.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    + {item.adicionais.map((a) => a.nome).join(", ")}
                  </p>
                )}

                {/* Observation */}
                {item.observacao && (
                  <p className="text-[11px] text-muted-foreground italic mt-0.5 truncate">
                    "{item.observacao}"
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-extrabold text-primary">
                    {formatCentavos(itemTotalCentavos(item))}
                  </span>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                    >
                      <Minus size={14} className="text-foreground" />
                    </button>
                    <span className="text-sm font-bold text-foreground w-5 text-center">
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                    >
                      <Plus size={14} className="text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Summary */}
        {itens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-2xl bg-card border border-border"
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">{formatCentavos(subtotalCentavos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-semibold text-foreground">
                  {freteCentavos === 0 ? "Grátis" : formatCentavos(freteCentavos)}
                </span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-extrabold text-foreground text-base">{formatCentavos(totalCentavos)}</span>
              </div>
            </div>

            {/* Minimum order warning */}
            {faltaParaMinimo > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="text-xs font-semibold text-destructive text-center">
                  Faltam {formatCentavos(faltaParaMinimo)} para atingir o pedido mínimo de{" "}
                  {formatCentavos(pedidoMinimoCentavos)}
                </p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={!canCheckout || congelado}
              className={`w-full h-12 mt-4 rounded-xl text-sm font-bold transition-colors ${
                canCheckout && !congelado
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {congelado ? "Pedido congelado" : "Ir para o Pagamento"}
            </button>
          </motion.div>
        )}
      </div>

      {/* Clear cart confirmation */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-2xl bg-card border border-border p-6 shadow-lg text-center"
            >
              <p className="text-sm font-bold text-foreground mb-4">Limpar carrinho?</p>
              <p className="text-xs text-muted-foreground mb-6">Todos os itens serão removidos.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 h-10 rounded-xl bg-muted text-sm font-semibold text-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { clearCart(); setShowClearConfirm(false); }}
                  className="flex-1 h-10 rounded-xl bg-destructive text-sm font-semibold text-destructive-foreground"
                >
                  Limpar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CarrinhoPage;
