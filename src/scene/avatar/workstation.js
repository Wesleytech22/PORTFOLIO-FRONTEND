import * as THREE from 'three';
import { material, part } from './parts.js';

const TEAL = 0x19e3d0;
const KEY_COLS = 15;
const KEY_ROWS = 5;

function createDesk() {
  const desk = new THREE.Group();
  const wood = material(0x2b2f3a, { roughness: 0.5, metalness: 0.2 });
  const metal = material(0x14161c, { roughness: 0.4, metalness: 0.7 });
  desk.add(part(new THREE.BoxGeometry(1.5, 0.04, 0.75), wood, { position: [0, 0.68, 0.675] }));
  for (const x of [-0.7, 0.7]) {
    for (const z of [0.36, 0.99]) desk.add(part(new THREE.BoxGeometry(0.04, 0.66, 0.04), metal, { position: [x, 0.33, z] }));
  }
  // Fita de LED na borda da mesa, no mesmo verde-água da foto.
  desk.add(part(new THREE.BoxGeometry(1.5, 0.008, 0.008), material(TEAL, { emissive: TEAL, emissiveIntensity: 1.4 }), { position: [0, 0.66, 0.3] }));
  return desk;
}

function createChair() {
  const chair = new THREE.Group();
  const shell = material(0x1c1f27, { roughness: 0.7 });
  const accent = material(TEAL, { emissive: TEAL, emissiveIntensity: 0.25, roughness: 0.5 });
  const metal = material(0x0f1014, { metalness: 0.8, roughness: 0.3 });
  chair.add(
    part(new THREE.BoxGeometry(0.5, 0.06, 0.48), shell, { position: [0, 0.43, -0.02] }),
    part(new THREE.BoxGeometry(0.46, 0.56, 0.06), shell, { position: [0, 0.82, -0.29], rotation: [-0.12, 0, 0] }),
    part(new THREE.BoxGeometry(0.47, 0.03, 0.065), accent, { position: [0, 1.06, -0.32], rotation: [-0.12, 0, 0] }),
    part(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 12), metal, { position: [0, 0.23, -0.02] })
  );
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const leg = part(new THREE.BoxGeometry(0.03, 0.025, 0.3), metal, { position: [Math.sin(angle) * 0.15, 0.06, Math.cos(angle) * 0.15 - 0.02], rotation: [0, angle, 0] });
    const wheel = part(new THREE.SphereGeometry(0.025, 10, 8), metal, { position: [Math.sin(angle) * 0.29, 0.025, Math.cos(angle) * 0.29 - 0.02] });
    chair.add(leg, wheel);
  }
  return chair;
}

// Teclado com teclas instanciadas: cada tecla digitada acende por um instante.
function createKeyboard() {
  const keyboard = new THREE.Group();
  keyboard.position.set(-0.02, 0.7, 0.44);
  keyboard.add(part(new THREE.BoxGeometry(0.46, 0.018, 0.16), material(0x101219, { roughness: 0.5, metalness: 0.3 })));

  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(0.024, 0.012, 0.024), material(0xffffff, { roughness: 0.45 }), KEY_COLS * KEY_ROWS);
  const base = new THREE.Color(0x2a2e3a);
  const lit = new THREE.Color(TEAL);
  const glow = new Float32Array(KEY_COLS * KEY_ROWS);
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  for (let r = 0; r < KEY_ROWS; r++) {
    for (let c = 0; c < KEY_COLS; c++) {
      const i = r * KEY_COLS + c;
      matrix.setPosition(-0.2 + c * 0.0286, 0.014, -0.058 + r * 0.029);
      keys.setMatrixAt(i, matrix);
      keys.setColorAt(i, base);
    }
  }
  keys.castShadow = true;
  keyboard.add(keys);

  return {
    group: keyboard,
    flash() {
      glow[Math.floor(Math.random() * glow.length)] = 1;
    },
    update(dt) {
      let changed = false;
      for (let i = 0; i < glow.length; i++) {
        if (glow[i] <= 0) continue;
        glow[i] = Math.max(0, glow[i] - dt * 4);
        keys.setColorAt(i, color.copy(base).lerp(lit, glow[i]));
        changed = true;
      }
      if (changed) keys.instanceColor.needsUpdate = true;
    },
  };
}

function createDeskItems() {
  const items = new THREE.Group();
  const dark = material(0x111318, { roughness: 0.4, metalness: 0.4 });
  items.add(
    part(new THREE.BoxGeometry(0.065, 0.025, 0.1), dark, { position: [0.34, 0.71, 0.46] }), // mouse
    part(new THREE.BoxGeometry(0.26, 0.004, 0.22), material(0x1a1d26, { roughness: 0.9 }), { position: [0.36, 0.702, 0.46] }), // mousepad
    part(new THREE.CylinderGeometry(0.04, 0.036, 0.1, 20), material(0xf2f4f7, { roughness: 0.3 }), { position: [-0.5, 0.75, 0.6] }), // caneca
    part(new THREE.TorusGeometry(0.025, 0.007, 8, 16), material(0xf2f4f7, { roughness: 0.3 }), { position: [-0.545, 0.75, 0.6], rotation: [0, Math.PI / 2, 0] })
  );
  return items;
}

// Tela holográfica flutuante: mostra o código digitado e emite luz.
function createHoloScreen(texture) {
  const holo = new THREE.Group();
  holo.position.set(-0.78, 1.3, 0.78);
  holo.rotation.y = 0.68; // virada para quem visita, ainda à vista do personagem
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.12, 0.7),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, toneMapped: false })
  );
  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.14, 0.72)),
    new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.9, toneMapped: false })
  );
  const light = new THREE.PointLight(0x6cd9ff, 2.2, 2.4);
  light.position.set(0.15, -0.05, -0.25);
  holo.add(screen, frame, light);
  return holo;
}

function createFloor() {
  const floor = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1.7, 64), material(0x0b0e18, { roughness: 0.85 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.25, 1.265, 96),
    new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.5, toneMapped: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  floor.add(ground, ring);
  return floor;
}

export function createWorkstation(codeTexture) {
  const group = new THREE.Group();
  const keyboard = createKeyboard();
  const holo = createHoloScreen(codeTexture);
  group.add(createFloor(), createDesk(), createChair(), keyboard.group, createDeskItems(), holo);
  return { group, keyboard, holo };
}
