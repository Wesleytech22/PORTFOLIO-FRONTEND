import * as THREE from 'three';

const COLORS = { warm: 0xff7a2f, cool: 0x6c8cff, teal: 0x19e3d0, fog: 0x070912, star: 0xbfc8ff };

function createLights(scene) {
  scene.add(new THREE.AmbientLight(COLORS.cool, 0.7));
  const warm = new THREE.PointLight(COLORS.warm, 60, 40);
  warm.position.set(4, 3, 5);
  const teal = new THREE.PointLight(COLORS.teal, 50, 40);
  teal.position.set(-5, -3, 4);
  scene.add(warm, teal);
}

function createFloaters(scene, count) {
  const geometries = [
    new THREE.OctahedronGeometry(0.35),
    new THREE.TetrahedronGeometry(0.4),
    new THREE.BoxGeometry(0.4, 0.4, 0.4),
  ];
  const materials = [COLORS.cool, COLORS.teal, COLORS.warm].map(
    (color) => new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4, flatShading: true })
  );
  return Array.from({ length: count }, (_, i) => {
    const mesh = new THREE.Mesh(geometries[i % geometries.length], materials[i % materials.length]);
    mesh.position.set((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 16, -Math.random() * 14 - 3);
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

// Fundo 3D da página inteira: estrelas e formas flutuantes que reagem ao
// ponteiro (parallax) e à rolagem. O destaque do topo é o avatar (./avatar).
export function initScene(canvas, { reduceMotion }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    canvas.remove(); // Sem WebGL: a página continua funcionando sem o fundo 3D.
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(COLORS.fog, 0.045);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  createLights(scene);
  const floaters = createFloaters(scene, innerWidth < 760 ? 18 : 36);
  createStars(scene, 900);

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
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
