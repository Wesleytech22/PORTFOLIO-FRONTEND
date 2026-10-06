import * as THREE from 'three';

const COLORS = { warm: 0xff7a2f, cool: 0x6c8cff, deep: 0x1a2150, fog: 0x070912, star: 0xbfc8ff };

function createLights(scene) {
  scene.add(new THREE.AmbientLight(COLORS.cool, 0.7));
  const warm = new THREE.PointLight(COLORS.warm, 60, 40);
  warm.position.set(4, 3, 5);
  const cool = new THREE.PointLight(COLORS.cool, 50, 40);
  cool.position.set(-5, -3, 4);
  scene.add(warm, cool);
}

// Núcleo: icosaedro sólido, malha em wireframe por cima e dois anéis.
function createCore() {
  const core = new THREE.Group();
  core.add(
    new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.6, 1),
      new THREE.MeshStandardMaterial({ color: COLORS.deep, metalness: 0.7, roughness: 0.25, flatShading: true })
    ),
    new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.95, 1),
      new THREE.MeshBasicMaterial({ color: COLORS.warm, wireframe: true, transparent: true, opacity: 0.35 })
    )
  );
  const rings = [2.6, 3.3].map((radius, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.012, 8, 120),
      new THREE.MeshBasicMaterial({ color: i ? COLORS.warm : COLORS.cool, transparent: true, opacity: 0.6 })
    );
    ring.rotation.x = Math.PI / 2.4 + i * 0.6;
    core.add(ring);
    return ring;
  });
  return { core, rings };
}

function createFloaters(scene, count) {
  const geometries = [
    new THREE.OctahedronGeometry(0.35),
    new THREE.TetrahedronGeometry(0.4),
    new THREE.BoxGeometry(0.4, 0.4, 0.4),
  ];
  const materials = [COLORS.cool, COLORS.warm].map(
    (color) => new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4, flatShading: true })
  );
  return Array.from({ length: count }, (_, i) => {
    const mesh = new THREE.Mesh(geometries[i % geometries.length], materials[i % 2]);
    mesh.position.set((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 16, -Math.random() * 14 - 1);
    mesh.userData = { speed: 0.2 + Math.random() * 0.5, offset: Math.random() * Math.PI * 2 };
    scene.add(mesh);
    return mesh;
  });
}

function createStars(scene, count) {
  const positions = new Float32Array(count * 3).map(() => (Math.random() - 0.5) * 50);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.04, color: COLORS.star })));
}

// Cena 3D de fundo: reage ao ponteiro (parallax) e à rolagem da página.
export function initScene(canvas, { reduceMotion }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    canvas.remove(); // Sem WebGL: a página continua funcionando sem o fundo 3D.
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(COLORS.fog, 0.045);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  createLights(scene);
  const { core, rings } = createCore();
  scene.add(core);
  const narrowScreen = () => innerWidth < 760;
  const floaters = createFloaters(scene, narrowScreen() ? 18 : 36);
  createStars(scene, 900);

  let coreBaseX = 3.2;
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    coreBaseX = narrowScreen() ? 0 : 3.2;
    core.scale.setScalar(narrowScreen() ? 0.6 : 1);
  }
  addEventListener('resize', resize);
  resize();

  const pointer = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth - 0.5) * 2;
    pointer.y = (e.clientY / innerHeight - 0.5) * 2;
  });

  let scroll = 0;
  const clock = new THREE.Clock();

  renderer.setAnimationLoop(() => {
    if (document.hidden) return;
    const t = reduceMotion ? 0 : clock.getElapsedTime();
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    scroll += ((maxScroll > 0 ? scrollY / maxScroll : 0) - scroll) * 0.06;

    core.rotation.y = t * 0.25 + scroll * 8;
    core.rotation.x = t * 0.12 + pointer.y * 0.3;
    core.position.x = coreBaseX - scroll * coreBaseX * 1.6;
    core.position.y = Math.sin(t * 0.8) * 0.2 - scroll * 1.5;
    rings.forEach((ring, i) => (ring.rotation.z = t * (0.3 + i * 0.2)));

    if (!reduceMotion) {
      for (const mesh of floaters) {
        mesh.rotation.x += 0.012 * mesh.userData.speed;
        mesh.rotation.y += 0.016 * mesh.userData.speed;
        mesh.position.y += Math.sin(t * mesh.userData.speed + mesh.userData.offset) * 0.0025;
      }
    }

    camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.04;
    camera.position.y += (-pointer.y * 0.5 - scroll * 3 - camera.position.y) * 0.04;
    camera.position.z = 9 - scroll * 2;
    camera.lookAt(0, -scroll * 2, 0);

    renderer.render(scene, camera);
  });
}
