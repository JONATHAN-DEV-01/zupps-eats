export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const getAuthToken = () => localStorage.getItem("auth_token");
export const setAuthToken = (token: string) => localStorage.setItem("auth_token", token);
export const removeAuthToken = () => localStorage.removeItem("auth_token");

export const getUserProfile = () => {
  const user = localStorage.getItem("user_profile");
  return user ? JSON.parse(user) : null;
};
export const setUserProfile = (user: any) => localStorage.setItem("user_profile", JSON.stringify(user));

export const logout = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_profile");
  sessionStorage.clear();
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Categoria {
  id: number;
  nome: string;
  tipo: string;
  imagem_url: string | null;
  is_highlight: boolean;
}

export interface RestauranteMeta {
  id: string;
  nome: string;
  is_open: boolean;
  nota_avaliacao: number | null;
  tempo_entrega_minutos: number | null;
  valor_frete: number | null;
}

export interface ProdutoBusca {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  preco_promocional?: number;
  preco_original?: number;
  em_promocao: boolean;
  imagem: string | null;
  _score?: number;
  restaurante: RestauranteMeta | null;
}

export interface BuscaResponse {
  q: string;
  total: number;
  page: number;
  per_page: number;
  pages: number;
  results: ProdutoBusca[];
  fallback?: {
    sugestoes_categorias: Categoria[];
    lojas_proximas: { id: string; nome: string }[];
  };
  message?: string;
}

export interface RestauranteItem {
  id: string;
  nome_fantasia: string;
  logotipo: string | null;
  capa: string | null;
  descricao: string | null;
  categoria: string | null;
  categorias: { id: number; nome: string }[];
  is_open: boolean;
  nota_avaliacao: number | null;
  tempo_entrega_minutos: number | null;
  valor_frete: number | null;
  ativo: boolean;
  distancia_km?: number | null;
}

// ─── Funções de API ───────────────────────────────────────────────────────────

/** RF-01/02/03 Req.6 — Busca global de produtos (mín. 3 chars) */
export const buscarProdutos = async (
  q: string,
  params?: { page?: number; per_page?: number }
): Promise<BuscaResponse> => {
  const query = new URLSearchParams({ q, ...(params as Record<string, string>) }).toString();
  const res = await fetchApi(`/busca?${query}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Erro na busca");
  }
  return res.json();
};

/** RF-02 Req.7 — Categorias em destaque para carrossel da Home */
export const fetchCategoriaDestaques = async (): Promise<Categoria[]> => {
  const res = await fetchApi("/categorias/destaques?tipo=COZINHA");
  if (!res.ok) return [];
  return res.json();
};

/** RF-03 Req.7 — Todas as categorias para grade na aba de busca */
export const fetchTodasCategorias = async (): Promise<Categoria[]> => {
  const res = await fetchApi("/categorias?tipo=COZINHA");
  if (!res.ok) return [];
  return res.json();
};

/** RF-04 Req.7 — Restaurantes filtrados por categoria + geolocalização */
export const fetchRestaurantesPorCategoria = async (
  categoriaId: number,
  coords?: { lat: number; lon: number }
): Promise<{ categoria: Categoria; results: RestauranteItem[]; total: number; message?: string }> => {
  const params = coords ? `?lat=${coords.lat}&lon=${coords.lon}` : "";
  const res = await fetchApi(`/restaurantes/por-categoria/${categoriaId}${params}`);
  if (!res.ok) throw new Error("Erro ao buscar restaurantes por categoria");
  return res.json();
};
