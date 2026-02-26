import { motion } from "framer-motion";
import promoImage from "@/assets/promo-food.jpg";

const PromoBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="relative w-full rounded-2xl overflow-hidden gradient-hero p-6 md:p-10"
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 text-primary-foreground">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-foreground/20 text-xs font-bold mb-3 backdrop-blur-sm">
            🔥 Limited Time
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-2 leading-tight">
            50% Off Your First Order
          </h2>
          <p className="text-sm md:text-base opacity-90 mb-4 max-w-md">
            Explore premium restaurants and get an exclusive discount. Use code <strong>ZUPPS50</strong> at checkout.
          </p>
          <button className="px-6 py-3 rounded-xl bg-primary-foreground text-primary font-bold text-sm hover:opacity-90 transition-opacity">
            Order Now
          </button>
        </div>
        <div className="w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden shadow-float flex-shrink-0">
          <img
            src={promoImage}
            alt="Delicious food promo"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default PromoBanner;
