import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import {
  CartaoTokenizado,
  HistoricoTransacao,
  StatusPagamento,
  formatCentavos,
  formatCVV,
  formatNumeroCartao,
  formatValidade,
  listarCartoes,
  processarPagamento,
  removerCartao,
  tokenizarCartao,
  validarCVV,
  validarNumeroCartao,
  validarValidade,
} from "@/lib/payments";
import { useToast } from "@/hooks/use-toast";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    restaurante,
    itens,
    subtotalCentavos,
    freteCentavos,
    totalCentavos,
    clearCart,
  } = useCart();

  const [cartoes, setCartoes] = useState<CartaoTokenizado[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showNewCard, setShowNewCard] = useState(false);

  // New card form
  const [numero, setNumero] = useState("");
  const [titular, setTitular] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [savingCard, setSavingCard] = useState(false);

  // Payment processing
  const [processing, setProcessing] = useState(false);
  const [forcedStatus, setForcedStatus] = useState<StatusPagamento | undefined>(undefined);
  const [resultado, setResultado] = useState<HistoricoTransacao | null>(null);

  useEffect(() => {
    const list = listarCartoes();
    setCartoes(list);
    if (list.length > 0) setSelectedCardId(list[0].id);
  }, []);

  // Guard: empty cart or no restaurant — redirect back
  useEffect(() => {
    if (!processing && !resultado && (itens.length === 0 || !restaurante)) {
      navigate("/carrinho");
    }
  }, [itens.length, restaurante, processing, resultado, navigate]);

  // Validations
  const numeroOk = useMemo(
    () => numero.replace(/\D/g, "").length === 16 && validarNumeroCartao(numero),
    [numero]
  );
  const validadeOk = useMemo(() => validarValidade(validade), [validade]);
  const cvvOk = useMemo(() => validarCVV(cvv), [cvv]);
  const titularOk = titular.trim().length >= 3;
  const formOk = numeroOk && validadeOk && cvvOk && titularOk;

  const handleSalvarCartao = async () => {
    if (!formOk) return;
    setSavingCard(true);
    try {
      const novo = await tokenizarCartao({ numero, titular, validade, cvv });
      const list = listarCartoes();
      setCartoes(list);
      setSelectedCardId(novo.id);
      setShowNewCard(false);
      setNumero(""); setTitular(""); setValidade(""); setCvv("");
      toast({ title: "Cartão adicionado!", description: `${novo.bandeira} •••• ${novo.ultimos4}` });
    } catch {
      toast({ title: "Erro ao salvar cartão", variant: "destructive" });
    } finally {
      setSavingCard(false);
    }
  };

  const handleRemoverCartao = (id: string) => {
    removerCartao(id);
    const list = listarCartoes();
    setCartoes(list);
    if (selectedCardId === id) setSelectedCardId(list[0]?.id ?? null);
  };

  const cartaoSelecionado = cartoes.find((c) => c.id === selectedCardId) || null;

  const podePagar =
    !!cartaoSelecionado &&
    !!restaurante &&
    restaurante.is_open &&
    itens.length > 0 &&
    !processing;

  const handlePagar = async () => {
    if (!cartaoSelecionado || !restaurante) return;

    if (!restaurante.is_open) {
      toast({ title: "Restaurante fechado", description: "Não é possível processar o pagamento.", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      const tx = await processarPagamento({
        cartao: cartaoSelecionado,
        restaurante_id: restaurante.id,
        restaurante_nome: restaurante.nome_fantasia,
        itens: itens.map((i) => ({
          produto_id: i.produto_id,
          nome: i.nome,
          quantidade: i.quantidade,
          preco_unitario_centavos: i.preco_unitario_centavos,
          adicionais_centavos: i.adicionais.reduce((s, a) => s + a.preco_centavos, 0),
        })),
        subtotal_centavos: subtotalCentavos,
        frete_centavos: freteCentavos,
        total_centavos: totalCentavos,
        forcar_status: forcedStatus,
      });
      setResultado(tx);
      if (tx.status === "aprovado") {
        clearCart();
      }
    } finally {
      setProcessing(false);
    }
  };

  // ─── Result screen ──────────────────────────────────────────────────────────
  if (resultado) {
    const isApproved = resultado.status === "aprovado";
    const isPending = resultado.status === "pendente";

    const Icon = isApproved ? CheckCircle2 : isPending ? Clock : XCircle;
    const colorClass = isApproved
      ? "text-green-500 bg-green-500/10"
      : isPending
      ? "text-amber-500 bg-amber-500/10"
      : "text-destructive bg-destructive/10";

    const titulo = isApproved
      ? "Pagamento aprovado!"
      : isPending
      ? "Pagamento pendente"
      : "Pagamento não aprovado";

    const descricao = isApproved
      ? "Seu pedido foi confirmado e está sendo preparado."
      : isPending
      ? "Estamos aguardando a confirmação do seu pagamento."
      : "Verifique os dados ou tente outro cartão.";

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center"
          >
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${colorClass}`}>
              <Icon size={40} />
            </div>
            <h1 className="text-xl font-extrabold text-foreground mb-2">{titulo}</h1>
            <p className="text-sm text-muted-foreground mb-6">{descricao}</p>

            <div className="rounded-2xl bg-card border border-border p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pedido</span>
                <span className="font-bold text-foreground">{resultado.numero_pedido}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Restaurante</span>
                <span className="font-semibold text-foreground truncate ml-2">{resultado.restaurante_nome}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cartão</span>
                <span className="font-semibold text-foreground">{resultado.cartao_bandeira} •••• {resultado.cartao_ultimos4}</span>
              </div>
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between">
                <span className="text-sm font-bold text-foreground">Total</span>
                <span className="text-base font-extrabold text-foreground">{formatCentavos(resultado.total_centavos)}</span>
              </div>
            </div>

            <div className="space-y-2">
              {!isApproved && (
                <button
                  onClick={() => { setResultado(null); }}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  Tentar novamente
                </button>
              )}
              <button
                onClick={() => navigate("/meus-pedidos")}
                className={`w-full h-11 rounded-xl text-sm font-bold transition-colors ${
                  isApproved
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                Ver meus pedidos
              </button>
              <button
                onClick={() => navigate("/cliente-home")}
                className="w-full h-11 rounded-xl bg-card border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Voltar para a Home
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Main checkout ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center gap-3 h-14">
          <button
            onClick={() => navigate("/carrinho")}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-base font-extrabold text-foreground">Pagamento</h1>
        </div>
      </header>

      {restaurante && !restaurante.is_open && (
        <div className="bg-destructive text-destructive-foreground text-center py-2 text-xs font-bold flex items-center justify-center gap-2">
          <AlertTriangle size={14} />
          Este restaurante está fechado no momento
        </div>
      )}

      <div className="container py-6 max-w-2xl space-y-5">
        {/* Saved cards */}
        <section>
          <h2 className="text-sm font-bold text-foreground mb-3">Forma de pagamento</h2>

          <div className="space-y-2">
            {cartoes.map((card) => {
              const selected = selectedCardId === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selected ? "bg-primary border-primary" : "border-border"
                  }`}>
                    {selected && <Check size={12} className="text-primary-foreground" />}
                  </div>
                  <CreditCard size={20} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {card.bandeira} •••• {card.ultimos4}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {card.titular} · venc. {card.validade}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoverCartao(card.id); }}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    aria-label="Remover cartão"
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </button>
                </button>
              );
            })}

            <button
              onClick={() => setShowNewCard(true)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Adicionar novo cartão</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Lock size={10} /> Tokenização segura
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Order summary */}
        <section className="rounded-2xl bg-card border border-border p-4">
          <h2 className="text-sm font-bold text-foreground mb-3">Resumo do pedido</h2>
          <div className="space-y-1.5 text-sm">
            {itens.map((i) => (
              <div key={i.id} className="flex justify-between text-xs">
                <span className="text-muted-foreground truncate mr-2">
                  {i.quantidade}x {i.nome}
                </span>
                <span className="font-semibold text-foreground shrink-0">
                  {formatCentavos(
                    (i.preco_unitario_centavos +
                      i.adicionais.reduce((s, a) => s + a.preco_centavos, 0)) *
                      i.quantidade
                  )}
                </span>
              </div>
            ))}
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">{formatCentavos(subtotalCentavos)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span className="font-semibold text-foreground">
                {freteCentavos === 0 ? "Grátis" : formatCentavos(freteCentavos)}
              </span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-extrabold text-foreground text-base">{formatCentavos(totalCentavos)}</span>
            </div>
          </div>
        </section>

      </div>

      {/* Sticky pay button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border p-4">
        <div className="container max-w-2xl">
          <button
            onClick={handlePagar}
            disabled={!podePagar}
            className={`w-full h-12 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
              podePagar
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {processing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processando pagamento...
              </>
            ) : (
              <>Confirmar e Pagar · {formatCentavos(totalCentavos)}</>
            )}
          </button>
          {!cartaoSelecionado && (
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Selecione um cartão para continuar
            </p>
          )}
        </div>
      </div>

      {/* New card modal */}
      <AnimatePresence>
        {showNewCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => !savingCard && setShowNewCard(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-2xl border border-border shadow-lg"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="text-base font-extrabold text-foreground">Novo cartão</h3>
                <button
                  onClick={() => !savingCard && setShowNewCard(false)}
                  className="p-1 rounded-lg hover:bg-muted"
                >
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">
                    Número do cartão
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={numero}
                    onChange={(e) => setNumero(formatNumeroCartao(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    className={`w-full h-11 px-3 rounded-xl bg-muted border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground ${
                      numero && !numeroOk ? "border-destructive" : "border-transparent"
                    }`}
                  />
                  {numero && !numeroOk && (
                    <p className="text-[11px] text-destructive mt-1">Número inválido</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">
                    Nome do titular
                  </label>
                  <input
                    type="text"
                    value={titular}
                    onChange={(e) => setTitular(e.target.value.toUpperCase())}
                    placeholder="COMO ESTÁ NO CARTÃO"
                    className={`w-full h-11 px-3 rounded-xl bg-muted border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground ${
                      titular && !titularOk ? "border-destructive" : "border-transparent"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground mb-1.5 block">
                      Validade
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={validade}
                      onChange={(e) => setValidade(formatValidade(e.target.value))}
                      placeholder="MM/AA"
                      className={`w-full h-11 px-3 rounded-xl bg-muted border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground ${
                        validade && !validadeOk ? "border-destructive" : "border-transparent"
                      }`}
                    />
                    {validade && !validadeOk && (
                      <p className="text-[11px] text-destructive mt-1">Validade inválida</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground mb-1.5 block">
                      CVV
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cvv}
                      onChange={(e) => setCvv(formatCVV(e.target.value))}
                      placeholder="123"
                      className={`w-full h-11 px-3 rounded-xl bg-muted border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground ${
                        cvv && !cvvOk ? "border-destructive" : "border-transparent"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Lock size={12} />
                  Seu cartão é tokenizado — só guardamos os 4 últimos dígitos.
                </div>

                <button
                  onClick={handleSalvarCartao}
                  disabled={!formOk || savingCard}
                  className={`w-full h-11 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                    formOk && !savingCard
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {savingCard ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Tokenizando...
                    </>
                  ) : (
                    "Salvar cartão"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckoutPage;
