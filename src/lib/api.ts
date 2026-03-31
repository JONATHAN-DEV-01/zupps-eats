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
