import Navbar from "@/components/Navbar";
import FloatingCart from "@/components/FloatingCart";
import { motion } from "framer-motion";
import { Star, Clock, DollarSign, ArrowLeft, Plus, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import restaurantCover from "@/assets/restaurant-cover.jpg";

const menuItems = [
  { id: 1, name: "Truffle Margherita", desc: "Fresh mozzarella, truffle oil, basil", price: 16.90, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80", popular: true },
  { id: 2, name: "Burrata Salad", desc: "Heirloom tomatoes, arugula, balsamic glaze", price: 14.50, image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80", popular: false },
  { id: 3, name: "Pasta Carbonara", desc: "Guanciale, pecorino, fresh egg yolk", price: 18.90, image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80", popular: true },
  { id: 4, name: "Tiramisu", desc: "Classic Italian dessert, espresso soaked", price: 9.90, image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80", popular: false },
  { id: 5, name: "Risotto al Funghi", desc: "Wild mushroom, parmesan, white wine", price: 19.50, image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80", popular: true },
];

const reviews = [
  { id: 1, name: "Sarah M.", rating: 5, text: "Absolutely incredible pasta! Best carbonara in the city.", date: "2 days ago" },
  { id: 2, name: "James L.", rating: 4, text: "Great food, slightly long delivery but worth the wait.", date: "1 week ago" },
  { id: 3, name: "Anna K.", rating: 5, text: "The truffle margherita is to die for. Will order again!", date: "3 days ago" },
];

const RestaurantPage = () => {
  return (
    <div className="min-h-screen bg-background pb-28">
      <Navbar />

      {/* Cover */}
      <div className="relative w-full h-56 md:h-80 overflow-hidden">
        <img src={restaurantCover} alt="Bella Napoli" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <Link
          to="/"
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-xl bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-card hover:bg-card transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </Link>
        <button
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-card hover:bg-card transition-colors"
          aria-label="Favorite"
        >
          <Heart size={18} className="text-primary" />
        </button>
      </div>

      {/* Restaurant Info */}
      <div className="container -mt-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-card p-6"
        >
          <h1 className="text-2xl font-extrabold text-foreground mb-1">Bella Napoli</h1>
          <p className="text-muted-foreground text-sm mb-4">Italian • Pizza • Pasta • Fine Dining</p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/10 text-secondary font-bold">
              <Star size={14} className="fill-secondary" /> 4.6
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock size={14} /> 30-40 min
            </span>
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <DollarSign size={14} className="text-accent" />
              <DollarSign size={14} className="text-accent" />
              <DollarSign size={14} className="text-border" />
            </span>
            <span className="text-muted-foreground">Min. $15.00</span>
          </div>
        </motion.div>

        {/* Menu */}
        <section className="mt-8" aria-label="Menu">
          <h2 className="text-lg font-bold text-foreground mb-5">Menu</h2>
          <div className="space-y-4">
            {menuItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 bg-card rounded-2xl shadow-card p-4 hover:shadow-card-hover transition-all group"
              >
                <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  {item.popular && (
                    <span className="absolute top-1 left-1 px-2 py-0.5 rounded-md gradient-primary text-primary-foreground text-[10px] font-bold">
                      Popular
                    </span>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.desc}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-extrabold text-foreground">${item.price.toFixed(2)}</span>
                    <button
                      className="w-9 h-9 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                      aria-label={`Add ${item.name} to cart`}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section className="mt-10" aria-label="Reviews">
          <h2 className="text-lg font-bold text-foreground mb-5">Reviews</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-card rounded-2xl shadow-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full gradient-dark flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {review.name[0]}
                    </div>
                    <span className="font-semibold text-sm text-foreground">{review.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className={i < review.rating ? "text-secondary fill-secondary" : "text-border"}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{review.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <FloatingCart />
    </div>
  );
};

export default RestaurantPage;
