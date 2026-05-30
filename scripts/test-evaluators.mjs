/**
 * Quick smoke tests for base/magic/rare evaluators (no Vitest required).
 * Run: node scripts/test-evaluators.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Minimal inline copies of condition logic for node script
function testCondition(values, cond) {
  const v = values[cond.stat] ?? 0;
  switch (cond.op) {
    case ">=":
      return v >= cond.value;
    case "==":
      return v === cond.value;
    default:
      return false;
  }
}

function countMatching(values, conditions) {
  return conditions.filter((c) => testCondition(values, c)).length;
}

function evaluateRareRule(values, rule) {
  for (const c of rule.core ?? []) {
    if (!testCondition(values, c)) return null;
  }
  if (rule.res_min_count && rule.res_stats) {
    const n = rule.res_stats.filter((s) => (values[s] ?? 0) >= (rule.res_min_value ?? 0)).length;
    if (n < rule.res_min_count) return null;
  }
  const sec = countMatching(values, rule.secondaries ?? []);
  if ((rule.secondary_min_count ?? 0) > 0 && sec < rule.secondary_min_count) return null;
  return rule.verdict;
}

const rare = JSON.parse(readFileSync(join(root, "data/rare_slots.json"), "utf8"));
const magic = JSON.parse(readFileSync(join(root, "data/magic_presets.json"), "utf8"));

const cases = [
  {
    name: "Rare amulet — KEEP",
    run: () =>
      evaluateRareRule(
        { class_skills: 2, fcr: 10, life: 35, mana: 30 },
        rare.slots.amulet.rules[0],
      ),
    expect: "KEEP",
  },
  {
    name: "Rare amulet — CHUCK (no FCR)",
    run: () =>
      evaluateRareRule({ class_skills: 2, fcr: 0, life: 40 }, rare.slots.amulet.rules[0]),
    expect: null,
  },
  {
    name: "Rare circlet — KEEP core",
    run: () =>
      evaluateRareRule({ class_skills: 2, fcr: 20 }, rare.slots.circlet.rules[0]),
    expect: "KEEP",
  },
  {
    name: "Rare boots — KEEP FRW + res",
    run: () =>
      evaluateRareRule(
        { frw: 30, fire_res: 25, cold_res: 22 },
        rare.slots.boots.rules[0],
      ),
    expect: "KEEP",
  },
  {
    name: "Magic preset count",
    run: () => magic.slots.reduce((n, s) => n + s.presets.length, 0),
    expect: (n) => n >= 25,
  },
];

let passed = 0;
let failed = 0;
for (const c of cases) {
  const got = c.run();
  const ok =
    typeof c.expect === "function"
      ? c.expect(got)
      : got === c.expect;
  if (ok) {
    console.log(`✓ ${c.name}`);
    passed++;
  } else {
    console.log(`✗ ${c.name} — got ${got}, expected ${c.expect}`);
    failed++;
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
