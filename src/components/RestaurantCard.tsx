import { Star, Clock, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface RestaurantCardProps {
  id: string;
  name: string;
  image: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  priceLevel: number;
  featured?: boolean;
}

const RestaurantCard = ({
  id,
  name,
  image,
  cuisine,
  rating,
  deliveryTime,
  priceLevel,
  featured,
}: RestaurantCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        to={`/restaurant/${id}`}
        className="group block rounded-2xl overflow-hidden bg-card shadow-card hover:shadow-card-hover transition-all"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {featured && (
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold">
              Featured
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-sm text-xs font-bold text-foreground">
            <Star size={13} className="text-secondary fill-secondary" />
            {rating.toFixed(1)}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-foreground text-base mb-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">{cuisine}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {deliveryTime}
            </span>
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <DollarSign
                  key={i}
                  size={13}
                  className={i < priceLevel ? "text-accent" : "text-border"}
                />
              ))}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default RestaurantCard;
