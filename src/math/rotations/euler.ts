import type { Matrix3 } from '../types';
/** Intrinsic convention: R = Rz(roll) Ry(yaw) Rx(pitch), right-handed. */
export function rotationMatrixFromEuler(yaw:number,pitch:number,roll:number):Matrix3 { const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll); return [cr*cy,cr*sy*sp-sr*cp,cr*sy*cp+sr*sp,sr*cy,sr*sy*sp+cr*cp,sr*sy*cp-cr*sp,-sy,cy*sp,cy*cp]; }
