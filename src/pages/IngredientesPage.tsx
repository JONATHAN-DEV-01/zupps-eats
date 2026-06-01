import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Loader2, Save, Trash2, Edit2, Archive } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Ingrediente = {
  id: string;
  nome: string;
  quantidade_atual: number;
  unidade_medida: string;
  custo_unitario: number | null;
  status_disponivel: boolean;
};

const IngredientesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nome: "",
    quantidade_atual: "",
    unidade_medida: "g",
    custo_unitario: ""
  });

  useEffect(() => {
    loadIngredientes();
  }, []);

  const loadIngredientes = async () => {
    setLoading(true);
    try {
      const response = await fetchApi("/ingredientes");
      if (response.ok) {
        const data = await response.json();
        setIngredientes(data);
      }
    } catch {
      toast({ title: "Erro ao carregar ingredientes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (ingrediente?: Ingrediente) => {
    if (ingrediente) {
      setEditingId(ingrediente.id);
      setFormData({
        nome: ingrediente.nome,
        quantidade_atual: ingrediente.quantidade_atual.toString(),
        unidade_medida: ingrediente.unidade_medida,
        custo_unitario: ingrediente.custo_unitario ? ingrediente.custo_unitario.toString() : ""
      });
    } else {
      setEditingId(null);
      setFormData({
        nome: "",
        quantidade_atual: "",
        unidade_medida: "g",
        custo_unitario: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.unidade_medida) {
      toast({ title: "Preencha nome e unidade", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        nome: formData.nome,
        quantidade_atual: parseFloat(formData.quantidade_atual || "0"),
        unidade_medida: formData.unidade_medida,
        custo_unitario: formData.custo_unitario ? parseFloat(formData.custo_unitario) : null
      };

      let response;
      if (editingId) {
        response = await fetchApi(`/ingredientes/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetchApi("/ingredientes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        toast({ title: "Ingrediente salvo com sucesso!" });
        setIsModalOpen(false);
        loadIngredientes();
      } else {
        const err = await response.json();
        toast({ title: "Erro", description: err.error || "Falha ao salvar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ingrediente?")) return;
    try {
      const response = await fetchApi(`/ingredientes/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast({ title: "Ingrediente excluído" });
        loadIngredientes();
      } else {
        toast({ title: "Erro", description: "Pode estar vinculado a uma ficha técnica", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/restaurante-home")} className="p-2 hover:bg-muted rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-extrabold text-lg text-foreground">Ingredientes (Ficha Técnica)</h1>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus size={16} /> Novo Ingrediente
          </Button>
        </div>
      </header>

      <div className="container py-6">
        {ingredientes.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Archive size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Nenhum ingrediente cadastrado</h2>
            <p className="text-muted-foreground mb-4">Adicione ingredientes para controlar o estoque por ficha técnica.</p>
            <Button onClick={() => handleOpenModal()}>Adicionar Primeiro Ingrediente</Button>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead>Em Estoque</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredientes.map((ing) => (
                  <TableRow key={ing.id}>
                    <TableCell className="font-medium">{ing.nome}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${ing.quantidade_atual <= 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {ing.quantidade_atual}
                      </span>
                    </TableCell>
                    <TableCell>{ing.unidade_medida}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(ing)}>
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(ing.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Ingrediente" : "Novo Ingrediente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Ingrediente</label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Hambúrguer 150g, Pão Brioche, Bacon..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Qtd em Estoque</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantidade_atual}
                  onChange={(e) => setFormData({ ...formData, quantidade_atual: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidade</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                  value={formData.unidade_medida}
                  onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
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
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gap-2">
              <Save size={16} /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IngredientesPage;
