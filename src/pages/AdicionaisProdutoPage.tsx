import { motion, Reorder } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Save, Loader2, GripVertical, ChevronDown } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Adicional {
  id?: string;
  nome: string;
  preco: number;
  disponivel: boolean;
}

interface GrupoAdicionais {
  id?: string;
  nome: string;
  min_selecao: number;
  max_selecao: number;
  obrigatorio: boolean;
  adicionais: Adicional[];
}

const AdicionaisProdutoPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [grupos, setGrupos] = useState<GrupoAdicionais[]>([]);

  useEffect(() => {
    const loadAdicionais = async () => {
      try {
        const response = await fetchApi(`/produtos/${id}/grupos-adicionais`);
        if (response.ok) {
          const data = await response.json();
          setGrupos(data);
        }
      } catch {
        toast({ title: "Erro", description: "Falha ao carregar adicionais." });
      } finally {
        setFetching(false);
      }
    };
    loadAdicionais();
  }, [id]);

  const addGrupo = () => {
    setGrupos([...grupos, {
      nome: "Novo Grupo",
      min_selecao: 0,
      max_selecao: 1,
      obrigatorio: false,
      adicionais: [{ nome: "Item 1", preco: 0, disponivel: true }]
    }]);
  };

  const removeGrupo = (index: number) => {
    setGrupos(grupos.filter((_, i) => i !== index));
  };

  const updateGrupo = (index: number, data: Partial<GrupoAdicionais>) => {
    const newGrupos = [...grupos];
    newGrupos[index] = { ...newGrupos[index], ...data };
    setGrupos(newGrupos);
  };

  const addAdicional = (grupoIndex: number) => {
    const newGrupos = [...grupos];
    newGrupos[grupoIndex].adicionais.push({ nome: "Novo item", preco: 0, disponivel: true });
    setGrupos(newGrupos);
  };

  const removeAdicional = (grupoIndex: number, itemIndex: number) => {
    const newGrupos = [...grupos];
    newGrupos[grupoIndex].adicionais = newGrupos[grupoIndex].adicionais.filter((_, i) => i !== itemIndex);
    setGrupos(newGrupos);
  };

  const updateAdicional = (grupoIndex: number, itemIndex: number, data: Partial<Adicional>) => {
    const newGrupos = [...grupos];
    newGrupos[grupoIndex].adicionais[itemIndex] = { ...newGrupos[grupoIndex].adicionais[itemIndex], ...data };
    setGrupos(newGrupos);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Syncs the full array of groups directly to the backend
      const response = await fetchApi(`/produtos/${id}/grupos-adicionais`, {
        method: "POST",
        body: JSON.stringify(grupos),
      });

      if (response.ok) {
        toast({ title: "Adicionais salvos!" });
        navigate("/gerencia-cardapio");
      } else {
        toast({ title: "Erro ao salvar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/gerencia-cardapio")} className="p-2 hover:bg-muted rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-extrabold text-xl text-foreground">Complementos</h1>
          </div>
          <button onClick={handleSave} disabled={loading} className="gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-float hover:opacity-95 transition-opacity disabled:opacity-70">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Salvar Tudo
          </button>
        </div>
      </header>

      <div className="container py-8 max-w-2xl space-y-6">
        {grupos.map((grupo, gIdx) => (
          <motion.div 
            key={gIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="p-4 bg-muted/30 border-b border-border flex items-center gap-4">
              <div className="flex-1 space-y-3">
                <input 
                  type="text" 
                  value={grupo.nome}
                  onChange={(e) => updateGrupo(gIdx, { nome: e.target.value })}
                  className="bg-transparent border-none text-lg font-extrabold text-foreground focus:ring-0 w-full p-0"
                  placeholder="Nome do Grupo (ex: Escolha sua carne)" 
                />
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Mín</span>
                    <input 
                      type="number" 
                      value={grupo.min_selecao}
                      onChange={(e) => updateGrupo(gIdx, { min_selecao: parseInt(e.target.value) || 0 })}
                      className="w-12 h-8 rounded-lg bg-card border border-border text-center text-sm font-bold" 
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Máx</span>
                    <input 
                      type="number" 
                      value={grupo.max_selecao}
                      onChange={(e) => updateGrupo(gIdx, { max_selecao: parseInt(e.target.value) || 1 })}
                      className="w-12 h-8 rounded-lg bg-card border border-border text-center text-sm font-bold" 
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={grupo.obrigatorio}
                      onChange={(e) => updateGrupo(gIdx, { obrigatorio: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary/20" 
                    />
                    <span className="text-xs font-bold text-muted-foreground uppercase">Obrigatório</span>
                  </label>
                </div>
              </div>
              <button 
                onClick={() => removeGrupo(gIdx)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {grupo.adicionais.map((item, iIdx) => (
                <div key={iIdx} className="flex items-center gap-3">
                  <GripVertical size={16} className="text-muted-foreground cursor-grab active:cursor-grabbing" />
                  <input 
                    type="text" 
                    value={item.nome}
                    onChange={(e) => updateAdicional(gIdx, iIdx, { nome: e.target.value })}
                    className="flex-1 h-10 px-3 rounded-xl bg-muted/30 border-transparent focus:bg-card focus:border-border text-sm font-medium transition-all"
                    placeholder="Nome do item" 
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={item.preco}
                      onChange={(e) => updateAdicional(gIdx, iIdx, { preco: parseFloat(e.target.value) || 0 })}
                      className="w-24 h-10 pl-8 pr-3 rounded-xl bg-muted/30 border-transparent focus:bg-card focus:border-border text-sm font-bold transition-all text-right"
                      placeholder="0.00" 
                    />
                  </div>
                  <button 
                    onClick={() => removeAdicional(gIdx, iIdx)}
                    className="p-2 text-muted-foreground/50 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => addAdicional(gIdx)}
                className="w-full h-10 border border-dashed border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted/30 hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Adicionar Opção
              </button>
            </div>
          </motion.div>
        ))}

        <button 
          onClick={addGrupo}
          className="w-full py-6 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <Plus size={24} />
          </div>
          <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-all">Novo Grupo de Adicionais</span>
        </button>
      </div>
    </div>
  );
};

export default AdicionaisProdutoPage;
