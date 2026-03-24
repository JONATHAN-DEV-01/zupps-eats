import { motion } from "framer-motion";
import { Search, MapPin, Clock, Star, Heart, LogOut, User, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getUserProfile, removeAuthToken } from "@/lib/api";

const quickCategories = [
  { emoji: "🍕", label: "Pizza" },
  { emoji: "🍔", label: "Burgers" },
  { emoji: "🍣", label: "Sushi" },
  { emoji: "🥗", label: "Saladas" },
  { emoji: "☕", label: "Café" },
  { emoji: "🍰", label: "Doces" },
];

const recentPlaces = [
  { name: "Pizzaria Bella", category: "Pizzaria", rating: 4.8, time: "25-35 min", image: "🍕" },
  { name: "Burger House", category: "Hambúrguer", rating: 4.6, time: "20-30 min", image: "🍔" },
  { name: "Sushi Garden", category: "Japonesa", rating: 4.9, time: "35-45 min", image: "🍣" },
];

const ClienteHomePage = () => {
  const navigate = useNavigate();
  const user = getUserProfile();
  const firstName = user?.nome?.split(" ")[0] || "Cliente";

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("user_profile");
    sessionStorage.clear();
    navigate("/home");
  };

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

          <div className="flex items-center gap-1.5">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">
              <MapPin size={14} className="text-primary" />
              <span className="hidden sm:inline">Localização</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container py-6 max-w-3xl">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <User size={18} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-foreground">Olá, {firstName}! 👋</h1>
              <p className="text-sm text-muted-foreground">O que deseja pedir hoje?</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-5"
        >
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Procurar restaurantes, mercados, cozinhas..."
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm font-medium shadow-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6"
        >
          <h2 className="text-sm font-bold text-foreground mb-3">Categorias</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {quickCategories.map((cat) => (
              <button
                key={cat.label}
                className="flex flex-col items-center gap-1.5 min-w-[64px] px-3 py-3 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">{cat.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Promo Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-2xl gradient-hero p-5 text-primary-foreground"
        >
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary-foreground/20 text-[11px] font-bold mb-2 backdrop-blur-sm">
            🔥 Promoção
          </span>
          <h3 className="text-lg font-extrabold mb-1">50% no primeiro pedido</h3>
          <p className="text-xs opacity-90">Use o código <strong>ZUPPS50</strong> no checkout</p>
        </motion.div>

        {/* Recent / Popular */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">Populares perto de você</h2>
            <button className="text-xs font-semibold text-primary">Ver todos</button>
          </div>
          <div className="space-y-3">
            {recentPlaces.map((place) => (
              <div
                key={place.name}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                  {place.image}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">{place.name}</h3>
                  <p className="text-xs text-muted-foreground">{place.category}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
                      <Star size={12} className="text-secondary fill-secondary" /> {place.rating}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={12} /> {place.time}
                    </span>
                  </div>
                </div>
                <button className="p-2 rounded-xl hover:bg-muted transition-colors">
                  <Heart size={18} className="text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-2 gap-3 pb-8"
        >
          <button className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all text-left">
            <ShoppingBag size={20} className="text-primary" />
            <div>
              <span className="text-sm font-bold text-foreground block">Meus Pedidos</span>
              <span className="text-[11px] text-muted-foreground">Histórico</span>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all text-left">
            <Heart size={20} className="text-destructive" />
            <div>
              <span className="text-sm font-bold text-foreground block">Favoritos</span>
              <span className="text-[11px] text-muted-foreground">Salvos</span>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ClienteHomePage;
