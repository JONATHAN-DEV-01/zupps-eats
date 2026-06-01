import { motion } from "framer-motion";
import { Store, Power, Clock, FileText, ImageIcon, Settings, LogOut, TrendingUp, ShoppingBag, Star, Users, ChevronRight, User, BarChart3, Package } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
// Importamos o API_BASE_URL para padronizar
import { fetchApi, getUserProfile, removeAuthToken, resolveImageUrl } from "@/lib/api";
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
      // Modo demo: sem usuário logado, exibe um restaurante fictício para visualização da tela.
      if (!user) {
        const demo = {
          id: "demo",
          nome_fantasia: "Burguer Master (Demo)",
          razao_social: "Demo Restaurante LTDA",
          endereco: "Rua das Flores, 123 - Centro",
          telefone: "(11) 99999-0000",
          email: "demo@burguermaster.com",
          logotipo: null,
          capa: null,
          ativo: true,
        };
        setRestaurant(demo);
        setActive(true);
        setLoading(false);
        return;
      }
      try {
        // Garantimos que pega o ID correto dependendo de como o objeto user foi salvo
        const targetId = user.id || user.restaurante_id;
        
        const response = await fetchApi(`/restaurantes?id=${targetId}`);
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
      // Como o backend usa request.get_json() para esta rota específica, enviamos JSON normalmente!
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
    navigate("/");
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
    { icon: FileText, label: "Cardápio", desc: "Gerencie seus pratos e preços", path: "/gerencia-cardapio", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { icon: Package, label: "Estoque", desc: "Disponibilidade em tempo real", path: "/estoque", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { icon: Clock, label: "Horários", desc: "Configure horários de funcionamento", path: "/cadastro-horario-restaurante", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { icon: ImageIcon, label: "Imagens", desc: "Atualize capa e logo", path: "/cadastro-logo-restaurante", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { icon: Settings, label: "Configurações", desc: "Dados do restaurante", path: "/cadastro-dados-restaurante", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800/50" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/restaurante-home" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-extrabold text-lg">Z</span>
            </div>
            <span className="font-extrabold text-xl text-foreground tracking-tight">Zupps</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-muted transition-colors">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-border">
                  {restaurant?.logotipo ? (
                    <img src={resolveImageUrl(restaurant.logotipo) ?? ''} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-muted-foreground" />
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-semibold text-foreground max-w-[120px] truncate">
                  {restaurant?.nome_fantasia || "Perfil"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Minha conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/gerencia-restaurante")} className="cursor-pointer gap-2">
                <Settings size={15} className="text-primary" /> Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/gerencia-cardapio")} className="cursor-pointer gap-2">
                <FileText size={15} className="text-primary" /> Cardápio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/estoque")} className="cursor-pointer gap-2">
                <Package size={15} className="text-primary" /> Estoque
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/ingredientes")} className="cursor-pointer gap-2">
                <FileText size={15} className="text-primary" /> Ingredientes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                <LogOut size={15} /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="container py-6 max-w-3xl">
        {/* Welcome + Status */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                {restaurant?.logotipo ? (
                  // Tratamento corrigido para o caminho da imagem usando API_BASE_URL e replace
                  <img src={resolveImageUrl(restaurant.logotipo) ?? ''} alt={restaurant.nome_fantasia} className="w-full h-full object-cover" />
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
            {quickActions.map(({ icon: Icon, label, desc, path, color, bg }) => (
              <Link
                key={label}
                to={path}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover hover:border-primary/20 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                  <Icon size={20} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-foreground block">{label}</span>
                  <span className="text-[11px] text-muted-foreground">{desc}</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RestauranteHomePage;