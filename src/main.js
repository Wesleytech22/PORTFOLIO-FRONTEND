import './styles/main.css';
import { initLangSwitch, onLangChange } from './i18n/index.js';
import { initScene } from './scene/scene.js';
import { initAvatar } from './scene/avatar/index.js';
import { initTilt } from './ui/tilt.js';
import { createReveal } from './ui/reveal.js';
import { initContactForm } from './ui/contactForm.js';
import { renderCollection } from './components/collection.js';
import { ProjectCard } from './components/projectCard.js';
import { ServiceCard } from './components/serviceCard.js';
import { ExperienceCard } from './components/experienceCard.js';
import { portfolioService } from './services/portfolio.service.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

initLangSwitch();
initScene(document.getElementById('scene'), { reduceMotion });
initAvatar(document.getElementById('avatar'), { reduceMotion });
initTilt({ reduceMotion });
initContactForm(document.getElementById('contact-form'));
const reveal = createReveal();
reveal.observe();

// Cada seção dinâmica declara data-collection no HTML e é ligada aqui
// ao método da API e ao componente que desenha cada item.
const COLLECTIONS = {
  experiences: { load: portfolioService.listExperiences, render: ExperienceCard, emptyKey: 'empty.experiences' },
  services: { load: portfolioService.listServices, render: ServiceCard, emptyKey: 'empty.services' },
  projects: { load: portfolioService.listProjects, render: ProjectCard, emptyKey: 'empty.projects' },
};

function loadCollections() {
  document.querySelectorAll('[data-collection]').forEach(async (container) => {
    const collection = COLLECTIONS[container.dataset.collection];
    if (!collection) return;
    await renderCollection(container, collection);
    reveal.observe(container, '.card');
  });
}

loadCollections();
onLangChange(loadCollections); // trocar o idioma busca o conteúdo traduzido na API
