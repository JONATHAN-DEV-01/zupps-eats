import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  MapPin,
  QrCode,
  Smartphone,
  Banknote,
} from "lucide-react";
import { fetchApi, getUserProfile } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import {
  CartaoTokenizado,
  HistoricoTransacao,
  formatCentavos,
  formatCVV,
  formatNumeroCartao,
  formatValidade,
  listarCartoes,
  removerCartao,
  tokenizarCartao,
  validarCVV,
  validarNumeroCartao,
  validarValidade,
} from "@/lib/payments";
import { useToast } from "@/hooks/use-toast";
import { criarPedidoTracking } from "@/lib/orderTracking";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const token_checkout: string | null = (location.state as any)?.token_checkout ?? null;
  const {
    restaurante,
    itens,
    subtotalCentavos,
    freteCentavos,
    totalCentavos,
    clearCart,
    cupomAplicado,
  } = useCart();

  const [cartoes, setCartoes] = useState<CartaoTokenizado[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showNewCard, setShowNewCard] = useState(false);

  const profile = getUserProfile();

  // Form states
  const [paymentMethod, setPaymentMethod] = useState<"CREDIT_CARD" | "PIX" | "CASH" | "CARD_MACHINE">("CREDIT_CARD");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");

  // New card form
  const [numero, setNumero] = useState("");
  const [titular, setTitular] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [savingCard, setSavingCard] = useState(false);

  // Payment processing
  const [processing, setProcessing] = useState(false);
  const [resultado, setResultado] = useState<HistoricoTransacao | null>(null);
  const [pixData, setPixData] = useState<{ qrCodeBase64: string, qrCodeCopiaCola: string, pedidoId: string } | null>(null);

  // CPF Modal for PIX
  const [showCpfModal, setShowCpfModal] = useState(false);
  const [cpfInput, setCpfInput] = useState("");
  const [cpfError, setCpfError] = useState("");

  const formatCpf = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const validateCpf = (cpf: string) => {
    const d = cpf.replace(/\D/g, "");
    return d.length === 11 && !/^(\d)\1{10}$/.test(d);
  };

  const storedCpf = () => sessionStorage.getItem("pix_cpf") || "";

  // Polling PIX
  useEffect(() => {
    if (!pixData?.pedidoId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetchApi(`/pagamentos/${pixData.pedidoId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'approved' || data.status === 'aprovado') {
            clearInterval(interval);
            setPixData(null);
            // Tracking já foi criado ao gerar o PIX — apenas redireciona
            navigate(`/acompanhar-pedido/${pixData.pedidoId}`, { replace: true });
          } else if (data.status === 'rejected' || data.status === 'recusado') {
            clearInterval(interval);
            setPixData(null);
            setResultado({
               id: "mock",
               numero_pedido: pixData.pedidoId,
               restaurante_id: restaurante?.id || "",
               restaurante_nome: restaurante?.nome_fantasia || "",
               itens: [],
               subtotal_centavos: subtotalCentavos,
               frete_centavos: freteCentavos,
               total_centavos: totalCentavos,
               cartao_ultimos4: "PIX",
               cartao_bandeira: "PIX",
               status: "recusado",
               criado_em: new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        console.error("Erro no polling do PIX", e);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [pixData, restaurante, subtotalCentavos, freteCentavos, totalCentavos]);

  useEffect(() => {
    const list = listarCartoes();
    setCartoes(list);
    if (list.length > 0) setSelectedCardId(list[0].id);
  }, []);

  // Guard: empty cart or no restaurant — redirect back (mas não durante PIX ou resultado)
  useEffect(() => {
    if (!processing && !resultado && !pixData && (itens.length === 0 || !restaurante)) {
      navigate("/carrinho");
    }
  }, [itens.length, restaurante, processing, resultado, pixData, navigate]);

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
    !!restaurante &&
    restaurante.is_open &&
    itens.length > 0 &&
    !processing &&
    (paymentMethod !== "CREDIT_CARD" || !!cartaoSelecionado);

  const handleConfirmCpf = () => {
    if (!validateCpf(cpfInput)) {
      setCpfError("CPF inválido. Verifique e tente novamente.");
      return;
    }
    sessionStorage.setItem("pix_cpf", cpfInput.replace(/\D/g, ""));
    setShowCpfModal(false);
    setCpfError("");
    handlePagar(true);
  };

  const snapshotItensTracking = () =>
    itens.map((i) => {
      const addCentavos = i.adicionais.reduce((s, a) => s + a.preco_centavos, 0);
      return {
        nome: i.nome,
        quantidade: i.quantidade,
        preco_centavos: i.preco_unitario_centavos + addCentavos,
      };
    });

  const handlePagar = async (skipCpfCheck = false) => {
    if (!restaurante) return;
    if (paymentMethod === "CREDIT_CARD" && !cartaoSelecionado) return;

    if (!restaurante.is_open) {
      toast({ title: "Restaurante fechado", description: "Não é possível processar o pagamento.", variant: "destructive" });
      return;
    }

    const cpf = profile?.cpf || storedCpf();

    // Se for PIX ou Cartão e não tiver CPF salvo (nem no perfil nem na sessão), abrir modal
    if ((paymentMethod === "PIX" || paymentMethod === "CREDIT_CARD") && !skipCpfCheck && !cpf) {
      setShowCpfModal(true);
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        restaurant_id: restaurante.id,
        payment: {
          method: paymentMethod,
          change_for: paymentMethod === "CASH" && changeFor ? parseFloat(changeFor.replace(",", ".")) : undefined,
        },
        coupon_code: cupomAplicado?.codigo || undefined,
        notes: notes.trim() || undefined,
        items: itens.map(i => ({
          product_id: i.produto_id,
          quantity: i.quantidade,
          options: i.adicionais.map(a => ({
            option_id: a.id,
            quantity: 1
          }))
        }))
      };

      const res = await fetchApi("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Erro ao criar pedido", description: data.error || "Tente novamente.", variant: "destructive" });
        return;
      }

      const orderId = data.order_id || "ZP-" + Date.now().toString().slice(-8);
      const restauranteNome = restaurante.nome_fantasia;
      const totalSnapshot = totalCentavos;
      const itensSnapshot = snapshotItensTracking();

      if (paymentMethod === "CREDIT_CARD") {
        const resPayment = await fetchApi("/pagamentos/cartao", {
          method: "POST",
          body: JSON.stringify({
            pedido_id: orderId,
            token: cartaoSelecionado?.token,
            payment_method_id: cartaoSelecionado?.bandeira.toLowerCase() || "visa",
            payer: { 
              email: profile?.email || "cliente@teste.com", 
              first_name: profile?.nome || "Cliente", 
              last_name: profile?.sobrenome || "Teste",
              identification: { type: "CPF", number: cpf }
            }
          })
        });
        const paymentData = await resPayment.json();
        if (!resPayment.ok) {
           let msg = paymentData.error || "Pagamento recusado.";
           if (paymentData.details && paymentData.details.message) {
              msg += " (" + paymentData.details.message + ")";
           }
           throw new Error(msg);
        }

        const aprovado = paymentData.status === "approved" || paymentData.status === "aprovado";
        await clearCart();

        if (aprovado) {
          // Cria tracking e redireciona automaticamente
          criarPedidoTracking({
            numero_pedido: orderId,
            restaurante_nome: restauranteNome,
            total_centavos: totalSnapshot,
            itens: itensSnapshot,
          });
          navigate(`/acompanhar-pedido/${orderId}`, { replace: true });
          return;
        }

        setResultado({
          id: paymentData.id || "mock",
          numero_pedido: orderId,
          restaurante_id: restaurante.id,
          restaurante_nome: restauranteNome,
          itens: [],
          subtotal_centavos: subtotalCentavos,
          frete_centavos: freteCentavos,
          total_centavos: totalSnapshot,
          cartao_ultimos4: cartaoSelecionado?.ultimos4 || "",
          cartao_bandeira: cartaoSelecionado?.bandeira || "",
          status: "recusado",
          criado_em: new Date().toISOString(),
        });

      } else if (paymentMethod === "PIX") {
        const resPix = await fetchApi("/pagamentos/pix", {
          method: "POST",
          body: JSON.stringify({
            pedido_id: orderId,
            payer: {
              email: profile?.email || "",
              first_name: profile?.nome || "Cliente",
              last_name: profile?.sobrenome || "Zupps",
              identification: { type: "CPF", number: cpf }
            }
          })
        });
        const pixDataRes = await resPix.json();
        if (!resPix.ok) throw new Error(pixDataRes.error || "Erro ao gerar PIX");

        // Salva tracking pré-criado para redirect quando PIX for aprovado (polling no useEffect)
        criarPedidoTracking({
          numero_pedido: orderId,
          restaurante_nome: restauranteNome,
          total_centavos: totalSnapshot,
          itens: itensSnapshot,
        });

        setPixData({
          qrCodeBase64: pixDataRes.pix_qr_code_base64,
          qrCodeCopiaCola: pixDataRes.pix_qr_code,
          pedidoId: orderId
        });
        await clearCart();

      } else {
        // Dinheiro ou Maquininha — pedido aceito, vai direto para acompanhamento
        await clearCart();
        criarPedidoTracking({
          numero_pedido: orderId,
          restaurante_nome: restauranteNome,
          total_centavos: totalSnapshot,
          itens: itensSnapshot,
        });
        navigate(`/acompanhar-pedido/${orderId}`, { replace: true });
        return;
      }

    } catch (error: any) {
      toast({ title: "Erro de pagamento", description: error.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  // ─── CPF Modal ───────────────────────────────────────────────────────────────
  const cpfModalEl = showCpfModal && (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-sm bg-card rounded-3xl shadow-2xl p-6 border border-border"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Lock size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-foreground">CPF para o PIX</h2>
            <p className="text-xs text-muted-foreground">Exigido pelo Banco Central</p>
          </div>
          <button
            onClick={() => setShowCpfModal(false)}
            className="ml-auto w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X size={15} className="text-foreground" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Informe seu CPF para gerar o QR Code PIX. Seus dados ficam salvos apenas neste dispositivo.
        </p>

        <div className="relative mb-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpfInput}
            onChange={(e) => {
              setCpfInput(formatCpf(e.target.value));
              setCpfError("");
            }}
            maxLength={14}
            autoFocus
            className={`w-full h-12 px-4 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
              cpfError
                ? "border-destructive bg-destructive/5 focus:ring-destructive/30"
                : "border-border bg-background focus:ring-primary/30 focus:border-primary"
            }`}
          />
        </div>
        {cpfError && (
          <p className="text-xs text-destructive mb-3 flex items-center gap-1">
            <AlertTriangle size={12} /> {cpfError}
          </p>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setShowCpfModal(false)}
            className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmCpf}
            disabled={cpfInput.replace(/\D/g, "").length < 11}
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );

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

  // ─── PIX Waiting screen ───────────────────────────────────────────────────────
  if (pixData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
          <div className="container flex items-center justify-center h-14">
            <h1 className="text-base font-extrabold text-foreground">Pagamento PIX</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
           <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm text-center bg-card border border-border p-6 rounded-3xl shadow-sm"
           >
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl bg-primary/10">
                  <QrCode size={40} className="text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-foreground mb-2">Pague com PIX</h2>
              <p className="text-sm text-muted-foreground mb-6">Escaneie o QR Code abaixo ou copie o código PIX para concluir o pagamento.</p>
              
              <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-sm border border-border">
                <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48 object-contain" />
              </div>
              
              <div className="space-y-3">
                 <button 
                   onClick={() => {
                      navigator.clipboard.writeText(pixData.qrCodeCopiaCola);
                      toast({ title: "Copiado!", description: "Código PIX Copia e Cola copiado para a área de transferência." });
                   }}
                   className="w-full h-11 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-colors"
                 >
                   Copiar código PIX
                 </button>
                 
                 <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary mt-4">
                    <Loader2 size={16} className="animate-spin" />
                    Aguardando confirmação...
                 </div>
              </div>
           </motion.div>
        </div>
      </div>
    );
  }

  // ─── Main checkout ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* CPF Modal for PIX */}
      {cpfModalEl}
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center gap-3 h-14">
          <button
            onClick={() => navigate(-1)}
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
        
        {/* Endereço de Entrega */}
        <section>
          <h2 className="text-sm font-bold text-foreground mb-3">Endereço de Entrega</h2>
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {profile?.endereco?.logradouro ? `${profile.endereco.logradouro}, ${profile.endereco.numero || 'S/N'}${profile.endereco.bairro ? ` - ${profile.endereco.bairro}` : ''}` : 'Endereço não cadastrado'}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile?.endereco?.complemento ? `Complemento: ${profile.endereco.complemento}` : profile?.endereco?.cidade ? `${profile.endereco.cidade} - ${profile.endereco.estado}` : 'Clique em trocar para atualizar'}
              </p>
            </div>
            <button className="text-xs font-bold text-primary hover:underline shrink-0">
              Trocar
            </button>
          </div>
        </section>

        {/* Observações do Pedido */}
        <section>
          <h2 className="text-sm font-bold text-foreground mb-3">Observações do Pedido</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Tocar o interfone 204, tirar cebola..."
            maxLength={140}
            className="w-full h-24 p-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none placeholder:text-muted-foreground"
          />
          <div className="text-right mt-1 text-[10px] text-muted-foreground">
            {notes.length}/140
          </div>
        </section>

        {/* Formas de Pagamento */}
        <section>
          <h2 className="text-sm font-bold text-foreground mb-3">Forma de pagamento</h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setPaymentMethod("CREDIT_CARD")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${
                paymentMethod === "CREDIT_CARD" ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <CreditCard size={20} />
              <span className="text-xs font-bold">Cartão (App)</span>
            </button>
            <button
              onClick={() => setPaymentMethod("PIX")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${
                paymentMethod === "PIX" ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <QrCode size={20} />
              <span className="text-xs font-bold">Pix</span>
            </button>
            <button
              onClick={() => setPaymentMethod("CARD_MACHINE")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${
                paymentMethod === "CARD_MACHINE" ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Smartphone size={20} />
              <span className="text-xs font-bold">Maquininha</span>
            </button>
            <button
              onClick={() => setPaymentMethod("CASH")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${
                paymentMethod === "CASH" ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Banknote size={20} />
              <span className="text-xs font-bold">Dinheiro</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {paymentMethod === "CREDIT_CARD" && (
              <motion.div
                key="credit_card"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
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
              </motion.div>
            )}
            {paymentMethod === "PIX" && (
              <motion.div
                key="pix"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center">
                  <QrCode size={32} className="mx-auto text-primary mb-2" />
                  <p className="text-sm font-bold text-foreground">Pagamento via PIX</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O QR Code será gerado após o fechamento do pedido.
                  </p>
                </div>
              </motion.div>
            )}
            {paymentMethod === "CARD_MACHINE" && (
              <motion.div
                key="card_machine"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-card border border-border text-center">
                  <Smartphone size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-bold text-foreground">Máquina na Entrega</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O entregador levará a maquininha até você. Aceita débito e crédito.
                  </p>
                </div>
              </motion.div>
            )}
            {paymentMethod === "CASH" && (
              <motion.div
                key="cash"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Precisa de troco para quanto?
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Se for pagar com valor exato, pode deixar em branco.
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                      R$
                    </span>
                    <input
                      type="number"
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      placeholder="Ex: 50"
                      className="w-full h-11 pl-9 pr-3 rounded-xl bg-muted border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            onClick={() => handlePagar()}
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
          {!podePagar && paymentMethod === "CREDIT_CARD" && !cartaoSelecionado && (
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
