import { el, safeUrl } from '../utils/dom.js';
import { t } from '../i18n/index.js';
import { Tags } from './tags.js';

export function ProjectCard(project) {
  const image = safeUrl(project.image);
  const links = [
    safeUrl(project.liveUrl) && el('a', { className: 'btn btn-sm', href: project.liveUrl, target: '_blank', rel: 'noopener', text: t('project.live') }),
    safeUrl(project.repoUrl) && el('a', { className: 'btn btn-sm btn-ghost', href: project.repoUrl, target: '_blank', rel: 'noopener', text: t('project.code') }),
  ].filter(Boolean);

  return el('article', { className: `card tilt${project.featured ? ' card-featured' : ''}` }, [
    el('div', { className: 'card-head' }, [
      image && el('img', { src: image, alt: '', width: 64, height: 64, loading: 'lazy' }),
      el('div', {}, [
        el('h3', { text: project.title }),
        project.subtitle && el('p', { className: 'muted', text: project.subtitle }),
      ]),
    ]),
    el('p', { text: project.description }),
    project.highlights?.length && el('ul', { className: 'features' }, project.highlights.map((h) => el('li', { text: h }))),
    Tags(project.tags),
    links.length && el('div', { className: 'links' }, links),
  ]);
}
