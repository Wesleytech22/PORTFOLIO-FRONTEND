// Configuração lida em tempo de build (variáveis VITE_*).
export const config = {
  apiUrl: (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, ''),
  requestTimeoutMs: 8000,
  // Avatar realista opcional (.glb). Vazio = personagem modelado em código.
  avatarModelUrl: import.meta.env.VITE_AVATAR_MODEL_URL || '',
};
