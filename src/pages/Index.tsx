import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
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

  // Redirect immediately if Authenticated
  const isRestaurante = user?.perfil === "RESTAURANTE";
  return <Navigate to={isRestaurante ? "/restaurante-home" : "/cliente-home"} replace />;
};

export default Index;
