// Configuração lida em tempo de build (variáveis VITE_*).
export const config = {
  apiUrl: (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, ''),
  requestTimeoutMs: 8000,
};
