import { motion } from "framer-motion";
import { Store, Power, Settings, Clock, ImageIcon, FileText, LogOut, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { fetchApi, getUserProfile, removeAuthToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const GerenciaRestaurantePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [active, setActive] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const user = getUserProfile();

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!user) {
        navigate("/login-restaurante");
        return;
      }
      
      try {
        const response = await fetchApi(`/restaurantes?usuario_id=${user.id}`);
        const data = await response.json();
        if (response.ok && data.length > 0) {
          setRestaurant(data[0]);
          setActive(data[0].ativo);
        } else if (response.ok) {
           navigate("/cadastro-dados-restaurante");
        }
      } catch {
        toast({ title: "Erro", description: "Falha ao carregar dados do restaurante.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadRestaurant();
  }, [user, navigate]);

  const handleStatusToggle = async (checked: boolean) => {
    if (!restaurant) return;
    
    setUpdatingStatus(true);
    try {
      const response = await fetchApi(`/restaurantes/${restaurant.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ ativo: checked }),
      });
      
      if (response.ok) {
        setActive(checked);
        toast({ title: "Status atualizado", description: `Seu restaurante está agora ${checked ? "Ativo" : "Inativo"}.` });
      } else {
        toast({ title: "Erro", description: "Não foi possível atualizar o status.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Falha na comunicação com o servidor.", variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    sessionStorage.clear();
    navigate("/login-restaurante");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-extrabold text-lg">Z</span>
            </div>
            <span className="font-extrabold text-xl text-foreground tracking-tight">Zupps</span>
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors">
            <LogOut size={18} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <div className="container py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Restaurant Info Card */}
          <div className="rounded-2xl bg-card border border-border p-6 mb-6 shadow-card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                {restaurant?.logotipo ? (
                   <img src={`http://localhost:5000/uploads/${restaurant.logotipo}`} alt={restaurant.nome_fantasia} className="w-full h-full object-cover" />
                ) : (
                  <Store size={28} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold text-foreground">{restaurant?.nome_fantasia || "Carregando..."}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${active ? "bg-accent" : "bg-destructive"}`} />
                  <span className="text-sm font-medium text-muted-foreground">
                    {active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">{updatingStatus ? "Atualizando..." : (active ? "Online" : "Offline")}</span>
                <Switch checked={active} onCheckedChange={handleStatusToggle} disabled={updatingStatus} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <h2 className="text-lg font-extrabold text-foreground mb-4">Gerenciamento</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: FileText, label: "Cardápio", desc: "Gerencie seus pratos e preços", color: "text-primary", path: "/gerencia-cardapio" },
              { icon: Clock, label: "Horários", desc: "Configure horários de funcionamento", color: "text-secondary", path: "/cadastro-horario-restaurante" },
              { icon: ImageIcon, label: "Imagens", desc: "Atualize capa e logo", color: "text-accent", path: "/cadastro-logo-restaurante" },
              { icon: Settings, label: "Configurações", desc: "Dados do restaurante", color: "text-muted-foreground", path: "/cadastro-dados-restaurante" },
            ].map(({ icon: Icon, label, desc, color, path }) => (
              <Link
                key={label}
                to={path}
                className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border hover:shadow-card-hover hover:border-primary/20 transition-all text-left"
              >
                <div className={`mt-0.5 ${color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground block">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GerenciaRestaurantePage;
