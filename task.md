# Current Task

## Goal
Astronomical precision hardening and Quantum Time (NT) migration to WASM for reuse across events.

## Subtasks
- [x] Add reusable UTC↔TT timescales module with leap seconds (TAI−UTC + 32.184s) and optional override setters
- [x] Improve winter solstice timing: use λ_app (FK5 + aberration + nutation) and Newton solver for λ=270° (TT), convert to UTC
- [x] Expand coarse path elimination; replace day-scan/ternary with Newton (≈20× faster)
- [x] Expose `get_quantum_time_components(epoch_ms, tz_offset_min)` from WASM; remove JS NT logic; update UI to minute cadence
- [x] Reuse sublunar computation once per frame for moon direction and marker
- [x] Fix GUI clipping of NT/current time labels (increase height, vertical centering)
- [ ] Add symmetric helpers: `next_summer_solstice_from`, `next_vernal_equinox_from`, `next_autumnal_equinox_from`
- [ ] Unit tests: compare event times 2023–2027 to reference (tolerance ≤ 10 s)

## Done Criteria
- Winter solstice time within seconds vs reference sources (typ. 2–10 s)
- Timescales utilities used by all event timing functions
- NT label sourced from WASM and updates once per minute without per-frame cost
- Scene uses one sublunar computation per frame

---

## Parallel Goal (Quality): Ban unwrap_* variants repo-wide and wire CI to fail on detection

## Subtasks
- [ ] Update `scripts/anti-patterns.sh` to detect: `unwrap_\w+`, `unwrap_err`, `unwrap_unchecked`, `unwrap_u8`, and custom helpers like `*_unwrap*`
- [ ] Add `.githooks/pre-commit` hook that runs `make anti-patterns` and blocks on violations
- [ ] Ensure GitHub Actions job runs anti-pattern scan on every PR (Quality Guardian workflow)
- [ ] Run repository-wide scan and fix any findings (prod code only; tests may use `.expect()` with messages)
- [ ] Document rules in `QUALITY.md` and link from `README.md`

## Done Criteria
- CI fails on `unwrap_u8`/`unwrap_unchecked`/`unwrap_err` (and any `unwrap_*`) usages
- Repository scan is clean (no production usages); tests follow CLAUDE.md allowances
