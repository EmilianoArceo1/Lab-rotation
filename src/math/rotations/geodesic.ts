import { multiply, transpose } from '../matrices';
import type { Matrix3 } from '../types';
import { radiansToDegrees } from '../angles';
export function geodesicDistance(a:Matrix3,b:Matrix3):number { const r=multiply(a,transpose(b)); const cosine=Math.min(1,Math.max(-1,(r[0]+r[4]+r[8]-1)/2)); return Math.acos(cosine); }
export const geodesicDistanceDegrees=(a:Matrix3,b:Matrix3):number=>radiansToDegrees(geodesicDistance(a,b));
