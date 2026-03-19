import { Link, useLocation } from "react-router-dom";
import { MapPin, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === "/home" || location.pathname === "/";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border"
    >
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-extrabold text-lg">Z</span>
            </div>
            <span className="font-extrabold text-xl text-foreground tracking-tight">Zupps</span>
          </Link>

          {isHome && (
            <button className="hidden md:flex items-center gap-1.5 ml-4 px-3 py-1.5 rounded-full bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">
              <MapPin size={14} className="text-primary" />
              <span>Localização</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {isHome && (
          <div className="flex items-center gap-3">
            <Link to="/login-restaurante" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors">
              <Store size={16} className="text-primary" />
              Sou Restaurante
            </Link>
            <Link to="/login-cliente" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
              <User size={16} />
              Sou Cliente
            </Link>
          </div>
        )}
      </div>
    </motion.header>
  );
};

export default Navbar;
