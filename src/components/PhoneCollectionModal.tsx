// src/components/PhoneCollectionModal.tsx
import { useState } from "react";
import { Phone, Loader2 } from "lucide-react";
import { formatPhone } from "@/lib/utils";

interface Props {
  nomeCompleto: string;
  email: string;
  onConfirm: (telefone: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

const PhoneCollectionModal = ({
  nomeCompleto,
  email,
  onConfirm,
  isLoading,
  errorMessage,
}: Props) => {
  const [telefone, setTelefone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefone) return;
    // Remove máscara antes de enviar
    onConfirm(telefone.replace(/\D/g, ""));
  };

  return (
    // Overlay com backdrop blur
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in">

        {/* Cabeçalho */}
        <div className="mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Phone size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">
            Só falta um detalhe!
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Olá <strong>{nomeCompleto || email}</strong>! Para sua segurança,
            precisamos do seu número de telefone para finalizar o cadastro.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Phone
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="input-phone-social"
              type="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(formatPhone(e.target.value))}
              disabled={isLoading}
              autoFocus
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-background border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
            />
          </div>

          {errorMessage && (
            <p className="text-red-500 text-xs text-center">{errorMessage}</p>
          )}

          <button
            id="btn-confirm-phone-social"
            type="submit"
            disabled={!telefone || isLoading}
            className="w-full h-12 rounded-xl gradient-primary text-white font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Finalizar Cadastro"
            )}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Seus dados são protegidos. Não faremos spam.
        </p>
      </div>
    </div>
  );
};

export default PhoneCollectionModal;
