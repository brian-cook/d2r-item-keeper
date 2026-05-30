export type EthPolicy = "ETH" | "NORM" | "BOTH";
export type Verdict = "KEEP" | "CHECK" | "CHUCK";
export type EthChoice = "norm" | "eth" | "either";
export type AppMode = "base" | "magic" | "rare";

/**
 * An optional value-driver that can make a base worth keeping on its own,
 * independent of its socket count — e.g. the Paladin-shield all-resistance
 * automod, or a +skill staffmod / class automod on staves, wands, daggers,
 * and class items. Inputs only ever *upgrade* a verdict (best-of), never
 * downgrade a base that already qualifies on sockets.
 */
export interface BaseValueMod {
  /** Stat key used in the value-mod input map. */
  id: string;
  label: string;
  /** Display/cap for the input (e.g. 45 for all-res, 3 for a single skill). */
  max: number;
  /** Value at/above which this roll alone is a strong KEEP. */
  keep_at: number;
  /** Value at/above which this roll alone is at least CHECK-worthy. */
  check_at?: number;
  /** Short "look for" guidance shown next to the input. */
  note?: string;
}

export interface ItemBase {
  id: string;
  name: string;
  category: string;
  eth_policy: EthPolicy;
  sockets_preferred: number[];
  sockets_acceptable?: number[];
  /** Absolute maximum sockets this base can ever roll (ilvl 41+). */
  max_sockets?: number;
  superior_ed_min?: number;
  superior_ed_ideal?: number;
  /** Value-driver automods/staffmods that can make this base a keeper. */
  value_mods?: BaseValueMod[];
  flags?: string[];
  aliases?: string[];
  notes?: string;
  keep_summary?: string;
}

export interface BasesData {
  season: string;
  patch: string;
  bases: ItemBase[];
  catch_all_rules?: CatchAllRule[];
}

export interface CatchAllRule {
  id: string;
  label: string;
  eth_policy: EthPolicy;
  sockets_preferred: number[];
  categories?: string[];
  notes?: string;
}

export interface BaseEvaluationInput {
  base: ItemBase | null;
  eth: EthChoice;
  sockets: number | null;
  unsocketed: boolean;
  superiorEd: number | null;
  /** Optional value-mod readings keyed by BaseValueMod.id. */
  valueMods?: Record<string, number>;
}

export interface EvaluationResult {
  verdict: Verdict;
  reasons: string[];
}

export type StatValues = Record<string, number>;

export interface StatCondition {
  stat: string;
  op: ">=" | ">" | "<=" | "==";
  value: number;
}

export interface StatDef {
  id: string;
  label: string;
  max?: number;
  type?: "bool" | "number";
}

export interface MagicPreset {
  id: string;
  label: string;
  verdict: Verdict;
  reason: string;
  crafting_only?: boolean;
  requirements?: StatCondition[];
  optional_any?: { stat: string; min: number }[];
  min_res_count?: number;
  res_stats?: string[];
}

export interface MagicSlot {
  id: string;
  label: string;
  stats: StatDef[];
  presets: MagicPreset[];
  crafting_note?: string;
  notes?: string[];
}

export interface MagicData {
  season: string;
  patch: string;
  slots: MagicSlot[];
}

export interface RareRule {
  id?: string;
  label?: string;
  verdict: Verdict;
  core?: StatCondition[];
  secondaries?: StatCondition[];
  secondary_min_count?: number;
  res_min_count?: number;
  res_min_value?: number;
  res_stats?: string[];
  combined_res_min?: number;
  any_skill_tree_min?: number;
  skill_tree_stats?: string[];
  note?: string;
}

export interface RareVariant {
  id: string;
  label: string;
  rule: RareRule;
}

export interface RareSlot {
  label: string;
  max_rolls: Record<string, number>;
  stats: StatDef[];
  rules?: RareRule[];
  variants?: RareVariant[];
}

export interface RareData {
  season: string;
  patch: string;
  slots: Record<string, RareSlot>;
}
