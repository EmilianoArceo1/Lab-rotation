import type { AnimationLoop } from '../animation/AnimationLoop';
import type { DisposableEvents } from '../events/DisposableEvents';
export type Modality='visual'|'acoustic'|'physiological'|'textual'|'mathematics';
export interface SimulationMetadata { id:string; slug:string; title:string; modality:Modality; topic:string; description:string; }
export interface SimulationContext { viewport:HTMLElement; controls:HTMLElement; content:HTMLElement; events:DisposableEvents; animation:AnimationLoop; }
export interface SimulationModule { metadata:SimulationMetadata; mount(context:SimulationContext):void; reset?():void; destroy():void; }
