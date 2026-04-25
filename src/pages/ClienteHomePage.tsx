import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Clock,
  Star,
  Heart,
  LogOut,
  User,
  ShoppingBag,
  Store,
  ChevronDown,
  Truck,
  Pizza,
  Utensils,
  Leaf,
  Coffee,
  CakeSlice,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getUserProfile,
  removeAuthToken,
  fetchApi,
  API_BASE_URL,
  fetchCategoriaDestaques,
  fetchTodasCategorias,
  fetchRestaurantesPorCategoria,
  Categoria,
  RestauranteItem,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import FloatingCartButton from "@/components/FloatingCartButton";
import HeaderCartButton from "@/components/HeaderCartButton";
import { mockRestaurant } from "@/lib/mockRestaurant";

const ClienteHomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const user = getUserProfile();
  const firstName = user?.nome?.split(" ")[0] || "Cliente";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Dados ──────────────────────────────────────────────────────
  const [restaurantes, setRestaurantes] = useState<RestauranteItem[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  // ── Filtros ────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<Categoria | null>(null);

  // Fecha menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Carrega lista geral de restaurantes
  const loadRestaurantes = async () => {
    setLoading(true);
    try {
      const response = await fetchApi("/restaurantes");
      if (response.ok) {
        const data = await response.json();
        // Sempre injeta o mock (Burguer Master) no topo para permitir testes do checkout
        const merged = [mockRestaurant as any, ...data.filter((r: any) => r.id !== mockRestaurant.id)];
        // RF-06 Req.7: restaurantes abertos primeiro
        const sorted = merged.sort((a, b) =>
          a.is_open === b.is_open ? 0 : a.is_open ? -1 : 1
        );
        setRestaurantes(sorted);
      } else {
        setRestaurantes([mockRestaurant as any]);
      }
    } catch (error) {
      console.error("Erro ao carregar restaurantes", error);
      setRestaurantes([mockRestaurant as any]);
    } finally {
      setLoading(false);
    }
  };

  // RF-02 Req.7: carrega categorias para a Home
  useEffect(() => {
    fetchTodasCategorias()
      .then(setCategorias)
      .catch(() => setCategorias([]))
      .finally(() => setLoadingCategorias(false));
  }, []);

  useEffect(() => {
    loadRestaurantes();
  }, []);

  // Lê categoria da URL se vier de outra página (/cliente-home?categoria=1)
  useEffect(() => {
    const catId = searchParams.get("categoria");
    if (catId && categorias.length > 0) {
      const cat = categorias.find((c) => c.id === Number(catId));
      if (cat) handleCategoryClick(cat);
    }
  }, [categorias]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("user_profile");
    sessionStorage.clear();
    navigate("/");
  };

  // RF-04 Req.7: ao clicar em categoria, filtra via API com geolocalização
  const handleCategoryClick = async (cat: Categoria) => {
    if (activeCategory?.id === cat.id) {
      setActiveCategory(null);
      await loadRestaurantes();
      return;
    }
    setActiveCategory(cat);
    setLoading(true);

    const fetchWithCoords = async (coords?: { lat: number; lon: number }) => {
      try {
        const data = await fetchRestaurantesPorCategoria(cat.id, coords);
        // RF-06: abertos primeiro
        const sorted = [...data.results].sort((a, b) =>
          a.is_open === b.is_open ? 0 : a.is_open ? -1 : 1
        );
        setRestaurantes(sorted);
      } catch {
        toast({ title: "Erro ao filtrar categoria", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          fetchWithCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => fetchWithCoords() // sem permissão — filtra sem distância
      );
    } else {
      fetchWithCoords();
    }
  };

  // Filtro local por texto (sobre os resultados já filtrados por categoria)
  const filteredRestaurantes = restaurantes.filter((place) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      place.nome_fantasia.toLowerCase().includes(term) ||
      place.categoria?.toLowerCase().includes(term) ||
      place.categorias?.some((c) => c.nome.toLowerCase().includes(term))
    );
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const getCategoryTheme = (nome: string) => {
    const term = nome.toLowerCase();
    if (term.includes("pizza")) return { icon: <Pizza className="text-orange-500" />, color: "bg-orange-50" };
    if (term.includes("burger") || term.includes("hamburguer")) return { icon: <Utensils className="text-red-500" />, color: "bg-red-50" };
    if (term.includes("sushi") || term.includes("japones") || term.includes("chine")) return { icon: <Utensils className="text-pink-500" />, color: "bg-pink-50" };
    if (term.includes("salada") || term.includes("saudavel") || term.includes("vegan")) return { icon: <Leaf className="text-green-500" />, color: "bg-green-50" };
    if (term.includes("cafe") || term.includes("café") || term.includes("bebida")) return { icon: <Coffee className="text-brown-500" />, color: "bg-[#FDF5E6]" };
    if (term.includes("doce") || term.includes("sobremesa") || term.includes("bolo")) return { icon: <CakeSlice className="text-purple-500" />, color: "bg-purple-50" };
    return { icon: <Utensils className="text-primary" />, color: "bg-muted" };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/cliente-home" className="flex items-center gap-2">
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
            <HeaderCartButton />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <User size={16} />
                <span className="hidden sm:inline">Perfil</span>
                <ChevronDown
                  size={14}
                  className={`text-muted-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    className="absolute right-0 mt-2 w-52 rounded-xl bg-card border border-border shadow-lg overflow-hidden z-50"
                  >
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <ShoppingBag size={16} className="text-primary" /> Meus Pedidos
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); navigate("/meus-pedidos"); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <ShoppingBag size={16} className="text-primary" /> Meus Pedidos
                    </button>
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Heart size={16} className="text-destructive" /> Favoritos
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); navigate("/cliente-perfil"); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <User size={16} className="text-primary" /> Meu Perfil
                    </button>
                    <div className="h-px bg-border" />
                    <button
                      onClick={() => { setMenuOpen(false); handleLogout(); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-destructive hover:bg-muted transition-colors"
                    >
                      <LogOut size={16} /> Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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

        {/* Campo de busca — ao clicar navega para /busca */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-5"
        >
          <div
            className="relative cursor-pointer"
            onClick={() => navigate("/busca")}
          >
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <div className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border text-muted-foreground text-sm font-medium shadow-card flex items-center select-none">
              Procurar produtos em todos os restaurantes...
            </div>
          </div>
        </motion.div>

        {/* Filtro local dentro da home (para nome de restaurante) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-3"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar restaurantes pelo nome..."
            className="w-full h-10 px-4 rounded-xl bg-muted border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground transition-all"
          />
        </motion.div>

        {/* Categories — RF-02 Req.7: carrossel dinâmico com dados do backend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">Categorias</h2>
            {activeCategory && (
              <button
                onClick={() => { setActiveCategory(null); loadRestaurantes(); }}
                className="text-[10px] font-bold text-primary uppercase tracking-wider"
              >
                Limpar Filtro
              </button>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {loadingCategorias
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-16 h-20 rounded-2xl bg-muted animate-pulse shrink-0"
                  />
                ))
              : categorias.length > 0
              ? categorias.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className={`flex flex-col items-center gap-1.5 min-w-[64px] px-3 py-3 rounded-2xl border transition-all shrink-0 ${
                      activeCategory?.id === cat.id
                        ? "bg-primary/10 border-primary shadow-sm scale-95"
                        : "bg-card border-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5"
                    }`}
                  >
                    {cat.imagem_url ? (
                      <img
                        src={cat.imagem_url}
                        alt={cat.nome}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryTheme(cat.nome).color}`}>
                        {getCategoryTheme(cat.nome).icon}
                      </div>
                    )}
                    <span
                      className={`text-[11px] font-semibold whitespace-nowrap ${
                        activeCategory?.id === cat.id ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {cat.nome}
                    </span>
                  </button>
                ))
              : // Sem destaques — mostra botão para explorar
                <button
                  onClick={() => navigate("/busca")}
                  className="flex flex-col items-center gap-1.5 min-w-[80px] px-3 py-3 rounded-2xl border border-dashed border-border text-muted-foreground text-xs font-semibold shrink-0"
                >
                  <Search size={20} />
                  Explorar
                </button>
            }
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
          <p className="text-xs opacity-90">
            Use o código <strong>ZUPPS50</strong> no checkout
          </p>
        </motion.div>

        {/* Listagem de Restaurantes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">
              {activeCategory
                ? `Resultados para "${activeCategory.nome}"`
                : "Populares perto de você"}
            </h2>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              {filteredRestaurantes.length} Encontrado{filteredRestaurantes.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Buscando sabores...</p>
              </div>
            ) : filteredRestaurantes.length > 0 ? (
              filteredRestaurantes.map((place) => (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/restaurante/${place.id}`)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all cursor-pointer"
                >
                  {/* Logo */}
                  <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center flex-shrink-0 border border-border/50">
                    {place.logotipo ? (
                      <img
                        src={`${API_BASE_URL}/${place.logotipo.replace(/\\/g, "/")}`}
                        alt={place.nome_fantasia}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store size={24} className="text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {place.nome_fantasia}
                      </h3>
                      {/* RF-06 Req.7: badge aberto/fechado */}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          place.is_open
                            ? "bg-green-500/10 text-green-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {place.is_open ? "Aberto" : "Fechado"}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {place.categoria || place.categorias?.[0]?.nome || "Restaurante"}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {/* RF-04 Req.6: nota real */}
                      <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
                        <Star size={12} className="text-secondary fill-secondary" />
                        {place.nota_avaliacao != null
                          ? place.nota_avaliacao.toFixed(1)
                          : "—"}
                      </span>

                      {/* RF-04: tempo de entrega real */}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={12} />
                        {place.tempo_entrega_minutos != null
                          ? `${place.tempo_entrega_minutos} min`
                          : "—"}
                      </span>

                      {/* RF-04: valor do frete real */}
                      {place.valor_frete != null && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Truck size={12} />
                          {place.valor_frete === 0
                            ? "Grátis"
                            : formatCurrency(place.valor_frete)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <Heart size={18} className="text-muted-foreground" />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-10 bg-muted/20 rounded-3xl border border-dashed border-border">
                <Store size={32} className="mx-auto text-muted-foreground mb-2 opacity-20" />
                <p className="text-sm font-bold text-foreground">
                  {activeCategory
                    ? `Nenhum restaurante encontrado para "${activeCategory.nome}"`
                    : "Nenhum restaurante encontrado"}
                </p>
                <p className="text-xs text-muted-foreground">Tente ajustar seus filtros.</p>
                {(searchTerm || activeCategory) && (
                  <button
                    onClick={() => { setSearchTerm(""); setActiveCategory(null); loadRestaurantes(); }}
                    className="mt-4 text-xs font-bold text-primary underline"
                  >
                    Ver todos os restaurantes
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <div className="pb-8" />
      </div>
      <FloatingCartButton />
    </div>
  );
};

export default ClienteHomePage;