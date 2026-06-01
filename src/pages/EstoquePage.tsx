import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Search, Plus, Wifi, WifiOff, Edit2, Trash2, Save, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fetchApi, getUserProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Produto = { id: string; nome: string; preco: number; quantidade_disponivel: number; status_disponivel: boolean };
type Adicional = { id: string; nome: string; preco: number; quantidade_atual: number; status_disponivel: boolean };
type Ingrediente = { id: string; nome: string; quantidade_atual: number; unidade_medida: string; custo_unitario: number | null; status_disponivel: boolean };

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const EstoquePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getUserProfile();
  const restaurantId = user?.restaurante_id || user?.id;

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isIngredienteModalOpen, setIsIngredienteModalOpen] = useState(false);
  const [isAdicionalModalOpen, setIsAdicionalModalOpen] = useState(false);
  
  const [editingIngredienteId, setEditingIngredienteId] = useState<string | null>(null);
  const [editingAdicionalId, setEditingAdicionalId] = useState<string | null>(null);

  const [formIngrediente, setFormIngrediente] = useState({
    nome: "",
    quantidade_atual: "",
    unidade_medida: "g",
    custo_unitario: ""
  });

  const [formAdicional, setFormAdicional] = useState({
    nome: "",
    preco: "",
    quantidade_atual: ""
  });

  // RNF-01: Sincronização em tempo real via Supabase Realtime (≤3s)
  const [realtimeOk, setRealtimeOk] = useState<boolean | null>(null);

  useEffect(() => {
    let channel: any = null;
    const connectRealtime = async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) return;

        const supabase = createClient(supabaseUrl, supabaseKey);

        channel = supabase
          .channel("estoque-realtime")
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "produto" },
            () => loadProdutos() // Reload to get computed quantidade_disponivel
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "adicionais" },
            () => loadAdicionais()
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "ingredientes" },
            () => loadIngredientes()
          )
          .subscribe((status: string) => {
            setRealtimeOk(status === "SUBSCRIBED");
          });
      } catch {
        setRealtimeOk(false);
      }
    };

    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadProdutos(), loadAdicionais(), loadIngredientes()]);
      setLoading(false);
    };

    loadAll();
    connectRealtime();
    
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, []);

  const loadProdutos = async () => {
    if (!restaurantId) return;
    try {
      const res = await fetchApi(`/estoque/${restaurantId}/produtos`);
      if (res.ok) setProdutos(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadAdicionais = async () => {
    try {
      const res = await fetchApi("/adicionais");
      if (res.ok) setAdicionais(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadIngredientes = async () => {
    try {
      const res = await fetchApi("/ingredientes");
      if (res.ok) setIngredientes(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // --- Ingredientes Logic ---
  const handleOpenIngredienteModal = (ingrediente?: Ingrediente) => {
    if (ingrediente) {
      setEditingIngredienteId(ingrediente.id);
      setFormIngrediente({
        nome: ingrediente.nome,
        quantidade_atual: ingrediente.quantidade_atual.toString(),
        unidade_medida: ingrediente.unidade_medida,
        custo_unitario: ingrediente.custo_unitario ? ingrediente.custo_unitario.toString() : ""
      });
    } else {
      setEditingIngredienteId(null);
      setFormIngrediente({ nome: "", quantidade_atual: "", unidade_medida: "g", custo_unitario: "" });
    }
    setIsIngredienteModalOpen(true);
  };

  const handleSaveIngrediente = async () => {
    if (!formIngrediente.nome || !formIngrediente.unidade_medida) {
      toast({ title: "Preencha nome e unidade", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        nome: formIngrediente.nome,
        quantidade_atual: parseFloat(formIngrediente.quantidade_atual || "0"),
        unidade_medida: formIngrediente.unidade_medida,
        custo_unitario: formIngrediente.custo_unitario ? parseFloat(formIngrediente.custo_unitario) : null
      };

      const res = await fetchApi(editingIngredienteId ? `/ingredientes/${editingIngredienteId}` : "/ingredientes", {
        method: editingIngredienteId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Ingrediente salvo com sucesso!" });
        setIsIngredienteModalOpen(false);
        loadIngredientes();
      } else {
        const err = await res.json();
        toast({ title: "Erro", description: err.error || "Falha ao salvar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    }
  };

  const handleDeleteIngrediente = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ingrediente?")) return;
    try {
      const res = await fetchApi(`/ingredientes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Ingrediente excluído" });
        loadIngredientes();
      } else {
        toast({ title: "Erro ao excluir", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    }
  };

  // --- Adicionais Logic ---
  const handleOpenAdicionalModal = (adicional?: Adicional) => {
    if (adicional) {
      setEditingAdicionalId(adicional.id);
      setFormAdicional({
        nome: adicional.nome,
        preco: adicional.preco.toString(),
        quantidade_atual: adicional.quantidade_atual.toString()
      });
    } else {
      setEditingAdicionalId(null);
      setFormAdicional({ nome: "", preco: "", quantidade_atual: "" });
    }
    setIsAdicionalModalOpen(true);
  };

  const handleSaveAdicional = async () => {
    if (!formAdicional.nome) {
      toast({ title: "Preencha o nome", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        nome: formAdicional.nome,
        preco: parseFloat(formAdicional.preco || "0"),
        quantidade_atual: parseFloat(formAdicional.quantidade_atual || "0"),
      };

      const res = await fetchApi(editingAdicionalId ? `/adicionais/${editingAdicionalId}` : "/adicionais", {
        method: editingAdicionalId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Adicional salvo com sucesso!" });
        setIsAdicionalModalOpen(false);
        loadAdicionais();
      } else {
        const err = await res.json();
        toast({ title: "Erro", description: err.error || "Falha ao salvar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    }
  };

  const handleDeleteAdicional = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este adicional?")) return;
    try {
      const res = await fetchApi(`/adicionais/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Adicional excluído" });
        loadAdicionais();
      } else {
        toast({ title: "Erro ao excluir", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    }
  };

  const produtosFiltrados = useMemo(() => produtos.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase())), [produtos, busca]);
  const ingredientesFiltrados = useMemo(() => ingredientes.filter((i) => i.nome.toLowerCase().includes(busca.toLowerCase())), [ingredientes, busca]);
  const adicionaisFiltrados = useMemo(() => adicionais.filter((a) => a.nome.toLowerCase().includes(busca.toLowerCase())), [adicionais, busca]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
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
              <p className="text-[11px] text-muted-foreground">Gestão de cardápio, adicionais e ingredientes</p>
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
          <TabsList className="grid grid-cols-3 w-full max-w-md rounded-xl">
            <TabsTrigger value="produtos" className="rounded-lg">Cardápio</TabsTrigger>
            <TabsTrigger value="adicionais" className="rounded-lg">Adicionais</TabsTrigger>
            <TabsTrigger value="ingredientes" className="rounded-lg">Ingredientes</TabsTrigger>
          </TabsList>

          {/* Produtos (Cardápio) */}
          <TabsContent value="produtos" className="mt-5">
            <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="w-[120px]">Preço</TableHead>
                    <TableHead className="w-[170px] text-center">Produção Máx.</TableHead>
                    <TableHead className="w-[130px] text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-sm text-muted-foreground">
                        Nenhum produto encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    produtosFiltrados.map((p) => {
                      // Status é baseado na quantidade calculada por ficha técnica no backend.
                      // Se for 0, está esgotado.
                      const maxQtd = p.quantidade_disponivel ?? 0;
                      const disponivel = maxQtd > 0;
                      return (
                        <TableRow key={p.id} className={!disponivel ? "opacity-50 bg-muted/30" : ""}>
                          <TableCell className="font-semibold text-foreground">{p.nome}</TableCell>
                          <TableCell className="text-sm text-foreground">{formatBRL(p.preco)}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-semibold text-foreground tabular-nums bg-muted px-3 py-1 rounded-lg">
                              {maxQtd === 999 ? "∞" : maxQtd} unid.
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {disponivel ? (
                              <Badge variant="secondary" className="bg-accent/15 text-accent border-0">Disponível</Badge>
                            ) : (
                              <Badge variant="destructive">Esgotado</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Adicionais */}
          <TabsContent value="adicionais" className="mt-5">
            <div className="flex justify-end mb-4">
              <Button onClick={() => handleOpenAdicionalModal()} className="gap-2 rounded-xl">
                <Plus size={16} /> Novo Adicional
              </Button>
            </div>
            <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adicional</TableHead>
                    <TableHead className="w-[120px]">Preço</TableHead>
                    <TableHead className="w-[140px]">Qtd. Estoque</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adicionaisFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                        Nenhum adicional encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    adicionaisFiltrados.map((a) => (
                      <TableRow key={a.id} className={a.quantidade_atual <= 0 ? "opacity-50 bg-muted/30" : ""}>
                        <TableCell className="font-semibold text-foreground">{a.nome}</TableCell>
                        <TableCell className="text-sm text-foreground">{formatBRL(a.preco)}</TableCell>
                        <TableCell>
                          <span className={`font-bold ${a.quantidade_atual <= 0 ? 'text-destructive' : 'text-foreground'}`}>
                            {a.quantidade_atual} unid.
                          </span>
                        </TableCell>
                        <TableCell>
                          {a.quantidade_atual > 0 ? (
                            <Badge variant="secondary" className="bg-accent/15 text-accent border-0">Disponível</Badge>
                          ) : (
                            <Badge variant="destructive">Esgotado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenAdicionalModal(a)}>
                              <Edit2 size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteAdicional(a.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Ingredientes */}
          <TabsContent value="ingredientes" className="mt-5">
            <div className="flex justify-end mb-4">
              <Button onClick={() => handleOpenIngredienteModal()} className="gap-2 rounded-xl">
                <Plus size={16} /> Novo Ingrediente
              </Button>
            </div>
            <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente (Matéria Prima)</TableHead>
                    <TableHead className="w-[200px]">Em Estoque</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[120px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredientesFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                        Nenhum ingrediente encontrado ou cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ingredientesFiltrados.map((i) => (
                      <TableRow key={i.id} className={i.quantidade_atual <= 0 ? "opacity-50 bg-muted/30" : ""}>
                        <TableCell className="font-semibold text-foreground">{i.nome}</TableCell>
                        <TableCell>
                          <span className={`font-bold ${i.quantidade_atual <= 0 ? 'text-destructive' : 'text-foreground'}`}>
                            {i.quantidade_atual} {i.unidade_medida}
                          </span>
                        </TableCell>
                        <TableCell>
                          {i.quantidade_atual > 0 ? (
                            <Badge variant="secondary" className="bg-accent/15 text-accent border-0">Em Estoque</Badge>
                          ) : (
                            <Badge variant="destructive">Esgotado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenIngredienteModal(i)}>
                              <Edit2 size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteIngrediente(i.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Ingrediente Modal */}
      <Dialog open={isIngredienteModalOpen} onOpenChange={setIsIngredienteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIngredienteId ? "Editar Ingrediente" : "Novo Ingrediente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Ingrediente</label>
              <Input
                value={formIngrediente.nome}
                onChange={(e) => setFormIngrediente({ ...formIngrediente, nome: e.target.value })}
                placeholder="Ex: Hambúrguer 150g, Bacon..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Qtd em Estoque</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formIngrediente.quantidade_atual}
                  onChange={(e) => setFormIngrediente({ ...formIngrediente, quantidade_atual: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidade</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                  value={formIngrediente.unidade_medida}
                  onChange={(e) => setFormIngrediente({ ...formIngrediente, unidade_medida: e.target.value })}
                >
                  <option value="g">Gramas (g)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="un">Unidade (un)</option>
                  <option value="kg">Quilogramas (kg)</option>
                  <option value="l">Litros (l)</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIngredienteModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveIngrediente} className="gap-2"><Save size={16} /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adicional Modal */}
      <Dialog open={isAdicionalModalOpen} onOpenChange={setIsAdicionalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAdicionalId ? "Editar Adicional" : "Novo Adicional"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Adicional</label>
              <Input
                value={formAdicional.nome}
                onChange={(e) => setFormAdicional({ ...formAdicional, nome: e.target.value })}
                placeholder="Ex: Bacon Extra"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formAdicional.preco}
                  onChange={(e) => setFormAdicional({ ...formAdicional, preco: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estoque (unid.)</label>
                <Input
                  type="number"
                  step="1"
                  value={formAdicional.quantidade_atual}
                  onChange={(e) => setFormAdicional({ ...formAdicional, quantidade_atual: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdicionalModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveAdicional} className="gap-2"><Save size={16} /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EstoquePage;
