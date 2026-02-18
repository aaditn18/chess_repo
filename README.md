# Chess Platform Monorepo

Scaffold for a chess platform with Rust engine core + WASM bridge + React/Vite frontend, designed to ship normal offline 1v1 first while reserving extension points for online modes, team formats, variants, and bot/ML play.

## Stack
- Monorepo: `pnpm workspaces` + `Turborepo`
- Frontend: React + Vite (`apps/web`)
- API placeholder: Node + TypeScript (`apps/api`)
- Engine: Rust (`crates/chess_core`)
- WASM bridge: Rust + `wasm-bindgen` (`crates/chess_core_wasm`)

## Workspace Layout
- `apps/web`: browser UI shell for normal chess
- `apps/api`: placeholder backend boundaries (`/health`, realtime/matchmaking/bots modules)
- `crates/chess_core`: engine API and core rules boundary
- `crates/chess_core_wasm`: JS/WASM adapter wrapper
- `packages/contracts`: shared TypeScript interfaces and DTOs
- `packages/mode-registry`: mode registration surface
- `packages/variant-*`: variant-specific placeholder packages
- `packages/engine-wasm`: stable import wrapper for WASM client integration

## Prerequisites
- Node.js 20+
- `pnpm` 10+
- Rust stable toolchain via `rustup`
- Wasm toolchain:
  - `rustup target add wasm32-unknown-unknown`
  - `cargo install wasm-pack`
  - `cargo install wasm-bindgen-cli --version 0.2.108`

## Local Setup
1. Install JS deps: `pnpm install`
2. Build WASM package: `pnpm --filter @chess/engine-wasm build`
3. Build all packages/apps: `pnpm build`

## Run Locally
1. Start web app: `pnpm dev:web` (or `pnpm --filter @chess/web dev`)
2. (Optional) Start API app in another terminal: `pnpm dev:api` (or `pnpm --filter @chess/api dev`)
3. Open the web URL shown by Vite (typically `http://localhost:5173`)

## Validation Commands
- Workspace checks: `pnpm lint && pnpm test && pnpm typecheck && pnpm build`
- Rust engine tests: `cargo test -p chess_core`
- All-in-one verifier: `pnpm verify:mvp`
- Final readiness report: `pnpm mvp:finalize` (writes `docs/reports/mvp-readiness-latest.md`)

## Manual UI Smoke Tests (Core Chess)
Use the web UI and click squares in this order:

1. Legal + illegal move feedback
- Click `e2`, then `e4` (legal)
- Click `e4`, then `e6` (illegal target should be rejected)

2. Castling
- `g1` -> `f3`
- `g8` -> `f6`
- `e2` -> `e4`
- `e7` -> `e5`
- `f1` -> `e2`
- `f8` -> `e7`
- `e1` -> `g1` (white king-side castle)

3. En passant
- Reset game
- `e2` -> `e4`
- `a7` -> `a6`
- `e4` -> `e5`
- `d7` -> `d5`
- `e5` -> `d6` (en passant capture)

4. Promotion + selection UI
- Reset game
- `a2` -> `a4`
- `b7` -> `b5`
- `a4` -> `b5` (capture)
- `b8` -> `c6`
- `b5` -> `b6`
- `h7` -> `h6`
- `b6` -> `b7`
- `h6` -> `h5`
- `b7` -> `b8` (promotion chooser should appear; select piece)

See `/Users/aaditnilay/Documents/chess_repo/docs/mvp-acceptance.md` for the full MVP checklist.

## Notes
- Engine currently supports baseline normal-chess legality/state flow, including castling and en-passant.
- `@chess/engine-wasm` attempts to load Rust/WASM output from `packages/engine-wasm/pkg` when available, and falls back to a JS adapter if not built.
- Non-normal variants and bot logic are placeholders in this phase.
