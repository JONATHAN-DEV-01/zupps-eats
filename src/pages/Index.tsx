import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-food.jpg";

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
            Deseje. <span className="text-gradient">Toque.</span><br />Receba.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-base md:text-lg mb-6 max-w-md"
          >
            Entrega de comida premium dos melhores restaurantes perto de você.
          </motion.p>
          <SearchBar />
        </div>
      </section>

    </div>
  );
};

export default Index;
