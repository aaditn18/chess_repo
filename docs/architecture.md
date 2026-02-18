# Architecture

## System Boundaries
- `crates/chess_core`: canonical chess state and move legality boundaries.
- `crates/chess_core_wasm`: serialization-safe bridge for browser use.
- `packages/engine-wasm`: stable TS import surface for the web app.
- `apps/web`: UI and local gameplay orchestration.
- `apps/api`: reserved backend boundaries for realtime sessions, matchmaking, and bot orchestration.

## Data Flow (Normal Offline 1v1)
1. UI reads current game state through `wasmEngineAdapter`.
2. UI requests legal moves for selected squares.
3. UI submits move input; engine validates and applies.
4. Updated state is rendered back onto the board.

## Extensibility
- Mode registry decouples mode IDs from runtime implementations.
- Variant packages isolate alternate rulesets.
- Bot SDK isolates model move providers from UI/state layers.
