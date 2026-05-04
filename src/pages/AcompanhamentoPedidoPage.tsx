import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  Loader2
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { formatCentavos } from "@/lib/payments";
import { useToast } from "@/hooks/use-toast";

const LIBRARIES: ("places" | "marker")[] = ['places', 'marker'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

export default function AcompanhamentoPedidoPage() {
  const { numeroPedido } = useParams<{ numeroPedido: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const [codigoConfirmacao, setCodigoConfirmacao] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  // Map state
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const advancedMarkerRef = useRef<any>(null);

  const fetchPedido = async () => {
    try {
      const res = await fetchApi(`/pedidos/${numeroPedido}`);
      if (res.ok) {
        const data = await res.json();
        setPedido(data.order);
      } else {
        toast({ title: "Erro", description: "Pedido não encontrado", variant: "destructive" });
        navigate("/cliente-home");
      }
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao carregar pedido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (numeroPedido) fetchPedido();
  }, [numeroPedido]);

  // Polling to keep status updated
  useEffect(() => {
    if (!numeroPedido) return;
    const interval = setInterval(() => {
       fetchPedido();
    }, 15000);
    return () => clearInterval(interval);
  }, [numeroPedido]);

  // Marker logic
  useEffect(() => {
    if (!isLoaded || !map || !pedido || !pedido.restaurante_latitude || !pedido.restaurante_longitude) return;

    const initMarker = async () => {
      try {
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as any;
        
        if (advancedMarkerRef.current) {
          advancedMarkerRef.current.map = null;
        }

        const position = { lat: pedido.restaurante_latitude, lng: pedido.restaurante_longitude };

        const pin = new PinElement({
          background: "#ea580c",
          borderColor: "#c2410c",
          glyphColor: "white",
        });

        const marker = new AdvancedMarkerElement({
          map,
          position,
          title: pedido.restaurante_nome,
          content: pin.element
        });
        
        advancedMarkerRef.current = marker;
      } catch (error) {
        console.error("Erro ao inicializar Marker:", error);
      }
    };

    initMarker();

    return () => {
      if (advancedMarkerRef.current) {
        advancedMarkerRef.current.map = null;
        advancedMarkerRef.current = null;
      }
    };
  }, [isLoaded, map, pedido?.restaurante_latitude, pedido?.restaurante_longitude]);

  const handleConfirmar = async () => {
    if (codigoConfirmacao.length < 6) return;
    setConfirmando(true);
    try {
      const res = await fetchApi(`/pedidos/${numeroPedido}/confirm`, {
        method: "POST",
        body: JSON.stringify({ codigo: codigoConfirmacao })
      });
      if (res.ok) {
        toast({ title: "Sucesso!", description: "Entrega confirmada com sucesso!" });
        setPedido((prev: any) => ({...prev, status: "ENTREGUE"}));
        setTimeout(() => navigate("/cliente-home"), 3000);
      } else {
         const err = await res.json();
         toast({ title: "Erro", description: err.error || "Código inválido", variant: "destructive" });
      }
    } catch {
       toast({ title: "Erro", description: "Falha de conexão", variant: "destructive" });
    } finally {
      setConfirmando(false);
    }
  };

  const handleDevAdvance = async () => {
     try {
       const res = await fetchApi(`/pedidos/${numeroPedido}/dev-advance-status`, { method: "POST" });
       if (res.ok) {
         fetchPedido();
       }
     } catch (e) { }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!pedido) return null;

  const lat = pedido.restaurante_latitude || -23.5505;
  const lng = pedido.restaurante_longitude || -46.6333;
  const position = { lat, lng };

  // Convert DB status to linear step
  const getStepIdx = () => {
    if (pedido.status === 'PENDENTE_ACEITACAO' || pedido.status === 'PAGO' || pedido.status === 'PREPARANDO') return 0; // Pagamento Recebido
    if (pedido.status === 'A_CAMINHO' || pedido.status === 'SAIU_ENTREGA') return 1; // Pedido a Caminho
    if (pedido.status === 'ENTREGUE') return 2; // Pedido Entregue
    return 0;
  };
  const currentStep = getStepIdx();

  const STATUS_LABELS = ["Pagamento Recebido", "Pedido a Caminho", "Pedido Entregue"];
  const STATUS_DESC = [
    "Aguardando preparo pelo restaurante.",
    "O entregador está a caminho com o seu pedido.",
    "Pedido entregue! Bom apetite!"
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
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
              #{pedido.id.split("-")[0].toUpperCase()}
            </p>
          </div>
          {/* Botão Developer */}
          {currentStep < 2 && (
             <button onClick={handleDevAdvance} className="text-[10px] bg-secondary text-secondary-foreground font-bold px-2 py-1 rounded">Dev+1</button>
          )}
        </div>
      </header>

      {/* Mapa Estático */}
      <div className="w-full h-[35vh] min-h-[250px] relative bg-muted border-b border-border">
        {!isLoaded ? (
           <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" />
           </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={position}
            zoom={16}
            onLoad={map => setMap(map)}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              mapId: 'DEMO_MAP_ID', // Requerido para AdvancedMarkerElement
            }}
          />
        )}
      </div>

      {/* Card Flutuante */}
      <div className="relative -mt-8 flex-1 bg-background rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-10 p-5">
         <div className="w-12 h-1 rounded-full bg-muted mx-auto mb-6" />

         <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-foreground">
              {STATUS_LABELS[currentStep]}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {STATUS_DESC[currentStep]}
            </p>
         </div>

         {/* Stepper Vertical Linear */}
         <div className="rounded-2xl border border-border bg-card p-4 mb-6">
           <div className="space-y-4">
             {STATUS_LABELS.map((label, idx) => {
                const isDone = idx <= currentStep;
                const isActive = idx === currentStep;
                const isLast = idx === STATUS_LABELS.length - 1;

                return (
                  <div key={label} className="flex gap-4 items-start">
                     <div className="flex flex-col items-center">
                        <div className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                           {isActive && <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />}
                           {isDone ? <CheckCircle2 size={16}/> : <Clock size={14}/>}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 h-6 mt-1 ${isDone ? "bg-primary" : "bg-border"}`} />
                        )}
                     </div>
                     <div className="pt-1">
                        <p className={`text-sm font-bold ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                          {label}
                        </p>
                     </div>
                  </div>
                )
             })}
           </div>
         </div>

         {/* Validação de Segurança */}
         {currentStep === 1 && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} className="rounded-2xl border border-border bg-card p-5 mb-6 shadow-sm">
               <h3 className="font-extrabold text-foreground mb-2 flex items-center gap-2">
                 <Lock size={16} className="text-primary"/> Segurança na Entrega
               </h3>
               <p className="text-xs text-muted-foreground mb-4">
                 Para confirmar que você recebeu o pedido, informe os <strong>últimos 6 dígitos do seu número de celular</strong> ao entregador ou digite abaixo.
               </p>
               
               <input 
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={codigoConfirmacao}
                  onChange={(e) => setCodigoConfirmacao(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl h-14 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none mb-3"
               />

               <button 
                  onClick={handleConfirmar}
                  disabled={codigoConfirmacao.length < 6 || confirmando}
                  className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
               >
                  {confirmando ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Confirmar Recebimento
               </button>
            </motion.div>
         )}

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
                        {pedido.endereco_entrega?.logradouro}, {pedido.endereco_entrega?.numero}
                        {pedido.endereco_entrega?.complemento ? ` - ${pedido.endereco_entrega?.complemento}` : ''}
                      </p>
                    </div>

                    {/* Itens */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Itens
                      </p>
                      <div className="space-y-2">
                        {pedido.itens?.map((it: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-foreground">
                              <span className="font-bold text-primary mr-2">
                                {it.quantidade}x
                              </span>
                              {it.nome_produto}
                            </span>
                            <span className="font-semibold text-foreground">
                              {formatCentavos(it.preco_total_item_centavos)}
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

      </div>
    </div>
  )
}
