import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createAxes } from '../../../visualization/three/axes';
import { ThreeScene } from '../../../visualization/three/ThreeScene';

interface EyeVisual {
  readonly center: THREE.Vector3;
  readonly model: THREE.Group;
  readonly gaze: THREE.ArrowHelper;
  readonly components: readonly [THREE.ArrowHelper, THREE.ArrowHelper, THREE.ArrowHelper];
}

/** Mathematical gaze view: two eyes, their unit vectors, and XYZ decomposition. */
export class GazeRenderer {
  private readonly stage: ThreeScene;
  private readonly left: EyeVisual;
  private readonly right: EyeVisual;
  private destroyed = false;

  constructor(host: HTMLElement) {
    this.stage = new ThreeScene(host);
    this.stage.scene.background = new THREE.Color(0x101922);
    this.stage.camera.position.set(4.3, 2.7, 7.2);
    this.stage.controls.target.set(0, 0, 0.4);

    const axes = createAxes(1.15);
    axes.position.set(-2.15, -1.25, -0.25);
    this.stage.scene.add(axes);
    this.left = this.makeEye(new THREE.Vector3(-0.7, 0, 0), 0x376fae);
    this.right = this.makeEye(new THREE.Vector3(0.7, 0, 0), 0xbd4b49);
    void this.loadEyeModels();
    this.setGaze([0, 0, 1], [0, 0, 1]);
  }

  private makeEye(center: THREE.Vector3, gazeColor: number): EyeVisual {
    const model = new THREE.Group();
    model.position.copy(center);
    this.stage.scene.add(model);

    const gaze = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), center, 1.65, gazeColor, 0.2, 0.1);
    const components = [0xc84242, 0x398d63, 0x3f6fb6].map(
      (color) => new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), center, 0.01, color, 0.11, 0.055),
    ) as [THREE.ArrowHelper, THREE.ArrowHelper, THREE.ArrowHelper];
    this.stage.scene.add(gaze, ...components);
    return { center, model, gaze, components };
  }

  private eyeSurfaceMaterial(irisColor: THREE.ColorRepresentation): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: { irisColor: { value: new THREE.Color(irisColor) } },
      vertexShader: `varying vec3 localPosition; varying vec3 worldNormal; void main(){localPosition=position;worldNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform vec3 irisColor;varying vec3 localPosition;varying vec3 worldNormal;void main(){float r=length(localPosition.xz);float angle=atan(localPosition.z,localPosition.x);vec3 sclera=vec3(.76,.78,.77);float veins=smoothstep(.5,.95,r)*pow(max(0.,sin(angle*11.+r*34.)),16.)*.16;sclera+=vec3(.25,-.08,-.08)*veins;float fibers=.68+.22*sin(angle*42.+r*58.)+.1*sin(angle*17.-r*91.);vec3 iris=mix(irisColor*.26,irisColor*1.25,clamp(fibers,0.,1.));iris*=smoothstep(.11,.23,r);iris=mix(iris,vec3(.025,.03,.028),smoothstep(.39,.46,r));vec3 color=mix(iris,sclera,smoothstep(.43,.47,r));color=mix(vec3(.012),color,smoothstep(.105,.145,r));float light=.68+.32*max(dot(normalize(worldNormal),normalize(vec3(.4,.8,1.))),0.);gl_FragColor=vec4(color*light,1.);}`,
    });
  }

  private async loadEyeModels(): Promise<void> {
    try {
      const asset = await new GLTFLoader().loadAsync(
        `${import.meta.env.BASE_URL}models/eyeball/eyeball.glb`,
      );
      if (this.destroyed) return;
      const install = (eye: EyeVisual, irisColor: THREE.ColorRepresentation): void => {
        const model = asset.scene.clone(true);
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry = object.geometry.clone();
          if (object.name === 'eyeball') object.material = this.eyeSurfaceMaterial(irisColor);
          else if (object.name === 'cornea') object.material = new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.18,roughness:.05,transmission:.8,ior:1.38,thickness:.12,depthWrite:false});
          else object.material = new THREE.MeshStandardMaterial({color:0xc7c9c7,roughness:.56});
        });
        model.scale.setScalar(.43);
        eye.model.add(model);
      };
      install(this.left, 0x4f7f88);
      install(this.right, 0x775f3e);
    } catch (error: unknown) {
      console.warn('Licensed eye model could not be loaded.', error);
    }
  }

  private updateEye(eye: EyeVisual, tuple: THREE.Vector3Tuple): void {
    const direction = new THREE.Vector3(...tuple).normalize();
    eye.model.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);

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
  destroy(): void { this.destroyed = true; this.stage.destroy(); }
}
