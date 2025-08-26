# Current Task

## Goal
Ban unwrap_* variants repo-wide and wire CI to fail on detection.

## Subtasks
- [ ] Update scripts/anti-patterns.sh with unwrap_* patterns
- [ ] Run scan locally and fix findings (if any)
- [ ] Ensure CI includes anti-pattern scan job

## Done Criteria
- CI fails on unwrap_u8/unwrap_unchecked/unwrap_err usages
- Repository scan is clean
