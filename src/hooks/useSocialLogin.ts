// src/hooks/useSocialLogin.ts
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi, setAuthToken, setUserProfile } from "@/lib/api";

export type SocialLoginState =
  | "idle"
  | "loading"
  | "require_phone"
  | "success"
  | "error";

export interface SocialLoginResult {
  state: SocialLoginState;
  errorMessage: string | null;
  provisionalData: {
    token_provisorio: string;
    nome_completo: string;
    email: string;
  } | null;
  handleGoogleToken: (accessToken: string) => Promise<void>;
  handleFacebookToken: (accessToken: string) => Promise<void>;
  handleCompleteRegistration: (telefone: string) => Promise<void>;
}

export function useSocialLogin(): SocialLoginResult {
  const navigate = useNavigate();
  const [state, setState] = useState<SocialLoginState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provisionalData, setProvisionalData] = useState<
    SocialLoginResult["provisionalData"]
  >(null);

  // -----------------------------------------------------------------
  // Função genérica: envia o access_token para o backend e trata a resposta
  // -----------------------------------------------------------------
  const sendTokenToBackend = async (
    endpoint: "/auth/google/callback" | "/auth/facebook/callback",
    accessToken: string
  ) => {
    setState("loading");
    setErrorMessage(null);

    try {
      const response = await fetchApi(endpoint, {
        method: "POST",
        body: JSON.stringify({ access_token: accessToken }),
      });

      const data = await response.json();

      // HTTP 200 → Login direto: usuário já existia
      if (response.status === 200) {
        if (data.token) setAuthToken(data.token);
        if (data.user) setUserProfile(data.user);
        setState("success");
        navigate("/cliente-home");
        return;
      }

      // HTTP 202 → Novo usuário: interceptado para coleta de telefone (RF-08)
      if (response.status === 202 && data.require_phone) {
        setProvisionalData({
          token_provisorio: data.token_provisorio,
          nome_completo: data.nome_completo,
          email: data.email,
        });
        setState("require_phone");
        // O componente pai observa state === "require_phone" e exibe o modal
        return;
      }

      // Outros erros (400, 422, 500...)
      setState("error");
      setErrorMessage(data.error || "Erro ao autenticar com provedor social.");
    } catch {
      setState("error");
      setErrorMessage("Falha de conexão com o servidor.");
    }
  };

  // -----------------------------------------------------------------
  // Handlers públicos do hook
  // -----------------------------------------------------------------
  const handleGoogleToken = (accessToken: string) =>
    sendTokenToBackend("/auth/google/callback", accessToken);

  const handleFacebookToken = (accessToken: string) =>
    sendTokenToBackend("/auth/facebook/callback", accessToken);

  // -----------------------------------------------------------------
  // Conclusão do cadastro com o telefone coletado no modal
  // -----------------------------------------------------------------
  const handleCompleteRegistration = async (telefone: string) => {
    if (!provisionalData) return;

    setState("loading");
    setErrorMessage(null);

    try {
      const response = await fetchApi("/auth/social/complete-registration", {
        method: "POST",
        body: JSON.stringify({
          token_provisorio: provisionalData.token_provisorio,
          telefone,
        }),
      });

      const data = await response.json();

      // 201 → Novo usuário criado com sucesso
      // 200 → E-mail já existia: conta vinculada, login realizado
      if (response.status === 201 || response.status === 200) {
        if (data.token) setAuthToken(data.token);
        if (data.user) setUserProfile(data.user);
        setState("success");
        navigate("/cliente-home");
        return;
      }

      // 401 → Token provisório expirado
      if (response.status === 401) {
        setState("error");
        setErrorMessage(
          "Tempo expirado. Por favor, reinicie o login com Google/Facebook."
        );
        return;
      }

      // 409 → Conflito (telefone duplicado ou identidade social já vinculada)
      if (response.status === 409) {
        setState("error");
        setErrorMessage(data.error || "Dados já cadastrados. Tente outro telefone.");
        return;
      }

      setState("error");
      setErrorMessage(data.error || "Erro ao finalizar cadastro.");
    } catch {
      setState("error");
      setErrorMessage("Falha de conexão com o servidor.");
    }
  };

  return {
    state,
    errorMessage,
    provisionalData,
    handleGoogleToken,
    handleFacebookToken,
    handleCompleteRegistration,
  };
}
