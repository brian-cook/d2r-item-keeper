import { useMemo, useState } from "react";
import rareData from "../../data/rare_slots.json";
import type { RareData, StatValues } from "../types";
import {
  describeRareRule,
  evaluateRare,
  evaluateRareAllVariants,
  listRareSlotIds,
  listRareTargets,
} from "../lib/evaluateRare";
import { VerdictBar } from "./VerdictBar";
import { StatInputs } from "./StatInputs";
import { MaxRollsPanel } from "./MaxRollsPanel";
import "./ItemChecker.css";

const data = rareData as unknown as RareData;
const SLOT_IDS = listRareSlotIds(data.slots);

const emptyStats = (slotId: string): StatValues => {
  const slot = data.slots[slotId];
  if (!slot) return {};
  return Object.fromEntries(
    slot.stats.map((s) => [s.id, s.type === "bool" ? 0 : 0]),
  );
};

export function RareChecker() {
  const [slotId, setSlotId] = useState(SLOT_IDS[0] ?? "amulet");
  const [values, setValues] = useState<StatValues>(() => emptyStats(slotId));
  const [pickedTarget, setPickedTarget] = useState<string | null>(null);

  const slot = data.slots[slotId];
  const hasVariants = Boolean(slot?.variants?.length);

  const statLabels = useMemo(
    () => Object.fromEntries((slot?.stats ?? []).map((s) => [s.id, s.label])),
    [slot],
  );
  const targets = useMemo(() => (slot ? listRareTargets(slot) : []), [slot]);

  const onSlotChange = (id: string) => {
    setSlotId(id);
    setValues(emptyStats(id));
    setPickedTarget(null);
  };

  const liveResult = useMemo(() => {
    if (!slot) {
      return { verdict: "CHUCK" as const, reasons: ["Unknown slot."] };
    }
    return hasVariants
      ? evaluateRareAllVariants(slot, values)
      : evaluateRare(slot, values);
  }, [slot, values, hasVariants]);

  if (!slot) return null;

  const picked = targets.find((t) => t.id === pickedTarget) ?? null;
  const result = picked
    ? describeRareRule(picked.rule, statLabels, picked.label)
    : liveResult;

  return (
    <section className="item-checker" aria-label="Rare item checker">
      <VerdictBar result={result} />

      <label className="field">
        <span className="field__label">Slot</span>
        <select
          className="slot-select"
          value={slotId}
          onChange={(e) => onSlotChange(e.target.value)}
        >
          {SLOT_IDS.map((id) => (
            <option key={id} value={id}>
              {data.slots[id].label}
            </option>
          ))}
        </select>
      </label>

      {targets.length > 0 && (
        <>
          <p className="preset-section__title">Known keep targets (tap)</p>
          <div className="btn-row">
            {targets.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`chip ${pickedTarget === t.id ? "chip--active" : ""} ${
                  t.rule.verdict === "KEEP" ? "chip--preset-keep" : ""
                }`}
                onClick={() =>
                  setPickedTarget(pickedTarget === t.id ? null : t.id)
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="preset-section__title">Enter affix values</p>
      <StatInputs
        stats={slot.stats}
        values={values}
        onChange={(v) => {
          setValues(v);
          setPickedTarget(null);
        }}
      />

      <MaxRollsPanel maxRolls={slot.max_rolls} />
    </section>
  );
}
