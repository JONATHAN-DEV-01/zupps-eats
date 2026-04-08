import { useState, useEffect } from "react";
import { useDebounce } from "./useDebounce";
import { buscarProdutos, BuscaResponse } from "@/lib/api";

/**
 * Hook de busca global de produtos.
 * - Aplica debounce de 500ms (RN-02)
 * - Só dispara com mínimo 3 caracteres (RN-02)
 * - Gerencia estado de loading, resultado e erro
 */
export function useBusca() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<BuscaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    // RN-02: mínimo 3 caracteres para disparar busca
    if (debouncedQuery.length < 3) {
      setResult(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    buscarProdutos(debouncedQuery)
      .then(setResult)
      .catch((err: Error) => setError(err.message || "Não foi possível realizar a busca."))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const clearBusca = () => {
    setQuery("");
    setResult(null);
    setError(null);
  };

  return { query, setQuery, result, loading, error, clearBusca };
}
