import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  CreditCard,
} from "lucide-react";
import {
  HistoricoTransacao,
  StatusPagamento,
  formatCentavos,
  listarTransacoes,
} from "@/lib/payments";

const statusConfig: Record<
  StatusPagamento,
  { label: string; icon: typeof CheckCircle2; classes: string }
> = {
  aprovado: { label: "Aprovado", icon: CheckCircle2, classes: "text-green-500 bg-green-500/10" },
  recusado: { label: "Recusado", icon: XCircle, classes: "text-destructive bg-destructive/10" },
  pendente: { label: "Pendente", icon: Clock, classes: "text-amber-500 bg-amber-500/10" },
};

const MeusPedidosPage = () => {
  const navigate = useNavigate();
  const [transacoes] = useState<HistoricoTransacao[]>(() => listarTransacoes());

  const [statusFilter, setStatusFilter] = useState<StatusPagamento | "todos">("todos");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  const filtradas = useMemo(() => {
    return transacoes.filter((t) => {
      if (statusFilter !== "todos" && t.status !== statusFilter) return false;
      const ts = new Date(t.criado_em).getTime();
      if (dataInicio) {
        const start = new Date(dataInicio + "T00:00:00").getTime();
        if (ts < start) return false;
      }
      if (dataFim) {
        const end = new Date(dataFim + "T23:59:59").getTime();
        if (ts > end) return false;
      }
      return true;
    });
  }, [transacoes, statusFilter, dataInicio, dataFim]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center gap-3 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-base font-extrabold text-foreground">Meus pedidos</h1>
        </div>
      </header>

      <div className="container py-6 max-w-2xl space-y-5">
        {/* Filters */}
        <section className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-muted-foreground" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Filtros
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {(["todos", "aprovado", "recusado", "pendente"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 h-8 rounded-full text-xs font-bold transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/70"
                }`}
              >
                {s === "todos" ? "Todos" : statusConfig[s].label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground mb-1 block">De</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground mb-1 block">Até</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </section>

        {/* List */}
        {filtradas.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <ShoppingBag size={42} className="mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="text-sm font-bold text-foreground mb-1">Nenhum pedido encontrado</p>
            <p className="text-xs text-muted-foreground mb-5">
              {transacoes.length === 0
                ? "Você ainda não realizou nenhum pedido."
                : "Tente ajustar os filtros acima."}
            </p>
            <button
              onClick={() => navigate("/cliente-home")}
              className="px-5 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              Explorar restaurantes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map((tx) => {
              const cfg = statusConfig[tx.status];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-card border border-border p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-foreground truncate">
                        {tx.restaurante_nome}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {tx.numero_pedido} · {formatDate(tx.criado_em)}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${cfg.classes}`}>
                      <Icon size={11} />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    {tx.itens.slice(0, 3).map((it, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground truncate">
                        {it.quantidade}x {it.nome}
                      </p>
                    ))}
                    {tx.itens.length > 3 && (
                      <p className="text-[11px] text-muted-foreground italic">
                        +{tx.itens.length - 3} item(ns)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CreditCard size={12} />
                      {tx.cartao_bandeira} •••• {tx.cartao_ultimos4}
                    </span>
                    <span className="text-sm font-extrabold text-foreground">
                      {formatCentavos(tx.total_centavos)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeusPedidosPage;
