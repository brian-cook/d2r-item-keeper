import { useEffect, useMemo, useRef, useState } from "react";
import basesData from "../../data/bases.json";
import type { BasesData, EthChoice, ItemBase } from "../types";
import { evaluateBase, formatCategory, searchBases } from "../lib/evaluateBase";
import { VerdictBar } from "./VerdictBar";
import "./BaseChecker.css";

const data = basesData as BasesData;
const ALL_BASES = data.bases;

const SOCKET_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;

// Display order for the "Browse by type" chips. Any category present in the
// data but missing here is appended afterwards so nothing is ever hidden.
const CATEGORY_ORDER = [
  "body_armor",
  "helmet",
  "shield",
  "paladin_shield",
  "grimoire",
  "sword",
  "axe",
  "maul",
  "spear",
  "polearm",
  "staff",
  "dagger",
  "claw",
  "class",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  class: "Class-Specific",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? formatCategory(category);
}

export function BaseChecker() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ItemBase | null>(null);
  const [eth, setEth] = useState<EthChoice>("either");
  const [sockets, setSockets] = useState<number | null>(null);
  const [unsocketed, setUnsocketed] = useState(false);
  const [superiorEd, setSuperiorEd] = useState<number | null>(null);
  const [valueMods, setValueMods] = useState<Record<string, number>>({});
  const [showList, setShowList] = useState(false);
  const [browseCategory, setBrowseCategory] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => searchBases(query, ALL_BASES).slice(0, 12), [query]);

  const categories = useMemo(() => {
    const present = new Set(ALL_BASES.map((b) => b.category));
    const ordered = CATEGORY_ORDER.filter((c) => present.has(c)) as string[];
    const extras = [...present].filter((c) => !ordered.includes(c)).sort();
    return [...ordered, ...extras];
  }, []);

  const browseMatches = useMemo(
    () =>
      browseCategory
        ? ALL_BASES.filter((b) => b.category === browseCategory)
        : [],
    [browseCategory],
  );

  useEffect(() => {
    if (!selected) return;
    if (selected.eth_policy === "ETH") setEth("eth");
    else if (selected.eth_policy === "NORM") setEth("norm");
    else setEth("either");
  }, [selected]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (selected && !unsocketed && "0123456".includes(e.key)) {
        setSockets(Number(e.key));
      }
      if (e.key === "e" || e.key === "E") {
        setEth((prev) =>
          prev === "norm" ? "eth" : prev === "eth" ? "either" : "norm",
        );
      }
      if (e.key === "Escape" && selected) {
        clearSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, unsocketed]);

  const result = useMemo(
    () =>
      evaluateBase({
        base: selected,
        eth,
        sockets: unsocketed ? null : sockets,
        unsocketed,
        superiorEd,
        valueMods,
      }),
    [selected, eth, sockets, unsocketed, superiorEd, valueMods],
  );

  const pickBase = (base: ItemBase) => {
    setSelected(base);
    setQuery(base.name);
    setShowList(false);
    setBrowseCategory(null);
    setSockets(null);
    setUnsocketed(false);
    setSuperiorEd(null);
    setValueMods({});
  };

  const clearSelection = () => {
    setSelected(null);
    setQuery("");
    setShowList(false);
    setBrowseCategory(null);
    setSockets(null);
    setUnsocketed(false);
    setSuperiorEd(null);
    setValueMods({});
    searchRef.current?.blur();
  };

  const ethPolicy = selected?.eth_policy ?? "BOTH";

  return (
    <section className="base-checker" aria-label="Base item checker">
      <VerdictBar result={selected ? result : null} />

      <label className="field">
        <span className="field__label">Base name</span>
        <input
          ref={searchRef}
          className="field__input"
          type="search"
          placeholder="Search… (/ to focus)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowList(true);
            setBrowseCategory(null);
            if (!e.target.value) setSelected(null);
          }}
          onFocus={() => setShowList(true)}
        />
      </label>

      {showList && query && matches.length > 0 && (
        <ul className="base-list" role="listbox">
          {matches.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className="base-list__item"
                onClick={() => pickBase(b)}
                role="option"
              >
                <span className="base-list__name">{b.name}</span>
                <span className="base-list__meta">
                  {formatCategory(b.category)} · {b.eth_policy} ·{" "}
                  {b.sockets_preferred.length > 0
                    ? `${b.sockets_preferred.join("/")}s`
                    : "skip"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <>
          <div className="base-detail">
            <strong>{selected.name}</strong>
            <span className="base-detail__cat">{formatCategory(selected.category)}</span>
            <p className="base-detail__policy">
              {selected.eth_policy} ·{" "}
              {selected.sockets_preferred.length > 0
                ? `sought ${selected.sockets_preferred.join("/")}s`
                : "no sought sockets"}
              {selected.max_sockets !== undefined && (
                <>
                  {" "}
                  · max {selected.max_sockets}
                  {selected.sockets_preferred.length > 0 &&
                    ` (Larzuk gives ${selected.max_sockets})`}
                </>
              )}
            </p>
          </div>

          <div
            className={`keep-target ${
              selected.sockets_preferred.length === 0 ? "keep-target--skip" : ""
            }`}
          >
            <p className="preset-section__title">Keep target</p>
            <p className="keep-target__line">
              {ethTargetLabel(selected.eth_policy)} ·{" "}
              {selected.sockets_preferred.length > 0
                ? `${selected.sockets_preferred.join(" / ")} sockets`
                : "no useful socket count — skip"}
            </p>
            {selected.value_mods && selected.value_mods.length > 0 && (
              <p className="keep-target__bonus">
                Bonus value:{" "}
                {selected.value_mods
                  .map((m) => `${m.label} ${m.keep_at}+`)
                  .join(" · ")}
              </p>
            )}
            {selected.notes && <p className="keep-target__note">{selected.notes}</p>}
          </div>

          <fieldset className="field eth-field">
            <legend className="field__label">Ethereal</legend>
            <div className="btn-row">
              <EthButton
                label="Norm"
                active={eth === "norm"}
                disabled={ethPolicy === "ETH"}
                onClick={() => setEth("norm")}
              />
              <EthButton
                label="Eth"
                active={eth === "eth"}
                disabled={ethPolicy === "NORM"}
                onClick={() => setEth("eth")}
              />
              <EthButton
                label="Either"
                active={eth === "either"}
                disabled={ethPolicy !== "BOTH"}
                onClick={() => setEth("either")}
              />
            </div>
          </fieldset>

          <fieldset className="field">
            <legend className="field__label">Sockets</legend>
            <label className="check-row">
              <input
                type="checkbox"
                checked={unsocketed}
                onChange={(e) => {
                  setUnsocketed(e.target.checked);
                  if (e.target.checked) setSockets(null);
                }}
              />
              Unsocketed (Larzuk / quest)
            </label>
            {!unsocketed && (
              <div className="btn-row socket-row">
                {SOCKET_OPTIONS.map((n) => {
                  const impossible =
                    selected.max_sockets !== undefined && n > selected.max_sockets;
                  return (
                    <button
                      key={n}
                      type="button"
                      className={`chip ${sockets === n ? "chip--active" : ""} ${
                        impossible ? "chip--impossible" : ""
                      }`}
                      title={impossible ? `${selected.name} cannot have ${n} sockets` : undefined}
                      onClick={() => setSockets(n)}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>

          {(selected.superior_ed_min !== undefined || selected.superior_ed_ideal) && (
            <label className="field">
              <span className="field__label">Superior ED % (optional)</span>
              <div className="btn-row">
                {[10, 15].map((ed) => (
                  <button
                    key={ed}
                    type="button"
                    className={`chip ${superiorEd === ed ? "chip--active" : ""}`}
                    onClick={() => setSuperiorEd(superiorEd === ed ? null : ed)}
                  >
                    {ed}%
                  </button>
                ))}
                <input
                  className="field__input field__input--narrow"
                  type="number"
                  min={0}
                  max={15}
                  placeholder="other"
                  value={superiorEd ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSuperiorEd(v === "" ? null : Number(v));
                  }}
                />
              </div>
            </label>
          )}

          {selected.value_mods && selected.value_mods.length > 0 && (
            <fieldset className="field value-mods">
              <legend className="field__label">Value mods (optional)</legend>
              {selected.value_mods.map((mod) => (
                <label key={mod.id} className="value-mod">
                  <span className="value-mod__label">{mod.label}</span>
                  <div className="value-mod__row">
                    <input
                      className="field__input field__input--narrow"
                      type="number"
                      min={0}
                      max={mod.max}
                      placeholder="0"
                      value={valueMods[mod.id] ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setValueMods((prev) => {
                          const next = { ...prev };
                          if (v === "") delete next[mod.id];
                          else next[mod.id] = Number(v);
                          return next;
                        });
                      }}
                    />
                    <span className="value-mod__max">/ {mod.max}</span>
                  </div>
                  {mod.note && <p className="value-mod__note">{mod.note}</p>}
                </label>
              ))}
            </fieldset>
          )}

          <button
            type="button"
            className="back-btn"
            onClick={clearSelection}
            aria-label="Back to all bases"
          >
            ← Back to all bases
          </button>
        </>
      )}

      {!selected && (!query || !showList) && (
        <div className="quick-picks">
          <p className="field__label">Browse by type</p>
          <div className="btn-row">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip ${browseCategory === c ? "chip--active" : ""}`}
                onClick={() =>
                  setBrowseCategory((prev) => (prev === c ? null : c))
                }
              >
                {categoryLabel(c)}
              </button>
            ))}
          </div>

          {browseCategory && browseMatches.length > 0 && (
            <ul className="base-list base-list--browse" role="listbox">
              {browseMatches.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className="base-list__item"
                    onClick={() => pickBase(b)}
                    role="option"
                  >
                    <span className="base-list__name">{b.name}</span>
                    <span className="base-list__meta">
                      {b.eth_policy} ·{" "}
                      {b.sockets_preferred.length > 0
                        ? `sought ${b.sockets_preferred.join("/")}s`
                        : "skip"}
                      {b.max_sockets !== undefined && ` · max ${b.max_sockets}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function ethTargetLabel(policy: ItemBase["eth_policy"]): string {
  if (policy === "ETH") return "Ethereal only";
  if (policy === "NORM") return "Non-ethereal only";
  return "Eth or non-eth";
}

function EthButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`chip ${active ? "chip--active" : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
