import { portfolioService } from '../services/portfolio.service.js';
import { t, onLangChange } from '../i18n/index.js';

// Status HTTP da API → mensagem no idioma da página.
const ERROR_KEYS = { 0: 'form.network', 400: 'form.invalid', 429: 'form.rateLimited' };

// Formulário de contato: valida no navegador, envia à API (que repassa ao
// Telegram) e mostra o resultado sem recarregar a página.
export function initContactForm(form) {
  if (!form) return;
  const status = form.querySelector('[data-status]');
  const button = form.querySelector('button[type=submit]');
  let lastKey = '';

  const show = (key, kind) => {
    lastKey = key;
    status.textContent = key ? t(key) : '';
    status.dataset.kind = kind;
  };
  onLangChange(() => lastKey && (status.textContent = t(lastKey)));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return show('form.invalid', 'error');
    }

    const data = Object.fromEntries(new FormData(form));
    button.disabled = true;
    show('form.sending', 'info');
    try {
      await portfolioService.sendContact(data);
      form.reset();
      show('form.sent', 'ok');
    } catch (err) {
      show(ERROR_KEYS[err.status] || 'form.failed', 'error');
    } finally {
      button.disabled = false;
    }
  });
}
