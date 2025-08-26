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
