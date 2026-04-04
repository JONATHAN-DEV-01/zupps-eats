import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Mail, Phone, MapPin, Pencil, Trash2, Save, X, Eye, EyeOff, Search, Edit2, Building, Hash, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, setUserProfile, removeAuthToken, fetchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import LocationPicker from "@/components/LocationPicker";

type ViewMode = "view" | "edit";

const ClientePerfilPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const stored = getUserProfile();

  const [mode, setMode] = useState<ViewMode>("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Admin Area States
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editAdminForm, setEditAdminForm] = useState<any>({});

  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetchApi('/users');
      if (response.ok) {
        setAllUsers(await response.json());
      }
    } catch (error) {
      toast({ title: "Erro ao buscar usuários", variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  const handleDeleteAUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir ESTE usuário do sistema?")) return;
    try {
      const response = await fetchApi(`/users/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Usuário apagado!" });
        setAllUsers(prev => prev.filter(u => u.id !== id));
      } else {
        toast({ title: "Erro ao apagar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao apagar", variant: "destructive" });
    }
  };

  const handleUpdateAUser = async (id: string) => {
    try {
      const response = await fetchApi(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editAdminForm),
      });
      if (response.ok) {
        toast({ title: "Usuário atualizado!" });
        setEditingUserId(null);
        loadAllUsers();
      } else {
        const err = await response.json();
        toast({ title: "Erro: " + (err.error || "Desconhecido"), variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const formatAddress = (endereco: any) => {
    if (!endereco) return "";
    if (typeof endereco === "string") return endereco;
    const { logradouro, numero, sem_numero, bairro, cidade, estado } = endereco;
    let main = logradouro || "";
    if (!sem_numero && numero) main += `, ${numero}`;
    else if (sem_numero) main += `, S/N`;
    
    const parts = [main];
    if (bairro) parts.push(bairro);
    if (cidade && estado) parts.push(`${cidade} - ${estado}`);
    
    return parts.filter(Boolean).join(" - ");
  };

  const [form, setForm] = useState({
    nome: stored?.nome || "",
    sobrenome: stored?.sobrenome || "",
    email: stored?.email || "",
    telefone: stored?.telefone || "",
    cpf: stored?.cpf || "",
    endereco_completo: formatAddress(stored?.endereco) || "",
  });

  const [address, setAddress] = useState({
    logradouro: stored?.endereco?.logradouro || "",
    bairro: stored?.endereco?.bairro || "",
    cidade: stored?.endereco?.cidade || "São Paulo",
    estado: stored?.endereco?.estado || "SP",
    numero: stored?.endereco?.numero || "",
    cep: stored?.endereco?.cep || "",
    sem_numero: stored?.endereco?.sem_numero || false,
    complemento: stored?.endereco?.complemento || "",
    ponto_referencia: stored?.endereco?.ponto_referencia || "",
  });

  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState({ ...form });
  const [originalAddress, setOriginalAddress] = useState({ ...address });

  const handleLocationSelect = (loc: any) => {
    setAddress(prev => ({
      ...prev,
      logradouro: loc.logradouro || prev.logradouro,
      bairro: loc.bairro || prev.bairro,
      cidade: loc.cidade || prev.cidade,
      estado: loc.estado || prev.estado,
      numero: loc.numero || prev.numero,
      cep: loc.cep || prev.cep,
    }));
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!stored?.id) {
      toast({ title: "Sessão expirada", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: form.nome,
        sobrenome: form.sobrenome,
        telefone: form.telefone,
        ...address
      };

      const response = await fetchApi(`/users/${stored.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setOriginal({ ...form, endereco_completo: formatAddress(data.endereco) });
        setOriginalAddress({
           logradouro: data.endereco?.logradouro || "",
           bairro: data.endereco?.bairro || "",
           cidade: data.endereco?.cidade || "",
           estado: data.endereco?.estado || "",
           numero: data.endereco?.numero || "",
           cep: data.endereco?.cep || "",
           sem_numero: data.endereco?.sem_numero || false,
           complemento: data.endereco?.complemento || "",
           ponto_referencia: data.endereco?.ponto_referencia || "",
        });
        setMode("view");
        toast({ title: "Perfil atualizado", description: "Suas informações foram salvas com sucesso." });
      } else {
        const err = await response.json();
        toast({ title: "Erro ao salvar", description: err.error || "Tente novamente mais tarde.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ ...original });
    setAddress({ ...originalAddress });
    setMode("view");
  };

  const handleDelete = () => {
    removeAuthToken();
    localStorage.removeItem("user_profile");
    sessionStorage.clear();
    toast({ title: "Conta removida", description: "Sua conta foi excluída com sucesso.", variant: "destructive" });
    navigate("/");
  };

  const fields = [
    { key: "nome", label: "Nome", icon: User },
    { key: "sobrenome", label: "Sobrenome", icon: User },
    { key: "email", label: "E-mail", icon: Mail },
    { key: "telefone", label: "Telefone", icon: Phone },
    { key: "cpf", label: "CPF", icon: Eye },
    { key: "endereco", label: "Endereço", icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center h-14 gap-3">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-base font-extrabold text-foreground">Meu Perfil</h1>
        </div>
      </header>

      <div className="container py-6 max-w-lg">
        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-3">
            <User size={32} className="text-primary-foreground" />
          </div>
          <h2 className="text-lg font-extrabold text-foreground">{form.nome} {form.sobrenome}</h2>
          <p className="text-sm text-muted-foreground">{form.email}</p>
        </motion.div>

        {/* Action buttons */}
        {mode === "view" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 mb-6">
            <button
              onClick={() => setMode("edit")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              <Pencil size={16} /> Editar
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-destructive/10 text-destructive font-bold text-sm hover:bg-destructive/20 transition-colors"
            >
              <Trash2 size={16} /> Excluir
            </button>
          </motion.div>
        )}

        {mode === "edit" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 mb-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Salvar</>}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-muted text-foreground font-bold text-sm hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <X size={16} /> Cancelar
            </button>
          </motion.div>
        )}

        {/* Fields */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          {fields.map(({ key, label, icon: Icon }) => {
            if (key === "endereco") {
              if (mode === "edit") {
                return (
                  <div key={key} className="space-y-4 pt-2">
                    <div className="flex items-center justify-between mb-1 px-1">
                      <p className="text-sm font-bold text-foreground flex items-center gap-2">
                        <MapPin size={16} className="text-primary" /> Endereço de Entrega
                      </p>
                      {(!address.logradouro) && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1 animate-pulse">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          DADOS ANTIGOS
                        </span>
                      )}
                    </div>

                    {stored?.endereco && (
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/50 relative">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider opacity-70">Endereço Atual</p>
                        <p className="text-sm font-semibold text-foreground leading-snug">{typeof stored.endereco === 'string' ? stored.endereco : formatAddress(stored.endereco)}</p>
                      </div>
                    )}

                    <LocationPicker onLocationSelect={handleLocationSelect} />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-card border border-border shadow-card">
                        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                          <Building size={14} className="text-primary" /> Rua *
                        </label>
                        <input
                          type="text"
                          value={address.logradouro}
                          onChange={(e) => setAddress({...address, logradouro: e.target.value})}
                          className="w-full bg-muted rounded-xl px-3 py-2 text-sm font-medium border border-border focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="p-4 rounded-2xl bg-card border border-border shadow-card">
                        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                          <Building size={14} className="text-primary" /> Bairro *
                        </label>
                        <input
                          type="text"
                          value={address.bairro}
                          onChange={(e) => setAddress({...address, bairro: e.target.value})}
                          className="w-full bg-muted rounded-xl px-3 py-2 text-sm font-medium border border-border focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-card border border-border shadow-card">
                        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                          <Hash size={14} className="text-primary" /> Número *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 123"
                          value={address.numero}
                          disabled={address.sem_numero}
                          onChange={(e) => setAddress({...address, numero: e.target.value})}
                          className="w-full bg-muted rounded-xl px-3 py-2 text-sm font-medium border border-border focus:ring-1 focus:ring-primary disabled:opacity-40"
                        />
                        <label className="flex items-center gap-2 mt-2 px-1 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={address.sem_numero} 
                            onChange={(e) => setAddress({...address, sem_numero: e.target.checked, numero: e.target.checked ? "" : address.numero})} 
                          />
                          <span className="text-[11px] text-muted-foreground">Sem número</span>
                        </label>
                      </div>
                      <div className="p-4 rounded-2xl bg-card border border-border shadow-card">
                        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                          <MapPin size={14} className="text-primary" /> CEP *
                        </label>
                        <input
                          type="text"
                          value={address.cep}
                          onChange={(e) => setAddress({...address, cep: e.target.value})}
                          className="w-full bg-muted rounded-xl px-3 py-2 text-sm font-medium border border-border focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 rounded-2xl bg-card border border-border shadow-card">
                          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                            <Building size={14} className="text-primary" /> Complemento
                          </label>
                          <input
                            type="text"
                            value={address.complemento}
                            onChange={(e) => setAddress({...address, complemento: e.target.value})}
                            className="w-full bg-muted rounded-xl px-3 py-2 text-sm font-medium border border-border focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="p-4 rounded-2xl bg-card border border-border shadow-card">
                          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                            <MapPin size={14} className="text-primary" /> Ponto de referência
                          </label>
                          <input
                            type="text"
                            value={address.ponto_referencia}
                            onChange={(e) => setAddress({...address, ponto_referencia: e.target.value})}
                            className="w-full bg-muted rounded-xl px-3 py-2 text-sm font-medium border border-border focus:ring-1 focus:ring-primary"
                          />
                        </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={key} className="p-4 rounded-2xl bg-card border border-border shadow-card">
                  <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                    <Icon size={14} className="text-primary" /> {label}
                  </label>
                  <p className="text-sm font-semibold text-foreground truncate">{form.endereco_completo || "Não informado"}</p>
                </div>
              );
            }

            return (
              <div key={key} className="p-4 rounded-2xl bg-card border border-border shadow-card">
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                  <Icon size={14} className="text-primary" /> {label}
                </label>
                {mode === "edit" ? (
                  <input
                    type="text"
                    value={(form as any)[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    disabled={key === "email" || key === "cpf"}
                    className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm font-medium text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
                  />
                ) : (
                  <p className="text-sm font-semibold text-foreground">{(form as any)[key]}</p>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Delete confirmation modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-card rounded-2xl p-6 border border-border shadow-lg"
              >
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={24} className="text-destructive" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground text-center mb-2">Excluir conta?</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Essa ação é irreversível. Todos os seus dados serão apagados permanentemente.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 rounded-2xl bg-muted text-foreground font-bold text-sm hover:bg-muted/80 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-3 rounded-2xl bg-destructive text-destructive-foreground font-bold text-sm hover:bg-destructive/90 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- MODO ADMINISTRADOR ZUPPS: LISTA TOTAL DE USUÁRIOS --- */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                Painel Administrativo
             </h2>
             <button onClick={loadAllUsers} className="text-xs text-primary font-bold">
               Atualizar
             </button>
          </div>
          <p className="text-xs text-muted-foreground mb-6">Listagem de todos os usuários do sistema. Exclusões são definitivas.</p>
          
          <div className="space-y-4">
             {loadingUsers ? (
               <p className="text-sm text-muted-foreground text-center">Carregando usuários...</p>
             ) : allUsers.map((u) => (
               <div key={u.id} className="p-4 rounded-2xl bg-card border border-border flex flex-col gap-3">
                 <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{u.nome} {u.sobrenome}</h4>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Telefone: {u.telefone}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Endereço: {u.endereco ? (typeof u.endereco === 'string' ? u.endereco : u.endereco.logradouro) : 'N/A'}</p>
                    </div>
                    <div className="flex gap-2">
                       {editingUserId === u.id ? (
                         <>
                           <button onClick={() => setEditingUserId(null)} className="p-2 rounded-lg bg-muted text-foreground hover:bg-muted/80">
                             <X size={14} />
                           </button>
                           <button onClick={() => handleUpdateAUser(u.id)} className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                             <Save size={14} />
                           </button>
                         </>
                       ) : (
                         <>
                           <button onClick={() => { setEditingUserId(u.id); setEditAdminForm({ telefone: u.telefone, logradouro: (typeof u.endereco === 'object' ? u.endereco?.logradouro : u.endereco) }); }} className="p-2 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-colors">
                             <Edit2 size={14} />
                           </button>
                           <button onClick={() => handleDeleteAUser(u.id)} className="p-2 rounded-lg text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors">
                             <Trash2 size={14} />
                           </button>
                         </>
                       )}
                    </div>
                 </div>

                 {editingUserId === u.id && (
                   <div className="mt-3 pt-3 border-t border-border space-y-3">
                     <p className="text-xs text-muted-foreground font-semibold mb-2">Atenção: A API de update suporta apenas telefone e logradouro (e outros de endereço).</p>
                     <div>
                       <label className="text-[11px] font-bold text-muted-foreground ml-1">Novo Telefone</label>
                       <input 
                         type="text" 
                         value={editAdminForm.telefone || ''} 
                         onChange={e => setEditAdminForm({ ...editAdminForm, telefone: e.target.value })}
                         className="w-full mt-1 bg-muted rounded-xl px-3 py-2 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                       />
                     </div>
                     <div>
                       <label className="text-[11px] font-bold text-muted-foreground ml-1">Novo Logradouro</label>
                       <input 
                         type="text" 
                         value={editAdminForm.logradouro || ''} 
                         onChange={e => setEditAdminForm({ ...editAdminForm, logradouro: e.target.value })}
                         className="w-full mt-1 bg-muted rounded-xl px-3 py-2 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                       />
                     </div>
                   </div>
                 )}
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientePerfilPage;
