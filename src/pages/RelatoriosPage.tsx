import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, LogOut, TrendingUp, ShoppingBag, DollarSign, Receipt,
  Clock, Truck, XCircle, BarChart3, Calendar as CalendarIcon,
  ChevronDown, RefreshCw, AlertCircle, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { removeAuthToken, API_BASE_URL, getAuthToken } from "@/lib/api";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ─────────────────────────────────────────────────────────────────

interface RestauranteOpcao {
  id: string;
  nome: string;
}

interface KPIs {
  total_pedidos: number;
  receita_bruta: number;
  ticket_medio: number;
  taxa_cancelamento: number;
}

interface EvolucaoDia {
  dia: string;
  valor: number;
}

interface TopProduto {
  nome: string;
  qtd: number;
  receita: number;
}

interface HorarioPico {
  hora: string;
  pedidos: number;
}

interface Transacao {
  id: string;
  data: string;
  metodo: string;
  valor: number;
  status: string;
}

// ─── API helpers ───────────────────────────────────────────────────────────

const dashboardFetch = async (endpoint: string, params: Record<string, string>) => {
  const token = getAuthToken();
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}${endpoint}?${qs}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
};

// ─── Período options ───────────────────────────────────────────────────────

const PERIODOS = [
  { id: "7", label: "Últimos 7 dias" },
  { id: "30", label: "Últimos 30 dias" },
  { id: "90", label: "Últimos 90 dias" },
  { id: "custom", label: "Personalizado" },
];

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
];

// ─── Loading skeleton ──────────────────────────────────────────────────────

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-muted ${className}`} />
);

// ─── Component ─────────────────────────────────────────────────────────────

const RelatoriosPage = () => {
  const navigate = useNavigate();

  // Filtros
  const [restaurantes, setRestaurantes] = useState<RestauranteOpcao[]>([]);
  const [restaurante, setRestaurante] = useState("all");
  const [periodo, setPeriodo] = useState("30");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Dashboard data
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [evolucao, setEvolucao] = useState<EvolucaoDia[]>([]);
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([]);
  const [horarios, setHorarios] = useState<HorarioPico[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("user_profile");
    navigate("/");
  };

  // Build query params based on current filters
  const buildParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = { restaurante_id: restaurante };
    if (periodo === "custom" && dateRange?.from && dateRange?.to) {
      params.data_inicio = format(dateRange.from, "yyyy-MM-dd");
      params.data_fim = format(dateRange.to, "yyyy-MM-dd");
    } else {
      params.periodo = periodo === "custom" ? "30" : periodo;
    }
    return params;
  }, [restaurante, periodo, dateRange]);

  // Load restaurants list
  useEffect(() => {
    dashboardFetch("/dashboard/restaurantes", {})
      .then((data: RestauranteOpcao[]) => {
        setRestaurantes([{ id: "all", nome: "Todos os Restaurantes" }, ...data]);
      })
      .catch(() => {
        setRestaurantes([{ id: "all", nome: "Todos os Restaurantes" }]);
      });
  }, []);

  // Load all dashboard data
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = buildParams();

    try {
      const [kpisData, evolucaoData, produtosData, horariosData, transacoesData] =
        await Promise.all([
          dashboardFetch("/dashboard/kpis", params),
          dashboardFetch("/dashboard/evolucao", params),
          dashboardFetch("/dashboard/top-produtos", params),
          dashboardFetch("/dashboard/horarios", params),
          dashboardFetch("/dashboard/ultimas-transacoes", params),
        ]);

      setKpis(kpisData);
      setEvolucao(evolucaoData);
      setTopProdutos(produtosData);
      setHorarios(horariosData);
      setTransacoes(transacoesData);
      setLastUpdate(new Date());
    } catch (e: any) {
      setError("Não foi possível carregar os dados. Verifique a conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Re-fetch when filters change (skip custom period until both dates selected)
  useEffect(() => {
    if (periodo === "custom") {
      if (dateRange?.from && dateRange?.to) fetchDashboard();
      return;
    }
    fetchDashboard();
  }, [restaurante, periodo, dateRange, fetchDashboard]);

  const periodoLabel =
    periodo === "custom" && dateRange?.from
      ? `${format(dateRange.from, "dd/MM", { locale: ptBR })}${
          dateRange.to ? ` – ${format(dateRange.to, "dd/MM", { locale: ptBR })}` : ""
        }`
      : PERIODOS.find((p) => p.id === periodo)?.label;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/restaurante-home" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-extrabold text-lg">Z</span>
            </div>
            <span className="font-extrabold text-xl text-foreground tracking-tight">Zupps</span>
          </Link>

          <div className="flex items-center gap-3">
            {lastUpdate && !loading && (
              <span className="hidden sm:inline text-[11px] text-muted-foreground">
                Atualizado às {format(lastUpdate, "HH:mm")}
              </span>
            )}
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
              title="Atualizar dados"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container py-6 max-w-6xl space-y-6">
        {/* ── Title ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            <BarChart3 size={14} className="text-primary" />
            Relatórios
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Painel de Análises</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe a performance do seu negócio em tempo real.
          </p>
        </motion.div>

        {/* ── Filters ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl bg-card border border-border shadow-card flex flex-col sm:flex-row gap-3 sm:items-center"
        >
          {/* Restaurant filter */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Store size={16} className="text-primary flex-shrink-0" />
            <Select value={restaurante} onValueChange={setRestaurante}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {restaurantes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period filter */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CalendarIcon size={16} className="text-primary flex-shrink-0" />
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {periodo === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-xl gap-2 flex-shrink-0">
                    <CalendarIcon size={14} />
                    <span className="text-xs">{periodoLabel || "Selecionar"}</span>
                    <ChevronDown size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </motion.div>

        {/* ── Error state ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════ FINANCEIRO & VENDAS ══════════════ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-foreground">Financeiro &amp; Vendas</h2>
            <span className="text-[11px] text-muted-foreground">{periodoLabel}</span>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                icon: ShoppingBag,
                label: "Pedidos Totais",
                value: loading ? null : kpis?.total_pedidos.toLocaleString("pt-BR") ?? "—",
                color: "text-primary",
              },
              {
                icon: DollarSign,
                label: "Receita Bruta",
                value: loading ? null : kpis ? `R$ ${kpis.receita_bruta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—",
                color: "text-accent",
              },
              {
                icon: Receipt,
                label: "Ticket Médio",
                value: loading ? null : kpis ? `R$ ${kpis.ticket_medio.toFixed(2).replace(".", ",")}` : "—",
                color: "text-secondary",
              },
              {
                icon: XCircle,
                label: "Taxa de Cancelamento",
                value: loading ? null : kpis ? `${kpis.taxa_cancelamento.toFixed(1)}%` : "—",
                color: "text-destructive",
              },
            ].map((kpi) => (
              <div key={kpi.label} className="p-5 rounded-2xl bg-card border border-border shadow-card">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {kpi.label}
                  </span>
                  <kpi.icon size={18} className={kpi.color} />
                </div>
                {kpi.value === null ? (
                  <Skeleton className="h-7 w-24 mt-1" />
                ) : (
                  <div className="text-2xl font-extrabold text-foreground">{kpi.value}</div>
                )}
              </div>
            ))}
          </div>

          {/* Revenue evolution chart */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-1">Evolução do Faturamento</h3>
            <p className="text-[11px] text-muted-foreground mb-4">Receita diária no período selecionado</p>
            {loading ? (
              <Skeleton className="h-60 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={evolucao}>
                  <defs>
                    <linearGradient id="grad-fat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={11} interval="preserveStartEnd" />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                    formatter={(v: number) => [`R$ ${v.toFixed(2).replace(".", ",")}`, "Faturamento"]}
                  />
                  <Area type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#grad-fat)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Last transactions */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-4">Últimas Transações</h3>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : transacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma transação no período</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-bold uppercase text-muted-foreground border-b border-border">
                      <th className="py-2">ID</th>
                      <th className="py-2">Data/Hora</th>
                      <th className="py-2">Método</th>
                      <th className="py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacoes.map((t) => (
                      <tr key={t.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 font-mono text-xs text-foreground">{t.id}</td>
                        <td className="py-3 text-muted-foreground text-xs">{t.data}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold text-foreground">
                            {t.metodo}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-foreground">
                          R$ {t.valor.toFixed(2).replace(".", ",")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════ PRODUTOS & PERFORMANCE ══════════════ */}
        <section className="space-y-4 pt-2 border-t border-border">
          <h2 className="text-lg font-extrabold text-foreground pt-4">Produtos &amp; Performance</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top produtos bar chart */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
              <h3 className="text-sm font-bold text-foreground mb-1">Top 8 Itens Mais Vendidos</h3>
              <p className="text-[11px] text-muted-foreground mb-4">Volume por produto</p>
              {loading ? (
                <Skeleton className="h-72 w-full" />
              ) : topProdutos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sem dados no período</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={topProdutos} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis type="category" dataKey="nome" stroke="hsl(var(--muted-foreground))" fontSize={10} width={120} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                      formatter={(v: number) => [v, "Qtd. vendida"]}
                    />
                    <Bar dataKey="qtd" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Faturamento por produto (pie) */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
              <h3 className="text-sm font-bold text-foreground mb-1">Faturamento por Produto</h3>
              <p className="text-[11px] text-muted-foreground mb-4">Participação dos top 8 itens</p>
              {loading ? (
                <Skeleton className="h-72 w-full" />
              ) : topProdutos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sem dados no período</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={topProdutos}
                      dataKey="receita"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={3}
                    >
                      {topProdutos.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                      formatter={(v: number) => [`R$ ${v.toFixed(2).replace(".", ",")}`, "Receita"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top produtos table */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-4">Performance dos Top Produtos</h3>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : topProdutos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sem dados no período</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-bold uppercase text-muted-foreground border-b border-border">
                      <th className="py-2">#</th>
                      <th className="py-2">Produto</th>
                      <th className="py-2 text-right">Qtd. Vendida</th>
                      <th className="py-2 text-right">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProdutos.map((p, i) => (
                      <tr key={p.nome} className="border-b border-border/50 last:border-0">
                        <td className="py-3 font-extrabold text-primary">
                          {String(i + 1).padStart(2, "0")}
                        </td>
                        <td className="py-3 font-semibold text-foreground">{p.nome}</td>
                        <td className="py-3 text-right text-foreground">
                          {p.qtd.toLocaleString("pt-BR")}
                        </td>
                        <td className="py-3 text-right font-bold text-foreground">
                          R$ {p.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Peak hours chart */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-1">Horário de Pico</h3>
            <p className="text-[11px] text-muted-foreground mb-4">Volume de pedidos por hora</p>
            {loading ? (
              <Skeleton className="h-60 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={horarios}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="hora" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                    formatter={(v: number) => [v, "Pedidos"]}
                  />
                  <Bar dataKey="pedidos" radius={[6, 6, 0, 0]}>
                    {horarios.map((h, i) => (
                      <Cell
                        key={i}
                        fill={
                          h.pedidos >= Math.max(...horarios.map((x) => x.pedidos)) * 0.7
                            ? "hsl(var(--primary))"
                            : "hsl(var(--primary) / 0.4)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* ══════════════ OPERAÇÃO ══════════════ */}
        <section className="space-y-4 pt-2 border-t border-border">
          <h2 className="text-lg font-extrabold text-foreground pt-4">Operação</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Clock, label: "Pedidos no Período", value: loading ? null : kpis?.total_pedidos.toLocaleString("pt-BR") ?? "—", color: "text-primary" },
              { icon: Truck, label: "Receita Bruta", value: loading ? null : kpis ? `R$ ${kpis.receita_bruta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—", color: "text-accent" },
              { icon: XCircle, label: "Taxa de Cancelamento", value: loading ? null : kpis ? `${kpis.taxa_cancelamento.toFixed(1)}%` : "—", color: "text-destructive" },
            ].map((m) => (
              <div key={m.label} className="p-5 rounded-2xl bg-card border border-border shadow-card">
                <m.icon size={18} className={`${m.color} mb-2`} />
                {m.value === null ? (
                  <Skeleton className="h-7 w-20 mb-1" />
                ) : (
                  <div className="text-xl font-extrabold text-foreground">{m.value}</div>
                )}
                <div className="text-[11px] text-muted-foreground mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default RelatoriosPage;
