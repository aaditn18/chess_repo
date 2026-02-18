import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const checks = [
  { name: "Workspace lint", cmd: "pnpm lint" },
  { name: "Workspace tests", cmd: "pnpm test" },
  { name: "Workspace typecheck", cmd: "pnpm typecheck" },
  { name: "Workspace build", cmd: "pnpm build" },
  { name: "Rust engine tests", cmd: "cargo test -p chess_core" },
  { name: "Engine WASM runtime tests", cmd: "pnpm --filter @chess/engine-wasm test" },
  { name: "Web adapter/store tests", cmd: "pnpm --filter @chess/web test" }
];

const runAt = new Date();
const datePart = runAt.toISOString().slice(0, 10);
const timestamp = runAt.toISOString();
const reportDir = path.resolve("docs", "reports");
const reportPath = path.join(reportDir, `mvp-readiness-${datePart}.md`);
const latestPath = path.join(reportDir, "mvp-readiness-latest.md");

mkdirSync(reportDir, { recursive: true });

const results = [];
let hasFailure = false;

for (const check of checks) {
  const started = Date.now();

  try {
    execSync(check.cmd, {
      stdio: "pipe",
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024
    });

    results.push({
      ...check,
      status: "PASS",
      durationMs: Date.now() - started
    });
  } catch (error) {
    hasFailure = true;
    const output = [error?.stdout ?? "", error?.stderr ?? ""]
      .map((chunk) => String(chunk).trim())
      .filter(Boolean)
      .join("\n")
      .slice(0, 4000);

    results.push({
      ...check,
      status: "FAIL",
      durationMs: Date.now() - started,
      output
    });
    break;
  }
}

const tableRows = results
  .map(
    (result) =>
      `| ${result.name} | \`${result.cmd}\` | ${result.status} | ${(
        result.durationMs / 1000
      ).toFixed(2)}s |`
  )
  .join("\n");

const failureDetail = results
  .filter((result) => result.status === "FAIL" && result.output)
  .map(
    (result) =>
      `## Failure Detail: ${result.name}\n\n\`\`\`text\n${result.output}\n\`\`\`\n`
  )
  .join("\n");

const report = `# MVP Readiness Report

- Generated at: ${timestamp}
- Overall result: ${hasFailure ? "FAIL" : "PASS"}
- Source checklist: \`/Users/aaditnilay/Documents/chess_repo/docs/mvp-acceptance.md\`

## Automated Checks
| Check | Command | Status | Duration |
| --- | --- | --- | --- |
${tableRows}

## Manual Verification
- Run the UI checklist in \`/Users/aaditnilay/Documents/chess_repo/docs/mvp-acceptance.md\` under "Core UI Functional Checks" and "Suggested Manual Move Sequences".
- Open the app with \`pnpm dev:web\` and verify board interaction, castling, en passant, and promotion chooser.

${failureDetail}`;

writeFileSync(reportPath, report);
writeFileSync(latestPath, report);

if (hasFailure) {
  process.exitCode = 1;
}
