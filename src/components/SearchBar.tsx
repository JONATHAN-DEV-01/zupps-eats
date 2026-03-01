import { Search } from "lucide-react";
import { motion } from "framer-motion";

const SearchBar = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative w-full max-w-2xl mx-auto"
    >
      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Procurar restaurantes, mercados, cozinhas..."
          aria-label="Search for food"
          className="w-full h-13 pl-12 pr-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm font-medium shadow-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>
    </motion.div>
  );
};

export default SearchBar;
