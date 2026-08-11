import { EPSILON } from './constants';
import type { Vector3 } from './types';

export const dot = (a: Vector3, b: Vector3): number => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const cross = (a: Vector3, b: Vector3): Vector3 => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm = (v: Vector3): number => Math.hypot(...v);
export function normalize(v: Vector3): Vector3 { const n=norm(v); if(n<EPSILON) throw new Error('Cannot normalize a near-zero vector.'); return [v[0]/n,v[1]/n,v[2]/n]; }
export const subtract = (a: Vector3,b: Vector3): Vector3 => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const scale = (v: Vector3,s:number): Vector3 => [v[0]*s,v[1]*s,v[2]*s];
