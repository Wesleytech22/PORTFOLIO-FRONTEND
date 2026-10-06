import * as THREE from 'three';
import { START_X } from './chapters.js';

const TEAL = 0x19e3d0;
const PANEL_W = 768;
const PANEL_H = 384;

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/(\s+)/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line + word;
    if (ctx.measureText(test).width > maxWidth && line.trim()) {
      lines.push(line.trim());
      line = word.trimStart();
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trim());
  // Chinês não tem espaços: quebra por caractere se ainda passar da largura.
  return lines.flatMap((l) => {
    if (ctx.measureText(l).width <= maxWidth) return [l];
    const parts = [];
    let current = '';
    for (const ch of l) {
      if (ctx.measureText(current + ch).width > maxWidth) {
        parts.push(current);
        current = ch;
      } else current += ch;
    }
    return [...parts, current];
  });
}

// Painel de marco (ano + título) desenhado num canvas.
function createPanel() {
  const canvas = document.createElement('canvas');
  canvas.width = PANEL_W;
  canvas.height = PANEL_H;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false, opacity: 0.55 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.85), material);

  function draw(year, label) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, PANEL_W, PANEL_H);
    ctx.beginPath();
    ctx.roundRect(6, 6, PANEL_W - 12, PANEL_H - 12, 28);
    ctx.fillStyle = 'rgba(8, 14, 30, 0.9)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(25, 227, 208, 0.7)';
    ctx.stroke();
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#19e3d0';
    ctx.font = '800 76px Inter, "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(year, 44, 52);
    ctx.fillStyle = '#e8ebff';
    ctx.font = '700 44px Inter, "Segoe UI", "Microsoft YaHei", sans-serif';
    wrapText(ctx, label, PANEL_W - 88).slice(0, 3).forEach((line, i) => ctx.fillText(line, 44, 160 + i * 56));
    texture.needsUpdate = true;
  }

  return { mesh, material, draw };
}

// Palco da história: piso com trilha luminosa, marcadores no chão e um
// painel flutuante para cada marco da trajetória.
export function createStage(scene, chapters) {
  scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x0d0f18, 0.6));
  const key = new THREE.DirectionalLight(0xffe2c4, 1.6);
  key.position.set(3, 4, 4);
  scene.add(key);
  const rim = new THREE.PointLight(TEAL, 6, 7);
  rim.position.set(0, 2.2, -1.4);
  scene.add(rim);

  const first = START_X - 2;
  const last = chapters.at(-1).x + 3;
  const length = last - first;
  const center = (first + last) / 2;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(length, 4), new THREE.MeshStandardMaterial({ color: 0x0b0e18, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(center, 0, 0);
  scene.add(floor);

  const grid = new THREE.GridHelper(length, Math.round(length * 2), 0x1d2a44, 0x131b2e);
  grid.scale.z = 4 / length;
  grid.position.set(center, 0.001, 0);
  scene.add(grid);

  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(length, 0.035),
    new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.55, toneMapped: false })
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(center, 0.003, 0.25);
  scene.add(path);

  const panels = chapters.map((chapter) => {
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.32, 48),
      new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.4, toneMapped: false, side: THREE.DoubleSide })
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(chapter.x, 0.004, 0);
    scene.add(marker);

    if (!chapter.milestone) return { marker };
    const panel = createPanel();
    scene.add(panel.mesh);
    return { marker, panel, x: chapter.x };
  });

  return {
    setLabels(getLabel) {
      chapters.forEach((chapter, i) => panels[i].panel?.draw(getLabel(chapter.id, 'year'), getLabel(chapter.id, 'label')));
    },
    // Destaca o marco atual e apaga um pouco os outros. Na tela larga o painel
    // fica à direita do avatar; na estreita (celular), acima da cabeça dele.
    update(activeIndex, t, dt, narrow) {
      panels.forEach(({ marker, panel, x }, i) => {
        const active = i === activeIndex;
        marker.material.opacity = THREE.MathUtils.damp(marker.material.opacity, active ? 0.95 : 0.3, 4, dt);
        marker.scale.setScalar(active ? 1 + Math.sin(t * 3) * 0.06 : 1);
        if (panel) {
          panel.material.opacity = THREE.MathUtils.damp(panel.material.opacity, active ? 1 : 0.45, 4, dt);
          const float = Math.sin(t * 1.3 + i) * 0.02;
          if (narrow) panel.mesh.position.set(x + 0.15, 2.35 + float, -1.1);
          else panel.mesh.position.set(x + 1.35, 1.7 + float, -1.1);
          panel.mesh.scale.setScalar(narrow ? 0.85 : 1);
        }
      });
    },
  };
}
