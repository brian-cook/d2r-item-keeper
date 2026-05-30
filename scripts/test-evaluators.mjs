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
const bases = JSON.parse(readFileSync(join(root, "data/bases.json"), "utf8"));

const findBase = (id) => bases.bases.find((b) => b.id === id);

// Minimal mirror of evaluateBase socket/Larzuk logic for smoke testing
function evaluateBaseSockets({ base, sockets, unsocketed }) {
  const preferred = base.sockets_preferred;
  const max = base.max_sockets;
  if (preferred.length === 0) return "CHUCK";
  if (unsocketed) {
    if (max !== undefined) return preferred.includes(max) ? "KEEP" : "CHECK";
    return "CHECK";
  }
  if (max !== undefined && sockets > max) return "CHUCK"; // impossible
  if (preferred.includes(sockets)) return "KEEP";
  if ((base.sockets_acceptable ?? []).includes(sockets)) return "CHECK";
  return "CHUCK";
}

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
  {
    name: "Base impossible sockets — CHUCK (Hyperion Spear 4os)",
    run: () =>
      evaluateBaseSockets({ base: findBase("hyperion_spear"), sockets: 4, unsocketed: false }),
    expect: "CHUCK",
  },
  {
    name: "Base Larzuk gives max — KEEP (Thresher unsocketed)",
    run: () =>
      evaluateBaseSockets({ base: findBase("thresher"), sockets: null, unsocketed: true }),
    expect: "KEEP",
  },
  {
    name: "Base Larzuk gives exact — KEEP (Colossus Sword, max 5 = needs 5)",
    run: () =>
      evaluateBaseSockets({ base: findBase("colossus_sword"), sockets: null, unsocketed: true }),
    expect: "KEEP",
  },
  {
    name: "Base Larzuk overshoots — CHECK (Mancatcher max 5, wants 4)",
    run: () =>
      evaluateBaseSockets({ base: findBase("mancatcher"), sockets: null, unsocketed: true }),
    expect: "CHECK",
  },
  {
    name: "Rare ring AR usable — KEEP (leech + AR + str)",
    run: () =>
      evaluateRareRule(
        { ll: 5, ar: 100, str: 20 },
        rare.slots.ring.rules[1],
      ),
    expect: "KEEP",
  },
  {
    name: "Rare jewel + bow + melee slots present (no javelin)",
    run: () =>
      Boolean(rare.slots.jewel && rare.slots.bow && rare.slots.melee) &&
      !rare.slots.weapon,
    expect: true,
  },
  {
    name: "Rare bow god-roll — KEEP",
    run: () =>
      evaluateRareRule({ ed: 250, ias: 20, sockets: 2 }, rare.slots.bow.rules[0]),
    expect: "KEEP",
  },
  {
    name: "Rare bow mediocre — CHUCK",
    run: () => evaluateRareRule({ ed: 120, ias: 20 }, rare.slots.bow.rules[0]),
    expect: null,
  },
  {
    name: "Skill weapon slots present (scepter/orb/wand)",
    run: () =>
      Boolean(rare.slots.scepter && rare.slots.orb && rare.slots.wand),
    expect: true,
  },
  {
    name: "Rare scepter Hammerdin — KEEP",
    run: () =>
      evaluateRareRule(
        { main_skill: 3, pala_skills: 2 },
        rare.slots.scepter.rules[0],
      ),
    expect: "KEEP",
  },
  {
    name: "Rare orb caster — KEEP (20 FCR + +3 skill)",
    run: () =>
      evaluateRareRule({ fcr: 20, main_skill: 3 }, rare.slots.orb.rules[0]),
    expect: "KEEP",
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
