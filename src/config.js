// Configuração lida em tempo de build (variáveis VITE_*).
export const config = {
  apiUrl: (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, ''),
  // O plano Free do Render dorme sem acesso; o primeiro request leva ~30-50 s.
  requestTimeoutMs: 60000,
  // Avatar realista opcional (.glb). Vazio = personagem modelado em código.
  avatarModelUrl: import.meta.env.VITE_AVATAR_MODEL_URL || '',
};
