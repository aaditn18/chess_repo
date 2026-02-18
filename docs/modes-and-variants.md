# Modes And Variants

## Game Modes
- `offline_local`: local pass-and-play gameplay on one device.
- `online_realtime`: future websocket-backed mode.
- `bot_match`: future mode for human vs model play.

## Team Modes
- `1v1`: current MVP target.
- `2v2`: future extension.
- `2v1`: future extension.

## Variants
- `normal`: MVP ruleset.
- `antichess`: placeholder package boundary.
- `nd_chess`: placeholder package boundary.

## Registry Model
Mode and variant identifiers are represented in `packages/contracts` and wired by `packages/mode-registry` so additional features can be added without architecture rewrites.
