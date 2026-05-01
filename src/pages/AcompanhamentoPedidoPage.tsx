import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  MessageCircle,
  Package,
  Star,
  Store,
  X,
  XCircle,
} from "lucide-react";
import {
  ORDER_FLOW,
  OrderStatus,
  PedidoTracking,
  STATUS_DESC,
  STATUS_LABEL,
  atualizarPosicaoEntregador,
  avancarStatus,
  buscarPedidoTracking,
  cancelarPedido,
  podeCancelar,
} from "@/lib/orderTracking";
import { formatCentavos } from "@/lib/payments";
import { useToast } from "@/hooks/use-toast";

const STATUS_ICONS: Record<OrderStatus, typeof Package> = {
  REALIZADO: Package,
  CONFIRMADO: CheckCircle2,
  EM_PREPARO: Clock,
  SAIU_ENTREGA: Bike,
  ENTREGUE: CheckCircle2,
};

// Tempos de transição automática (ms) — simula RNF-01 (<2s reflexão na UI)
const STATUS_DELAYS_MS: Record<OrderStatus, number> = {
  REALIZADO: 8000,      // → CONFIRMADO
  CONFIRMADO: 12000,    // → EM_PREPARO
  EM_PREPARO: 20000,    // → SAIU_ENTREGA
  SAIU_ENTREGA: 30000,  // → ENTREGUE
  ENTREGUE: 0,
};

// Coordenadas viewport SVG (espaço normalizado 0..100)
const REST_VIEW = { x: 15, y: 80 };
const CLIENTE_VIEW = { x: 85, y: 20 };

const AcompanhamentoPedidoPage = () => {
  const { numeroPedido } = useParams<{ numeroPedido: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pedido, setPedido] = useState<PedidoTracking | null>(null);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const [progresso, setProgresso] = useState(0); // 0..1 deslocamento do entregador

  // Refs para timers
  const statusTimerRef = useRef<number | null>(null);
  const moveTimerRef = useRef<number | null>(null);

  // Carrega pedido inicial — se não existir, cria um pedido demo
  useEffect(() => {
    const id = numeroPedido || "DEMO-" + Date.now().toString().slice(-6);
    let found = buscarPedidoTracking(id);
    if (!found) {
      found = criarPedidoTracking({
        numero_pedido: id,
        restaurante_nome: "Burguer Master",
        total_centavos: 6780,
        itens: [
          { nome: "Master Cheeseburger", quantidade: 1, preco_centavos: 3290 },
          { nome: "Batata Frita Crocante (G)", quantidade: 1, preco_centavos: 1800 },
          { nome: "Refrigerante Lata 350ml", quantidade: 2, preco_centavos: 750 },
        ],
        cliente_endereco: "Rua das Flores, 123 - Centro",
      });
      toast({
        title: "Pedido demo criado",
        description: "Você está visualizando um pedido de demonstração.",
      });
    }
    setPedido(found);
  }, [numeroPedido, toast]);


  // Avança status automaticamente (RN-01 — fluxo linear)
  useEffect(() => {
    if (!pedido || pedido.cancelado) return;
    if (pedido.status_atual === "ENTREGUE") return;

    const delay = STATUS_DELAYS_MS[pedido.status_atual];
    statusTimerRef.current = window.setTimeout(() => {
      setPedido((prev) => (prev ? avancarStatus(prev) : prev));
    }, delay);

    return () => {
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    };
  }, [pedido?.status_atual, pedido?.cancelado]);

  // RN-03: simula movimento do entregador a cada 30s quando SAIU_ENTREGA
  useEffect(() => {
    if (!pedido) return;
    if (pedido.status_atual !== "SAIU_ENTREGA") return;
    if (pedido.cancelado) return;

    // tick imediato + a cada 5s para ter interpolação suave (mas usa step de 30s lógicos)
    const TICK_MS = 5000;
    const STEPS = 6; // 6 ticks de 5s = 30s reais para chegar
    let step = 0;

    moveTimerRef.current = window.setInterval(() => {
      step += 1;
      const p = Math.min(1, step / STEPS);
      setProgresso(p);
      setPedido((prev) => (prev ? atualizarPosicaoEntregador(prev, p) : prev));
      if (p >= 1 && moveTimerRef.current) window.clearInterval(moveTimerRef.current);
    }, TICK_MS);

    return () => {
      if (moveTimerRef.current) window.clearInterval(moveTimerRef.current);
    };
  }, [pedido?.status_atual, pedido?.cancelado]);

  const statusIdx = useMemo(
    () => (pedido ? ORDER_FLOW.indexOf(pedido.status_atual) : 0),
    [pedido]
  );

  const handleCancelar = () => {
    if (!pedido) return;
    if (!podeCancelar(pedido.status_atual)) return;
    const updated = cancelarPedido(pedido);
    setPedido({ ...updated });
    toast({ title: "Pedido cancelado", description: "Seu pedido foi cancelado com sucesso." });
  };

  if (!pedido) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Carregando pedido...</div>
      </div>
    );
  }

  // Posição do entregador no viewport SVG (interpola entre rest e cliente)
  const entregadorView = {
    x: REST_VIEW.x + (CLIENTE_VIEW.x - REST_VIEW.x) * progresso,
    y: REST_VIEW.y + (CLIENTE_VIEW.y - REST_VIEW.y) * progresso,
  };

  // Se ainda não saiu, fica no restaurante
  const showEntregadorAt =
    pedido.status_atual === "SAIU_ENTREGA" || pedido.status_atual === "ENTREGUE"
      ? entregadorView
      : REST_VIEW;

  const horaPrevista = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + pedido.eta_minutos);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  })();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center gap-3 h-14">
          <button
            onClick={() => navigate("/cliente-home")}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-extrabold text-foreground truncate">
              Acompanhar pedido
            </h1>
            <p className="text-[11px] text-muted-foreground">
              #{pedido.numero_pedido}
            </p>
          </div>
        </div>
      </header>

      {/* Mapa */}
      <div className="relative w-full h-[42vh] min-h-[280px] bg-gradient-to-br from-muted to-muted/40 overflow-hidden border-b border-border">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {/* Grid sutil */}
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path
                d="M 8 0 L 0 0 0 8"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="0.2"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* "Ruas" decorativas */}
          <path d="M 0 60 Q 50 55 100 65" stroke="hsl(var(--border))" strokeWidth="0.6" fill="none" />
          <path d="M 30 0 Q 40 50 60 100" stroke="hsl(var(--border))" strokeWidth="0.6" fill="none" />

          {/* Trajeto */}
          <path
            d={`M ${REST_VIEW.x} ${REST_VIEW.y} Q ${(REST_VIEW.x + CLIENTE_VIEW.x) / 2} ${
              Math.min(REST_VIEW.y, CLIENTE_VIEW.y) - 10
            } ${CLIENTE_VIEW.x} ${CLIENTE_VIEW.y}`}
            stroke="hsl(var(--primary))"
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
            fill="none"
            className="opacity-70"
          />
        </svg>

        {/* Pin Restaurante */}
        <div
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${REST_VIEW.x}%`, top: `${REST_VIEW.y}%` }}
        >
          <div className="flex flex-col items-center">
            <div className="bg-card border border-border rounded-xl px-2 py-1 mb-1 shadow-md">
              <span className="text-[10px] font-bold text-foreground">
                {pedido.restaurante_nome}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg">
              <Store size={16} />
            </div>
          </div>
        </div>

        {/* Pin Cliente */}
        <div
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${CLIENTE_VIEW.x}%`, top: `${CLIENTE_VIEW.y}%` }}
        >
          <div className="flex flex-col items-center">
            <div className="bg-primary text-primary-foreground rounded-xl px-2 py-1 mb-1 shadow-md">
              <span className="text-[10px] font-bold">Você</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
              <MapPin size={16} />
            </div>
          </div>
        </div>

        {/* Entregador (animado) */}
        <AnimatePresence>
          {(pedido.status_atual === "SAIU_ENTREGA" ||
            pedido.status_atual === "ENTREGUE") && (
            <motion.div
              key="entregador"
              className="absolute -translate-x-1/2 -translate-y-1/2"
              initial={{ left: `${REST_VIEW.x}%`, top: `${REST_VIEW.y}%`, scale: 0 }}
              animate={{
                left: `${showEntregadorAt.x}%`,
                top: `${showEntregadorAt.y}%`,
                scale: 1,
              }}
              transition={{ duration: 4, ease: "linear" }}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
                <div className="relative w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl border-2 border-card">
                  <Bike size={18} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ETA flutuante */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-xl border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
          <Clock size={14} className="text-primary" />
          <span className="text-xs font-extrabold text-foreground">
            {pedido.cancelado
              ? "Pedido cancelado"
              : pedido.status_atual === "ENTREGUE"
              ? "Entregue!"
              : `Chega às ${horaPrevista}`}
          </span>
        </div>
      </div>

      {/* Card flutuante */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative -mt-6 flex-1 bg-background rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-10"
      >
        <div className="container max-w-2xl px-4 py-5 space-y-5">
          {/* Handle */}
          <div className="w-12 h-1 rounded-full bg-muted mx-auto" />

          {/* Status Hero */}
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
              {pedido.cancelado
                ? "Pedido cancelado"
                : `${pedido.eta_minutos} min restantes`}
            </p>
            <h2 className="text-xl font-extrabold text-foreground">
              {pedido.cancelado
                ? "Você cancelou o pedido"
                : STATUS_LABEL[pedido.status_atual]}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {pedido.cancelado
                ? "O reembolso será processado em até 7 dias."
                : STATUS_DESC[pedido.status_atual]}
            </p>
          </div>

          {/* Stepper vertical */}
          {!pedido.cancelado && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="space-y-3">
                {ORDER_FLOW.map((s, idx) => {
                  const Icon = STATUS_ICONS[s];
                  const isDone = idx < statusIdx;
                  const isActive = idx === statusIdx;
                  const isLast = idx === ORDER_FLOW.length - 1;

                  return (
                    <div key={s} className="flex gap-3 items-start">
                      <div className="flex flex-col items-center">
                        <div
                          className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isDone
                              ? "bg-primary text-primary-foreground"
                              : isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isActive && (
                            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
                          )}
                          <Icon size={14} className="relative" />
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 h-6 mt-1 ${
                              isDone ? "bg-primary" : "bg-border"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p
                          className={`text-sm font-bold ${
                            isActive
                              ? "text-foreground"
                              : isDone
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {STATUS_LABEL[s]}
                        </p>
                        {isActive && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {STATUS_DESC[s]}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card do entregador (apenas SAIU_ENTREGA / ENTREGUE) */}
          <AnimatePresence>
            {(pedido.status_atual === "SAIU_ENTREGA" ||
              pedido.status_atual === "ENTREGUE") &&
              !pedido.cancelado && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-base shrink-0">
                    {pedido.entregador.nome
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-foreground truncate">
                      {pedido.entregador.nome}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span className="font-bold text-foreground">
                          {pedido.entregador.nota.toFixed(1)}
                        </span>
                      </span>
                      <span>·</span>
                      <span className="truncate">{pedido.entregador.veiculo}</span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      toast({
                        title: "Chat indisponível",
                        description: "O chat com o entregador será liberado em breve.",
                      })
                    }
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0"
                  >
                    <MessageCircle size={16} />
                  </button>
                </motion.div>
              )}
          </AnimatePresence>

          {/* Detalhes expansíveis */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setDetalhesAbertos((v) => !v)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
            >
              <span className="text-sm font-bold text-foreground">
                Ver detalhes do pedido
              </span>
              {detalhesAbertos ? (
                <ChevronUp size={18} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={18} className="text-muted-foreground" />
              )}
            </button>
            <AnimatePresence>
              {detalhesAbertos && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="p-4 space-y-4">
                    {/* Endereço */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Entregar em
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {pedido.cliente_endereco}
                      </p>
                    </div>

                    {/* Itens */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Itens
                      </p>
                      <div className="space-y-2">
                        {pedido.itens.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Detalhes dos itens não disponíveis.
                          </p>
                        )}
                        {pedido.itens.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-foreground">
                              <span className="font-bold text-primary mr-2">
                                {it.quantidade}x
                              </span>
                              {it.nome}
                            </span>
                            <span className="font-semibold text-foreground">
                              {formatCentavos(it.preco_centavos * it.quantidade)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-sm font-bold text-foreground">Total</span>
                      <span className="text-base font-extrabold text-foreground">
                        {formatCentavos(pedido.total_centavos)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cancelar (RN-02) */}
          {!pedido.cancelado && podeCancelar(pedido.status_atual) && (
            <button
              onClick={handleCancelar}
              className="w-full h-12 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm font-bold hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
            >
              <X size={16} />
              Cancelar pedido
            </button>
          )}

          {!pedido.cancelado &&
            !podeCancelar(pedido.status_atual) &&
            pedido.status_atual !== "ENTREGUE" && (
              <p className="text-center text-[11px] text-muted-foreground">
                O pedido já está em preparo e não pode mais ser cancelado.
              </p>
            )}

          {pedido.cancelado && (
            <button
              onClick={() => navigate("/cliente-home")}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle size={16} />
              Voltar para a Home
            </button>
          )}

          {pedido.status_atual === "ENTREGUE" && !pedido.cancelado && (
            <button
              onClick={() => navigate("/cliente-home")}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              Concluir
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AcompanhamentoPedidoPage;
