import { request } from './http.js';
import { getLang } from '../i18n/index.js';

const list = async (collection) => (await request(`/${collection}?lang=${getLang()}`)).items;

// Um método por coleção do backend. Nova coleção na API → novo método aqui.
// O conteúdo vem traduzido no idioma escolhido na página.
export const portfolioService = {
  listProjects: () => list('projects'),
  listServices: () => list('services'),
  listExperiences: () => list('experiences'),

  // Formulário de contato: o backend encaminha a mensagem para o Telegram.
  sendContact(message) {
    return request('/contact', { method: 'POST', body: { ...message, lang: getLang() } });
  },
};
