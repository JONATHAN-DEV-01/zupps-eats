import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  backgroundImage: string;
  panelTitle: string;
  panelSubtitle: string;
  children: React.ReactNode;
}

const AuthLayout = ({ backgroundImage, panelTitle, panelSubtitle, children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Food Image Panel */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden bg-zinc-900">
        <img
          src={backgroundImage}
          alt="Food"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-primary-foreground text-center max-w-md px-8">
          <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl font-extrabold">Z</span>
          </div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            {panelTitle}
          </h2>
          <p className="text-lg opacity-80">
            {panelSubtitle}
          </p>
        </div>
      </div>

      {/* Right - Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/home" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-extrabold text-lg">Z</span>
            </div>
            <span className="font-extrabold text-xl text-foreground">Zupps</span>
          </Link>
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
