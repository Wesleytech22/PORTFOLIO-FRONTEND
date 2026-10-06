import { el } from '../utils/dom.js';
import { t } from '../i18n/index.js';

// Preenche um contêiner com os itens de uma coleção da API, cuidando dos
// estados de carregando, vazio e erro (com botão de tentar de novo).
export async function renderCollection(container, { load, render, emptyKey }) {
  container.replaceChildren(el('p', { className: 'status', text: t('collection.loading') }));
  try {
    const items = await load();
    container.replaceChildren(
      ...(items.length ? items.map(render) : [el('p', { className: 'status', text: t(emptyKey) })])
    );
  } catch {
    const retry = el('button', { className: 'btn btn-sm btn-ghost', type: 'button', text: t('collection.retry') });
    retry.addEventListener('click', () => renderCollection(container, { load, render, emptyKey }));
    container.replaceChildren(el('div', { className: 'status status-error' }, [el('p', { text: t('collection.error') }), retry]));
  }
}
