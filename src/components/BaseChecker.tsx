import { useEffect, useMemo, useRef, useState } from "react";
import basesData from "../../data/bases.json";
import type { BasesData, EthChoice, ItemBase } from "../types";
import { evaluateBase, formatCategory, searchBases } from "../lib/evaluateBase";
import { VerdictBar } from "./VerdictBar";
import "./BaseChecker.css";

const data = basesData as BasesData;
const ALL_BASES = data.bases;

const SOCKET_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;

export function BaseChecker() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ItemBase | null>(null);
  const [eth, setEth] = useState<EthChoice>("either");
  const [sockets, setSockets] = useState<number | null>(null);
  const [unsocketed, setUnsocketed] = useState(false);
  const [superiorEd, setSuperiorEd] = useState<number | null>(null);
  const [showList, setShowList] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => searchBases(query, ALL_BASES).slice(0, 12), [query]);

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
      }),
    [selected, eth, sockets, unsocketed, superiorEd],
  );

  const pickBase = (base: ItemBase) => {
    setSelected(base);
    setQuery(base.name);
    setShowList(false);
    setSockets(null);
    setUnsocketed(false);
    setSuperiorEd(null);
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
        </>
      )}

      {!selected && (
        <div className="quick-picks">
          <p className="field__label">Quick picks</p>
          <div className="btn-row">
            {["monarch", "archon", "thresher", "grimoire", "phase blade"].map((q) => {
              const base = ALL_BASES.find(
                (b) =>
                  b.id.includes(q.replace(" ", "_")) ||
                  b.aliases?.includes(q) ||
                  b.name.toLowerCase().includes(q),
              );
              if (!base) return null;
              return (
                <button
                  key={q}
                  type="button"
                  className="chip"
                  onClick={() => pickBase(base)}
                >
                  {q}
                </button>
              );
            })}
          </div>
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
