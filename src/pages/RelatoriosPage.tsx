import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, MapPin, ShoppingBag, DollarSign, Receipt, XCircle,
  Package, TrendingUp, Flame, Clock, RefreshCw, AlertCircle,
  Calendar as CalendarIcon, ChevronDown, Filter, Search,
  BarChart3, Map, ArrowUpRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Line, Cell, Legend,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { removeAuthToken, API_BASE_URL, getAuthToken, getUserProfile, resolveImageUrl } from "@/lib/api";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "regioes" | "mais-vendidos" | "horarios";

interface RestauranteOpcao { id: string; nome: string }
interface KPIs {
  total_pedidos: number; receita_bruta: number;
  ticket_medio: number; taxa_cancelamento: number;
}
interface Regiao { bairro: string; cidade: string; pedidos: number; receita: number }
interface TopProduto { nome: string; qtd: number; receita: number }
interface HorarioPico { hora: string; pedidos: number }
interface HeatmapData { matrix: Record<string, number[]>; tabela: { horario: string; pedidos: number }[] }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const dashFetch = async (endpoint: string, params: Record<string, string>) => {
  const token = getAuthToken();
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}${endpoint}?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
);

const fmt = (n: number) => n.toLocaleString("pt-BR");
const fmtR = (n: number) =>
  `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

// ─── Period filter buttons ────────────────────────────────────────────────────

const PERIODOS = [
  { id: "1",  label: "Hoje" },
  { id: "7",  label: "Últimos 7 dias" },
  { id: "30", label: "Últimos 30 dias" },
  { id: "custom", label: "Personalizado" },
];

interface PeriodBarProps {
  periodo: string;
  setPeriodo: (p: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (d: DateRange | undefined) => void;
  children?: React.ReactNode;
}

const PeriodBar = ({ periodo, setPeriodo, dateRange, setDateRange, children }: PeriodBarProps) => {
  const periodoLabel =
    periodo === "custom" && dateRange?.from
      ? `${format(dateRange.from, "dd/MM", { locale: ptBR })}${dateRange.to ? ` – ${format(dateRange.to, "dd/MM", { locale: ptBR })}` : ""}`
      : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PERIODOS.map((p) => (
        <button
          key={p.id}
          onClick={() => setPeriodo(p.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
            periodo === p.id
              ? "bg-foreground text-background border-foreground"
              : "bg-transparent text-foreground border-border hover:border-foreground/40"
          }`}
        >
          {p.label}
        </button>
      ))}

      {periodo === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-8 text-sm">
              <CalendarIcon size={13} />
              {periodoLabel || "Selecionar datas"}
              <ChevronDown size={13} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={ptBR} />
          </PopoverContent>
        </Popover>
      )}

      {children}
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | null;
  sub?: string;
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
}

const KpiCard = ({ label, value, sub, icon: Icon, iconBg = "bg-primary/10", iconColor = "text-primary" }: KpiCardProps) => (
  <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
    <div className="flex items-start justify-between mb-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
    </div>
    {value === null ? (
      <Skeleton className="h-8 w-28" />
    ) : (
      <div className="text-2xl font-extrabold text-foreground tracking-tight">{value}</div>
    )}
    {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
  </div>
);

// ─── Heatmap component ────────────────────────────────────────────────────────

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HORAS_EXIBIDAS = [0, 3, 6, 9, 12, 15, 18, 21];

const Heatmap = ({ data }: { data: HeatmapData | null }) => {
  if (!data) return <Skeleton className="h-48 w-full" />;

  const matrix = data.matrix;
  const maxVal = Math.max(...DIAS_SEMANA.flatMap((d) => matrix[d] ?? [])) || 1;

  const getColor = (v: number) => {
    if (v === 0) return "#fef3e2";
    const ratio = v / maxVal;
    if (ratio < 0.25) return "#fde4b8";
    if (ratio < 0.5)  return "#f8a642";
    if (ratio < 0.75) return "#ea6c00";
    return "#c44d00";
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Hour labels */}
        <div className="flex ml-8 mb-1">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="flex-1 text-center" style={{ minWidth: 22 }}>
              {HORAS_EXIBIDAS.includes(h) && (
                <span className="text-[10px] text-muted-foreground">{String(h).padStart(2, "0")}</span>
              )}
            </div>
          ))}
        </div>

        {/* Rows */}
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="flex items-center gap-1 mb-1">
            <span className="w-7 text-[11px] font-semibold text-muted-foreground shrink-0">{dia}</span>
            {(matrix[dia] ?? Array(24).fill(0)).map((v, h) => (
              <div
                key={h}
                title={`${dia} ${String(h).padStart(2, "0")}h: ${v} pedidos`}
                className="rounded-sm transition-opacity hover:opacity-80 cursor-default"
                style={{ width: 22, height: 22, backgroundColor: getColor(v), flexShrink: 0 }}
              />
            ))}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 ml-8">
          <span className="text-[10px] text-muted-foreground">Menor volume</span>
          {["#fef3e2", "#fde4b8", "#f8a642", "#ea6c00", "#c44d00"].map((c) => (
            <div key={c} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[10px] text-muted-foreground">Maior volume</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const RelatoriosPage = () => {
  const navigate = useNavigate();
  const restaurant = getUserProfile();

  // Navigation
  const [activeTab, setActiveTab] = useState<Tab>("regioes");

  // Shared filters
  const [restaurantes, setRestaurantes] = useState<RestauranteOpcao[]>([]);
  const [restaurante, setRestaurante] = useState("all");
  const [periodo, setPeriodo] = useState("30");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Per-tab search
  const [searchRegiao, setSearchRegiao] = useState("");

  // Data
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([]);
  const [horarios, setHorarios] = useState<HorarioPico[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);

  // UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("user_profile");
    navigate("/");
  };

  const buildParams = useCallback((): Record<string, string> => {
    const p: Record<string, string> = { restaurante_id: restaurante };
    if (periodo === "custom" && dateRange?.from && dateRange?.to) {
      p.data_inicio = format(dateRange.from, "yyyy-MM-dd");
      p.data_fim = format(dateRange.to, "yyyy-MM-dd");
    } else {
      p.periodo = periodo === "custom" ? "30" : periodo;
    }
    return p;
  }, [restaurante, periodo, dateRange]);

  // Load restaurant list once
  useEffect(() => {
    dashFetch("/dashboard/restaurantes", {})
      .then((d: RestauranteOpcao[]) =>
        setRestaurantes([{ id: "all", nome: "Todos os Restaurantes" }, ...d])
      )
      .catch(() => setRestaurantes([{ id: "all", nome: "Todos os Restaurantes" }]));
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = buildParams();
    try {
      const [kpisD, regD, prodD, horD, heatD] = await Promise.all([
        dashFetch("/dashboard/kpis", params),
        dashFetch("/dashboard/regioes", params),
        dashFetch("/dashboard/top-produtos", params),
        dashFetch("/dashboard/horarios", params),
        dashFetch("/dashboard/heatmap", params),
      ]);
      setKpis(kpisD);
      setRegioes(regD);
      setTopProdutos(prodD);
      setHorarios(horD);
      setHeatmap(heatD);
      setLastUpdate(new Date());
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        handleLogout();
      } else {
        setError("Não foi possível carregar os dados. Verifique a conexão com o servidor.");
      }
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    if (periodo === "custom" && !(dateRange?.from && dateRange?.to)) return;
    fetchAll();
  }, [restaurante, periodo, dateRange, fetchAll]);

  // ── Computed ────────────────────────────────────────────────────────────────

  const filteredRegioes = regioes.filter(
    (r) =>
      r.bairro.toLowerCase().includes(searchRegiao.toLowerCase()) ||
      r.cidade.toLowerCase().includes(searchRegiao.toLowerCase())
  );

  const maxReceita = Math.max(...regioes.map((r) => r.receita), 1);

  const totalUnidades = topProdutos.reduce((s, p) => s + p.qtd, 0);
  const totalReceita = topProdutos.reduce((s, p) => s + p.receita, 0);
  const ticketItem = totalUnidades > 0 ? totalReceita / totalUnidades : 0;
  const maxQtd = Math.max(...topProdutos.map((p) => p.qtd), 1);

  const picoHora = horarios.reduce(
    (best, h) => (h.pedidos > best.pedidos ? h : best),
    { hora: "—", pedidos: 0 }
  );
  const lentoHora = horarios.reduce(
    (worst, h) => (h.pedidos > 0 && h.pedidos < worst.pedidos ? h : worst),
    { hora: "—", pedidos: Infinity }
  );

  // ── Tab definitions ──────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string }[] = [
    { id: "regioes", label: "Vendas por Região" },
    { id: "mais-vendidos", label: "Mais Vendidos" },
    { id: "horarios", label: "Horário de Pico" },
  ];

  const periodoLabel =
    periodo === "custom" && dateRange?.from
      ? `${format(dateRange.from, "dd/MM", { locale: ptBR })}${dateRange.to ? ` – ${format(dateRange.to, "dd/MM", { locale: ptBR })}` : ""}`
      : PERIODOS.find((p) => p.id === periodo)?.label ?? "";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fafaf9] font-sans">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between h-14">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link to="/restaurante-home" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-extrabold text-base">Z</span>
              </div>
              <div>
                <div className="font-extrabold text-sm text-foreground leading-none">Zupps Eats</div>
                <div className="text-[10px] text-muted-foreground">Painel do Parceiro</div>
              </div>
            </Link>


          </div>

          {/* Right: restaurant + refresh + logout */}
          <div className="flex items-center gap-3">
            {lastUpdate && !loading && (
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                Atualizado há {Math.round((Date.now() - lastUpdate.getTime()) / 60000)} min
              </span>
            )}
            <button
              onClick={fetchAll}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>

            {restaurant && (
              <div className="hidden sm:flex items-center gap-2 text-right">
                <div>
                  <div className="text-xs font-bold text-foreground leading-none">{restaurant.nome_fantasia || restaurant.nome}</div>
                  <div className="text-[10px] text-muted-foreground">{restaurant.cidade || ""}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {(restaurant.nome_fantasia || restaurant.nome || "?").charAt(0).toUpperCase()}
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="max-w-[1280px] mx-auto px-6 border-t border-border">
          <div className="flex items-center gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-3 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-[1280px] mx-auto px-6 pt-4"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle size={15} />
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          TAB 1 — VENDAS POR REGIÃO
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {activeTab === "regioes" && (
          <motion.div
            key="regioes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-[1280px] mx-auto px-6 py-8 space-y-6"
          >
            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Relatórios</div>
                <h1 className="text-3xl font-extrabold text-foreground">Vendas por Região</h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                  Visualize e filtre dados de vendas segmentados por bairro para apoiar decisões de expansão.
                </p>
              </div>
              {lastUpdate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 mt-1">
                  <CalendarIcon size={12} />
                  Última atualização: {format(lastUpdate, "dd/MM/yyyy · HH:mm")}
                </div>
              )}
            </div>

            {/* Filter bar */}
            <div className="bg-white border border-border rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <Filter size={13} />
                Filtros
              </div>
              <PeriodBar periodo={periodo} setPeriodo={setPeriodo} dateRange={dateRange} setDateRange={setDateRange}>
                <Select value={restaurante} onValueChange={setRestaurante}>
                  <SelectTrigger className="h-8 rounded-full text-sm w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurantes.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </PeriodBar>

              <div className="sm:ml-auto flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                <Search size={14} className="text-muted-foreground" />
                <input
                  value={searchRegiao}
                  onChange={(e) => setSearchRegiao(e.target.value)}
                  placeholder="Buscar região..."
                  className="bg-transparent text-sm outline-none w-36 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Pedidos Totais" value={loading ? null : fmt(kpis?.total_pedidos ?? 0)} icon={ShoppingBag} sub={periodoLabel} />
              <KpiCard label="Receita Bruta" value={loading ? null : fmtR(kpis?.receita_bruta ?? 0)} icon={DollarSign} iconBg="bg-accent/10" iconColor="text-accent" sub={periodoLabel} />
              <KpiCard label="Ticket Médio" value={loading ? null : fmtR(kpis?.ticket_medio ?? 0)} icon={Receipt} iconBg="bg-secondary/10" iconColor="text-secondary" />
              <KpiCard label="Taxa de Cancelamento" value={loading ? null : `${(kpis?.taxa_cancelamento ?? 0).toFixed(1)}%`} icon={XCircle} iconBg="bg-destructive/10" iconColor="text-destructive" />
            </div>

            {/* Chart + Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Bar chart */}
              <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Top 10 regiões por receita</h3>
                    <p className="text-[11px] text-muted-foreground">{periodoLabel} · Nível: bairro</p>
                  </div>
                </div>
                {loading ? (
                  <Skeleton className="h-64 mt-4" />
                ) : filteredRegioes.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                    Nenhuma região encontrada
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={filteredRegioes} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="bairro" stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ dy: 6 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `R$${Math.round(v / 1000)}k`} />
                      <Tooltip
                        contentStyle={{ background: "#fff", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                        formatter={(v: number) => [fmtR(v), "Receita"]}
                      />
                      <Bar dataKey="receita" radius={[4, 4, 0, 0]}>
                        {filteredRegioes.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : "hsl(var(--foreground))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Top regiões list */}
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-1">Destaques de volume</h3>
                <p className="text-[11px] text-muted-foreground mb-4">Regiões com maior concentração de pedidos</p>
                {loading ? (
                  <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : filteredRegioes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                ) : (
                  <div className="space-y-3">
                    {filteredRegioes.slice(0, 5).map((r, i) => {
                      const pct = Math.round((r.receita / maxReceita) * 100);
                      return (
                        <div key={r.bairro} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <MapPin size={13} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-foreground truncate">{r.bairro}</div>
                            <div className="text-[10px] text-muted-foreground">{r.cidade}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-bold">
                            <ArrowUpRight size={10} />
                            {pct}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Regions table */}
            {!loading && filteredRegioes.length > 0 && (
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-4">Todas as regiões</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                        <th className="pb-3">#</th>
                        <th className="pb-3">Bairro</th>
                        <th className="pb-3">Cidade</th>
                        <th className="pb-3 text-right">Pedidos</th>
                        <th className="pb-3 text-right">Receita</th>
                        <th className="pb-3">Participação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegioes.map((r, i) => (
                        <tr key={r.bairro} className="border-b border-border/40 last:border-0">
                          <td className="py-3 font-bold text-primary">{String(i + 1).padStart(2, "0")}</td>
                          <td className="py-3 font-semibold text-foreground">{r.bairro}</td>
                          <td className="py-3 text-muted-foreground text-xs">{r.cidade}</td>
                          <td className="py-3 text-right">{fmt(r.pedidos)}</td>
                          <td className="py-3 text-right font-bold">{fmtR(r.receita)}</td>
                          <td className="py-3 w-32">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${(r.receita / maxReceita) * 100}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2 — MAIS VENDIDOS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "mais-vendidos" && (
          <motion.div
            key="mais-vendidos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-[1280px] mx-auto px-6 py-8 space-y-6"
          >
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Relatórios · BI</span>
                {lastUpdate && <span className="text-[11px] text-muted-foreground">Atualizado há {Math.round((Date.now() - lastUpdate.getTime()) / 60000)} min</span>}
              </div>
              <h1 className="text-3xl font-extrabold text-foreground">Itens &amp; "Extras" Mais Vendidos</h1>
              <p className="text-sm text-muted-foreground mt-1">{periodoLabel} · Todas as categorias</p>
            </div>

            {/* Filter bar */}
            <div className="bg-white border border-border rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <PeriodBar periodo={periodo} setPeriodo={setPeriodo} dateRange={dateRange} setDateRange={setDateRange}>
                <Select value={restaurante} onValueChange={setRestaurante}>
                  <SelectTrigger className="h-8 rounded-full text-sm w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurantes.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </PeriodBar>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Unidades Vendidas" value={loading ? null : fmt(totalUnidades)} sub="Apenas pedidos concluídos" icon={Package} />
              <KpiCard label="Receita Total" value={loading ? null : fmtR(totalReceita)} sub="Soma dos itens do ranking" icon={DollarSign} iconBg="bg-accent/10" iconColor="text-accent" />
              <KpiCard label="Itens no Ranking" value={loading ? null : String(topProdutos.length)} sub="Top produtos do período" icon={BarChart3} iconBg="bg-secondary/10" iconColor="text-secondary" />
              <KpiCard label="Ticket Médio (Item)" value={loading ? null : fmtR(ticketItem)} sub="Receita / unidade" icon={Receipt} />
            </div>

            {/* Bar chart */}
            <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Volume de vendas por item</h3>
                  <p className="text-[11px] text-muted-foreground">Top 8 itens · passe o mouse para detalhes</p>
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-64 mt-4" />
              ) : topProdutos.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Sem dados no período</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topProdutos} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="nome" stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ dy: 6 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number) => [fmt(v), "Unidades"]}
                    />
                    <Bar dataKey="qtd" radius={[4, 4, 0, 0]}>
                      {topProdutos.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : `hsl(var(--primary) / ${1 - i * 0.1})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Table */}
            <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-1">Top {topProdutos.length} — Itens Mais Vendidos</h3>
              <p className="text-[11px] text-muted-foreground mb-4">Ordenado por quantidade · pedidos concluídos</p>
              {loading ? (
                <div className="space-y-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : topProdutos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Sem dados no período</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                        <th className="pb-3 w-10">#</th>
                        <th className="pb-3">Item</th>
                        <th className="pb-3 text-right">Quantidade</th>
                        <th className="pb-3 text-right">Receita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProdutos.map((p, i) => (
                        <tr key={p.nome} className="border-b border-border/40 last:border-0">
                          <td className="py-4">
                            <span className={`font-extrabold text-sm ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                              {i === 0 ? "👑" : ""} {String(i + 1).padStart(2, "0")}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="font-semibold text-foreground text-sm">{p.nome}</div>
                            <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden w-40">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(p.qtd / maxQtd) * 100}%` }} />
                            </div>
                          </td>
                          <td className="py-4 text-right font-bold text-foreground">{fmt(p.qtd)}</td>
                          <td className="py-4 text-right font-bold text-foreground">{fmtR(p.receita)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3 — HORÁRIO DE PICO
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "horarios" && (
          <motion.div
            key="horarios"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-[1280px] mx-auto px-6 py-8 space-y-6"
          >
            {/* Title */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Relatórios / Operação</div>
                <h1 className="text-3xl font-extrabold text-foreground">Horários de Pico</h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                  Analise os horários com maior volume de pedidos. Use os filtros para refinar a análise.
                </p>
              </div>
              {kpis && !loading && (
                <div className="shrink-0 text-xs text-muted-foreground mt-1">
                  Exibindo {fmt(kpis.total_pedidos)} pedidos concluídos
                </div>
              )}
            </div>

            {/* Filter bar */}
            <div className="bg-white border border-border rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Período</span>
              </div>
              <PeriodBar periodo={periodo} setPeriodo={setPeriodo} dateRange={dateRange} setDateRange={setDateRange}>
                <Select value={restaurante} onValueChange={setRestaurante}>
                  <SelectTrigger className="h-8 rounded-full text-sm w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurantes.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </PeriodBar>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Pedidos Concluídos"
                value={loading ? null : fmt(kpis?.total_pedidos ?? 0)}
                sub={`${periodoLabel}`}
                icon={TrendingUp}
              />
              <KpiCard
                label="Receita no Período"
                value={loading ? null : fmtR(kpis?.receita_bruta ?? 0)}
                sub="Total acumulado"
                icon={DollarSign}
                iconBg="bg-accent/10"
                iconColor="text-accent"
              />
              <KpiCard
                label="Horário de Pico"
                value={loading ? null : picoHora.hora}
                sub={`${fmt(picoHora.pedidos)} pedidos no bloco`}
                icon={Flame}
                iconBg="bg-orange-100"
                iconColor="text-orange-500"
              />
              <KpiCard
                label="Horário Mais Lento"
                value={loading ? null : (lentoHora.pedidos === Infinity ? "—" : lentoHora.hora)}
                sub={lentoHora.pedidos === Infinity ? "Sem dados" : `${fmt(lentoHora.pedidos)} pedidos`}
                icon={Clock}
                iconBg="bg-muted"
                iconColor="text-muted-foreground"
              />
            </div>

            {/* ComposedChart: bars for orders */}
            <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">Volume de pedidos por hora</h3>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">Sobreposição por faixa horária — barras: pedidos</p>
              {loading ? (
                <Skeleton className="h-64" />
              ) : horarios.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Sem dados no período</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={horarios} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="hora" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    />
                    <Bar yAxisId="left" dataKey="pedidos" name="Pedidos" radius={[4, 4, 0, 0]}>
                      {horarios.map((h, i) => (
                        <Cell key={i} fill={h.pedidos >= picoHora.pedidos * 0.7 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.35)"} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Heatmap + Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={14} className="text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Mapa de calor — dia da semana × hora</h3>
                </div>
                <p className="text-[11px] text-muted-foreground mb-5">Volume de pedidos consolidado por bloco horário</p>
                {loading ? <Skeleton className="h-48" /> : <Heatmap data={heatmap} />}
              </div>

              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-1">Tabela consolidada</h3>
                <p className="text-[11px] text-muted-foreground mb-4">Métricas por faixa horária (00:00–23:00)</p>
                {loading ? (
                  <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
                ) : (
                  <div className="overflow-y-auto max-h-80">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                          <th className="pb-2">Horário</th>
                          <th className="pb-2 text-right">Pedidos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(heatmap?.tabela ?? []).map((row, i) => (
                          <tr key={i} className="border-b border-border/30 last:border-0">
                            <td className="py-2 font-mono text-xs text-foreground">{row.horario}</td>
                            <td className={`py-2 text-right font-bold text-xs ${row.pedidos > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                              {row.pedidos}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RelatoriosPage;
