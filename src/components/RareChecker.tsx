import { useMemo, useState } from "react";
import rareData from "../../data/rare_slots.json";
import type { RareData, StatValues } from "../types";
import { evaluateRare, evaluateRareAllVariants, listRareSlotIds } from "../lib/evaluateRare";
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
  const [variantId, setVariantId] = useState<string>("auto");
  const [values, setValues] = useState<StatValues>(() => emptyStats(slotId));

  const slot = data.slots[slotId];
  const hasVariants = Boolean(slot?.variants?.length);

  const onSlotChange = (id: string) => {
    setSlotId(id);
    setValues(emptyStats(id));
    setVariantId("auto");
  };

  const result = useMemo(() => {
    if (!slot) {
      return { verdict: "CHUCK" as const, reasons: ["Unknown slot."] };
    }
    if (hasVariants && variantId === "auto") {
      return evaluateRareAllVariants(slot, values);
    }
    return evaluateRare(
      slot,
      values,
      variantId === "auto" ? undefined : variantId,
    );
  }, [slot, values, variantId, hasVariants]);

  if (!slot) return null;

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

      {hasVariants && (
        <label className="field">
          <span className="field__label">Build</span>
          <select
            className="slot-select"
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
          >
            <option value="auto">Auto (best match)</option>
            {slot.variants!.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <p className="preset-section__title">Enter affix values</p>
      <StatInputs stats={slot.stats} values={values} onChange={setValues} />

      <MaxRollsPanel maxRolls={slot.max_rolls} />
    </section>
  );
}
