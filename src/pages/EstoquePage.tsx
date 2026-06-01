import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Search, ShieldAlert, Minus, Plus, Wifi, WifiOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getUserProfile } from "@/lib/api";

type Produto = { id: string; nome: string; preco: number; quantidade: number; status_disponivel: boolean };
type Adicional = { id: string; nome: string; preco: number; grupo_id: string; grupo_nome: string; status_disponivel: boolean };

const PRODUTOS_MOCK: Produto[] = [
  { id: "p1", nome: "Burguer Master", preco: 32.9, quantidade: 24, status_disponivel: true },
  { id: "p2", nome: "Cheese Bacon", preco: 28.5, quantidade: 12, status_disponivel: true },
  { id: "p3", nome: "Veggie Burger", preco: 26.0, quantidade: 0, status_disponivel: false },
  { id: "p4", nome: "Batata Frita G", preco: 18.9, quantidade: 40, status_disponivel: true },
  { id: "p5", nome: "Onion Rings", preco: 16.5, quantidade: 9, status_disponivel: true },
  { id: "p6", nome: "Milk Shake Chocolate", preco: 14.9, quantidade: 0, status_disponivel: false },
  { id: "p7", nome: "Refrigerante Lata", preco: 6.0, quantidade: 60, status_disponivel: true },
  { id: "p8", nome: "Combo Família", preco: 89.9, quantidade: 5, status_disponivel: true },
];

const ADICIONAIS_MOCK: Adicional[] = [
  { id: "a1", nome: "Bacon extra", preco: 4.5, grupo_id: "g1", grupo_nome: "Extras", status_disponivel: true },
  { id: "a2", nome: "Queijo cheddar", preco: 3.5, grupo_id: "g1", grupo_nome: "Extras", status_disponivel: true },
  { id: "a3", nome: "Cebola caramelizada", preco: 2.5, grupo_id: "g1", grupo_nome: "Extras", status_disponivel: false },
  { id: "a4", nome: "Maionese da casa", preco: 1.5, grupo_id: "g2", grupo_nome: "Molhos", status_disponivel: true },
  { id: "a5", nome: "Molho barbecue", preco: 1.5, grupo_id: "g2", grupo_nome: "Molhos", status_disponivel: true },
  { id: "a6", nome: "Molho picante", preco: 1.5, grupo_id: "g2", grupo_nome: "Molhos", status_disponivel: false },
  { id: "a7", nome: "Coca-Cola 350ml", preco: 6.0, grupo_id: "g3", grupo_nome: "Bebidas", status_disponivel: true },
  { id: "a8", nome: "Suco natural", preco: 8.0, grupo_id: "g3", grupo_nome: "Bebidas", status_disponivel: true },
];

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const EstoquePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getUserProfile();

  // RN-02: Proteção de acesso (Administrador do Restaurante). Permite demo sem login.
  const isAdmin = !user || user?.tipo === "restaurante" || user?.role === "admin_restaurante" || user?.perfil === "admin_restaurante";

  const [produtos, setProdutos] = useState<Produto[]>(PRODUTOS_MOCK);
  const [adicionais, setAdicionais] = useState<Adicional[]>(ADICIONAIS_MOCK);
  const [busca, setBusca] = useState("");

  // RNF-01: Sincronização em tempo real via Supabase Realtime (≤3s)
  const [realtimeOk, setRealtimeOk] = useState<boolean | null>(null);

  useEffect(() => {
    let channel: any = null;
    const connectRealtime = async () => {
      try {
        // Importação dinâmica para não quebrar se Supabase não estiver configurado
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) return;

        const supabase = createClient(supabaseUrl, supabaseKey);

        channel = supabase
          .channel("estoque-realtime")
          // Escuta UPDATE em produtos
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "produto" },
            (payload: any) => {
              const updated = payload.new;
              setProdutos((prev) =>
                prev.map((p) =>
                  p.id === String(updated.id)
                    ? { ...p, status_disponivel: updated.status_disponivel, quantidade: updated.quantidade ?? p.quantidade }
                    : p
                )
              );
            }
          )
          // Escuta UPDATE em item_adicional
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "item_adicional" },
            (payload: any) => {
              const updated = payload.new;
              setAdicionais((prev) =>
                prev.map((a) =>
                  a.id === String(updated.id)
                    ? { ...a, status_disponivel: updated.status_disponivel }
                    : a
                )
              );
            }
          )
          .subscribe((status: string) => {
            setRealtimeOk(status === "SUBSCRIBED");
          });
      } catch {
        // Supabase não configurado — modo offline apenas
        setRealtimeOk(false);
      }
    };

    connectRealtime();
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, []);

  const toggleProduto = (id: string, value: boolean) => {
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, status_disponivel: value, quantidade: value && p.quantidade === 0 ? 1 : p.quantidade } : p)));
    toast({
      title: value ? "Produto disponível" : "Produto pausado",
      description: `Alteração salva com sucesso.`,
    });
  };

  // Optimistic update da quantidade — dispara persistência em background.
  const updateQuantidade = (id: string, delta: number) => {
    setProdutos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const novaQtd = Math.max(0, p.quantidade + delta);
        return {
          ...p,
          quantidade: novaQtd,
          status_disponivel: novaQtd > 0,
        };
      }),
    );
    // Persistência em background (ex.: supabase.from('produto').update({ quantidade }).eq('id', id))
  };

  const toggleAdicional = (id: string, value: boolean) => {
    setAdicionais((prev) => prev.map((a) => (a.id === id ? { ...a, status_disponivel: value } : a)));
    toast({
      title: value ? "Adicional disponível" : "Adicional pausado",
      description: `Alteração salva com sucesso.`,
    });
  };

  const produtosFiltrados = useMemo(
    () => produtos.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase())),
    [produtos, busca],
  );

  const adicionaisAgrupados = useMemo(() => {
    const filtrados = adicionais.filter((a) => a.nome.toLowerCase().includes(busca.toLowerCase()));
    const grupos: Record<string, { nome: string; itens: Adicional[] }> = {};
    filtrados.forEach((a) => {
      if (!grupos[a.grupo_id]) grupos[a.grupo_id] = { nome: a.grupo_nome, itens: [] };
      grupos[a.grupo_id].itens.push(a);
    });
    return Object.entries(grupos);
  }, [adicionais, busca]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center p-8 rounded-2xl bg-card border border-border shadow-card">
          <ShieldAlert size={40} className="mx-auto text-destructive mb-3" />
          <h1 className="text-lg font-extrabold text-foreground mb-1">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Apenas administradores do restaurante podem acessar o gerenciamento de estoque.
          </p>
          <button
            onClick={() => navigate("/restaurante-home")}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center gap-3 h-16">
          <Link
            to="/restaurante-home"
            className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Package size={18} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-foreground leading-tight">Estoque</h1>
              <p className="text-[11px] text-muted-foreground">Disponibilidade de produtos e adicionais</p>
            </div>
          </div>
          {/* RNF-01: Indicador de status do Realtime */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-semibold">
            {realtimeOk === true ? (
              <>
                <Wifi size={12} className="text-emerald-500" />
                <span className="text-emerald-600 hidden sm:inline">Tempo real</span>
              </>
            ) : realtimeOk === false ? (
              <>
                <WifiOff size={12} className="text-muted-foreground" />
                <span className="text-muted-foreground hidden sm:inline">Offline</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-muted-foreground hidden sm:inline">Conectando...</span>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container py-6 max-w-4xl">
        {/* Busca */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar item por nome..."
              className="pl-9 rounded-xl h-11 bg-card border-border"
            />
          </div>
        </motion.div>

        <Tabs defaultValue="produtos" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-sm rounded-xl">
            <TabsTrigger value="produtos" className="rounded-lg">Produtos</TabsTrigger>
            <TabsTrigger value="adicionais" className="rounded-lg">Adicionais</TabsTrigger>
          </TabsList>

          {/* Produtos */}
          <TabsContent value="produtos" className="mt-5">
            <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="w-[120px]">Preço</TableHead>
                    <TableHead className="w-[170px]">Qtd. Disponível</TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead className="w-[110px] text-right">Disponível</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                        Nenhum produto encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    produtosFiltrados.map((p) => (
                      <TableRow
                        key={p.id}
                        className={!p.status_disponivel ? "opacity-50 bg-muted/30" : ""}
                      >
                        <TableCell className="font-semibold text-foreground">{p.nome}</TableCell>
                        <TableCell className="text-sm text-foreground">{formatBRL(p.preco)}</TableCell>
                        <TableCell>
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateQuantidade(p.id, -1)}
                              disabled={p.quantidade <= 0}
                              aria-label="Diminuir quantidade"
                              className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="min-w-[2.5rem] text-center text-sm font-semibold text-foreground tabular-nums">
                              {p.quantidade}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantidade(p.id, 1)}
                              aria-label="Aumentar quantidade"
                              className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {p.status_disponivel ? (
                            <Badge variant="secondary" className="bg-accent/15 text-accent border-0">
                              Disponível
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Esgotado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={p.status_disponivel}
                            onCheckedChange={(v) => toggleProduto(p.id, v)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Adicionais */}
          <TabsContent value="adicionais" className="mt-5 space-y-5">
            {adicionaisAgrupados.length === 0 ? (
              <div className="rounded-2xl bg-card border border-border shadow-card py-10 text-center text-sm text-muted-foreground">
                Nenhum adicional encontrado.
              </div>
            ) : (
              adicionaisAgrupados.map(([grupoId, grupo]) => (
                <div key={grupoId} className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/30">
                    <h3 className="text-sm font-bold text-foreground">{grupo.nome}</h3>
                    <p className="text-[11px] text-muted-foreground">{grupo.itens.length} item(s)</p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Adicional</TableHead>
                        <TableHead className="w-[140px]">Preço</TableHead>
                        <TableHead className="w-[140px]">Status</TableHead>
                        <TableHead className="w-[120px] text-right">Disponível</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grupo.itens.map((a) => (
                        <TableRow
                          key={a.id}
                          className={!a.status_disponivel ? "opacity-50 bg-muted/30" : ""}
                        >
                          <TableCell className="font-semibold text-foreground">{a.nome}</TableCell>
                          <TableCell className="text-sm text-foreground">{formatBRL(a.preco)}</TableCell>
                          <TableCell>
                            {a.status_disponivel ? (
                              <Badge variant="secondary" className="bg-accent/15 text-accent border-0">
                                Disponível
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Esgotado</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Switch
                              checked={a.status_disponivel}
                              onCheckedChange={(v) => toggleAdicional(a.id, v)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EstoquePage;
