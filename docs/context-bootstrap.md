# StarsCalendars – Canonical Context Bootstrap (2025-08-08)

This document is the single source of truth for agents. It resolves previous contradictions and pins the exact runtime/scene model and rules. Treat this file as the bootstrap when joining a new chat.

## Stack (major-only)
- Frontend: TypeScript 5.9, React 19, Vite 7, Babylon.js 8 (major; latest 8.x at build time)
- WASM core: Rust 1.88, wasm-bindgen; local `astro-rust/` (READ-ONLY). Reference scene `frontend/ref/sceneComponent.jsx` — READ-ONLY (для изучения и портирования, без правок).
- Backend: Axum 0.8, Tokio 1, SQLX 0.8, Teloxide 0.13 (not required for scene)

## Scene Model (reference parity)
 - Coordinate system: Babylon default (left-handed) for rendering. Scientific data stays RH (WASM). Any axis flip (Z) is applied only at scene layer. Do not change the engine handedness.
- Heliocentric: Sun at (0,0,0). Earth uses heliocentric coordinates. Moon is geocentric relative to Earth.
- Scaling: 1 AU → 700 units (scaleAU=700). Artistic diameters: Earth=50, Moon=20, Sun=40; Atmosphere shell height (ENV_H)=2.
- Mesh segments: Earth=300, Clouds=300, Sun=15, Moon=25.
- DIAMETER semantics: configured numbers are DIAMETERS passed to Babylon mesh `diameter` (not radii). When radius is needed, use `diameter*0.5`.
- Camera: ArcRotateCamera, FOV=1.5, target Earth. minZ≈0.1, maxZ≈200000. Zoom: [earthRadius*1.1, earthRadius*50].
- Skybox: `new CubeTexture('/textures/universe/universe', scene)` bound to a box size 10000. No manual mipmap toggling.
- Sun FX: FireProceduralTexture size=128 → emissiveTexture; GodRays samples=100; tuned exposure/decay/weight/density as in ref.
- GUI: Babylon GUI only; show current time and quantum date. Stats overlay `#stats` for FPS.

## Quick Start (development)

```bash
# 1) Установка зависимостей (workspace)
cd /Volumes/WXW/R/_ai_/starscalendars pnpm -w install

# 2) Запуск фронтенда (пересобирает WASM и стартует Vite dev)
cd /Volumes/WXW/R/_ai_/starscalendars/frontend && pnpm -w run dev:frontend-only
```

Notes:
- WASM обертка использует ТОЛЬКО локальную `astro-rust/` (READ-ONLY); любые правки запрещены.
- `frontend/ref/sceneComponent.jsx` — READ-ONLY референс для паритета, без правок.
- Координаты RH из WASM; единичный RH→LH Z‑flip применяется ТОЛЬКО в слое сцены при присвоении позиций.

## WASM contract and usage
- Exactly one `compute_state(jd: f64) -> *const f64` per frame. Zero-copy Float64Array view on memory.
- Buffer layout (length = 11 f64):
  - Sun: x,y,z (geocentric)
  - Moon: x,y,z (geocentric)
  - Earth: x,y,z (heliocentric)
  - Solar zenith: [lon_east_rad, lat_rad]
- Extraction on scene:
  - Sun at (0,0,0) in scene (heliocentric visualization)
  - Earth uses Earth xyz from buffer (scale 1 AU = 700)
  - Moon position = Earth xyz + Moon geocentric offset
  - Zenith comes directly from the last 2 buffer values (radians)
- Z-convention: any required axis flips are handled once in the scene when assigning coordinates (single Z flip RH→LH). No flips in WASM bridge.

-## Zenith marker and orientation (as in reference)
- Create Earth pivot (TransformNode). Place `pivot.position` from Earth heliocentric position (scaled). Parent `earth` and `moonPivot` to `pivot`.
- Use zenith from `compute_state` buffer: `(lonE, lat)` in radians are in the last two slots.
- Apply reference rotations:
  - `pivot.rotation.z = lat`
  - `pivot.rotation.x = pivot.rotation.z`
  - `earth.rotation.y = -lonE`
- Marker position each frame in Earth-local:
  - Reference tweak: longitude used in ref was `-(zp.longitude - 7 + trueAnomalyDeg)`; replicate with true anomaly derived from Earth heliocentric vector via `atan2(y, x)`.
- Marker sphere is red, diameter=1, parent=earth.

## Textures
- Do not force `noMipmap` or `anisotropicFilteringLevel`. Use Babylon defaults.
- Earth material: custom day/night shader with `earth-diffuse.jpg` and `earth-night-o2.png` and height map `earth-height.png` applied once mesh ready.
- Clouds: custom shader, texture `earth-c.jpg`, shell diameter = Earth diameter + 2, rotation.z = π, parent=earth.

## Quantum date (reference logic)
- Constants: `constNT=1344643200000, constD=86459178.082191780821918, constDExtra=43229589.41095890410959, constY=31557600000, maxTime=4090089600000, specialDays {year:11, day:121}`.
- Build NT array once (≈30k). For display each second: use `findClosestSmaller` over adjusted UTC midnight (offset 4h per ref).

## Quality and rules
- One render loop, no extra timers. No mock data. No manual performance hacks that conflict with reference parity.
- Major-only versions in package manifests and Cargo.toml (e.g., `"@babylonjs/core": "8"`, `axum = "0.8"`).
- `astro-rust/` is read-only.
 - `frontend/ref/sceneComponent.jsx` is read-only reference; do not modify.

## What is implemented now (BabylonScene.tsx)
- Reference mesh sizes/segments set. Fire=128, GodRays=100. Skybox via base path. GUI matches ref. No manual mipmaps.
- Remaining deltas to finalize parity:
  1) Introduce `pivot`/`moonPivot` hierarchy and move Earth/ Moon placement to those nodes.
  2) Compute true anomaly from Earth vector; apply reference marker longitude tweak `- (lonE - 7 + trueAnomalyDeg)`.
  3) Ensure Moon uses local geocentric offset under `moonPivot`/`earth`.

## Agent initialization prompt (paste into new chat)
```
You are joining the StarsCalendars project. Use docs/context-bootstrap.md as the single source of truth. Implement strictly:
 - Heliocentric scene (Sun@0,0,0), DIAMETER semantics (Earth=50, Moon=20, Sun=40), ENV_H=2, segments Earth/Clouds=300, Sun=15, Moon=25.
 - One compute_state(jd) per frame; zero-copy view; Z flip applied in scene (not in bridge).
 - Zenith is included in compute_state buffer (lonE, lat in radians); build pivot hierarchy and apply rotations as specified.
- Marker longitude tweak: -(lonE_deg - 7 + trueAnomalyDeg). True anomaly from atan2(y, x) of Earth heliocentric vector.
- No manual mipmaps/anisotropy; Babylon GUI only; Canvas full-screen.
Current work: finalize pivot hierarchy, moon local offset, and marker formula. All other parity items are in place.
```


