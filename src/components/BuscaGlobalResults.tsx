import { motion } from "framer-motion";
import { Star, Clock, Truck, Package, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProdutoBusca, API_BASE_URL } from "@/lib/api";

interface Props {
  results: ProdutoBusca[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

/**
 * Lista de resultados da busca global.
 * RF-04 Req.6: exibe metadados da loja em cada item.
 * RF-05 Req.6: exibe preço original riscado quando há promoção.
 */
export function BuscaGlobalResults({ results }: Props) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {results.map((produto, i) => (
        <motion.div
          key={produto.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() =>
            produto.restaurante && navigate(`/restaurante/${produto.restaurante.id}`)
          }
          className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover cursor-pointer transition-all"
        >
          {/* Imagem do produto */}
          <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center border border-border/50">
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

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{produto.nome}</h3>
            {produto.descricao && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {produto.descricao}
              </p>
            )}

            {/* RF-05: Preço com destaque para promoção */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {produto.em_promocao ? (
                <>
                  <span className="text-xs line-through text-muted-foreground">
                    {formatCurrency(produto.preco_original!)}
                  </span>
                  <span className="text-sm font-extrabold text-primary">
                    {formatCurrency(produto.preco_promocional!)}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    OFERTA
                  </span>
                </>
              ) : (
                <span className="text-sm font-extrabold text-primary">
                  {formatCurrency(produto.preco)}
                </span>
              )}
            </div>

            {/* RF-04: Metadados da loja */}
            {produto.restaurante && (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs font-semibold text-foreground truncate max-w-[120px]">
                  <Store size={11} className="text-muted-foreground shrink-0" />
                  {produto.restaurante.nome}
                </span>

                {produto.restaurante.nota_avaliacao != null && (
                  <span className="flex items-center gap-1 text-xs font-semibold">
                    <Star size={11} className="text-secondary fill-secondary" />
                    {produto.restaurante.nota_avaliacao.toFixed(1)}
                  </span>
                )}

                {produto.restaurante.tempo_entrega_minutos != null && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={11} />
                    {produto.restaurante.tempo_entrega_minutos} min
                  </span>
                )}

                {produto.restaurante.valor_frete != null && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Truck size={11} />
                    {produto.restaurante.valor_frete === 0
                      ? "Frete grátis"
                      : formatCurrency(produto.restaurante.valor_frete)}
                  </span>
                )}

                {/* RF-06 Req.7: badge aberto/fechado */}
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    produto.restaurante.is_open
                      ? "bg-green-500/10 text-green-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {produto.restaurante.is_open ? "Aberto" : "Fechado"}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
