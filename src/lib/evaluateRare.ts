import type {
  EvaluationResult,
  RareRule,
  RareSlot,
  RareVariant,
  StatValues,
  Verdict,
} from "../types";
import { countMatching, testCondition } from "./conditions";

function verdictRank(v: Verdict): number {
  return { CHUCK: 0, CHECK: 1, KEEP: 2 }[v];
}

function sumStats(values: StatValues, stats: string[]): number {
  return stats.reduce((sum, s) => sum + (values[s] ?? 0), 0);
}

function evaluateRule(values: StatValues, rule: RareRule): EvaluationResult | null {
  const reasons: string[] = [];

  for (const cond of rule.core ?? []) {
    if (!testCondition(values, cond)) {
      return null;
    }
  }

  if (rule.any_skill_tree_min && rule.skill_tree_stats) {
    const maxTree = Math.max(
      0,
      ...rule.skill_tree_stats.map((s) => values[s] ?? 0),
    );
    if (maxTree < rule.any_skill_tree_min) return null;
    reasons.push(`Skill tree +${maxTree} meets threshold.`);
  }

  if (rule.res_min_count && rule.res_stats && rule.res_min_value !== undefined) {
    const resCount = rule.res_stats.filter(
      (s) => (values[s] ?? 0) >= rule.res_min_value!,
    ).length;
    if (resCount < rule.res_min_count) return null;
    reasons.push(`${resCount} resistances at ${rule.res_min_value}%+.`);
  }

  if (rule.combined_res_min && rule.res_stats) {
    const total = sumStats(values, rule.res_stats);
    if (total < rule.combined_res_min) return null;
    reasons.push(`Combined tri-res: ${total}% (need ${rule.combined_res_min}%+).`);
  }

  const secondaryCount = countMatching(values, rule.secondaries ?? []);
  if ((rule.secondary_min_count ?? 0) > 0) {
    if (secondaryCount < rule.secondary_min_count!) {
      return null;
    }
    reasons.push(
      `${secondaryCount}/${rule.secondary_min_count} useful secondaries.`,
    );
  }

  const verdict = rule.verdict;
  if (rule.label) reasons.unshift(rule.label);
  if (rule.note) reasons.push(rule.note);

  return { verdict, reasons };
}

function evaluateRules(values: StatValues, rules: RareRule[]): EvaluationResult {
  let best: EvaluationResult = {
    verdict: "CHUCK",
    reasons: ["Does not meet keep criteria for this slot."],
  };

  for (const rule of rules) {
    const result = evaluateRule(values, rule);
    if (result && verdictRank(result.verdict) >= verdictRank(best.verdict)) {
      best = result;
    }
  }

  return best;
}

export function evaluateRare(
  slot: RareSlot,
  values: StatValues,
  variantId?: string,
): EvaluationResult {
  if (slot.variants?.length) {
    const variant = variantId
      ? slot.variants.find((v) => v.id === variantId)
      : slot.variants[0];
    if (variant) {
      const result = evaluateRule(values, variant.rule);
      if (result) return result;
      return {
        verdict: "CHUCK",
        reasons: [`No match for ${variant.label} criteria.`],
      };
    }
  }

  if (slot.rules?.length) {
    return evaluateRules(values, slot.rules);
  }

  return { verdict: "CHUCK", reasons: ["No rules defined for this slot."] };
}

export function evaluateRareAllVariants(
  slot: RareSlot,
  values: StatValues,
): EvaluationResult {
  if (!slot.variants?.length) {
    return evaluateRare(slot, values);
  }

  let best: EvaluationResult = {
    verdict: "CHUCK",
    reasons: ["Does not match any build variant."],
  };

  for (const v of slot.variants) {
    const result = evaluateRule(values, v.rule);
    if (result) {
      result.reasons = [`[${v.label}]`, ...result.reasons];
      if (verdictRank(result.verdict) >= verdictRank(best.verdict)) {
        best = result;
      }
    }
  }

  return best;
}

export function getRareSlot(
  slots: Record<string, RareSlot>,
  id: string,
): RareSlot | undefined {
  return slots[id];
}

export function listRareSlotIds(slots: Record<string, RareSlot>): string[] {
  return Object.keys(slots);
}

export function listVariants(slot: RareSlot): RareVariant[] {
  return slot.variants ?? [];
}
