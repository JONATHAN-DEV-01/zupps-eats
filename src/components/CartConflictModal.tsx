import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const CartConflictModal = () => {
  const { pendingConflict, confirmSwitch, dismissConflict, restaurante } = useCart();
  const [switching, setSwitching] = useState(false);

  if (!pendingConflict) return null;

  const handleConfirmSwitch = async () => {
    setSwitching(true);
    await confirmSwitch(
      pendingConflict.restaurante,
      pendingConflict.item,
      pendingConflict.quantidade
    );
    setSwitching(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
        onClick={() => !switching && dismissConflict()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle size={20} className="text-destructive" />
            </div>
            <h3 className="text-base font-bold text-foreground">Trocar restaurante?</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-1">
            Você já tem itens de <strong className="text-foreground">{restaurante?.nome_fantasia}</strong>.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Deseja limpar o carrinho atual e começar um novo com{" "}
            <strong className="text-foreground">{pendingConflict.restaurante.nome_fantasia}</strong>?
          </p>

          <div className="flex gap-3">
            <button
              onClick={dismissConflict}
              disabled={switching}
              className="flex-1 h-10 rounded-xl bg-muted text-sm font-semibold text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmSwitch}
              disabled={switching}
              className="flex-1 h-10 rounded-xl bg-destructive text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
            >
              {switching ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Limpando...
                </>
              ) : (
                "Limpar e trocar"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CartConflictModal;
