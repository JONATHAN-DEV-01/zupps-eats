import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import CategorySlider from "@/components/CategorySlider";
import RestaurantCard from "@/components/RestaurantCard";
import PromoBanner from "@/components/PromoBanner";
import FloatingCart from "@/components/FloatingCart";
import { motion } from "framer-motion";
import { SlidersHorizontal, Star, Clock, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-food.jpg";

const restaurants = [
  { id: "1", name: "Sakura Sushi", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80", cuisine: "Japanese • Sushi • Asian", rating: 4.8, deliveryTime: "25-35 min", priceLevel: 2, featured: true },
  { id: "2", name: "Bella Napoli", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80", cuisine: "Italian • Pizza • Pasta", rating: 4.6, deliveryTime: "30-40 min", priceLevel: 2, featured: false },
  { id: "3", name: "Green Bowl", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", cuisine: "Healthy • Salads • Bowls", rating: 4.9, deliveryTime: "20-30 min", priceLevel: 1, featured: true },
  { id: "4", name: "Burger District", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80", cuisine: "American • Burgers • Fries", rating: 4.5, deliveryTime: "15-25 min", priceLevel: 1, featured: false },
  { id: "5", name: "Taj Mahal Kitchen", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80", cuisine: "Indian • Curry • Tandoori", rating: 4.7, deliveryTime: "35-45 min", priceLevel: 2, featured: false },
  { id: "6", name: "Le Petit Café", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80", cuisine: "French • Café • Pastries", rating: 4.8, deliveryTime: "20-30 min", priceLevel: 3, featured: true },
];

const filters = [
  { label: "Rating 4.5+", icon: Star },
  { label: "Under 30 min", icon: Clock },
  { label: "Trending", icon: TrendingUp },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative w-full h-[340px] md:h-[420px] overflow-hidden" aria-label="Hero banner">
        <img src={heroImage} alt="Delicious food variety" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative z-10 container h-full flex flex-col justify-end pb-8 md:pb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-extrabold text-foreground mb-2 leading-tight"
          >
            Crave it. <span className="text-gradient">Tap it.</span><br />Get it.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-base md:text-lg mb-6 max-w-md"
          >
            Premium food delivery from the best restaurants near you.
          </motion.p>
          <SearchBar />
        </div>
      </section>

      <main className="container py-8 space-y-10 pb-28">
        {/* Categories */}
        <section aria-label="Food categories">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Browse by Category</h2>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open filters"
            >
              <SlidersHorizontal size={15} />
              Filters
            </button>
          </div>
          <CategorySlider />
        </section>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.label}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground shadow-card hover:border-primary hover:text-primary transition-all"
            >
              <f.icon size={14} />
              {f.label}
            </button>
          ))}
        </div>

        {/* Promo */}
        <PromoBanner />

        {/* Restaurants */}
        <section aria-label="Restaurants">
          <h2 className="text-lg font-bold text-foreground mb-5">Popular Near You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {restaurants.map((r, i) => (
              <RestaurantCard key={r.id} {...r} />
            ))}
          </div>
        </section>
      </main>

      <FloatingCart />
    </div>
  );
};

export default Index;
