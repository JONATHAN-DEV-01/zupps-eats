import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const FloatingCart = ({ itemCount = 3, total = "24.90" }: { itemCount?: number; total?: string }) => {
  if (itemCount === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg"
    >
      <Link
        to="/cart"
        className="flex items-center justify-between w-full px-6 py-4 rounded-2xl gradient-primary text-primary-foreground shadow-float hover:opacity-95 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag size={22} />
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-secondary text-secondary-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <span className="font-bold text-sm">View Cart</span>
        </div>
        <span className="font-extrabold text-lg">${total}</span>
      </Link>
    </motion.div>
  );
};

export default FloatingCart;
