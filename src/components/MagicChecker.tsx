import { useMemo, useState } from "react";
import magicData from "../../data/magic_presets.json";
import type { MagicData, StatValues } from "../types";
import {
  evaluateMagicFromStats,
  evaluateMagicPreset,
} from "../lib/evaluateMagic";
import { VerdictBar } from "./VerdictBar";
import { StatInputs } from "./StatInputs";
import "./ItemChecker.css";

const data = magicData as MagicData;

const emptyStats = (slotId: string): StatValues => {
  const slot = data.slots.find((s) => s.id === slotId);
  if (!slot) return {};
  return Object.fromEntries(slot.stats.map((s) => [s.id, 0]));
};

export function MagicChecker() {
  const [slotId, setSlotId] = useState(data.slots[0]?.id ?? "gloves");
  const [values, setValues] = useState<StatValues>(() => emptyStats(slotId));
  const [craftingInput, setCraftingInput] = useState(false);

  const slot = data.slots.find((s) => s.id === slotId)!;

  const onSlotChange = (id: string) => {
    setSlotId(id);
    setValues(emptyStats(id));
    setCraftingInput(false);
  };

  const statResult = useMemo(
    () => evaluateMagicFromStats(slot, values, craftingInput),
    [slot, values, craftingInput],
  );

  const keepTargets = slot.presets.filter((p) => !p.crafting_only);
  const hasCrafting = slot.presets.some((p) => p.crafting_only) || slot.crafting_note;

  return (
    <section className="item-checker" aria-label="Magic item checker">
      <VerdictBar result={statResult} />

      <label className="field">
        <span className="field__label">Slot</span>
        <select
          className="slot-select"
          value={slotId}
          onChange={(e) => onSlotChange(e.target.value)}
        >
          {data.slots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      {hasCrafting && (
        <label className="check-row">
          <input
            type="checkbox"
            checked={craftingInput}
            onChange={(e) => setCraftingInput(e.target.checked)}
          />
          Crafting input only
        </label>
      )}

      {keepTargets.length > 0 && (
        <div className="keep-targets">
          <p className="preset-section__title">Known keep targets</p>
          {keepTargets.map((p) => {
            const r = evaluateMagicPreset(p);
            const v = r.verdict.toLowerCase();
            return (
              <div key={p.id} className={`keep-target keep-target--${v}`}>
                <p className="keep-target__line">
                  <span className={`kt-badge kt-badge--${v}`}>{r.verdict}</span>
                  {p.label}
                </p>
                {r.reasons.length > 0 && (
                  <p className="keep-target__note">{r.reasons.join(" ")}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="preset-section__title">Enter rolls on item</p>
      <StatInputs
        stats={slot.stats}
        values={values}
        onChange={(v) => setValues(v)}
      />

      {slot.crafting_note && !craftingInput && (
        <p className="slot-notes">{slot.crafting_note}</p>
      )}
      {slot.notes?.map((n) => (
        <p key={n} className="slot-notes">
          {n}
        </p>
      ))}
    </section>
  );
}
