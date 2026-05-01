// Lógica de acompanhamento de pedido em tempo real (mock).
// Máquina de estados linear + simulação de movimento do entregador.

export type OrderStatus =
  | "REALIZADO"
  | "CONFIRMADO"
  | "EM_PREPARO"
  | "SAIU_ENTREGA"
  | "ENTREGUE";

export const ORDER_FLOW: OrderStatus[] = [
  "REALIZADO",
  "CONFIRMADO",
  "EM_PREPARO",
  "SAIU_ENTREGA",
  "ENTREGUE",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  REALIZADO: "Pedido realizado",
  CONFIRMADO: "Confirmado",
  EM_PREPARO: "Em preparo",
  SAIU_ENTREGA: "Saiu para entrega",
  ENTREGUE: "Entregue",
};

export const STATUS_DESC: Record<OrderStatus, string> = {
  REALIZADO: "Aguardando o restaurante aceitar",
  CONFIRMADO: "Restaurante aceitou seu pedido",
  EM_PREPARO: "Seu pedido está sendo preparado",
  SAIU_ENTREGA: "O entregador está a caminho",
  ENTREGUE: "Pedido entregue. Bom apetite!",
};

export interface Coords {
  lat: number;
  lng: number;
}

export interface Entregador {
  id: string;
  nome: string;
  nota: number;
  foto: string | null;
  veiculo: string;
  placa: string;
}

export interface PedidoStatusEvent {
  status: OrderStatus;
  timestamp: string;
}

export interface PedidoTracking {
  id: string;
  numero_pedido: string;
  restaurante_nome: string;
  restaurante_coords: Coords;
  cliente_endereco: string;
  cliente_coords: Coords;
  entregador: Entregador;
  entregador_coords: Coords;
  status_atual: OrderStatus;
  historico: PedidoStatusEvent[];
  criado_em: string;
  eta_minutos: number;
  total_centavos: number;
  itens: Array<{ nome: string; quantidade: number; preco_centavos: number }>;
  cancelado?: boolean;
}

const KEY_PREFIX = "zupps_tracking_";

const randomId = () => Math.random().toString(36).slice(2, 10);

// Coordenadas mockadas (Av. Paulista região)
const REST_COORDS: Coords = { lat: -23.5613, lng: -46.6565 };
const CLIENTE_COORDS: Coords = { lat: -23.5505, lng: -46.6333 };

const MOCK_ENTREGADOR: Entregador = {
  id: "ent-1",
  nome: "Carlos Silva",
  nota: 4.9,
  foto: null,
  veiculo: "Moto Honda CG 160",
  placa: "BRA-2E19",
};

export const criarPedidoTracking = (params: {
  numero_pedido: string;
  restaurante_nome: string;
  total_centavos: number;
  itens: Array<{ nome: string; quantidade: number; preco_centavos: number }>;
  cliente_endereco?: string;
}): PedidoTracking => {
  const now = new Date().toISOString();
  const pedido: PedidoTracking = {
    id: randomId(),
    numero_pedido: params.numero_pedido,
    restaurante_nome: params.restaurante_nome,
    restaurante_coords: REST_COORDS,
    cliente_endereco: params.cliente_endereco || "Rua das Flores, 123 - Centro",
    cliente_coords: CLIENTE_COORDS,
    entregador: MOCK_ENTREGADOR,
    entregador_coords: REST_COORDS,
    status_atual: "REALIZADO",
    historico: [{ status: "REALIZADO", timestamp: now }],
    criado_em: now,
    eta_minutos: 35,
    total_centavos: params.total_centavos,
    itens: params.itens,
  };
  salvarPedidoTracking(pedido);
  return pedido;
};

export const salvarPedidoTracking = (pedido: PedidoTracking) => {
  localStorage.setItem(KEY_PREFIX + pedido.numero_pedido, JSON.stringify(pedido));
};

export const buscarPedidoTracking = (numero_pedido: string): PedidoTracking | null => {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + numero_pedido);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// RN-01: Máquina de estados linear — só permite avançar para o próximo
export const avancarStatus = (pedido: PedidoTracking): PedidoTracking => {
  if (pedido.cancelado) return pedido;
  const idx = ORDER_FLOW.indexOf(pedido.status_atual);
  if (idx === -1 || idx >= ORDER_FLOW.length - 1) return pedido;
  const next = ORDER_FLOW[idx + 1];
  const updated: PedidoTracking = {
    ...pedido,
    status_atual: next,
    historico: [
      ...pedido.historico,
      { status: next, timestamp: new Date().toISOString() },
    ],
    eta_minutos: Math.max(0, pedido.eta_minutos - 8),
  };
  salvarPedidoTracking(updated);
  return updated;
};

// RN-02: cancelamento permitido apenas em REALIZADO ou CONFIRMADO
export const podeCancelar = (status: OrderStatus): boolean =>
  status === "REALIZADO" || status === "CONFIRMADO";

export const cancelarPedido = (pedido: PedidoTracking): PedidoTracking => {
  if (!podeCancelar(pedido.status_atual)) return pedido;
  const updated: PedidoTracking = { ...pedido, cancelado: true };
  salvarPedidoTracking(updated);
  return updated;
};

// RN-03: interpola posição do entregador entre restaurante e cliente
// progress: 0..1
export const interpolarCoords = (a: Coords, b: Coords, progress: number): Coords => ({
  lat: a.lat + (b.lat - a.lat) * progress,
  lng: a.lng + (b.lng - a.lng) * progress,
});

export const atualizarPosicaoEntregador = (
  pedido: PedidoTracking,
  progress: number
): PedidoTracking => {
  const novaPos = interpolarCoords(
    pedido.restaurante_coords,
    pedido.cliente_coords,
    Math.min(1, Math.max(0, progress))
  );
  const updated: PedidoTracking = { ...pedido, entregador_coords: novaPos };
  salvarPedidoTracking(updated);
  return updated;
};
