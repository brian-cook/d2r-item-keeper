export type EthPolicy = "ETH" | "NORM" | "BOTH";
export type Verdict = "KEEP" | "CHECK" | "CHUCK";
export type EthChoice = "norm" | "eth" | "either";
export type AppMode = "base" | "magic" | "rare";

export interface ItemBase {
  id: string;
  name: string;
  category: string;
  eth_policy: EthPolicy;
  sockets_preferred: number[];
  sockets_acceptable?: number[];
  superior_ed_min?: number;
  superior_ed_ideal?: number;
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
