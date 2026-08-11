import * as THREE from 'three';
import { createAxes } from '../../../visualization/three/axes';
import { ThreeScene } from '../../../visualization/three/ThreeScene';

interface EyeVisual {
  readonly center: THREE.Vector3;
  readonly iris: THREE.Mesh;
  readonly pupil: THREE.Mesh;
  readonly gaze: THREE.ArrowHelper;
  readonly components: readonly [THREE.ArrowHelper, THREE.ArrowHelper, THREE.ArrowHelper];
}

/** Mathematical gaze view: two eyes, their unit vectors, and XYZ decomposition. */
export class GazeRenderer {
  private readonly stage: ThreeScene;
  private readonly left: EyeVisual;
  private readonly right: EyeVisual;

  constructor(host: HTMLElement) {
    this.stage = new ThreeScene(host);
    this.stage.camera.position.set(4.3, 2.7, 7.2);
    this.stage.controls.target.set(0, 0, 0.4);

    const axes = createAxes(1.15);
    axes.position.set(-2.15, -1.25, -0.25);
    this.stage.scene.add(axes);
    this.left = this.makeEye(new THREE.Vector3(-0.7, 0, 0), 0x376fae);
    this.right = this.makeEye(new THREE.Vector3(0.7, 0, 0), 0xbd4b49);
    this.setGaze([0, 0, 1], [0, 0, 1]);
  }

  private makeEye(center: THREE.Vector3, gazeColor: number): EyeVisual {
    const sclera = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 48, 32),
      new THREE.MeshStandardMaterial({ color: 0xd8d9d7, roughness: 0.48 }),
    );
    sclera.scale.set(1.12, 0.82, 1);
    sclera.position.copy(center);
    this.stage.scene.add(sclera);

    const iris = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.025, 36),
      new THREE.MeshStandardMaterial({ color: 0x657d83, roughness: 0.38 }),
    );
    const pupil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.066, 0.066, 0.03, 32),
      new THREE.MeshStandardMaterial({ color: 0x171c1f, roughness: 0.5 }),
    );
    this.stage.scene.add(iris, pupil);

    const gaze = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), center, 1.65, gazeColor, 0.2, 0.1);
    const components = [0xc84242, 0x398d63, 0x3f6fb6].map(
      (color) => new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), center, 0.01, color, 0.11, 0.055),
    ) as [THREE.ArrowHelper, THREE.ArrowHelper, THREE.ArrowHelper];
    this.stage.scene.add(gaze, ...components);
    return { center, iris, pupil, gaze, components };
  }

  private updateEye(eye: EyeVisual, tuple: THREE.Vector3Tuple): void {
    const direction = new THREE.Vector3(...tuple).normalize();
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    eye.iris.position.copy(eye.center).addScaledVector(direction, 0.375);
    eye.pupil.position.copy(eye.center).addScaledVector(direction, 0.395);
    eye.iris.quaternion.copy(rotation);
    eye.pupil.quaternion.copy(rotation);

    eye.gaze.position.copy(eye.center).addScaledVector(direction, 0.43);
    eye.gaze.setDirection(direction);
    eye.gaze.setLength(1.55, 0.2, 0.1);

    const scale = 1.18;
    const deltas = [
      new THREE.Vector3(direction.x * scale, 0, 0),
      new THREE.Vector3(0, direction.y * scale, 0),
      new THREE.Vector3(0, 0, direction.z * scale),
    ];
    const origins = [
      eye.center.clone(),
      eye.center.clone().add(deltas[0]),
      eye.center.clone().add(deltas[0]).add(deltas[1]),
    ];
    deltas.forEach((delta, index) => {
      const arrow = eye.components[index];
      const length = delta.length();
      arrow.visible = length > 0.008;
      arrow.position.copy(origins[index]);
      if (arrow.visible) {
        arrow.setDirection(delta.clone().normalize());
        arrow.setLength(length, Math.min(0.11, length * 0.3), 0.055);
      }
    });
  }

  setGaze(left: THREE.Vector3Tuple, right: THREE.Vector3Tuple): void {
    this.updateEye(this.left, left);
    this.updateEye(this.right, right);
  }

  render(): void { this.stage.render(); }
  destroy(): void { this.stage.destroy(); }
}
