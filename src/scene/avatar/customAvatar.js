import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Carrega um avatar realista em .glb (gerado a partir de uma foto) no lugar
// do personagem modelado em código. Se o arquivo trouxer animação (ex.: a
// "Typing" do Mixamo), ela toca em loop. O modelo é normalizado para ~1,75 m
// em pé, centralizado na cadeira e virado para a mesa (+z).
export async function loadCustomAvatar(url) {
  const gltf = await new GLTFLoader().loadAsync(url);
  const model = gltf.scene;
  model.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  const box = new THREE.Box3().setFromObject(model);
  const height = box.getSize(new THREE.Vector3()).y || 1;
  model.scale.setScalar(1.75 / height);
  box.setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -box.min.y, -center.z);

  const wrapper = new THREE.Group();
  wrapper.add(model);

  const mixer = gltf.animations.length ? new THREE.AnimationMixer(model) : null;
  mixer?.clipAction(gltf.animations[0]).play();

  return {
    group: wrapper,
    update(t, dt) {
      mixer?.update(dt);
    },
  };
}
