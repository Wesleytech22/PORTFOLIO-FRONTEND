import { el } from '../utils/dom.js';

export function Tags(tags = []) {
  if (!tags.length) return null;
  return el('div', { className: 'tags' }, tags.map((tag) => el('span', { text: tag })));
}
