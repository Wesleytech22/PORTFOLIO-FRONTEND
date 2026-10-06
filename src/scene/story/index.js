import * as THREE from 'three';
import { t, onLangChange } from '../../i18n/index.js';
import { createCharacter } from '../avatar/character.js';
import { damp } from '../avatar/parts.js';
import { CHAPTERS, START_X } from './chapters.js';
import { createStage } from './stage.js';

const WALK_SPEED = 1.15; // m/s
const CHARS_PER_SECOND = 40;
const FACE_CAMERA = 0.38; // rotação do corpo ao falar, de frente para quem assiste

const chapterText = (id, field = 'text') => t(`story.${id}.${field}`);

// Cena 3D da história: criada só na primeira vez que o modo história abre.
function createEngine(canvas, { reduceMotion }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x070912);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x070912, 6, 14);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  const stage = createStage(scene, CHAPTERS);
  stage.setLabels(chapterText);

  const character = createCharacter();
  scene.add(character.group);

  const state = { index: 0, x: START_X, facing: Math.PI / 2, camX: START_X + 0.9, onArrive: null, arrived: false, talking: false };
  const headScreen = new THREE.Vector3();

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);

  const clock = new THREE.Clock();

  function frame(onFrame) {
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    const chapter = CHAPTERS[state.index];
    const dx = chapter.x - state.x;
    const walking = Math.abs(dx) > 0.02;

    if (walking) {
      state.x += Math.sign(dx) * Math.min(Math.abs(dx), WALK_SPEED * dt);
      state.facing = Math.sign(dx) > 0 ? Math.PI / 2 : -Math.PI / 2;
      state.arrived = false;
    } else if (!state.arrived) {
      state.x = chapter.x;
      state.facing = FACE_CAMERA;
      state.arrived = true;
      state.onArrive?.();
    }

    const mode = walking ? 'walk' : state.talking && chapter.pose === 'wave' ? 'wave' : state.talking ? 'talk' : 'stand';
    character.group.position.x = state.x;
    character.group.rotation.y = damp(character.group.rotation.y, state.facing, 7, dt);
    character.update(time, dt, { mode, talking: state.talking && !walking, headYaw: walking ? 0 : 0.1 });
    // Câmera acompanha o avatar, enquadrando ele e o painel do marco.
    const narrow = camera.aspect < 0.9;
    stage.update(state.index, time, dt, narrow);
    state.camX = damp(state.camX, state.x + (narrow ? 0.1 : 1.0), 2.6, dt);
    camera.position.set(state.camX, narrow ? 1.6 : 1.45, narrow ? 6.2 : 4.9);
    camera.lookAt(narrow ? state.camX : state.camX - 0.3, narrow ? 1.35 : 1.05, 0);
    renderer.render(scene, camera);

    // Ponto acima da cabeça, em pixels, para posicionar o balão de fala.
    headScreen.copy(character.getHeadPosition());
    headScreen.y += 0.38;
    headScreen.project(camera);
    onFrame?.({
      dt,
      walking,
      bubbleX: ((headScreen.x + 1) / 2) * canvas.clientWidth,
      bubbleY: ((1 - headScreen.y) / 2) * canvas.clientHeight,
    });
  }

  return {
    state,
    stage,
    start(onFrame) {
      clock.getDelta();
      resize();
      renderer.setAnimationLoop(() => frame(onFrame));
    },
    stop() {
      renderer.setAnimationLoop(null);
    },
    placeAt(x) {
      state.x = x;
      state.camX = x + 1.0;
      state.arrived = false;
    },
    reduceMotion,
  };
}

// Modo história: abre ao clicar em "Sobre" (ou no botão da seção). O avatar
// entra andando, para em cada marco e conta aquela parte da trajetória.
export function initStory({ reduceMotion }) {
  const root = document.getElementById('story');
  if (!root) return;
  const canvas = root.querySelector('canvas');
  const bubble = root.querySelector('[data-story-bubble]');
  const textEl = root.querySelector('[data-story-text]');
  const ctaEl = root.querySelector('[data-story-cta]');
  const dotsEl = root.querySelector('[data-story-dots]');
  const prevBtn = root.querySelector('[data-story-prev]');
  const nextBtn = root.querySelector('[data-story-next]');

  let engine = null;
  let fullText = '';
  let typed = 0;
  let returnTo = null;
  let lastFocus = null;

  dotsEl.replaceChildren(
    ...CHAPTERS.map((chapter, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'story-dot';
      dot.addEventListener('click', () => goTo(i));
      return dot;
    })
  );

  function renderControls() {
    const { index } = engine.state;
    prevBtn.disabled = index === 0;
    nextBtn.textContent = t(index === CHAPTERS.length - 1 ? 'story.finish' : 'story.next');
    [...dotsEl.children].forEach((dot, i) => {
      dot.setAttribute('aria-current', String(i === index));
      dot.setAttribute('aria-label', `${i + 1} / ${CHAPTERS.length}`);
    });
  }

  function startTalking() {
    fullText = chapterText(CHAPTERS[engine.state.index].id);
    typed = reduceMotion ? fullText.length : 0;
    engine.state.talking = typed < fullText.length;
    textEl.textContent = fullText.slice(0, typed);
    ctaEl.hidden = !(CHAPTERS[engine.state.index].cta && typed >= fullText.length);
    bubble.classList.add('is-visible');
  }

  function goTo(index) {
    if (!engine || index < 0 || index >= CHAPTERS.length) return;
    engine.state.index = index;
    engine.state.talking = false;
    engine.state.onArrive = startTalking;
    bubble.classList.remove('is-visible');
    ctaEl.hidden = true;
    if (reduceMotion) engine.placeAt(CHAPTERS[index].x);
    renderControls();
  }

  function next() {
    // Primeiro clique durante a fala completa o texto; o segundo avança.
    if (engine.state.talking) {
      typed = fullText.length;
      return;
    }
    if (engine.state.index === CHAPTERS.length - 1) close();
    else goTo(engine.state.index + 1);
  }

  function onFrame({ dt, walking, bubbleX, bubbleY }) {
    if (engine.state.talking) {
      typed = Math.min(fullText.length, typed + dt * CHARS_PER_SECOND);
      textEl.textContent = fullText.slice(0, Math.floor(typed));
      if (typed >= fullText.length) {
        engine.state.talking = false;
        ctaEl.hidden = !CHAPTERS[engine.state.index].cta;
      }
    }
    if (walking) bubble.classList.remove('is-visible');
    root.style.setProperty('--bubble-x', `${bubbleX}px`);
    root.style.setProperty('--bubble-y', `${bubbleY}px`);
  }

  function open(target) {
    returnTo = target;
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add('story-open');
    engine ??= createEngine(canvas, { reduceMotion });
    engine.placeAt(reduceMotion ? CHAPTERS[0].x : START_X);
    engine.start(onFrame);
    goTo(0);
    nextBtn.focus();
  }

  function close() {
    engine?.stop();
    root.hidden = true;
    document.body.classList.remove('story-open');
    if (returnTo) document.querySelector(returnTo)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    lastFocus?.focus?.({ preventScroll: true });
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest?.('[data-story-open]');
    if (!trigger) return;
    event.preventDefault();
    open(trigger.getAttribute('href') || '#sobre');
  });
  root.querySelector('[data-story-close]').addEventListener('click', close);
  prevBtn.addEventListener('click', () => goTo(engine.state.index - 1));
  nextBtn.addEventListener('click', next);
  ctaEl.addEventListener('click', () => {
    returnTo = '#contato';
    close();
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
    else if (event.key === 'ArrowRight') next();
    else if (event.key === 'ArrowLeft') goTo(engine.state.index - 1);
    else if (event.key === 'Tab') {
      // Mantém o foco dentro do modo história.
      const focusables = [...root.querySelectorAll('button:not([disabled]):not([hidden])')];
      const i = focusables.indexOf(document.activeElement);
      const nextIndex = event.shiftKey ? (i <= 0 ? focusables.length - 1 : i - 1) : (i + 1) % focusables.length;
      focusables[nextIndex]?.focus();
      event.preventDefault();
    }
  });

  onLangChange(() => {
    if (!engine) return;
    engine.stage.setLabels(chapterText);
    if (!root.hidden) {
      renderControls();
      if (bubble.classList.contains('is-visible')) startTalking();
    }
  });
}
