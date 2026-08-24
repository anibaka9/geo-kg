import { $ } from "bun";

async function buildMap(): Promise<void> {
  const result = await Bun.build({
    entrypoints: ["./web/map.ts"],
    outdir: "./public",
    target: "browser",
    naming: "map.js",
    minify: true,
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("build failed: web/map.ts");
  }
}

async function buildTable(): Promise<void> {
  const result = await Bun.build({
    entrypoints: ["./web/table.ts"],
    outdir: "./public",
    target: "browser",
    naming: "table.js",
    minify: true,
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("build failed: web/table.ts");
  }
}

async function buildTurbo(): Promise<void> {
  const result = await Bun.build({
    entrypoints: ["./node_modules/@hotwired/turbo/dist/turbo.es2017-esm.js"],
    outdir: "./public",
    target: "browser",
    naming: "turbo.js",
    minify: true,
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("build failed: turbo.js");
  }
}

async function buildCss(): Promise<void> {
  await $`bunx @tailwindcss/cli -i ./web/input.css -o ./public/output.css --minify`;
}

const results = await Promise.allSettled([buildMap(), buildTable(), buildTurbo(), buildCss()]);
const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");

if (failures.length > 0) {
  for (const failure of failures) console.error(failure.reason);
  process.exit(1);
}

console.log("Built public/map.js, public/table.js, public/turbo.js, public/output.css");
