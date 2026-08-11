import './ui/styles/main.css';import { App } from './app/App';import { simulationRegistry } from './app/simulationRegistry';import { HeadPoseSimulation } from './simulations/visual/head-pose';
import { GazeFeatureSimulation } from './simulations/visual/gaze-features';

if (new URLSearchParams(location.search).get('embed') === '1') document.body.classList.add('embed');
simulationRegistry.register(new HeadPoseSimulation());
simulationRegistry.register(new GazeFeatureSimulation());
const root=document.querySelector<HTMLElement>('#app');if(!root)throw new Error('Application root not found');new App(root);
