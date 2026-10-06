import { el } from '../utils/dom.js';
import { Tags } from './tags.js';

export function ServiceCard(service) {
  return el('div', { className: 'card tilt' }, [
    el('h3', { text: service.title }),
    el('p', { text: service.description }),
    Tags(service.tags),
  ]);
}
