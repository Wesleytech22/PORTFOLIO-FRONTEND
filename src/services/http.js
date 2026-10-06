import { config } from '../config.js';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Cliente HTTP único do frontend: base URL, timeout e erro padronizado.
export async function request(path, { method = 'GET', body, signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  signal?.addEventListener('abort', () => controller.abort());

  try {
    const res = await fetch(`${config.apiUrl}${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(data?.error || `Erro ${res.status} na API.`, res.status);
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Não foi possível conectar à API.', 0);
  } finally {
    clearTimeout(timer);
  }
}
