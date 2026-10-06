import * as THREE from 'three';
import { material, part, group, damp } from './parts.js';

// Personagem sentado, modelado a partir da foto: pele morena clara, cabelo
// curto escuro, boné, cavanhaque, óculos, polo branca, calça preta, tênis
// preto de sola branca e relógio no pulso esquerdo. Fica de frente para +z.
const PALETTE = {
  skin: 0xc68d66,
  hair: 0x141011,
  shirt: 0xf2f4f7,
  pants: 0x16171c,
  shoe: 0x0f0f12,
  sole: 0xf5f5f5,
  frame: 0x2a2a2e,
  lip: 0x8e4f40,
  logo: 0x1f6f63,
  cap: 0x121418,
  capAccent: 0x19e3d0,
  watch: 0x1b1d22,
  watchFace: 0x9fb3c8,
};

function createMaterials() {
  return {
    skin: material(PALETTE.skin, { roughness: 0.55 }),
    hair: material(PALETTE.hair, { roughness: 0.95 }),
    shirt: material(PALETTE.shirt, { roughness: 0.85 }),
    pants: material(PALETTE.pants, { roughness: 0.85 }),
    shoe: material(PALETTE.shoe, { roughness: 0.7 }),
    sole: material(PALETTE.sole, { roughness: 0.5 }),
    frame: material(PALETTE.frame, { metalness: 0.6, roughness: 0.3 }),
    lens: new THREE.MeshStandardMaterial({ color: 0xaadfff, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2 }),
    eye: material(0xffffff, { roughness: 0.3 }),
    pupil: material(0x0b0b0d, { roughness: 0.2 }),
    lip: material(PALETTE.lip),
    logo: material(PALETTE.logo),
    cap: material(PALETTE.cap, { roughness: 0.85 }),
    capAccent: material(PALETTE.capAccent, { emissive: PALETTE.capAccent, emissiveIntensity: 0.35, roughness: 0.5 }),
    watch: material(PALETTE.watch, { metalness: 0.5, roughness: 0.35 }),
    watchFace: material(PALETTE.watchFace, { metalness: 0.9, roughness: 0.2 }),
  };
}

// Pernas articuladas (quadril → joelho), para sentar, ficar de pé e andar.
// Coxa e canela medem 0,42 m: sentado, o quadril fica a 0,53 m do chão;
// de pé, a 0,95 m.
function createLegs(M) {
  const legs = [-1, 1].map((side) => {
    const hip = group([side * 0.105, 0.53, -0.02]);
    hip.add(part(new THREE.CapsuleGeometry(0.075, 0.28, 6, 12), M.pants, { position: [0, -0.21, 0] }));
    const knee = group([0, -0.42, 0]);
    knee.add(
      part(new THREE.CapsuleGeometry(0.062, 0.3, 6, 12), M.pants, { position: [0, -0.2, 0] }),
      part(new THREE.BoxGeometry(0.11, 0.08, 0.26), M.shoe, { position: [0, -0.46, 0.05] }),
      part(new THREE.BoxGeometry(0.116, 0.026, 0.27), M.sole, { position: [0, -0.508, 0.05] }),
      part(new THREE.BoxGeometry(0.118, 0.012, 0.13), M.sole, { position: [0, -0.45, 0.03] }) // faixa lateral do tênis
    );
    hip.add(knee);
    return { hip, knee, side };
  });
  const pelvis = part(new THREE.BoxGeometry(0.34, 0.14, 0.26), M.pants, { position: [0, 0.53, -0.02] });
  return { legs, pelvis };
}

// Ângulos-alvo de cada pose. As articulações se aproximam suavemente deles,
// então trocar de pose (sentar → levantar → andar) vira uma transição.
const STAND_HEIGHT = 0.42;
function poseTargets(mode, t, side) {
  const right = side > 0;
  if (mode === 'sit') {
    return { bodyY: 0, lean: 0.1, hip: -Math.PI / 2, knee: Math.PI / 2, shoulderX: -0.45, shoulderZ: -side * 0.15, elbowX: -1.15, wristX: 0.3, finger: 0.25 };
  }
  const stand = { bodyY: STAND_HEIGHT, lean: 0.02, hip: 0, knee: 0.04, shoulderX: 0.06, shoulderZ: side * 0.1, elbowX: -0.22, wristX: 0.05, finger: 0.45 };
  if (mode === 'walk') {
    const phase = t * 6.2 + (right ? 0 : Math.PI);
    return {
      ...stand,
      bodyY: STAND_HEIGHT + Math.abs(Math.sin(t * 6.2)) * 0.025,
      lean: 0.06,
      hip: Math.sin(phase) * 0.48,
      knee: 0.1 + Math.max(0, Math.sin(phase + Math.PI / 2)) * 0.65,
      shoulderX: -Math.sin(phase) * 0.42,
      elbowX: -0.35,
    };
  }
  if (mode === 'wave' && right) {
    return { ...stand, shoulderX: -0.15, shoulderZ: 2.55, elbowX: -0.35 + Math.sin(t * 9) * 0.38, wristX: 0 };
  }
  if (mode === 'talk' && right) {
    return { ...stand, shoulderX: -0.55 + Math.sin(t * 2.3) * 0.12, shoulderZ: 0.25, elbowX: -1.05 + Math.sin(t * 3.1) * 0.18, wristX: 0.25 };
  }
  return { ...stand, shoulderX: stand.shoulderX + Math.sin(t * 1.4 + side) * 0.03 };
}

// Boné preto com aba para a frente, botão no topo e bordado verde-água.
function createCap(M) {
  const cap = group([0, 0.135, -0.004], [-0.18, 0, 0]);
  cap.add(
    part(new THREE.SphereGeometry(0.132, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.cap, { scale: [0.97, 0.78, 1.04] }), // copa
    part(new THREE.CylinderGeometry(0.135, 0.135, 0.01, 32), M.cap, { position: [0, 0.002, 0], scale: [0.97, 1, 1.04] }), // faixa da base
    part(new THREE.CylinderGeometry(0.105, 0.105, 0.008, 32), M.cap, { position: [0, 0.012, 0.125], rotation: [0.32, 0, 0], scale: [1, 1, 0.72] }), // aba
    part(new THREE.SphereGeometry(0.011, 12, 8), M.capAccent, { position: [0, 0.103, 0] }), // botão
    part(new THREE.BoxGeometry(0.05, 0.02, 0.004), M.capAccent, { position: [0, 0.058, 0.118], rotation: [-0.62, 0, 0] }) // bordado
  );
  return cap;
}

function createHead(M) {
  const head = group([0, 0.66, 0]);
  const add = (...meshes) => head.add(...meshes);

  add(part(new THREE.CylinderGeometry(0.05, 0.055, 0.14, 16), M.skin, { position: [0, -0.03, 0] })); // pescoço
  add(part(new THREE.SphereGeometry(0.115, 32, 24), M.skin, { position: [0, 0.1, 0], scale: [0.92, 1.08, 1] }));

  // Cabelo curto: calota que aparece nas laterais e na nuca, por baixo do boné.
  add(
    part(new THREE.SphereGeometry(0.123, 32, 16, 0, Math.PI * 2, 0, 1.2), M.hair, {
      position: [0, 0.108, -0.006],
      rotation: [-0.3, 0, 0],
      scale: [0.95, 1.0, 1.03],
    })
  );
  // Faixa de cabelo baixo que sai por baixo do boné, das orelhas até a nuca.
  add(
    part(new THREE.SphereGeometry(0.12, 32, 12, Math.PI, Math.PI, 0.95, 0.8), M.hair, {
      position: [0, 0.1, -0.004],
      scale: [0.95, 1.06, 1.03],
    })
  );
  for (const side of [-1, 1]) {
    add(part(new THREE.SphereGeometry(0.022, 12, 10), M.hair, { position: [side * 0.102, 0.124, 0.026], scale: [0.3, 1.1, 0.5] })); // costeleta
  }
  head.add(createCap(M));

  for (const side of [-1, 1]) {
    add(part(new THREE.SphereGeometry(0.025, 12, 12), M.skin, { position: [side * 0.106, 0.09, -0.005], scale: [0.5, 1, 0.8] })); // orelha
    add(part(new THREE.BoxGeometry(0.036, 0.008, 0.012), M.hair, { position: [side * 0.041, 0.145, 0.104], rotation: [0, 0, side * -0.12] })); // sobrancelha
  }

  const eyes = [-1, 1].map((side) => {
    const eye = group([side * 0.04, 0.116, 0.098]);
    eye.add(part(new THREE.SphereGeometry(0.016, 16, 12), M.eye));
    eye.add(part(new THREE.SphereGeometry(0.009, 12, 10), M.pupil, { position: [0, 0, 0.011] }));
    head.add(eye);
    return eye;
  });

  const mouth = part(new THREE.TorusGeometry(0.028, 0.0055, 8, 20, Math.PI), M.lip, { position: [0, 0.052, 0.103], rotation: [0.15, 0, Math.PI] }); // sorriso
  add(
    part(new THREE.SphereGeometry(0.021, 16, 12), M.skin, { position: [0, 0.085, 0.114], scale: [1.05, 0.9, 1] }), // nariz
    mouth,
    part(new THREE.BoxGeometry(0.052, 0.009, 0.012), M.hair, { position: [0, 0.066, 0.108] }), // bigode
    part(new THREE.SphereGeometry(0.03, 16, 12), M.hair, { position: [0, 0.006, 0.078], scale: [1, 0.75, 0.6] }) // cavanhaque
  );

  // Óculos de aro fino.
  for (const side of [-1, 1]) {
    add(
      part(new THREE.TorusGeometry(0.03, 0.0035, 8, 28), M.frame, { position: [side * 0.042, 0.116, 0.123] }),
      part(new THREE.CircleGeometry(0.03, 24), M.lens, { position: [side * 0.042, 0.116, 0.122] }),
      part(new THREE.BoxGeometry(0.004, 0.004, 0.12), M.frame, { position: [side * 0.076, 0.12, 0.066], rotation: [0, side * 0.14, 0] })
    );
  }
  add(part(new THREE.BoxGeometry(0.024, 0.004, 0.004), M.frame, { position: [0, 0.121, 0.124] }));

  return { head, eyes, mouth };
}

// Braço: ombro → cotovelo → pulso → dedos, cada articulação um Group.
function createArm(M, side) {
  const shoulder = group([side * 0.2, 0.44, 0], [-0.45, 0, -side * 0.15]);
  shoulder.add(
    part(new THREE.CylinderGeometry(0.06, 0.056, 0.14, 16), M.shirt, { position: [0, -0.05, 0] }), // manga
    part(new THREE.CapsuleGeometry(0.045, 0.18, 6, 12), M.skin, { position: [0, -0.15, 0] })
  );

  const elbow = group([0, -0.27, 0], [-1.15, 0, 0]);
  elbow.add(part(new THREE.CapsuleGeometry(0.04, 0.2, 6, 12), M.skin, { position: [0, -0.13, 0] }));
  shoulder.add(elbow);

  if (side === -1) {
    // Relógio no pulso esquerdo (o mostrador fica para cima).
    elbow.add(
      part(new THREE.CylinderGeometry(0.046, 0.046, 0.03, 20), M.watch, { position: [0, -0.22, 0] }),
      part(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 20), M.watchFace, { position: [0, -0.22, 0.047], rotation: [Math.PI / 2, 0, 0] })
    );
  }

  const wrist = group([0, -0.26, 0], [0.3, 0, 0]);
  wrist.add(part(new THREE.BoxGeometry(0.075, 0.09, 0.03), M.skin, { position: [0, -0.045, 0] }));
  elbow.add(wrist);

  const fingers = [-0.027, -0.009, 0.009, 0.027].map((x, i) => {
    const finger = group([x, -0.09, 0]);
    finger.add(part(new THREE.CapsuleGeometry(0.0085, 0.035, 4, 8), M.skin, { position: [0, -0.024, 0] }));
    finger.userData.phase = i * 1.7 + (side > 0 ? 0.9 : 0);
    wrist.add(finger);
    return finger;
  });
  wrist.add(part(new THREE.CapsuleGeometry(0.01, 0.03, 4, 8), M.skin, { position: [-side * 0.045, -0.06, 0.012], rotation: [0, 0, side * 0.6] })); // polegar

  return { shoulder, elbow, wrist, fingers, side };
}

// Aproxima a articulação do ângulo-alvo e soma um movimento extra (digitação)
// sem acumular: a base suavizada fica guardada à parte em userData.
function joint(obj, axis, target, lambda, dt, extra = 0) {
  const key = `base_${axis}`;
  obj.userData[key] = damp(obj.userData[key] ?? obj.rotation[axis], target, lambda, dt);
  obj.rotation[axis] = obj.userData[key] + extra;
}

// update(t, dt, estado) aceita:
//   mode: 'sit' (digitando, padrão) | 'stand' | 'walk' | 'talk' | 'wave'
//   typing, lookAtViewer: usados no modo sentado
//   talking: mexe a boca; headYaw: para onde a cabeça vira de pé
export function createCharacter() {
  const M = createMaterials();
  const root = new THREE.Group();
  const body = new THREE.Group(); // sobe 0,42 m quando ele se levanta
  root.add(body);
  const { legs, pelvis } = createLegs(M);
  body.add(pelvis, ...legs.map((leg) => leg.hip));
  legs.forEach((leg) => {
    leg.hip.rotation.x = -Math.PI / 2; // começa sentado
    leg.knee.rotation.x = Math.PI / 2;
  });

  const torso = group([0, 0.58, -0.04], [0.1, 0, 0]);
  body.add(torso);
  const chest = part(new THREE.CapsuleGeometry(0.17, 0.26, 8, 20), M.shirt, { position: [0, 0.26, 0], scale: [1.12, 1, 0.78] });
  torso.add(
    chest,
    part(new THREE.TorusGeometry(0.066, 0.02, 8, 24), M.shirt, { position: [0, 0.545, 0.01], rotation: [Math.PI / 2 - 0.2, 0, 0] }), // gola
    part(new THREE.BoxGeometry(0.03, 0.1, 0.006), M.shirt, { position: [0, 0.47, 0.132] }), // carcela
    part(new THREE.BoxGeometry(0.05, 0.022, 0.006), M.logo, { position: [0.085, 0.42, 0.128] }) // bordado no peito
  );

  const { head, eyes, mouth } = createHead(M);
  torso.add(head);
  const arms = [createArm(M, -1), createArm(M, 1)];
  arms.forEach((arm) => torso.add(arm.shoulder));

  // Estado da animação
  let typingAmount = 0;
  let lookAmount = 0;
  let glance = 0;
  let nextGlanceAt = 3;
  let nextBlinkAt = 2;

  function updateHeadSeated(t, dt) {
    // De vez em quando olha para o teclado.
    if (t > nextGlanceAt) {
      glance = glance ? 0 : 1;
      nextGlanceAt = t + (glance ? 0.9 : 3 + Math.random() * 4);
    }
    // Olha para a tela à esquerda; com o mouse em cima, olha para quem visita.
    const pitchScreen = glance ? 0.32 : 0.02;
    head.rotation.y = damp(head.rotation.y, THREE.MathUtils.lerp(-0.42, 0.32, lookAmount), 6, dt);
    head.rotation.x = damp(head.rotation.x, THREE.MathUtils.lerp(pitchScreen, -0.05, lookAmount), 6, dt) + Math.sin(t * 9) * 0.004 * typingAmount;
  }

  function update(t, dt, { mode = 'sit', typing = false, lookAtViewer = false, talking = false, headYaw = 0 } = {}) {
    const seated = mode === 'sit';
    typingAmount = damp(typingAmount, seated && typing ? 1 : 0, 8, dt);
    lookAmount = damp(lookAmount, lookAtViewer ? 1 : 0, 5, dt);
    const speed = mode === 'walk' ? 14 : 7; // na caminhada as pernas acompanham o passo sem atraso

    // Corpo e pernas
    const base = poseTargets(mode, t, 1);
    body.position.y = damp(body.position.y, base.bodyY, speed, dt);
    torso.rotation.x = damp(torso.rotation.x, base.lean, 6, dt);
    for (const leg of legs) {
      const pose = poseTargets(mode, t, leg.side);
      leg.hip.rotation.x = damp(leg.hip.rotation.x, pose.hip, speed, dt);
      leg.knee.rotation.x = damp(leg.knee.rotation.x, pose.knee, speed, dt);
    }

    // Respiração
    chest.scale.y = 1 + Math.sin(t * 1.6) * 0.012;

    // Cabeça
    if (seated) {
      updateHeadSeated(t, dt);
    } else {
      head.rotation.y = damp(head.rotation.y, headYaw, 5, dt);
      head.rotation.x = damp(head.rotation.x, talking ? Math.sin(t * 4.2) * 0.05 : -0.03, 6, dt);
    }
    head.rotation.z = Math.sin(t * 0.7) * 0.02;

    // Boca: abre e fecha enquanto fala.
    mouth.scale.y = talking ? 1 + Math.abs(Math.sin(t * 13)) * 1.6 : damp(mouth.scale.y, 1, 10, dt);

    // Piscar
    if (t > nextBlinkAt) nextBlinkAt = t + 2.5 + Math.random() * 3;
    const blink = nextBlinkAt - t > 2.38 ? 0.1 : 1;
    eyes.forEach((eye) => (eye.scale.y = blink));

    // Braços: pose do modo + digitação (dedos em ritmos diferentes).
    for (const arm of arms) {
      const s = arm.side;
      const pose = poseTargets(mode, t, s);
      joint(arm.shoulder, 'x', pose.shoulderX, speed, dt, Math.sin(t * 7 + s) * 0.02 * typingAmount);
      joint(arm.shoulder, 'z', pose.shoulderZ, 7, dt);
      joint(arm.elbow, 'x', pose.elbowX, speed, dt);
      joint(arm.wrist, 'x', pose.wristX, 7, dt, Math.sin(t * 13 + s * 2) * 0.06 * typingAmount);
      arm.wrist.rotation.y = Math.sin(t * 3.1 + s) * 0.12 * typingAmount;
      for (const finger of arm.fingers) {
        const tap = Math.max(0, Math.sin(t * 21 + finger.userData.phase));
        joint(finger, 'x', pose.finger, 7, dt, tap * 0.7 * typingAmount);
      }
    }
  }

  // Posição da cabeça no mundo (para o balão de fala acompanhar).
  const headWorld = new THREE.Vector3();
  const getHeadPosition = () => head.getWorldPosition(headWorld);

  return { group: root, update, getHeadPosition };
}
