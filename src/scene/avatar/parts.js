import * as THREE from 'three';

export function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...options });
}

// Cria uma malha já posicionada e com sombras ligadas.
export function part(geometry, mat, { position, rotation, scale } = {}) {
  const mesh = new THREE.Mesh(geometry, mat);
  if (position) mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function group(position = [0, 0, 0], rotation = [0, 0, 0]) {
  const g = new THREE.Group();
  g.position.set(...position);
  g.rotation.set(...rotation);
  return g;
}

export const damp = (current, target, lambda, dt) => THREE.MathUtils.damp(current, target, lambda, dt);
