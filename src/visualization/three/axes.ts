import * as THREE from 'three';
export function createAxes(length=2.2):THREE.Group { const group=new THREE.Group(); const colors=[0xc84242,0x398d63,0x3f6fb6]; const dirs=[new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)]; dirs.forEach((dir,i)=>group.add(new THREE.ArrowHelper(dir,new THREE.Vector3(),length,colors[i],.18,.09)));return group; }
