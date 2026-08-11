import { dot, normalize, scale, subtract, cross } from '../vectors';
import { fromColumns } from '../matrices';
import type { Matrix3, Vector3 } from '../types';
/** Converts two predicted basis columns into the nearest right-handed orthonormal frame. */
export function gramSchmidt6D(a1:Vector3,a2:Vector3):Matrix3 { const b1=normalize(a1); const b2=normalize(subtract(a2,scale(b1,dot(b1,a2)))); return fromColumns(b1,b2,cross(b1,b2)); }
