import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface LoadedHead {
  readonly scene: THREE.Group;
  readonly material: THREE.MeshPhysicalMaterial;
  readonly bounds: THREE.Box3;
}

/** Loads the bundled licensed scan and applies the lab's neutral scientific material. */
export async function loadNeutralHead(): Promise<LoadedHead> {
  const asset = await new GLTFLoader().loadAsync(
    `${import.meta.env.BASE_URL}models/lee-perry-smith/LeePerrySmith.glb`,
  );
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x9da2a6, roughness: 0.72, metalness: 0, clearcoat: 0.08, clearcoatRoughness: 0.8,
  });
  asset.scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      const oldMaterials = Array.isArray(object.material) ? object.material : [object.material];
      oldMaterials.forEach((oldMaterial) => oldMaterial.dispose());
      object.material = material;
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  asset.scene.updateMatrixWorld(true);
  return { scene: asset.scene, material, bounds: new THREE.Box3().setFromObject(asset.scene) };
}
