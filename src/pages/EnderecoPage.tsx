import { motion } from "framer-motion";
import { MapPin, Home, Hash, Building, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const EnderecoPage = () => {
  const navigate = useNavigate();
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [semComplemento, setSemComplemento] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cep && rua && bairro && numero) navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary-foreground"
              style={{
                width: `${60 + i * 40}px`,
                height: `${60 + i * 40}px`,
                top: `${10 + i * 15}%`,
                left: `${5 + i * 12}%`,
                opacity: 0.15 - i * 0.02,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-primary-foreground text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl font-extrabold">Z</span>
          </div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            Onde você está?
          </h2>
          <p className="text-lg opacity-80">
            Informe seu endereço para encontrarmos os melhores restaurantes perto de você.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-extrabold text-lg">Z</span>
            </div>
            <span className="font-extrabold text-xl text-foreground">Zupps</span>
          </Link>

          <h1 className="text-2xl font-extrabold text-foreground mb-2">
            Seu endereço
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Última etapa! Informe seu endereço de entrega
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="CEP *"
                aria-label="CEP"
                required
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="relative">
              <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nome da Rua *"
                aria-label="Nome da Rua"
                required
                value={rua}
                onChange={(e) => setRua(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="relative">
              <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Bairro *"
                aria-label="Bairro"
                required
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="relative">
              <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Número *"
                aria-label="Número"
                required
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            {/* Complemento */}
            <div>
              <div className="relative">
                <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Complemento"
                  aria-label="Complemento"
                  disabled={semComplemento}
                  value={semComplemento ? "" : complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className={`w-full h-12 pl-11 pr-4 rounded-xl border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                    semComplemento ? "bg-muted cursor-not-allowed opacity-60" : "bg-card"
                  }`}
                />
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={semComplemento}
                  onChange={(e) => {
                    setSemComplemento(e.target.checked);
                    if (e.target.checked) setComplemento("");
                  }}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 accent-primary"
                />
                <span className="text-sm text-muted-foreground">Não há complemento</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
            >
              Finalizar
              <ArrowRight size={16} />
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default EnderecoPage;
