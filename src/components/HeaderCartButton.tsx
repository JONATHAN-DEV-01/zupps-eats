import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

const HeaderCartButton = () => {
  const { totalItens } = useCart();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/carrinho")}
      className="relative p-2 rounded-xl hover:bg-muted transition-colors"
      title="Carrinho"
    >
      <ShoppingCart size={20} className="text-foreground" />
      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
        {totalItens > 99 ? "99+" : totalItens}
      </span>
    </button>
  );
};

export default HeaderCartButton;
