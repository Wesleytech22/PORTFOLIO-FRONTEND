import { el } from '../utils/dom.js';

// Preenche um contêiner com os itens de uma coleção da API, cuidando dos
// estados de carregando, vazio e erro (com botão de tentar de novo).
export async function renderCollection(container, { load, render, emptyText }) {
  container.replaceChildren(el('p', { className: 'status', text: 'Carregando…' }));
  try {
    const items = await load();
    container.replaceChildren(
      ...(items.length ? items.map(render) : [el('p', { className: 'status', text: emptyText })])
    );
  } catch (err) {
    const retry = el('button', { className: 'btn btn-sm btn-ghost', type: 'button', text: 'Tentar de novo' });
    retry.addEventListener('click', () => renderCollection(container, { load, render, emptyText }));
    container.replaceChildren(el('div', { className: 'status status-error' }, [el('p', { text: err.message }), retry]));
  }
}
