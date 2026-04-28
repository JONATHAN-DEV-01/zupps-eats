import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { carrinhoApi, getAuthToken } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartAdditional {
  id: string;
  nome: string;
  preco_centavos: number;
}

export interface CartItem {
  id: string; // UUID do servidor (ou gerado localmente para usuários não autenticados)
  produto_id: string;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  preco_unitario_centavos: number;
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

export interface CartCupom {
  codigo: string;
  desconto_centavos: number;
  tipo: string;
}

interface CartState {
  restaurante: CartRestaurant | null;
  itens: CartItem[];
  congelado: boolean;
  cupomAplicado: CartCupom | null;
  // Valores do servidor (incluem desconto do cupom quando aplicado)
  subtotalCentavosServer: number | null;
  freteCentavosServer: number | null;
  totalCentavosServer: number | null;
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
  isLoading: boolean;
  cupomAplicado: CartCupom | null;
  addItem: (
    restaurante: CartRestaurant,
    item: Omit<CartItem, "id" | "quantidade">,
    quantidade?: number
  ) => Promise<"added" | "conflict" | "error">;
  confirmSwitch: (
    restaurante: CartRestaurant,
    item: Omit<CartItem, "id" | "quantidade">,
    quantidade?: number
  ) => Promise<void>;
  updateQuantity: (itemId: string, delta: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  freezeCart: () => Promise<{ token_checkout: string; resumo: any } | null>;
  unfreezeCart: () => void;
  applyCoupon: (code: string) => Promise<{ ok: boolean; error?: string }>;
  removeCoupon: () => Promise<void>;
  pendingConflict: {
    restaurante: CartRestaurant;
    item: Omit<CartItem, "id" | "quantidade">;
    quantidade: number;
  } | null;
  dismissConflict: () => void;
}

// ─── Local storage (fallback para usuários não autenticados) ─────────────────

const STORAGE_KEY = "zupps_cart";

const emptyState = (): CartState => ({
  restaurante: null,
  itens: [],
  congelado: false,
  cupomAplicado: null,
  subtotalCentavosServer: null,
  freteCentavosServer: null,
  totalCentavosServer: null,
});

const loadLocalState = (): CartState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...emptyState(), ...parsed };
    }
  } catch {}
  return emptyState();
};

const saveLocalState = (state: CartState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

const generateId = () => Math.random().toString(36).slice(2, 10);

// ─── Hydration do servidor → CartState ────────────────────────────────────────

const hydrateFromServer = (carrinho: any): CartState => {
  const rest = carrinho.restaurante;
  const restaurante: CartRestaurant | null = rest
    ? {
        id: String(rest.id),
        nome_fantasia: rest.nome_fantasia,
        logotipo: rest.logotipo ?? null,
        is_open: rest.is_open ?? true,
        pedido_minimo_centavos: rest.pedido_minimo_centavos ?? 0,
        valor_frete_centavos: carrinho.frete_centavos ?? 0,
      }
    : null;

  const itens: CartItem[] = (carrinho.itens ?? []).map((it: any) => ({
    id: String(it.id),
    produto_id: String(it.produto_id),
    nome: it.nome,
    descricao: it.descricao ?? null,
    imagem: it.imagem ?? null,
    preco_unitario_centavos: it.preco_unitario_centavos,
    quantidade: it.quantidade,
    observacao: it.observacao ?? "",
    adicionais: (it.adicionais ?? []).map((a: any) => ({
      id: String(a.id),
      nome: a.nome,
      preco_centavos: a.preco_centavos,
    })),
  }));

  const cupomAplicado: CartCupom | null = carrinho.cupom_aplicado
    ? {
        codigo: carrinho.cupom_aplicado.codigo,
        desconto_centavos: carrinho.cupom_aplicado.desconto_centavos ?? 0,
        tipo: carrinho.cupom_aplicado.tipo ?? "percentual",
      }
    : null;

  return {
    restaurante,
    itens,
    congelado: carrinho.congelado ?? false,
    cupomAplicado,
    subtotalCentavosServer: carrinho.subtotal_centavos ?? null,
    freteCentavosServer: carrinho.frete_centavos ?? null,
    totalCentavosServer: carrinho.total_centavos ?? null,
  };
};

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CartState>(loadLocalState);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingConflict, setPendingConflict] = useState<{
    restaurante: CartRestaurant;
    item: Omit<CartItem, "id" | "quantidade">;
    quantidade: number;
  } | null>(null);

  // Evita múltiplos fetches simultâneos
  const hydrating = useRef(false);

  // ─── Hydration inicial do servidor ─────────────────────────────────────────

  useEffect(() => {
    const token = getAuthToken();
    if (!token || hydrating.current) return;

    hydrating.current = true;
    setIsLoading(true);

    carrinhoApi
      .get()
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (data.carrinho) {
          const serverState = hydrateFromServer(data.carrinho);
          setState(serverState);
          saveLocalState(serverState);
        } else {
          // Carrinho vazio no servidor — manter estado local limpo
          setState(emptyState());
          saveLocalState(emptyState());
        }
      })
      .catch(() => {
        // Falha de rede — manter estado local (offline graceful)
      })
      .finally(() => {
        setIsLoading(false);
        hydrating.current = false;
      });
  }, []);

  // Persiste no localStorage sempre que o estado muda
  useEffect(() => {
    saveLocalState(state);
  }, [state]);

  // ─── Helpers internos ──────────────────────────────────────────────────────

  const isAuthenticated = () => !!getAuthToken();

  const syncFromServerResponse = (res: Response): Promise<CartState | null> =>
    res.json().then((data) => {
      if (data.carrinho) {
        const s = hydrateFromServer(data.carrinho);
        setState(s);
        saveLocalState(s);
        return s;
      }
      // Carrinho apagado no servidor (ex: último item removido)
      const empty = emptyState();
      setState(empty);
      saveLocalState(empty);
      return null;
    });

  // ─── addItem ───────────────────────────────────────────────────────────────

  const addItem = useCallback(
    async (
      restaurante: CartRestaurant,
      item: Omit<CartItem, "id" | "quantidade">,
      quantidade = 1
    ): Promise<"added" | "conflict" | "error"> => {
      // --- Usuário autenticado: chama backend ---
      if (isAuthenticated()) {
        try {
          const res = await carrinhoApi.addItem({
            produto_id: item.produto_id,
            restaurante_id: restaurante.id,
            quantidade,
            observacao: item.observacao || "",
            adicionais_ids: item.adicionais.map((a) => Number(a.id)),
          });

          if (res.status === 409) {
            // Conflito de restaurante reportado pelo servidor
            setPendingConflict({ restaurante, item, quantidade });
            return "conflict";
          }

          if (!res.ok) return "error";

          await syncFromServerResponse(res);
          return "added";
        } catch {
          return "error";
        }
      }

      // --- Fallback local (não autenticado) ---
      if (
        state.restaurante &&
        state.restaurante.id !== restaurante.id &&
        state.itens.length > 0
      ) {
        setPendingConflict({ restaurante, item, quantidade });
        return "conflict";
      }

      setState((prev) => {
        const fp = `${item.produto_id}|${item.adicionais.map((a) => a.id).sort().join(",")}|${item.observacao.trim()}`;
        const existing = prev.itens.find(
          (i) =>
            `${i.produto_id}|${i.adicionais.map((a) => a.id).sort().join(",")}|${i.observacao.trim()}` === fp
        );
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

  // ─── confirmSwitch ─────────────────────────────────────────────────────────

  const confirmSwitch = useCallback(
    async (
      restaurante: CartRestaurant,
      item: Omit<CartItem, "id" | "quantidade">,
      quantidade = 1
    ) => {
      setPendingConflict(null);

      if (isAuthenticated()) {
        try {
          // Limpa o carrinho antigo e adiciona o novo item
          await carrinhoApi.clear();
          const res = await carrinhoApi.addItem({
            produto_id: item.produto_id,
            restaurante_id: restaurante.id,
            quantidade,
            observacao: item.observacao || "",
            adicionais_ids: item.adicionais.map((a) => Number(a.id)),
          });
          if (res.ok) await syncFromServerResponse(res);
        } catch {}
        return;
      }

      // Fallback local
      const newState: CartState = {
        ...emptyState(),
        restaurante,
        itens: [{ ...item, id: generateId(), quantidade }],
      };
      setState(newState);
      saveLocalState(newState);
    },
    []
  );

  // ─── updateQuantity ────────────────────────────────────────────────────────

  const updateQuantity = useCallback(async (itemId: string, delta: number) => {
    if (isAuthenticated()) {
      try {
        const currentItem = state.itens.find((i) => i.id === itemId);
        if (!currentItem) return;
        const novaQtd = Math.max(0, currentItem.quantidade + delta);
        const res = novaQtd === 0
          ? await carrinhoApi.removeItem(itemId)
          : await carrinhoApi.updateItem(itemId, novaQtd);
        if (res.ok) await syncFromServerResponse(res);
      } catch {}
      return;
    }

    // Fallback local
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
  }, [state.itens]);

  // ─── removeItem ────────────────────────────────────────────────────────────

  const removeItem = useCallback(async (itemId: string) => {
    if (isAuthenticated()) {
      try {
        const res = await carrinhoApi.removeItem(itemId);
        if (res.ok) await syncFromServerResponse(res);
      } catch {}
      return;
    }

    setState((prev) => {
      const updated = prev.itens.filter((i) => i.id !== itemId);
      return { ...prev, itens: updated, restaurante: updated.length === 0 ? null : prev.restaurante };
    });
  }, []);

  // ─── clearCart ─────────────────────────────────────────────────────────────

  const clearCart = useCallback(async () => {
    if (isAuthenticated()) {
      try {
        await carrinhoApi.clear();
      } catch {}
    }
    const empty = emptyState();
    setState(empty);
    saveLocalState(empty);
  }, []);

  // ─── freezeCart ────────────────────────────────────────────────────────────

  const freezeCart = useCallback(async (): Promise<{ token_checkout: string; resumo: any } | null> => {
    if (isAuthenticated()) {
      try {
        const res = await carrinhoApi.freeze();
        if (!res.ok) return null;
        const data = await res.json();
        setState((prev) => ({ ...prev, congelado: true }));
        return { token_checkout: data.token_checkout, resumo: data.resumo };
      } catch {
        return null;
      }
    }

    // Fallback local (sem backend)
    setState((prev) => ({ ...prev, congelado: true }));
    return null;
  }, []);

  // ─── unfreezeCart ──────────────────────────────────────────────────────────

  const unfreezeCart = useCallback(() => {
    setState((prev) => ({ ...prev, congelado: false }));
  }, []);


  // ─── applyCoupon ───────────────────────────────────────────────────────────

  const applyCoupon = useCallback(
    async (code: string): Promise<{ ok: boolean; error?: string }> => {
      if (!isAuthenticated()) return { ok: false, error: "Faça login para usar cupons." };
      try {
        const res = await carrinhoApi.applyCoupon(code.trim().toUpperCase());
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.error ?? "Cupom inválido." };
        if (data.carrinho) {
          const s = hydrateFromServer(data.carrinho);
          setState(s);
          saveLocalState(s);
        }
        return { ok: true };
      } catch {
        return { ok: false, error: "Erro de conexão." };
      }
    },
    []
  );

  // ─── removeCoupon ──────────────────────────────────────────────────────────

  const removeCoupon = useCallback(async () => {
    if (!isAuthenticated()) return;
    try {
      const res = await carrinhoApi.removeCoupon();
      if (res.ok) await syncFromServerResponse(res);
    } catch {}
  }, []);

  // ─── dismissConflict ───────────────────────────────────────────────────────

  const dismissConflict = useCallback(() => setPendingConflict(null), []);

  // ─── Computed values ───────────────────────────────────────────────────────

  // Usa os valores do servidor quando disponíveis (incluem desconto de cupom)
  const subtotalCentavos =
    state.subtotalCentavosServer ??
    state.itens.reduce((sum, item) => {
      const addTotal = item.adicionais.reduce((s, a) => s + a.preco_centavos, 0);
      return sum + (item.preco_unitario_centavos + addTotal) * item.quantidade;
    }, 0);

  const freteCentavos = state.freteCentavosServer ?? state.restaurante?.valor_frete_centavos ?? 0;
  const totalCentavos = state.totalCentavosServer ?? subtotalCentavos + freteCentavos;
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
        isLoading,
        cupomAplicado: state.cupomAplicado,
        addItem,
        confirmSwitch,
        updateQuantity,
        removeItem,
        clearCart,
        freezeCart,
        unfreezeCart,
        applyCoupon,
        removeCoupon,
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
