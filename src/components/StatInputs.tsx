import type { StatDef, StatValues } from "../types";
import "./ItemChecker.css";

interface Props {
  stats: StatDef[];
  values: StatValues;
  onChange: (values: StatValues) => void;
}

export function StatInputs({ stats, values, onChange }: Props) {
  const set = (id: string, v: number) => {
    onChange({ ...values, [id]: v });
  };

  const toggle = (id: string) => {
    onChange({ ...values, [id]: values[id] ? 0 : 1 });
  };

  return (
    <div className="stat-grid">
      {stats.map((s) =>
        s.type === "bool" ? (
          <label key={s.id} className="check-row">
            <input
              type="checkbox"
              checked={Boolean(values[s.id])}
              onChange={() => toggle(s.id)}
            />
            {s.label}
          </label>
        ) : (
          <label key={s.id} className="stat-field">
            <span className="field__label">
              {s.label}
              {s.max !== undefined && (
                <span className="stat-field__max"> max {s.max}</span>
              )}
            </span>
            <input
              className="field__input field__input--narrow"
              type="number"
              min={0}
              max={s.max ?? 999}
              placeholder="0"
              value={values[s.id] ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                set(s.id, raw === "" ? 0 : Number(raw));
              }}
            />
          </label>
        ),
      )}
    </div>
  );
}
