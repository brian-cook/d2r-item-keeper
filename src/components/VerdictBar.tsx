import type { EvaluationResult } from "../types";
import "./VerdictBar.css";

interface Props {
  result: EvaluationResult | null;
}

export function VerdictBar({ result }: Props) {
  if (!result) {
    return (
      <div className="verdict verdict--idle" role="status">
        <span className="verdict__label">—</span>
        <span className="verdict__hint">Select a base and sockets</span>
      </div>
    );
  }

  const cls = `verdict verdict--${result.verdict.toLowerCase()}`;
  return (
    <div className={cls} role="status" aria-live="polite">
      <span className="verdict__label">{result.verdict}</span>
      <ul className="verdict__reasons">
        {result.reasons.slice(0, 3).map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
