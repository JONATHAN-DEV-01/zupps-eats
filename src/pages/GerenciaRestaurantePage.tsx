import { motion } from "framer-motion";
import { Store, Power, Settings, Clock, ImageIcon, FileText, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

const GerenciaRestaurantePage = () => {
  const [active, setActive] = useState(true);
  const restaurantName = "Meu Restaurante"; // TODO: load from API

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
          <Link to="/home" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors">
            <LogOut size={18} />
            <span className="hidden sm:inline">Sair</span>
          </Link>
        </div>
      </header>

      <div className="container py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Restaurant Info Card */}
          <div className="rounded-2xl bg-card border border-border p-6 mb-6 shadow-card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                <Store size={28} className="text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold text-foreground">{restaurantName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${active ? "bg-accent" : "bg-destructive"}`} />
                  <span className="text-sm font-medium text-muted-foreground">
                    {active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <h2 className="text-lg font-extrabold text-foreground mb-4">Gerenciamento</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: FileText, label: "Cardápio", desc: "Gerencie seus pratos e preços", color: "text-primary" },
              { icon: Clock, label: "Horários", desc: "Configure horários de funcionamento", color: "text-secondary" },
              { icon: ImageIcon, label: "Imagens", desc: "Atualize capa e logo", color: "text-accent" },
              { icon: Settings, label: "Configurações", desc: "Dados do restaurante", color: "text-muted-foreground" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <button
                key={label}
                className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border hover:shadow-card-hover hover:border-primary/20 transition-all text-left"
              >
                <div className={`mt-0.5 ${color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground block">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GerenciaRestaurantePage;
