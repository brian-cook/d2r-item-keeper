import type { StatCondition, StatValues } from "../types";

export function testCondition(values: StatValues, cond: StatCondition): boolean {
  const raw = values[cond.stat];
  const v = typeof raw === "boolean" ? (raw ? 1 : 0) : (raw ?? 0);

  switch (cond.op) {
    case ">=":
      return v >= cond.value;
    case ">":
      return v > cond.value;
    case "<=":
      return v <= cond.value;
    case "==":
      return v === cond.value;
    default:
      return false;
  }
}

export function countMatching(
  values: StatValues,
  conditions: StatCondition[],
): number {
  return conditions.filter((c) => testCondition(values, c)).length;
}
