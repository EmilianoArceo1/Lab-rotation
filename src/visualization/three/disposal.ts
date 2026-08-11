import * as THREE from 'three';
export function disposeObject(root:THREE.Object3D):void { root.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose());}}); }
