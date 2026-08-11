import * as THREE from 'three';
import { createAxes } from '../../../visualization/three/axes';
import { disposeObject } from '../../../visualization/three/disposal';
import { loadNeutralHead } from '../../../visualization/three/loadNeutralHead';
import { ThreeScene } from '../../../visualization/three/ThreeScene';

export class GazeRenderer {
  private readonly stage: ThreeScene;
  private readonly leftArrow: THREE.ArrowHelper;
  private readonly rightArrow: THREE.ArrowHelper;
  private destroyed = false;

  constructor(host: HTMLElement) {
    this.stage = new ThreeScene(host);
    this.stage.camera.position.set(4.2, 2.4, 6.8);
    this.stage.scene.add(createAxes(2.5));
    const leftOrigin = new THREE.Vector3(-0.25, 0.35, 0.92);
    const rightOrigin = new THREE.Vector3(0.25, 0.35, 0.92);
    this.leftArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), leftOrigin, 2, 0x3f6fb6, 0.18, 0.09);
    this.rightArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), rightOrigin, 2, 0xc84242, 0.18, 0.09);
    this.stage.scene.add(this.leftArrow, this.rightArrow);
    void this.addHead();
  }

  private async addHead(): Promise<void> {
    const loaded = await loadNeutralHead();
    if (this.destroyed) { disposeObject(loaded.scene); return; }
    const size = loaded.bounds.getSize(new THREE.Vector3());
    loaded.scene.scale.setScalar(2.65 / size.y);
    const center = new THREE.Box3().setFromObject(loaded.scene).getCenter(new THREE.Vector3());
    loaded.scene.position.sub(center);
    loaded.scene.position.y = 0.1;
    this.stage.scene.add(loaded.scene);
  }

  setGaze(left: THREE.Vector3Tuple, right: THREE.Vector3Tuple): void {
    this.leftArrow.setDirection(new THREE.Vector3(...left).normalize());
    this.rightArrow.setDirection(new THREE.Vector3(...right).normalize());
  }

  render(): void { this.stage.render(); }
  destroy(): void { this.destroyed = true; this.stage.destroy(); }
}
