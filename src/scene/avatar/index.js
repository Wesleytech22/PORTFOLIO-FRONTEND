import * as THREE from 'three';
import { config } from '../../config.js';
import { t, onLangChange } from '../../i18n/index.js';
import { createCharacter } from './character.js';
import { createWorkstation } from './workstation.js';
import { createCodeScreen } from './codeScreen.js';
import { loadCustomAvatar } from './customAvatar.js';
import { damp } from './parts.js';

function createLights(scene) {
  scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x0d0f18, 0.55));

  const key = new THREE.DirectionalLight(0xffe2c4, 1.7);
  key.position.set(2.2, 3.2, 2.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -2;
  key.shadow.camera.right = key.shadow.camera.top = 2;
  key.shadow.bias = -0.0005;
  scene.add(key);

  // Contraluz verde-água atrás do personagem, como o letreiro da foto.
  const rim = new THREE.PointLight(0x19e3d0, 7, 6);
  rim.position.set(-0.9, 1.9, -1.1);
  scene.add(rim);

  const fill = new THREE.PointLight(0x6c8cff, 1.4, 6);
  fill.position.set(1.6, 1.2, 1.8);
  scene.add(fill);
}

// Cena do topo da página: o avatar sentado, digitando o código que aparece
// na tela holográfica. Pausa quando sai da tela ou a aba fica oculta.
export function initAvatar(canvas, { reduceMotion }) {
  if (!canvas) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    canvas.closest('.hero-avatar')?.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(1.85, 1.5, 3.25);
  const target = new THREE.Vector3(-0.28, 0.96, 0.34);
  camera.lookAt(target);
  createLights(scene);

  const rig = new THREE.Group();
  scene.add(rig);
  let station = null;
  const codeScreen = createCodeScreen({
    onKeystroke: () => station?.keyboard.flash(),
    labels: () => ({ typing: t('avatar.typing'), idle: t('avatar.idle') }),
  });
  station = createWorkstation(codeScreen.texture);
  onLangChange(() => {
    codeScreen.redraw();
    if (reduceMotion) render();
  });
  rig.add(station.group);

  let character = createCharacter();
  rig.add(character.group);

  if (config.avatarModelUrl) {
    loadCustomAvatar(config.avatarModelUrl)
      .then((custom) => {
        rig.remove(character.group);
        character = custom;
        rig.add(custom.group);
        if (reduceMotion) render();
      })
      .catch((err) => console.warn('Avatar .glb não carregou; usando o modelado em código.', err));
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas.parentElement;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();

  // Interação: a cena acompanha o mouse e, com o ponteiro em cima, ele olha para você.
  const pointer = { x: 0, y: 0 };
  let hovering = false;
  addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth - 0.5) * 2;
    pointer.y = (e.clientY / innerHeight - 0.5) * 2;
  });
  canvas.addEventListener('pointerenter', () => (hovering = true));
  canvas.addEventListener('pointerleave', () => (hovering = false));
  // No toque, ele olha para você por alguns segundos.
  let touchTimer;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    hovering = true;
    clearTimeout(touchTimer);
    touchTimer = setTimeout(() => (hovering = false), 2500);
  });

  let visible = true;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(canvas);

  const render = () => renderer.render(scene, camera);

  if (reduceMotion) {
    codeScreen.showAll();
    character.update(0, 1, { typing: false, lookAtViewer: true });
    render();
    return;
  }

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible || document.hidden) return;
    const t = clock.elapsedTime;

    const typing = codeScreen.update(t);
    station.keyboard.update(dt);
    character.update(t, dt, { typing, lookAtViewer: hovering });
    station.holo.position.y = 1.3 + Math.sin(t * 1.2) * 0.012;

    rig.rotation.y = damp(rig.rotation.y, pointer.x * 0.22, 3, dt);
    camera.position.y = damp(camera.position.y, 1.45 - pointer.y * 0.15, 3, dt);
    camera.lookAt(target);
    render();
  });
}
