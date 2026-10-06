import { request } from './http.js';

// Um método por coleção do backend. Nova coleção na API → novo método aqui.
export const portfolioService = {
  async listProjects() {
    return (await request('/projects')).items;
  },

  async listServices() {
    return (await request('/services')).items;
  },
};
