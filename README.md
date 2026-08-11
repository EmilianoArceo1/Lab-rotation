# Interactive Mathematics & Feature Extraction Lab

An extensible static laboratory for visual explanations of mathematics, machine learning, signal processing, and feature extraction used in automatic deception detection. The first module explores head pose, Euler angles, rotation matrices, 6D rotation representations, Gram–Schmidt reconstruction, and SO(3) geodesic distance.

## Architecture

- `src/math`: pure, DOM-free and Three.js-free domain mathematics.
- `src/core`: simulation contract, centralized animation loop, cleanup, and runner.
- `src/visualization`: optional rendering adapters; Three.js is not required by the core.
- `src/ui`: reusable controls and shared visual system.
- `src/simulations`: modules grouped by modality.
- `src/app`: registry, hash routing, and application shell.

The head-pose module uses right-handed active rotations with `R = Rz(roll) Ry(yaw) Rx(pitch)`. Matrices are row-major in the domain layer; their columns are rotated local basis vectors.

### 3D model attribution

The detailed head is **Infinite, 3D Head Scan** by Lee Perry-Smith, licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), sourced from the official Three.js example assets. The original license is included at `public/models/lee-perry-smith/LICENSE.txt`. A procedural primitive head remains as the loading/error fallback.

## Run, test, and build

```bash
npm install
npm run dev
npm test
npm run build
```

Open `/#/visual/head-pose`.

### Notion embed

Use the compact embed URL `https://emilianoarceo1.github.io/Lab-rotation/?embed=1#/visual/head-pose` in a Notion `/embed` block. This mode removes site chrome and long-form explanations, keeps the visualization dominant, and places controls and live mathematics in a responsive sidebar.

## Adding a simulation

1. Create a directory under `src/simulations/<modality>`.
2. Implement `SimulationModule` with metadata, `mount`, and `destroy`.
3. Put domain mathematics in `src/math` and test it independently.
4. Add a renderer locally or reuse a focused visualization utility.
5. Compose controls from `src/ui/controls`.
6. Register one module instance in `src/main.ts`.
7. Add tests and verify navigation and cleanup.

## GitHub Pages

Vite uses relative `base: './'`, so no repository name is hard-coded. Hash routes work on static hosting and in embeds: `https://<owner>.github.io/<repo>/#/visual/head-pose`. In repository settings, select **GitHub Actions** as the Pages source. Pushes to `main` test, build, and deploy through `.github/workflows/deploy.yml`.
