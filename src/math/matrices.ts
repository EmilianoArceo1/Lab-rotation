import type { Matrix3, Vector3 } from './types';
export const IDENTITY_MATRIX: Matrix3=[1,0,0,0,1,0,0,0,1];
export const transpose=(m:Matrix3):Matrix3=>[m[0],m[3],m[6],m[1],m[4],m[7],m[2],m[5],m[8]];
export const multiply=(a:Matrix3,b:Matrix3):Matrix3=>[a[0]*b[0]+a[1]*b[3]+a[2]*b[6],a[0]*b[1]+a[1]*b[4]+a[2]*b[7],a[0]*b[2]+a[1]*b[5]+a[2]*b[8],a[3]*b[0]+a[4]*b[3]+a[5]*b[6],a[3]*b[1]+a[4]*b[4]+a[5]*b[7],a[3]*b[2]+a[4]*b[5]+a[5]*b[8],a[6]*b[0]+a[7]*b[3]+a[8]*b[6],a[6]*b[1]+a[7]*b[4]+a[8]*b[7],a[6]*b[2]+a[7]*b[5]+a[8]*b[8]];
export const determinant=(m:Matrix3):number=>m[0]*(m[4]*m[8]-m[5]*m[7])-m[1]*(m[3]*m[8]-m[5]*m[6])+m[2]*(m[3]*m[7]-m[4]*m[6]);
export const column=(m:Matrix3,i:0|1|2):Vector3=>[m[i],m[i+3],m[i+6]];
export const fromColumns=(a:Vector3,b:Vector3,c:Vector3):Matrix3=>[a[0],b[0],c[0],a[1],b[1],c[1],a[2],b[2],c[2]];
