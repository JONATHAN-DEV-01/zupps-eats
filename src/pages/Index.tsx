import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Utensils, 
  Pizza, 
  Leaf, 
  Coffee, 
  CakeSlice, 
  Star, 
  Clock, 
  Heart,
  ShoppingBag,
  History,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { fetchApi, API_BASE_URL, getUserProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-food.jpg";

const CATEGORIES = [
  { name: "Pizza", icon: <Pizza className="text-orange-500" />, color: "bg-orange-50" },
  { name: "Burgers", icon: <Utensils className="text-red-500" />, color: "bg-red-50" },
  { name: "Sushi", icon: <Utensils className="text-pink-500" />, color: "bg-pink-50" },
  { name: "Saladas", icon: <Leaf className="text-green-500" />, color: "bg-green-50" },
  { name: "Café", icon: <Coffee className="text-brown-500" />, color: "bg-[#FDF5E6]" },
  { name: "Doces", icon: <CakeSlice className="text-purple-500" />, color: "bg-purple-50" },
];

const Index = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [restaurantes, setRestaurantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const profile = getUserProfile();
    if (profile) {
      setUser(profile);
    }

    const loadRestaurantes = async () => {
      try {
        const response = await fetchApi("/restaurantes");
        if (response.ok) {
          const data = await response.json();
          setRestaurantes(data);
        }
      } catch (err) {
        // Silently fail if public, show toast if private
        if (profile) {
           toast({ title: "Erro", description: "Não foi possível carregar os restaurantes.", variant: "destructive" });
        }
      } finally {
        setLoading(false);
      }
    };

    loadRestaurantes();
  }, []);

  // Landing Page (Unauthenticated)
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="relative">
          {/* Hero Section */}
          <section className="relative w-full h-[80vh] min-h-[500px] overflow-hidden">
            <div className="absolute inset-0">
              <img 
                src={heroImage} 
                alt="Banner" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-background" />
            </div>

            <div className="container relative h-full flex flex-col justify-center items-start pt-20">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-xl"
              >
                <h1 className="text-5xl md:text-7xl font-black text-foreground leading-[1.1] mb-6">
                  Deseje. <span className="text-primary">Toque.</span><br />
                  Receba.
                </h1>
                <p className="text-lg md:text-xl text-foreground font-medium opacity-90 max-w-md mb-8">
                  Entrega de comida premium dos melhores restaurantes perto de você.
                </p>

                <div className="relative w-full max-w-2xl">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Procurar restaurantes, mercados, cozinhas..."
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-background shadow-2xl border border-white/20 backdrop-blur-md text-foreground placeholder:text-muted-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </motion.div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Dashboard (Authenticated)
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="container pt-6 space-y-8">
        {/* Saudação */}
        <section className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              Olá, {user?.nome || user?.nome_fantasia || "Usuário"}! 👋
            </h1>
            <p className="text-muted-foreground text-sm">O que deseja pedir hoje?</p>
          </div>
        </section>

        {/* Busca */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Procurar restaurantes, mercados, cozinhas..."
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>

        {/* Categorias */}
        <section className="space-y-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Categorias</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
            {CATEGORIES.map((cat, idx) => (
              <motion.button 
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div className={`w-16 h-16 rounded-2xl ${cat.color} flex items-center justify-center shadow-sm`}>
                  {cat.icon}
                </div>
                <span className="text-xs font-bold text-foreground">{cat.name}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Banner Promoção */}
        <section>
          <div className="w-full rounded-3xl overflow-hidden relative aspect-[21/9] md:aspect-[21/6] bg-gradient-to-r from-orange-500 to-yellow-400 p-6 flex flex-col justify-center text-white shadow-lg">
            <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Promoção
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-1">50% no primeiro pedido</h2>
            <p className="text-sm md:text-base opacity-90 font-medium">Use o código <span className="underline decoration-2 font-bold">ZUPPS50</span> no checkout</p>
            
            <div className="absolute right-[-20px] bottom-[-20px] opacity-20 transform rotate-[-12deg]">
              <ShoppingBag size={180} />
            </div>
          </div>
        </section>

        {/* Lista de Restaurantes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Populares perto de você</h2>
            <button className="text-xs font-bold text-primary">Ver todos</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
              ))
            ) : restaurantes.length > 0 ? (
              restaurantes.map((res) => (
                <motion.div 
                  key={res.id}
                  whileHover={{ y: -4 }}
                  className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden flex-shrink-0">
                      {res.logotipo ? (
                        <img 
                          src={`${API_BASE_URL}/${res.logotipo.replace(/\\/g, '/')}`} 
                          alt={res.nome_fantasia} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Utensils size={24} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                        {res.nome_fantasia}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-1">{res.categoria || "Restaurante"}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-orange-500 font-bold">
                          <Star size={12} fill="currentColor" /> 4.8
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground font-medium">
                          <Clock size={12} /> 25-35 min
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all">
                    <Heart size={18} />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                Nenhum restaurante disponível no momento.
              </div>
            )}
          </div>
        </section>

        {/* Footer Buttons */}
        <section className="grid grid-cols-2 gap-4 pb-12">
          <button className="flex items-center gap-3 p-4 rounded-3xl bg-card border border-border hover:bg-muted transition-colors text-left shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <History size={20} />
            </div>
            <div>
              <span className="text-sm font-extrabold text-foreground block">Meus Pedidos</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Histórico</span>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-3xl bg-card border border-border hover:bg-muted transition-colors text-left shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <Heart size={20} />
            </div>
            <div>
              <span className="text-sm font-extrabold text-foreground block">Favoritos</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Salvos</span>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
};

export default Index;
