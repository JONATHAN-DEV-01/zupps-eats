import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartAdditional {
  id: string;
  nome: string;
  preco_centavos: number;
}

export interface CartItem {
  id: string; // unique cart item id
  produto_id: string;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  preco_unitario_centavos: number; // base price in cents
  adicionais: CartAdditional[];
  observacao: string;
  quantidade: number;
}

export interface CartRestaurant {
  id: string;
  nome_fantasia: string;
  logotipo: string | null;
  is_open: boolean;
  pedido_minimo_centavos: number;
  valor_frete_centavos: number;
}

interface CartState {
  restaurante: CartRestaurant | null;
  itens: CartItem[];
  congelado: boolean; // freezed for checkout
}

interface CartContextType {
  restaurante: CartRestaurant | null;
  itens: CartItem[];
  totalItens: number;
  subtotalCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  pedidoMinimoCentavos: number;
  faltaParaMinimo: number;
  congelado: boolean;
  addItem: (
    restaurante: CartRestaurant,
    item: Omit<CartItem, "id" | "quantidade">,
    quantidade?: number
  ) => "added" | "conflict";
  confirmSwitch: (
    restaurante: CartRestaurant,
    item: Omit<CartItem, "id" | "quantidade">,
    quantidade?: number
  ) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  freezeCart: () => CartState;
  pendingConflict: { restaurante: CartRestaurant; item: Omit<CartItem, "id" | "quantidade">; quantidade: number } | null;
  dismissConflict: () => void;
}

const STORAGE_KEY = "zupps_cart";

const CartContext = createContext<CartContextType | null>(null);

// Generate a fingerprint for grouping identical items
const itemFingerprint = (item: Omit<CartItem, "id" | "quantidade">) => {
  const addIds = item.adicionais.map((a) => a.id).sort().join(",");
  return `${item.produto_id}|${addIds}|${item.observacao.trim()}`;
};

const generateId = () => Math.random().toString(36).slice(2, 10);

const loadState = (): CartState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { restaurante: null, itens: [], congelado: false };
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CartState>(loadState);
  const [pendingConflict, setPendingConflict] = useState<{
    restaurante: CartRestaurant;
    item: Omit<CartItem, "id" | "quantidade">;
    quantidade: number;
  } | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = useCallback(
    (
      restaurante: CartRestaurant,
      item: Omit<CartItem, "id" | "quantidade">,
      quantidade = 1
    ): "added" | "conflict" => {
      // Check restaurant conflict
      if (state.restaurante && state.restaurante.id !== restaurante.id && state.itens.length > 0) {
        setPendingConflict({ restaurante, item, quantidade });
        return "conflict";
      }

      setState((prev) => {
        const fp = itemFingerprint(item);
        const existing = prev.itens.find((i) => itemFingerprint(i) === fp);

        if (existing) {
          return {
            ...prev,
            restaurante,
            itens: prev.itens.map((i) =>
              i.id === existing.id ? { ...i, quantidade: i.quantidade + quantidade } : i
            ),
            congelado: false,
          };
        }

        return {
          ...prev,
          restaurante,
          itens: [...prev.itens, { ...item, id: generateId(), quantidade }],
          congelado: false,
        };
      });

      return "added";
    },
    [state.restaurante, state.itens]
  );

  const confirmSwitch = useCallback(
    (
      restaurante: CartRestaurant,
      item: Omit<CartItem, "id" | "quantidade">,
      quantidade = 1
    ) => {
      setState({
        restaurante,
        itens: [{ ...item, id: generateId(), quantidade }],
        congelado: false,
      });
      setPendingConflict(null);
    },
    []
  );

  const dismissConflict = useCallback(() => setPendingConflict(null), []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setState((prev) => {
      const updated = prev.itens
        .map((i) => (i.id === itemId ? { ...i, quantidade: i.quantidade + delta } : i))
        .filter((i) => i.quantidade > 0);

      return {
        ...prev,
        itens: updated,
        restaurante: updated.length === 0 ? null : prev.restaurante,
      };
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setState((prev) => {
      const updated = prev.itens.filter((i) => i.id !== itemId);
      return { ...prev, itens: updated, restaurante: updated.length === 0 ? null : prev.restaurante };
    });
  }, []);

  const clearCart = useCallback(() => {
    setState({ restaurante: null, itens: [], congelado: false });
  }, []);

  const freezeCart = useCallback(() => {
    const frozen = { ...state, congelado: true };
    setState(frozen);
    return frozen;
  }, [state]);

  // Computed values
  const subtotalCentavos = state.itens.reduce((sum, item) => {
    const addTotal = item.adicionais.reduce((s, a) => s + a.preco_centavos, 0);
    return sum + (item.preco_unitario_centavos + addTotal) * item.quantidade;
  }, 0);

  const freteCentavos = state.restaurante?.valor_frete_centavos ?? 0;
  const totalCentavos = subtotalCentavos + freteCentavos;
  const pedidoMinimoCentavos = state.restaurante?.pedido_minimo_centavos ?? 0;
  const faltaParaMinimo = Math.max(0, pedidoMinimoCentavos - subtotalCentavos);
  const totalItens = state.itens.reduce((s, i) => s + i.quantidade, 0);

  return (
    <CartContext.Provider
      value={{
        restaurante: state.restaurante,
        itens: state.itens,
        totalItens,
        subtotalCentavos,
        freteCentavos,
        totalCentavos,
        pedidoMinimoCentavos,
        faltaParaMinimo,
        congelado: state.congelado,
        addItem,
        confirmSwitch,
        updateQuantity,
        removeItem,
        clearCart,
        freezeCart,
        pendingConflict,
        dismissConflict,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
