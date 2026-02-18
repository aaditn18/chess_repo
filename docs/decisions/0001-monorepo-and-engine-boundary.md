# ADR-0001: Monorepo And Engine Boundary

## Status
Accepted

## Context
The platform must support multiple gameplay modes and variants while shipping an offline normal chess MVP quickly.

## Decision
- Use `pnpm workspaces + Turborepo` for scalable package boundaries.
- Keep chess rules and state transitions in Rust (`chess_core`).
- Expose browser-safe engine APIs via WASM bridge crate (`chess_core_wasm`).
- Consume engine behavior in web through `packages/engine-wasm` adapter package.

## Consequences
- Cross-language integration complexity increases slightly.
- Rule correctness can evolve independently from UI concerns.
- Future online and bot integrations can reuse the same engine core.
