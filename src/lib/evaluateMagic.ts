import type {
  EvaluationResult,
  MagicPreset,
  MagicSlot,
  StatValues,
  Verdict,
} from "../types";
import { countMatching, testCondition } from "./conditions";

function verdictRank(v: Verdict): number {
  return { CHUCK: 0, CHECK: 1, KEEP: 2 }[v];
}

function presetMatches(values: StatValues, preset: MagicPreset): boolean {
  if (preset.crafting_only) return false;

  if (preset.requirements?.length) {
    if (!preset.requirements.every((c) => testCondition(values, c))) {
      return false;
    }
  }

  if (preset.optional_any?.length) {
    const anyOk = preset.optional_any.some((o) => (values[o.stat] ?? 0) >= o.min);
    if (!anyOk) return false;
  }

  if (preset.min_res_count && preset.res_stats) {
    const count = preset.res_stats.filter((s) => (values[s] ?? 0) > 0).length;
    if (count < preset.min_res_count) return false;
  }

  return Boolean(preset.requirements?.length || preset.optional_any || preset.min_res_count);
}

function partialPresetMatch(values: StatValues, preset: MagicPreset): number {
  if (preset.crafting_only || !preset.requirements?.length) return 0;
  return countMatching(values, preset.requirements) / preset.requirements.length;
}

export function evaluateMagicPreset(preset: MagicPreset): EvaluationResult {
  return {
    verdict: preset.verdict,
    reasons: [preset.reason],
  };
}

export function evaluateMagicFromStats(
  slot: MagicSlot,
  values: StatValues,
  craftingInput: boolean,
): EvaluationResult {
  if (craftingInput) {
    const craft = slot.presets.find((p) => p.crafting_only);
    if (craft) {
      return { verdict: craft.verdict, reasons: [craft.reason] };
    }
    if (slot.crafting_note) {
      return { verdict: "CHECK", reasons: [slot.crafting_note] };
    }
  }

  let best: EvaluationResult = {
    verdict: "CHUCK",
    reasons: ["Does not match a known magic keep target for this slot."],
  };

  for (const preset of slot.presets) {
    if (preset.crafting_only) continue;
    if (presetMatches(values, preset)) {
      const result: EvaluationResult = {
        verdict: preset.verdict,
        reasons: [`Matches: ${preset.label}`, preset.reason],
      };
      if (verdictRank(result.verdict) > verdictRank(best.verdict)) {
        best = result;
      } else if (
        result.verdict === best.verdict &&
        result.verdict === "KEEP"
      ) {
        best = result;
      }
    }
  }

  if (best.verdict !== "CHUCK") return best;

  let bestPartial = 0;
  let closest: MagicPreset | null = null;
  for (const preset of slot.presets) {
    if (preset.crafting_only) continue;
    const score = partialPresetMatch(values, preset);
    if (score > bestPartial) {
      bestPartial = score;
      closest = preset;
    }
  }

  if (closest && bestPartial >= 0.5) {
    return {
      verdict: "CHECK",
      reasons: [
        `Close to "${closest.label}" (${Math.round(bestPartial * 100)}% of requirements).`,
        closest.reason,
      ],
    };
  }

  return best;
}

export function getMagicSlot(slots: MagicSlot[], id: string): MagicSlot | undefined {
  return slots.find((s) => s.id === id);
}
