# MVP Acceptance Checklist

## Objective
Confirm the normal-chess offline MVP is locally runnable and that core game flows behave correctly in the UI.

## Environment Readiness
- [ ] Node.js 20+ installed
- [ ] `pnpm` 10+ installed
- [ ] Rust stable installed (`rustup`)
- [ ] `wasm32-unknown-unknown` target installed
- [ ] `wasm-pack` installed
- [ ] `wasm-bindgen-cli` installed

## Build + Test Gates
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `cargo test -p chess_core`
- [ ] `pnpm --filter @chess/engine-wasm test`
- [ ] `pnpm --filter @chess/web test`
- [ ] `pnpm mvp:finalize` and verify `docs/reports/mvp-readiness-latest.md` is `PASS`

## Local Run
- [ ] `pnpm --filter @chess/engine-wasm build`
- [ ] `pnpm --filter @chess/web dev`
- [ ] Web UI opens successfully in browser

## Core UI Functional Checks
- [ ] Legal move can be made from start position (`e2` -> `e4`)
- [ ] Illegal move shows clear rejection feedback
- [ ] Move history updates after each legal move
- [ ] Last move highlighting updates on the board
- [ ] Castling works when conditions are met (`e1` -> `g1`)
- [ ] En passant capture works (`e5` -> `d6` after `...d7` -> `d5`)
- [ ] Promotion chooser appears and selected promotion is applied
- [ ] Status panel updates active color, clocks, castling rights, and en passant target
- [ ] Reset clears board state metadata and move history

## Suggested Manual Move Sequences

### Castling
`g1-f3`, `g8-f6`, `e2-e4`, `e7-e5`, `f1-e2`, `f8-e7`, `e1-g1`

### En Passant
`e2-e4`, `a7-a6`, `e4-e5`, `d7-d5`, `e5-d6`

### Promotion
`a2-a4`, `b7-b5`, `a4-b5`, `b8-c6`, `b5-b6`, `h7-h6`, `b6-b7`, `h6-h5`, `b7-b8`
