import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const crateDir = resolve(process.cwd(), "../../crates/chess_core_wasm");
const hasWasmPack = spawnSync("wasm-pack", ["--version"], { stdio: "ignore" }).status === 0;

if (!existsSync(crateDir)) {
  console.warn("[engine-wasm] chess_core_wasm crate not found; skipping wasm build.");
  process.exit(0);
}

if (!hasWasmPack) {
  console.warn("[engine-wasm] wasm-pack not installed; skipping wasm build.");
  process.exit(0);
}

const result = spawnSync(
  "wasm-pack",
  [
    "build",
    crateDir,
    "--target",
    "web",
    "--mode",
    "no-install",
    "--no-opt",
    "--out-dir",
    "../../packages/engine-wasm/pkg"
  ],
  { stdio: "inherit" }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
