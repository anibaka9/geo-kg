import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadRaw, licenseKey } from "./csv";
import { normalize } from "./normalize";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const raw2025 = loadRaw(join(ROOT, "data/2025.csv"), 2025);
const raw2026 = loadRaw(join(ROOT, "data/2026.csv"), 2026);

// Merge by short license number (e.g. "нм 11-02"): 2025 as base, 2026 takes priority
const rawByKey = new Map(raw2025.map((r) => [licenseKey(r.licenseNumber), r]));
for (const r of raw2026) rawByKey.set(licenseKey(r.licenseNumber), r);

const output = [...rawByKey.values()].map(normalize).map((l, i) => ({
  ...l,
  id: { raw: l.id.raw, value: String(i + 1) },
}));

const withCoords = output.filter((l) => l.polygon.value.length > 0).length;
console.log(`Total licenses: ${output.length}`);
console.log(`  With coordinates:    ${withCoords}`);
console.log(`  Without coordinates: ${output.length - withCoords}`);
console.log(`  From 2025 only: ${output.filter((l) => l.sourceYear === 2025).length}`);
console.log(`  From 2026:      ${output.filter((l) => l.sourceYear === 2026).length}`);

mkdirSync(join(ROOT, "output"), { recursive: true });
writeFileSync(join(ROOT, "output/licenses.json"), JSON.stringify(output, null, 2), "utf-8");
console.log(`\nWritten to output/licenses.json`);
