// Mock payments service — simulates POST /pagamentos, POST /cartoes, GET /pagamentos/usuario
// Persists tokenized cards and transaction history in localStorage.

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export interface CartaoTokenizado {
  id: string;
  token: string;
  ultimos4: string;
  bandeira: string; // "Visa" | "Mastercard" | "Elo" | etc.
  titular: string;
  validade: string; // MM/AA
  criado_em: string;
}

export type StatusPagamento = "aprovado" | "recusado" | "pendente";

export interface ItemTransacao {
  produto_id: string;
  nome: string;
  quantidade: number;
  preco_unitario_centavos: number;
  adicionais_centavos: number;
}

export interface HistoricoTransacao {
  id: string;
  numero_pedido: string;
  restaurante_id: string;
  restaurante_nome: string;
  itens: ItemTransacao[];
  subtotal_centavos: number;
  frete_centavos: number;
  total_centavos: number;
  cartao_ultimos4: string;
  cartao_bandeira: string;
  status: StatusPagamento;
  criado_em: string;
}

export interface PayerInfo {
  email: string;
  first_name?: string;
  last_name?: string;
  identification?: {
    type: string;
    number: string;
  };
}

const CARDS_KEY = "zupps_cartoes";
const TX_KEY = "zupps_transacoes";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const randomId = () => Math.random().toString(36).slice(2, 12);
const randomToken = () => "tok_" + Math.random().toString(36).slice(2, 18);

const detectBandeira = (numero: string): string => {
  const n = numero.replace(/\D/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^(4011|4312|4389|5041|5067|6277|6362|6363|650|6516|6550)/.test(n)) return "Elo";
  if (/^6(?:011|5)/.test(n)) return "Discover";
  return "Cartão";
};

// ─── Validators ──────────────────────────────────────────────────────────────
export const validarNumeroCartao = (numero: string): boolean => {
  const n = numero.replace(/\D/g, "");
  if (n.length < 13 || n.length > 19) return false;
  // Luhn
  let sum = 0;
  let alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i], 10);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
};

export const validarValidade = (validade: string): boolean => {
  const m = validade.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const mes = parseInt(m[1], 10);
  const ano = 2000 + parseInt(m[2], 10);
  if (mes < 1 || mes > 12) return false;
  const fim = new Date(ano, mes, 0, 23, 59, 59);
  return fim.getTime() >= Date.now();
};

export const validarCVV = (cvv: string): boolean => /^\d{3,4}$/.test(cvv);

// ─── Masks ───────────────────────────────────────────────────────────────────
export const formatNumeroCartao = (v: string) =>
  v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ").trim();

export const formatValidade = (v: string) => {
  const n = v.replace(/\D/g, "").slice(0, 4);
  if (n.length < 3) return n;
  return `${n.slice(0, 2)}/${n.slice(2)}`;
};

export const formatCVV = (v: string) => v.replace(/\D/g, "").slice(0, 4);

// ─── Storage: cartoes ────────────────────────────────────────────────────────
export const listarCartoes = (): CartaoTokenizado[] => {
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistCartoes = (cards: CartaoTokenizado[]) =>
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));

export interface NovoCartaoInput {
  numero: string;
  titular: string;
  validade: string;
  cvv: string;
}

// O sdk-react não exporta mais loadMercadoPago. Vamos injetar o script manualmente para garantir o carregamento assíncrono.
let mpInitialized = false;

export const initializeMP = async () => {
  if (mpInitialized && window.MercadoPago) return;

  if (!document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]')) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  mpInitialized = true;
};

export const tokenizarCartao = async (input: NovoCartaoInput): Promise<CartaoTokenizado> => {
  await initializeMP();
  
  const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-PUBLIC-KEY-HERE', { locale: 'pt-BR' });
  
  const numeroLimpo = input.numero.replace(/\D/g, "");
  const [mes, anoStr] = input.validade.split('/');
  // Assume "25" means 2025
  const ano = anoStr.length === 2 ? `20${anoStr}` : anoStr;

  try {
    const response = await mp.createCardToken({
      cardNumber: numeroLimpo,
      cardholderName: input.titular.trim().toUpperCase(),
      cardExpirationMonth: mes,
      cardExpirationYear: ano,
      securityCode: input.cvv,
      // Se necessário identificação, passar aqui:
      // identificationType: 'CPF',
      // identificationNumber: '11111111111'
    });

    if (response && response.id) {
      const novo: CartaoTokenizado = {
        id: randomId(),
        token: response.id,
        ultimos4: response.lastFourDigits || numeroLimpo.slice(-4),
        bandeira: detectBandeira(numeroLimpo),
        titular: input.titular.trim().toUpperCase(),
        validade: input.validade,
        criado_em: new Date().toISOString(),
      };
      const cards = listarCartoes();
      cards.unshift(novo);
      persistCartoes(cards);
      return novo;
    }
    
    throw new Error("Não foi possível gerar o token do cartão");
  } catch (error) {
    console.error("Erro na tokenização:", error);
    throw error;
  }
};

export const removerCartao = (id: string) => {
  persistCartoes(listarCartoes().filter((c) => c.id !== id));
};

// ─── Storage: transacoes ─────────────────────────────────────────────────────
export const listarTransacoes = (): HistoricoTransacao[] => {
  try {
    const raw = localStorage.getItem(TX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistTransacoes = (list: HistoricoTransacao[]) =>
  localStorage.setItem(TX_KEY, JSON.stringify(list));

export interface ProcessarPagamentoInput {
  cartao: CartaoTokenizado;
  restaurante_id: string;
  restaurante_nome: string;
  itens: ItemTransacao[];
  subtotal_centavos: number;
  frete_centavos: number;
  total_centavos: number;
  token_checkout?: string; // token do POST /carrinho/congelar (quando autenticado)
  forcar_status?: StatusPagamento; // for test buttons
}

// Simula POST /pagamentos — 2s loading, status aleatório (ou forçado).
export const processarPagamento = async (
  input: ProcessarPagamentoInput
): Promise<HistoricoTransacao> => {
  await sleep(1800 + Math.random() * 200);

  let status: StatusPagamento;
  if (input.forcar_status) {
    status = input.forcar_status;
  } else {
    const r = Math.random();
    // 70% aprovado, 20% recusado, 10% pendente
    if (r < 0.7) status = "aprovado";
    else if (r < 0.9) status = "recusado";
    else status = "pendente";
  }

  const tx: HistoricoTransacao = {
    id: randomId(),
    numero_pedido: "ZP-" + Date.now().toString().slice(-8),
    restaurante_id: input.restaurante_id,
    restaurante_nome: input.restaurante_nome,
    itens: input.itens,
    subtotal_centavos: input.subtotal_centavos,
    frete_centavos: input.frete_centavos,
    total_centavos: input.total_centavos,
    cartao_ultimos4: input.cartao.ultimos4,
    cartao_bandeira: input.cartao.bandeira,
    status,
    criado_em: new Date().toISOString(),
  };

  const list = listarTransacoes();
  list.unshift(tx);
  persistTransacoes(list);
  return tx;
};

export const formatCentavos = (centavos: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
