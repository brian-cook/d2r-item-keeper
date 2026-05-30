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
  fire_res: "Fire Res",
  cold_res: "Cold Res",
  light_res: "Light Res",
  poison_res: "Pois Res",
  ll: "LL",
  ml: "ML",
  cb: "CB",
  ow: "OW",
  sockets: "Sockets",
  gf: "GF",
  pdr: "PDR",
  ar: "AR",
  ed: "ED",
  max_dmg: "Max Dmg",
  mf: "MF",
  skills: "+Skills",
  jav_skills: "+Jav",
  bow_skills: "+Bow",
  ma_skills: "+MA",
  demon_binding: "Demon Bind",
  demon_skills: "+Demon",
  chaos_skills: "+Chaos",
  eldritch_skills: "+Eldritch",
  main_skill: "+Main Skill",
  second_skill: "+2nd Skill",
  skill_tab: "+Skill Tab",
  pala_skills: "+Pal Skills",
  sorc_skills: "+Sorc Skills",
  necro_skills: "+Necro Skills",
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
