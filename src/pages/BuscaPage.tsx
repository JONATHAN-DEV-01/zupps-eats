import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, X, PackageSearch } from "lucide-react";
import { useBusca } from "@/hooks/useBusca";
import { fetchTodasCategorias, Categoria } from "@/lib/api";
import { BuscaGlobalResults } from "@/components/BuscaGlobalResults";
import { FallbackSugestoes } from "@/components/FallbackSugestoes";
import { useState } from "react";
import FloatingCartButton from "@/components/FloatingCartButton";
import HeaderCartButton from "@/components/HeaderCartButton";

/**
 * Página de busca global — RF-01 ao RF-05 Req.6 + RF-03 Req.7.
 * Acessível em: /busca
 */
const BuscaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { query, setQuery, result, loading, clearBusca } = useBusca();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // RF-03 Req.7: grade de todas as categorias
  useEffect(() => {
    fetchTodasCategorias()
      .then(setCategorias)
      .finally(() => setLoadingCats(false));
  }, []);

  // Pré-preenche a busca via query param (/busca?q=hamburguer)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasResults = result && result.total > 0;
  const hasFallback = result && result.total === 0 && result.fallback;
  const showGrade = query.length < 3;

  return (
    <div className="min-h-screen bg-background">
      {/* Header com campo de busca inline */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center h-14 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>

          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produtos em todos os restaurantes..."
              className="w-full h-10 pl-9 pr-9 rounded-xl bg-muted border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground transition-all"
            />
            {query && (
              <button
                onClick={clearBusca}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <HeaderCartButton />
        </div>
      </header>

      <div className="container py-6 max-w-2xl">
        {/* Loading spinner */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-12 gap-3"
            >
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Buscando produtos...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resultados encontrados */}
        {!loading && hasResults && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs text-muted-foreground mb-4">
              <span className="font-bold text-foreground">{result.total}</span> resultado(s) para{" "}
              <span className="font-bold text-foreground">"{result.q}"</span>
            </p>
            <BuscaGlobalResults results={result.results} />
          </motion.div>
        )}

        {/* Fallback RN-03: nenhum resultado */}
        {!loading && hasFallback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6"
          >
            <PackageSearch
              size={48}
              className="mx-auto text-muted-foreground mb-3 opacity-30"
            />
            <p className="text-sm font-bold text-foreground mb-1">
              Nenhum resultado para "{result.q}"
            </p>
            <p className="text-xs text-muted-foreground">
              {result.message || "Tente outro termo ou explore as categorias abaixo."}
            </p>
            <FallbackSugestoes
              categorias={result.fallback!.sugestoes_categorias}
              lojas={result.fallback!.lojas_proximas}
            />
          </motion.div>
        )}

        {/* Grade de Categorias RF-03 Req.7 — visível quando busca < 3 chars */}
        {showGrade && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {query.length > 0 && query.length < 3 && (
              <p className="text-xs text-muted-foreground mb-4">
                Continue digitando para pesquisar...
              </p>
            )}

            <h2 className="text-sm font-bold text-foreground mb-4">
              {query.length === 0 ? "Explorar por categoria" : ""}
            </h2>

            {loadingCats ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : categorias.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {categorias.map((cat, i) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/cliente-home?categoria=${cat.id}`)}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
                  >
                    {cat.imagem_url ? (
                      <img
                        src={cat.imagem_url}
                        alt={cat.nome}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).replaceWith(
                            Object.assign(document.createElement("span"), {
                              textContent: "🍽️",
                              className: "text-3xl",
                            })
                          );
                        }}
                      />
                    ) : (
                      <span className="text-3xl">🍽️</span>
                    )}
                    <span className="text-[11px] font-semibold text-center leading-tight text-foreground">
                      {cat.nome}
                    </span>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma categoria disponível.
              </p>
            )}
          </motion.div>
        )}
      </div>
      <FloatingCartButton />
    </div>
  );
};

export default BuscaPage;
