import "./ItemChecker.css";

interface Props {
  maxRolls: Record<string, number>;
  labels?: Record<string, string>;
}

const DEFAULT_LABELS: Record<string, string> = {
  class_skills: "+Class",
  fcr: "FCR",
  ias: "IAS",
  frw: "FRW",
  fhr: "FHR",
  fbr: "FBR",
  life: "Life",
  mana: "Mana",
  str: "Str",
  dex: "Dex",
  all_res: "All Res",
  single_res: "Res",
  ll: "LL",
  ml: "ML",
  cb: "CB",
  ow: "OW",
  sockets: "Sockets",
  gf: "GF",
  pdr: "PDR",
};

export function MaxRollsPanel({ maxRolls, labels = DEFAULT_LABELS }: Props) {
  const entries = Object.entries(maxRolls);
  if (entries.length === 0) return null;

  return (
    <details className="max-rolls">
      <summary>Max rolls reference</summary>
      <ul className="max-rolls__list">
        {entries.map(([key, val]) => (
          <li key={key}>
            <span>{labels[key] ?? key}</span>
            <span>{val}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
