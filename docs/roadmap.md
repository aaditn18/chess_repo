# Roadmap

## M1: Scaffold (Done)
- Root tooling + workspace manifests
- Web/API app shells
- Rust core + WASM bridge stubs
- Contracts, registry, variants, bot SDK placeholders
- CI skeleton

## M2: Engine Fundamentals (Done)
- Board model completeness
- Legal move generation including castling and en-passant
- Check/checkmate/stalemate correctness tests

## M3: Offline Local 1v1 UX (Done)
- Select/move interactions and illegal-move feedback
- Move history, last-move highlighting, and turn/status metadata
- Runtime WASM loading path wired in `@chess/engine-wasm` with fallback when wasm artifact is unavailable
- Real wasm artifact generation now verified via `packages/engine-wasm/pkg` and web production build consumption

## M4: Quality Hardening (Done)
- CI now enforces lint, typecheck, test, build, and Rust format/test gates.
- New web unit coverage added for engine adapter/store flow.
- Added API route integration tests without socket binding (sandbox-safe) and engine-wasm runtime verification that exercises real WASM semantics in Node.
- Enforced stricter TypeScript static checks (`noUnusedLocals` and `noUnusedParameters`) as lint policy baseline.

## M5: MVP Finalization (Done)
- MVP acceptance checklist documented in `docs/mvp-acceptance.md`
- Local setup/run/test instructions expanded in `README.md`
- Automated readiness report generated via `pnpm mvp:finalize` (`docs/reports/mvp-readiness-latest.md`)
