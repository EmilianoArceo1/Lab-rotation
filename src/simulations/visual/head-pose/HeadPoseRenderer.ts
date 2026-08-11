import * as THREE from 'three';
import type { Matrix3 } from '../../../math/types';
import { createAxes } from '../../../visualization/three/axes';
import { disposeObject } from '../../../visualization/three/disposal';
import { loadNeutralHead } from '../../../visualization/three/loadNeutralHead';
import { ThreeScene } from '../../../visualization/three/ThreeScene';

/** A lightweight anatomical bust assembled entirely from Three.js primitives. */
export class HeadPoseRenderer {
  private readonly stage: ThreeScene;
  private readonly head = new THREE.Group();
  private readonly fixedNeck = new THREE.Group();
  private readonly localAxes = createAxes(2);
  private destroyed = false;

  constructor(host: HTMLElement) {
    this.stage = new ThreeScene(host);
    this.stage.scene.add(createAxes(2.8));
    this.makeHead();
    this.head.add(this.localAxes);
    this.stage.scene.add(this.head);
    this.stage.scene.add(this.fixedNeck);
    void this.loadScannedHead();

    const floor = new THREE.GridHelper(9, 9, 0xb8bec5, 0xe1e4e7);
    floor.position.y = -2.05;
    this.stage.scene.add(floor);
  }

  /** Replaces the lightweight fallback with a licensed high-detail head scan. */
  private async loadScannedHead(): Promise<void> {
    try {
      const loaded = await loadNeutralHead();
      const asset = { scene: loaded.scene };
      if (this.destroyed) {
        disposeObject(asset.scene);
        return;
      }
      asset.scene.updateMatrixWorld(true);
      const sourceBounds = loaded.bounds;
      const sourceSize = sourceBounds.getSize(new THREE.Vector3());
      const neckJointY = sourceBounds.min.y + sourceSize.y * 0.36;
      const fixedAsset = asset.scene.clone(true);
      fixedAsset.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry = object.geometry.clone();
      });
      const neutralMaterial = loaded.material;
      asset.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.material = neutralMaterial;
          this.keepTriangles(object, neckJointY, true);
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      fixedAsset.updateMatrixWorld(true);
      fixedAsset.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.material = neutralMaterial;
          this.keepTriangles(object, neckJointY, false);
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });

      const scale = 2.9 / sourceSize.y;
      asset.scene.scale.setScalar(scale);
      fixedAsset.scale.setScalar(scale);
      const center = new THREE.Box3().setFromObject(asset.scene).getCenter(new THREE.Vector3());
      asset.scene.position.set(-center.x, -neckJointY * scale, -center.z);
      fixedAsset.position.copy(asset.scene.position);
      for (const child of [...this.head.children]) {
        if (child === this.localAxes) continue;
        this.head.remove(child);
        disposeObject(child);
      }
      this.head.position.y = 0.15;
      this.head.add(asset.scene);
      this.fixedNeck.position.y = 0.15;
      this.fixedNeck.add(fixedAsset);
    } catch (error: unknown) {
      console.warn('Detailed head model could not be loaded; using fallback.', error);
    }
  }

  /** Partitions triangles at the neck joint without inventing replacement anatomy. */
  private keepTriangles(mesh: THREE.Mesh, jointWorldY: number, keepAbove: boolean): void {
    const geometry = mesh.geometry;
    const position = geometry.getAttribute('position');
    const sourceIndex = geometry.index;
    const triangleVertexCount = sourceIndex ? sourceIndex.count : position.count;
    const kept: number[] = [];
    const point = new THREE.Vector3();
    const vertexIndex = (offset: number): number => sourceIndex ? sourceIndex.getX(offset) : offset;
    const worldY = (index: number): number => {
      point.fromBufferAttribute(position, index).applyMatrix4(mesh.matrixWorld);
      return point.y;
    };
    for (let offset = 0; offset + 2 < triangleVertexCount; offset += 3) {
      const a = vertexIndex(offset);
      const b = vertexIndex(offset + 1);
      const c = vertexIndex(offset + 2);
      const centroidY = (worldY(a) + worldY(b) + worldY(c)) / 3;
      if ((centroidY >= jointWorldY) === keepAbove) kept.push(a, b, c);
    }
    geometry.setIndex(kept);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }

  private makeHead(): void {
    const skin = new THREE.MeshStandardMaterial({ color: 0x9da2a6, roughness: 0.82 });
    const highlight = new THREE.MeshStandardMaterial({ color: 0xb0b4b7, roughness: 0.78 });
    const shadow = new THREE.MeshStandardMaterial({ color: 0x747a7e, roughness: 0.88 });
    const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xd3d5d4, roughness: 0.65 });
    const iris = new THREE.MeshStandardMaterial({ color: 0x485158, roughness: 0.45 });
    const pupil = new THREE.MeshStandardMaterial({ color: 0x1f2427, roughness: 0.5 });
    const lip = new THREE.MeshStandardMaterial({ color: 0x676c6f, roughness: 0.9 });

    const ellipsoid = (
      radius: number,
      scale: THREE.Vector3Tuple,
      position: THREE.Vector3Tuple,
      material: THREE.Material = skin,
      segments = 40,
    ): THREE.Mesh => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, Math.max(20, segments / 2)), material);
      mesh.scale.set(...scale);
      mesh.position.set(...position);
      this.head.add(mesh);
      return mesh;
    };

    // The overlapping volumes create a recognizable skull, temporal region,
    // cheekbones, tapered jaw, and chin without relying on an external model.
    ellipsoid(1, [1.02, 1.3, 0.94], [0, 0.45, -0.08]);
    ellipsoid(1, [0.91, 0.94, 0.82], [0, -0.5, 0.13]);
    ellipsoid(0.56, [1.26, 0.52, 0.62], [0, -0.48, 0.56], highlight);
    ellipsoid(0.56, [0.8, 0.75, 0.67], [0, -1.03, 0.28]);
    ellipsoid(0.34, [0.92, 0.55, 0.72], [0, -1.32, 0.52], highlight);

    // Neck gives the floating head a more anatomical silhouette.
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.62, 1.05, 32), shadow);
    neck.position.set(0, -1.6, -0.18);
    this.head.add(neck);

    // Eye sockets sit behind the eyeballs and make gaze direction legible.
    for (const side of [-1, 1]) {
      ellipsoid(0.34, [1.25, 0.62, 0.28], [side * 0.39, 0.34, 0.79], shadow);
      ellipsoid(0.22, [1.25, 0.67, 0.55], [side * 0.39, 0.33, 0.965], eyeWhite, 28);
      ellipsoid(0.095, [1, 1, 0.38], [side * 0.39, 0.33, 1.085], iris, 24);
      ellipsoid(0.043, [1, 1, 0.35], [side * 0.39, 0.33, 1.12], pupil, 20);

      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.43, 5, 16), shadow);
      brow.rotation.z = Math.PI / 2 + side * 0.08;
      brow.position.set(side * 0.39, 0.64, 0.94);
      this.head.add(brow);

      // Outer ear plus recessed concha.
      const ear = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.095, 14, 30), skin);
      ear.rotation.y = Math.PI / 2;
      ear.scale.set(1, 1.25, 0.72);
      ear.position.set(side * 1.02, 0.02, -0.06);
      this.head.add(ear);
      ellipsoid(0.12, [0.35, 1.2, 0.55], [side * 1.035, 0.02, -0.045], shadow, 20);
    }

    // Nose: a bridge, tapered body, rounded tip, and alar wings.
    const bridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.52, 8, 24), highlight);
    bridge.position.set(0, 0.1, 0.98);
    bridge.rotation.x = -0.08;
    this.head.add(bridge);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.7, 32), skin);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, -0.04, 1.18);
    this.head.add(nose);
    ellipsoid(0.17, [1, 0.72, 0.9], [0, -0.2, 1.43], highlight, 28);
    ellipsoid(0.12, [0.9, 0.62, 0.7], [-0.17, -0.2, 1.31], skin, 24);
    ellipsoid(0.12, [0.9, 0.62, 0.7], [0.17, -0.2, 1.31], skin, 24);

    // Philtrum and separate lips give the lower face useful orientation cues.
    const philtrum = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.16, 4, 12), shadow);
    philtrum.position.set(0, -0.49, 0.965);
    this.head.add(philtrum);
    ellipsoid(0.24, [1.55, 0.28, 0.22], [0, -0.69, 1.02], lip, 28);
    ellipsoid(0.25, [1.42, 0.33, 0.2], [0, -0.77, 1.01], lip, 28);
    const mouthLine = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.018, 0.025), pupil);
    mouthLine.position.set(0, -0.735, 1.075);
    this.head.add(mouthLine);

    this.head.position.y = 0.28;
  }

  setRotation(m: Matrix3): void {
    const matrix = new THREE.Matrix4().set(
      m[0], m[1], m[2], 0,
      m[3], m[4], m[5], 0,
      m[6], m[7], m[8], 0,
      0, 0, 0, 1,
    );
    this.head.quaternion.setFromRotationMatrix(matrix);
  }

  setLocalAxesVisible(value: boolean): void { this.localAxes.visible = value; }
  render(): void { this.stage.render(); }
  destroy(): void { this.destroyed = true; this.stage.destroy(); }
}
