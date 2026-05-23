import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Store, LogOut, TrendingUp, ShoppingBag, DollarSign, Receipt,
  Star, Clock, Truck, XCircle, BarChart3, Calendar as CalendarIcon, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { removeAuthToken } from "@/lib/api";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const RESTAURANTES = [
  { id: "all", nome: "Todos os Restaurantes" },
  { id: "1", nome: "Burguer Master - Centro" },
  { id: "2", nome: "Burguer Master - Pinheiros" },
  { id: "3", nome: "Burguer Master - Itaim" },
];

const PERIODOS = [
  { id: "7", label: "Últimos 7 dias" },
  { id: "30", label: "Últimos 30 dias" },
  { id: "90", label: "Últimos 90 dias" },
  { id: "custom", label: "Personalizado" },
];

// Mock data generators (deterministic per filter)
const seededRand = (seed: number) => {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
};

const RelatoriosPage = () => {
  const navigate = useNavigate();
  const [restaurante, setRestaurante] = useState("all");
  const [periodo, setPeriodo] = useState("30");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const seed = useMemo(() => {
    return restaurante.length * 13 + parseInt(periodo === "custom" ? "15" : periodo);
  }, [restaurante, periodo]);

  // Financial KPIs scaled by period
  const data = useMemo(() => {
    const rand = seededRand(seed);
    const mult = periodo === "7" ? 0.25 : periodo === "30" ? 1 : periodo === "90" ? 2.8 : 1;
    const faturamento = Math.round(45280 * mult);
    const pedidos = Math.round(1240 * mult);
    const ticket = Math.round((faturamento / pedidos) * 100) / 100;

    const days = periodo === "7" ? 7 : periodo === "90" ? 12 : 30;
    const evolucao = Array.from({ length: days }, (_, i) => ({
      dia: periodo === "90" ? `Sem ${i + 1}` : `${i + 1}`,
      valor: Math.round((faturamento / days) * (0.7 + rand() * 0.6)),
    }));

    const metodos = ["Cartão", "Pix", "Dinheiro"];
    const transacoes = Array.from({ length: 10 }, (_, i) => ({
      id: `#${(45200 + i).toString()}`,
      data: `${String(28 - i).padStart(2, "0")}/05 ${String(10 + i).padStart(2, "0")}:${String(Math.floor(rand() * 59)).padStart(2, "0")}`,
      metodo: metodos[Math.floor(rand() * 3)],
      valor: Math.round((20 + rand() * 80) * 100) / 100,
    }));

    const topProdutos = [
      { nome: "X-Zupps Bacon Duplo", categoria: "Lanches", qtd: 411, receita: 12326 },
      { nome: "Smash Burger Clássico", categoria: "Lanches", qtd: 333, receita: 8669 },
      { nome: "Chicken Crispy", categoria: "Lanches", qtd: 280, receita: 7288 },
      { nome: "Batata Rústica Grande", categoria: "Acompanhamentos", qtd: 260, receita: 3898 },
      { nome: "Coca-Cola 350ml", categoria: "Bebidas", qtd: 245, receita: 1714 },
      { nome: "Milk Shake Ovomaltine", categoria: "Sobremesas", qtd: 196, receita: 4113 },
      { nome: "Onion Rings", categoria: "Acompanhamentos", qtd: 173, receita: 2592 },
      { nome: "Brownie com Sorvete", categoria: "Sobremesas", qtd: 156, receita: 2808 },
    ].map(p => ({ ...p, qtd: Math.round(p.qtd * mult), receita: Math.round(p.receita * mult) }));

    const categorias = [
      { name: "Lanches", value: 58 },
      { name: "Acompanhamentos", value: 18 },
      { name: "Bebidas", value: 14 },
      { name: "Sobremesas", value: 10 },
    ];

    const horarios = Array.from({ length: 17 }, (_, i) => {
      const hora = i + 7;
      let base = 20;
      if (hora >= 12 && hora <= 14) base = 90;
      if (hora >= 19 && hora <= 21) base = 110;
      return { hora: `${String(hora).padStart(2, "0")}h`, pedidos: Math.round(base + rand() * 30) };
    });

    return { faturamento, pedidos, ticket, evolucao, transacoes, topProdutos, categorias, horarios };
  }, [seed, periodo]);

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("user_profile");
    navigate("/");
  };

  const CATEGORY_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "hsl(var(--muted-foreground))"];

  const periodoLabel = periodo === "custom" && dateRange?.from
    ? `${format(dateRange.from, "dd/MM", { locale: ptBR })}${dateRange.to ? ` - ${format(dateRange.to, "dd/MM", { locale: ptBR })}` : ""}`
    : PERIODOS.find(p => p.id === periodo)?.label;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/restaurante-home" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-extrabold text-lg">Z</span>
            </div>
            <span className="font-extrabold text-xl text-foreground tracking-tight">Zupps</span>
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors">
            <LogOut size={16} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <div className="container py-6 max-w-6xl space-y-6">
        {/* Title */}
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

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl bg-card border border-border shadow-card flex flex-col sm:flex-row gap-3 sm:items-center"
        >
          <div className="flex items-center gap-2 flex-1">
            <Store size={16} className="text-primary flex-shrink-0" />
            <Select value={restaurante} onValueChange={setRestaurante}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESTAURANTES.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <CalendarIcon size={16} className="text-primary flex-shrink-0" />
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {periodo === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-xl gap-2">
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

        {/* ============ RELATÓRIO 1 — FINANCEIRO ============ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-foreground">Financeiro & Vendas</h2>
            <span className="text-[11px] text-muted-foreground">{periodoLabel}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: DollarSign, label: "Faturamento Total", value: `R$ ${data.faturamento.toLocaleString("pt-BR")},00`, trend: "+12%", color: "text-accent" },
              { icon: ShoppingBag, label: "Total de Pedidos", value: data.pedidos.toLocaleString("pt-BR"), trend: "+8%", color: "text-primary" },
              { icon: Receipt, label: "Ticket Médio", value: `R$ ${data.ticket.toFixed(2).replace(".", ",")}`, trend: "+3%", color: "text-secondary" },
            ].map((kpi) => (
              <div key={kpi.label} className="p-5 rounded-2xl bg-card border border-border shadow-card">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                  <kpi.icon size={18} className={kpi.color} />
                </div>
                <div className="text-2xl font-extrabold text-foreground">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-2 text-[11px] font-bold text-accent">
                  <TrendingUp size={12} /> {kpi.trend} vs período anterior
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-1">Evolução do Faturamento</h3>
            <p className="text-[11px] text-muted-foreground mb-4">Receita diária no período selecionado</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.evolucao}>
                <defs>
                  <linearGradient id="grad-fat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Area type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#grad-fat)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-4">Últimas Transações</h3>
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
                  {data.transacoes.map(t => (
                    <tr key={t.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-mono text-xs text-foreground">{t.id}</td>
                      <td className="py-3 text-muted-foreground text-xs">{t.data}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold text-foreground">{t.metodo}</span>
                      </td>
                      <td className="py-3 text-right font-bold text-foreground">R$ {t.valor.toFixed(2).replace(".", ",")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ============ RELATÓRIO 2 — PRODUTOS ============ */}
        <section className="space-y-4 pt-2 border-t border-border">
          <h2 className="text-lg font-extrabold text-foreground pt-4">Produtos & Performance</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
              <h3 className="text-sm font-bold text-foreground mb-1">Top 8 Itens Mais Vendidos</h3>
              <p className="text-[11px] text-muted-foreground mb-4">Volume por produto</p>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.topProdutos} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="nome" stroke="hsl(var(--muted-foreground))" fontSize={10} width={110} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Bar dataKey="qtd" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
              <h3 className="text-sm font-bold text-foreground mb-1">Vendas por Categoria</h3>
              <p className="text-[11px] text-muted-foreground mb-4">Distribuição percentual</p>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={data.categorias} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3}>
                    {data.categorias.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-4">Performance dos Top 8 Produtos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase text-muted-foreground border-b border-border">
                    <th className="py-2">#</th>
                    <th className="py-2">Produto</th>
                    <th className="py-2">Categoria</th>
                    <th className="py-2 text-right">Qtd. Vendida</th>
                    <th className="py-2 text-right">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProdutos.map((p, i) => (
                    <tr key={p.nome} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-extrabold text-primary">{String(i + 1).padStart(2, "0")}</td>
                      <td className="py-3 font-semibold text-foreground">{p.nome}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold text-foreground">{p.categoria}</span>
                      </td>
                      <td className="py-3 text-right text-foreground">{p.qtd.toLocaleString("pt-BR")}</td>
                      <td className="py-3 text-right font-bold text-foreground">R$ {p.receita.toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-1">Horário de Pico</h3>
            <p className="text-[11px] text-muted-foreground mb-4">Volume de pedidos por hora</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.horarios}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hora" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="pedidos" radius={[6, 6, 0, 0]}>
                  {data.horarios.map((h, i) => (
                    <Cell key={i} fill={h.pedidos > 90 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ============ RELATÓRIO 3 — SATISFAÇÃO ============ */}
        <section className="space-y-4 pt-2 border-t border-border">
          <h2 className="text-lg font-extrabold text-foreground pt-4">Satisfação & Operação</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-card text-center">
              <div className="text-5xl font-extrabold text-foreground mb-2">4.7<span className="text-2xl text-muted-foreground"> / 5.0</span></div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={22} className={i <= 4 ? "fill-primary text-primary" : "fill-primary/50 text-primary"} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Baseado em 340 avaliações</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-card">
              <h3 className="text-sm font-bold text-foreground mb-4">Distribuição de Feedback</h3>
              {[
                { label: "Excelente / Bom", pct: 86, color: "bg-accent" },
                { label: "Regular", pct: 10, color: "bg-secondary" },
                { label: "Ruim", pct: 4, color: "bg-destructive" },
              ].map(f => (
                <div key={f.label} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
                    <span>{f.label}</span>
                    <span>{f.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${f.color} rounded-full transition-all`} style={{ width: `${f.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Clock, label: "Tempo Médio de Preparo", value: "18 min", color: "text-primary" },
              { icon: Truck, label: "Tempo Médio de Entrega", value: "24 min", color: "text-accent" },
              { icon: XCircle, label: "Taxa de Cancelamento", value: "0,8%", color: "text-destructive" },
            ].map(m => (
              <div key={m.label} className="p-5 rounded-2xl bg-card border border-border shadow-card">
                <m.icon size={18} className={`${m.color} mb-2`} />
                <div className="text-xl font-extrabold text-foreground">{m.value}</div>
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
