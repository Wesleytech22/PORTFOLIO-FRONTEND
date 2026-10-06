import './styles/main.css';
import { initScene } from './scene/scene.js';
import { initTilt } from './ui/tilt.js';
import { createReveal } from './ui/reveal.js';
import { renderCollection } from './components/collection.js';
import { ProjectCard } from './components/projectCard.js';
import { ServiceCard } from './components/serviceCard.js';
import { portfolioService } from './services/portfolio.service.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

initScene(document.getElementById('scene'), { reduceMotion });
initTilt({ reduceMotion });
const reveal = createReveal();
reveal.observe();

// Cada seção dinâmica declara data-collection no HTML e é ligada aqui
// ao método da API e ao componente que desenha cada item.
const COLLECTIONS = {
  services: { load: portfolioService.listServices, render: ServiceCard, emptyText: 'Nenhum serviço cadastrado ainda.' },
  projects: { load: portfolioService.listProjects, render: ProjectCard, emptyText: 'Nenhum projeto cadastrado ainda.' },
};

document.querySelectorAll('[data-collection]').forEach(async (container) => {
  const collection = COLLECTIONS[container.dataset.collection];
  if (!collection) return;
  await renderCollection(container, collection);
  reveal.observe(container, '.card');
});
