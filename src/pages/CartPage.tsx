import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, Tag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const cartItems = [
  { id: 1, name: "Truffle Margherita", restaurant: "Bella Napoli", price: 16.90, qty: 1, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&q=80" },
  { id: 2, name: "Pasta Carbonara", restaurant: "Bella Napoli", price: 18.90, qty: 2, image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=200&q=80" },
  { id: 3, name: "Tiramisu", restaurant: "Bella Napoli", price: 9.90, qty: 1, image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200&q=80" },
];

const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
const deliveryFee = 3.99;
const total = subtotal + deliveryFee;

const CartPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-extrabold text-foreground mb-6"
        >
          Your Cart
        </motion.h1>

        {/* Items */}
        <div className="space-y-4 mb-8">
          {cartItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4 bg-card rounded-2xl shadow-card p-4"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.restaurant}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-extrabold text-foreground">${(item.price * item.qty).toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors" aria-label="Decrease quantity">
                      {item.qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                    </button>
                    <span className="w-6 text-center font-bold text-sm text-foreground">{item.qty}</span>
                    <button className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity" aria-label="Increase quantity">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Coupon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-8"
        >
          <div className="relative flex-1">
            <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Enter coupon code"
              aria-label="Coupon code"
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <button className="px-5 h-12 rounded-xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-opacity">
            Apply
          </button>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl shadow-card p-6 space-y-3"
        >
          <h2 className="font-bold text-foreground mb-3">Order Summary</h2>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Fee</span>
            <span className="font-semibold text-foreground">${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-bold text-foreground">Total</span>
            <span className="font-extrabold text-xl text-foreground">${total.toFixed(2)}</span>
          </div>

          <button className="w-full mt-4 flex items-center justify-center gap-2 h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-base shadow-float hover:opacity-95 transition-opacity">
            Proceed to Checkout
            <ArrowRight size={18} />
          </button>
        </motion.div>

        <Link to="/" className="block text-center mt-6 text-sm font-medium text-primary hover:underline">
          ← Continue Shopping
        </Link>
      </main>
    </div>
  );
};

export default CartPage;
