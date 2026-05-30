import { useMemo, useState } from "react";
import magicData from "../../data/magic_presets.json";
import type { MagicData, MagicPreset, StatValues } from "../types";
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
  const [presetPick, setPresetPick] = useState<MagicPreset | null>(null);

  const slot = data.slots.find((s) => s.id === slotId)!;

  const onSlotChange = (id: string) => {
    setSlotId(id);
    setValues(emptyStats(id));
    setCraftingInput(false);
    setPresetPick(null);
  };

  const statResult = useMemo(
    () => evaluateMagicFromStats(slot, values, craftingInput),
    [slot, values, craftingInput],
  );

  const displayResult = presetPick
    ? evaluateMagicPreset(presetPick)
    : statResult;

  const hasCrafting = slot.presets.some((p) => p.crafting_only) || slot.crafting_note;

  return (
    <section className="item-checker" aria-label="Magic item checker">
      <VerdictBar result={displayResult} />

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
            onChange={(e) => {
              setCraftingInput(e.target.checked);
              setPresetPick(null);
            }}
          />
          Crafting input only
        </label>
      )}

      <p className="preset-section__title">Known keep targets (tap)</p>
      <div className="btn-row">
        {slot.presets
          .filter((p) => !p.crafting_only)
          .map((p) => (
            <button
              key={p.id}
              type="button"
              className={`chip ${presetPick?.id === p.id ? "chip--active chip--preset-keep" : ""}`}
              onClick={() => {
                setPresetPick(presetPick?.id === p.id ? null : p);
                setCraftingInput(false);
              }}
            >
              {p.label}
            </button>
          ))}
      </div>

      <p className="preset-section__title">Enter rolls on item</p>
      <StatInputs
        stats={slot.stats}
        values={values}
        onChange={(v) => {
          setValues(v);
          setPresetPick(null);
        }}
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
