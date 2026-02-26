import { motion } from "framer-motion";
import { UtensilsCrossed, Pizza, Salad, Coffee, IceCream, Sandwich, Fish, Soup } from "lucide-react";

const categories = [
  { name: "All", icon: UtensilsCrossed },
  { name: "Pizza", icon: Pizza },
  { name: "Salads", icon: Salad },
  { name: "Café", icon: Coffee },
  { name: "Desserts", icon: IceCream },
  { name: "Burgers", icon: Sandwich },
  { name: "Sushi", icon: Fish },
  { name: "Soups", icon: Soup },
];

const CategorySlider = () => {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-2">
      <div className="flex gap-3 min-w-max px-1">
        {categories.map((cat, i) => (
          <motion.button
            key={cat.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={`flex flex-col items-center gap-2 px-5 py-3 rounded-2xl transition-all ${
              i === 0
                ? "gradient-primary text-primary-foreground shadow-float"
                : "bg-card text-foreground shadow-card hover:shadow-card-hover hover:-translate-y-0.5"
            }`}
            aria-label={`Category: ${cat.name}`}
          >
            <cat.icon size={22} />
            <span className="text-xs font-semibold whitespace-nowrap">{cat.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CategorySlider;
