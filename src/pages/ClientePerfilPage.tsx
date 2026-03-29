import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Mail, Phone, MapPin, Pencil, Trash2, Save, X, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, setUserProfile, removeAuthToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "view" | "edit";

const ClientePerfilPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const stored = getUserProfile();

  const [mode, setMode] = useState<ViewMode>("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, setForm] = useState({
    nome: stored?.nome || "Cliente Exemplo",
    sobrenome: stored?.sobrenome || "Silva",
    email: stored?.email || "cliente@email.com",
    telefone: stored?.telefone || "(11) 99999-0000",
    cpf: stored?.cpf || "000.000.000-00",
    endereco: stored?.endereco || "Rua Exemplo, 123 - São Paulo, SP",
  });

  const [original, setOriginal] = useState({ ...form });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setUserProfile({ ...stored, ...form });
    setOriginal({ ...form });
    setMode("view");
    toast({ title: "Perfil atualizado", description: "Suas informações foram salvas com sucesso." });
  };

  const handleCancel = () => {
    setForm({ ...original });
    setMode("view");
  };

  const handleDelete = () => {
    removeAuthToken();
    localStorage.removeItem("user_profile");
    sessionStorage.clear();
    toast({ title: "Conta removida", description: "Sua conta foi excluída com sucesso.", variant: "destructive" });
    navigate("/home");
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
          <button onClick={() => navigate("/cliente-home")} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
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
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              <Save size={16} /> Salvar
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-muted text-foreground font-bold text-sm hover:bg-muted/80 transition-colors"
            >
              <X size={16} /> Cancelar
            </button>
          </motion.div>
        )}

        {/* Fields */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
          {fields.map(({ key, label, icon: Icon }) => (
            <div key={key} className="p-4 rounded-2xl bg-card border border-border shadow-card">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                <Icon size={14} className="text-primary" /> {label}
              </label>
              {mode === "edit" ? (
                <input
                  type="text"
                  value={(form as any)[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm font-medium text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              ) : (
                <p className="text-sm font-semibold text-foreground">{(form as any)[key]}</p>
              )}
            </div>
          ))}
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
      </div>
    </div>
  );
};

export default ClientePerfilPage;
