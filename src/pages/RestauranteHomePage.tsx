import { motion } from "framer-motion";
import { Store, Power, Clock, FileText, ImageIcon, Settings, LogOut, TrendingUp, ShoppingBag, Star, Users, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { fetchApi, getUserProfile, removeAuthToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const RestauranteHomePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [active, setActive] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const user = getUserProfile();

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!user) { navigate("/login-restaurante"); return; }
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
        toast({ title: "Erro", description: "Falha ao carregar dados.", variant: "destructive" });
      } finally { setLoading(false); }
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
        toast({ title: "Status atualizado", description: `Restaurante ${checked ? "ativo" : "inativo"}.` });
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao atualizar status.", variant: "destructive" });
    } finally { setUpdatingStatus(false); }
  };

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("user_profile");
    sessionStorage.clear();
    navigate("/home");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  const stats = [
    { icon: ShoppingBag, label: "Pedidos hoje", value: "0", color: "text-primary" },
    { icon: TrendingUp, label: "Faturamento", value: "R$ 0", color: "text-accent" },
    { icon: Star, label: "Avaliação", value: "—", color: "text-secondary" },
    { icon: Users, label: "Clientes", value: "0", color: "text-primary" },
  ];

  const quickActions = [
    { icon: FileText, label: "Cardápio", desc: "Gerencie pratos e preços", path: "/gerencia-cardapio" },
    { icon: Clock, label: "Horários", desc: "Funcionamento semanal", path: "/cadastro-horario-restaurante" },
    { icon: ImageIcon, label: "Imagens", desc: "Capa e logotipo", path: "/cadastro-logo-restaurante" },
    { icon: Settings, label: "Dados", desc: "Informações do restaurante", path: "/cadastro-dados-restaurante" },
  ];

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
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors">
            <LogOut size={16} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <div className="container py-6 max-w-3xl">
        {/* Welcome + Status */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                {restaurant?.logotipo ? (
                  <img src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/uploads/${restaurant.logotipo}`} alt={restaurant.nome_fantasia} className="w-full h-full object-cover" />
                ) : (
                  <Store size={24} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-foreground">{restaurant?.nome_fantasia || "Restaurante"}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${active ? "bg-accent" : "bg-destructive"}`} />
                  <span className="text-xs font-medium text-muted-foreground">{active ? "Aberto agora" : "Fechado"}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground hidden sm:inline">{updatingStatus ? "..." : active ? "Online" : "Offline"}</span>
              <Switch checked={active} onCheckedChange={handleStatusToggle} disabled={updatingStatus} />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="p-4 rounded-2xl bg-card border border-border shadow-card text-center">
              <stat.icon size={20} className={`${stat.color} mx-auto mb-2`} />
              <span className="text-lg font-extrabold text-foreground block">{stat.value}</span>
              <span className="text-[11px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Promo/Tip Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl gradient-hero p-5 text-primary-foreground mb-6"
        >
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary-foreground/20 text-[11px] font-bold mb-2 backdrop-blur-sm">
            💡 Dica
          </span>
          <h3 className="text-base font-extrabold mb-1">Complete seu cardápio</h3>
          <p className="text-xs opacity-90">Restaurantes com cardápio completo recebem até 3x mais pedidos.</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-bold text-foreground mb-3">Gerenciamento</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
            {quickActions.map(({ icon: Icon, label, desc, path }) => (
              <Link
                key={label}
                to={path}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover hover:border-primary/20 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-foreground block">{label}</span>
                  <span className="text-[11px] text-muted-foreground">{desc}</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RestauranteHomePage;
