import pt from './locales/pt.js';
import en from './locales/en.js';
import zh from './locales/zh.js';

// Internacionalização: português (padrão), inglês e chinês.
// No HTML, data-i18n="chave" troca o texto e data-i18n-aria-label o rótulo.
const LOCALES = { pt, en, zh };
const HTML_LANG = { pt: 'pt-BR', en: 'en', zh: 'zh-CN' };
const STORAGE_KEY = 'portfolio.lang';
const listeners = new Set();

// Ordem: ?lang= no link (para compartilhar já traduzido) → escolha salva →
// idioma do navegador → português.
function detectLang() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (LOCALES[fromUrl]) return fromUrl;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LOCALES[saved]) return saved;
  } catch {
    // armazenamento bloqueado: segue para o idioma do navegador
  }
  const browser = (navigator.language || 'pt').toLowerCase();
  if (browser.startsWith('zh')) return 'zh';
  if (browser.startsWith('en')) return 'en';
  return 'pt';
}

let current = detectLang();

export const LANGS = Object.keys(LOCALES);
export const getLang = () => current;
export const t = (key) => LOCALES[current][key] ?? LOCALES.pt[key] ?? key;
export const onLangChange = (fn) => listeners.add(fn);

export function applyTranslations(root = document) {
  document.documentElement.lang = HTML_LANG[current];
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
  root.querySelectorAll('[data-i18n]').forEach((node) => (node.textContent = t(node.dataset.i18n)));
  root.querySelectorAll('[data-i18n-aria-label]').forEach((node) => node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel)));
  root.querySelectorAll('[data-lang]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lang === current)));
}

export function setLang(lang) {
  if (!LOCALES[lang] || lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // sem armazenamento: vale só para esta visita
  }
  applyTranslations();
  listeners.forEach((fn) => fn(lang));
}

// Botões com data-lang="pt|en|zh" trocam o idioma.
export function initLangSwitch(root = document) {
  root.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-lang]');
    if (button) setLang(button.dataset.lang);
  });
  applyTranslations();
}
