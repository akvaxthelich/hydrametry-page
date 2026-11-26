# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Install: `npm ci` (lockfile is committed; the Docker build uses `npm ci` too)
- Dev server: `npm run dev` (Vite, `host: true`, opens a browser unless `SANDBOX_URL` or `CODESANDBOX_HOST` is set)
- Production build: `npm run build` → writes `dist/`
- Container: `docker build -t hydrametry-page .` (node:22 builds `dist/`, then nginx:alpine serves it on port 80)

There is no lint, test, or typecheck script configured. Nothing to run for a single test.

## Architecture

**Multi-page Vite site, no framework.** Vite's `root` is `src/` and `publicDir` is `static/`, so a URL like `/models/fodder/fodder.fbx` in code maps to `static/models/fodder/fodder.fbx`. Build output goes to `dist/`, which is gitignored.

**Three entry pages**, each an HTML file in `src/` with its own module script, all listed explicitly under `build.rollupOptions.input` in `vite.config.js`. Adding a page means adding an HTML file there and a new input key.
- `index.html` → `index.js` (landing scene, "Double-click anywhere to enter...")
- `aboutUs.html` → `aboutUs.js`
- `spatooJr.html` → `spatooJr.js` (standalone backdrop, see below)

**Shared code is split between two layers:**
- `index.js` and `aboutUs.js` are large three.js scene scripts. They import `UTILS.js`, which handles the fade overlay (`#fade`), bottom-of-screen text (`#screenText`), and navigation. `UTILS.js` assigns `fadeAndNavigateTo` to `window`, because the HTML `onclick` handlers call it directly.
- `spatooJr.js` shares nothing with the other pages. It imports only `three` and `FBXLoader`, and it has its own renderer and loop. Don't assume helpers from `UTILS.js` exist there.

**`spatooJr.js` is a port of a Unity "BoidsInSpace" scene.** Its header comment names the Unity source files it follows. Three pieces matter:
- *Skybox:* a 4×3 cross-layout PNG (`static/textures/space/swap.png`) is sliced by `sliceCross` into six canvases in CubeTexture face order.
- *Flocking:* 60 boids use separation (INNER radius 5), cohesion, and alignment (OUTER radius 10). Boids are grouped as in Unity's `GroupedBoidManager`: each boid joins the nearest group with room, capped at `MAX_GROUP_SIZE` (6), and neighbours come only from its own group. Unity's obstacle avoidance is replaced by a soft cage around `CENTER` (`CAGE_R` 35).
- *Model:* `fodder.fbx` is loaded once, and its submeshes are drawn with one `InstancedMesh` per part. Parts are placed by `PART_X` (Body at 0, GunL/GunR at ±2.865), copying the Unity prefab offsets. The FBX node positions are pivot offsets and are ignored on purpose.

Scene units are scaled down from Unity (see `MODEL_LENGTH`), so don't copy numbers straight from the Unity project.

**Unused files.** `notes.js` and `notes2.js` are scratch experiments. No HTML page loads them. `index.js` and `aboutUs.js` contain large commented-out blocks (FBX/GLTF loading, GUI, lights) from earlier iterations.

## Deployment

The Dockerfile is the only deploy artifact. Nothing in the repo runs it. The image serves the static `dist/` output, so every page must go through `npm run build` to be deployed.

**Runtime settings.** Every tunable number for the spatooJr pages (parallax sensitivity, gyro range, flock, logo fit, camera) is in `src/config.js` with its default. In the container, set `APP_<KEY>` env vars (for example `APP_PARALLAX_X=8`); `docker/40-runtime-config.sh` writes them to `/runtime-config.js` at start, which every spatooJr page loads before its module. Changing them needs a container restart, not a rebuild. Outside the container, `static/runtime-config.js` is an empty placeholder and the defaults apply.
