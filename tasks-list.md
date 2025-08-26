# Tasks List (high-level)

- [ ] Strengthen anti-pattern scanning and CI gating
  - Extend scripts/anti-patterns.sh
  - Ensure GitHub Actions runs it on PRs
- [ ] Workspace hygiene & research-before-code automation
  - Template PR Research Summary checklist
  - Enforce --locked builds
- [ ] Observability updates
  - tracing spans normalized; x-request-id propagation
- [ ] Security hardening
  - secrets scanning in CI; forbid hardcoded tokens
- [ ] Performance
  - WASM-JS zero-copy audit; render loop allocations elimination
  - [x] Solstice timing precision: FK5 + aberration + nutation + Newton solver; UTC↔TT reuse module
  - [x] NT (Quantum Time) moved to WASM with reusable components; minute cadence update
  - [ ] Add seasonal events (summer solstice, equinoxes) using shared λ_app solver
  - [ ] Provide UTC formatting helpers and test harness for events (tolerance ≤ 10 s)
  - [ ] Expand `compute_state(jd)` to include lunar RA/Dec, AST, and sublunar lon/lat (rad) + optional Earth-local unit vector Earth→Moon; remove TS trigonometry; keep single call per frame; enable visual tidal lock helper

- [ ] Astronomical/Spiritual Events
  - [ ] Orion–SÜN alignment (Tatev): implement `next_orion_alignment_from(jd_utc_start, lat_rad, lon_east_rad)` in WASM; define belt PA/azimuth target, use RA/Dec of Alnitak/Alnilam/Mintaka with proper motion; solve time via Newton. Cache in frontend; update GUI once per minute
  - [ ] NT integration: сделать старт квантового года = событие синхронизации Ориона с СЮН; рефактор NT так, чтобы базовая эпоха приходила от провайдера событий (fallback — текущая constNT)
