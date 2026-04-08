import { useNavigate } from "react-router-dom";
import { Categoria } from "@/lib/api";

interface Props {
  categorias: Categoria[];
  lojas: { id: string; nome: string }[];
}

/**
 * Exibido quando a busca retorna zero resultados (RN-03 Req.6).
 * Mostra sugestões de categorias populares e lojas abertas próximas.
 */
export function FallbackSugestoes({ categorias, lojas }: Props) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 mt-2">
      {categorias.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Categorias populares
          </p>
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/cliente-home?categoria=${c.id}`)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                {c.imagem_url ? (
                  <img
                    src={c.imagem_url}
                    alt={c.nome}
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-base">🍽️</span>
                )}
                {c.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {lojas.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Restaurantes abertos perto de você
          </p>
          <div className="space-y-2">
            {lojas.map((loja) => (
              <button
                key={loja.id}
                onClick={() => navigate(`/restaurante/${loja.id}`)}
                className="w-full text-left px-4 py-3 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                {loja.nome}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
