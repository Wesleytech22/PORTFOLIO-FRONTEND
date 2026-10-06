import { el } from '../utils/dom.js';
import { Tags } from './tags.js';

// Item da linha do tempo de experiência profissional.
export function ExperienceCard(experience) {
  return el('article', { className: 'card tilt timeline-item' }, [
    el('div', { className: 'timeline-head' }, [
      el('div', {}, [
        el('h3', { text: experience.title }),
        el('p', { className: 'company', text: experience.company }),
      ]),
      el('span', { className: 'period', text: experience.period }),
    ]),
    experience.highlights?.length && el('ul', { className: 'features' }, experience.highlights.map((h) => el('li', { text: h }))),
    Tags(experience.tags),
  ]);
}
