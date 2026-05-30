import type {
  BaseEvaluationInput,
  EthChoice,
  EvaluationResult,
  ItemBase,
  Verdict,
} from "../types";

function worstVerdict(a: Verdict, b: Verdict): Verdict {
  const rank: Record<Verdict, number> = { CHUCK: 0, CHECK: 1, KEEP: 2 };
  return rank[a] <= rank[b] ? a : b;
}

function bestVerdict(a: Verdict, b: Verdict): Verdict {
  const rank: Record<Verdict, number> = { CHUCK: 0, CHECK: 1, KEEP: 2 };
  return rank[a] >= rank[b] ? a : b;
}

function ethMatchesPolicy(choice: EthChoice, policy: ItemBase["eth_policy"]): boolean {
  if (policy === "BOTH") return true;
  if (choice === "either") return true;
  if (policy === "ETH") return choice === "eth";
  if (policy === "NORM") return choice === "norm";
  return true;
}

export function evaluateBase(input: BaseEvaluationInput): EvaluationResult {
  const { base, eth, sockets, unsocketed, superiorEd, valueMods } = input;

  if (!base) {
    return { verdict: "CHUCK", reasons: ["Select or search for a base item."] };
  }

  const reasons: string[] = [];
  let verdict: Verdict = "KEEP";
  let ethFail = false;

  if (!ethMatchesPolicy(eth, base.eth_policy)) {
    const want = base.eth_policy === "ETH" ? "ethereal" : "non-ethereal";
    reasons.push(`Wrong eth: this base wants ${want} only.`);
    verdict = "CHUCK";
    ethFail = true;
  }

  const preferred = base.sockets_preferred;
  const maxSockets = base.max_sockets;

  if (preferred.length === 0) {
    reasons.push(
      maxSockets !== undefined
        ? `This base (max ${maxSockets} sockets) has no sought socket count — generally not worth keeping.`
        : "This base has no sought socket count — generally not worth keeping.",
    );
    verdict = worstVerdict(verdict, "CHUCK");
  } else if (unsocketed) {
    if (maxSockets !== undefined) {
      if (preferred.includes(maxSockets)) {
        reasons.push(
          `Unsocketed OK — Larzuk gives this base's max (${maxSockets}), exactly a sought count.`,
        );
        verdict = worstVerdict(verdict, "KEEP");
      } else {
        const sought = preferred.join("/");
        reasons.push(
          `Unsocketed risky — Larzuk gives the max (${maxSockets}), but you want ${sought}. You need a natural ${sought}-socket drop.`,
        );
        verdict = worstVerdict(verdict, "CHECK");
      }
    } else {
      reasons.push("Unsocketed — verify socket count after Larzuk or socket quest.");
      verdict = worstVerdict(verdict, "CHECK");
    }
  } else if (sockets === null) {
    reasons.push("Pick a socket count (or mark unsocketed).");
    verdict = worstVerdict(verdict, "CHECK");
  } else if (maxSockets !== undefined && sockets > maxSockets) {
    reasons.push(
      `Impossible: ${sockets} sockets — this base can have at most ${maxSockets}.`,
    );
    verdict = "CHUCK";
  } else {
    const acceptable = base.sockets_acceptable ?? [];
    const exactOnly = base.flags?.includes("exact_socket_count");

    if (preferred.includes(sockets)) {
      reasons.push(`Socket count ${sockets} matches preferred (${preferred.join(", ")}).`);
    } else if (acceptable.includes(sockets)) {
      reasons.push(`Socket count ${sockets} is acceptable (preferred: ${preferred.join(", ")}).`);
      verdict = worstVerdict(verdict, "CHECK");
    } else if (exactOnly) {
      reasons.push(
        `Socket count ${sockets} wrong — needs exactly ${preferred.join(" or ")}.`,
      );
      verdict = "CHUCK";
    } else {
      reasons.push(
        `Socket count ${sockets} not in preferred list (${preferred.join(", ")}).`,
      );
      verdict = worstVerdict(verdict, "CHUCK");
    }
  }

  if (superiorEd !== null && base.superior_ed_min !== undefined) {
    if (superiorEd >= (base.superior_ed_ideal ?? base.superior_ed_min)) {
      reasons.push(`Superior ED ${superiorEd}% is ideal for this base.`);
    } else if (superiorEd >= base.superior_ed_min) {
      reasons.push(`Superior ED ${superiorEd}% is good (ideal ${base.superior_ed_ideal ?? 15}%).`);
    } else {
      reasons.push(
        `Superior ED ${superiorEd}% is low — aim for ${base.superior_ed_min}%+ on this base.`,
      );
      verdict = worstVerdict(verdict, "CHECK");
    }
  }

  // Value-driver mods (Paladin all-res automod, +skill staffmod / class
  // automod). A premium roll can make a base a keeper on its own, so these
  // upgrade the verdict (best-of) but never downgrade a socket-qualified base.
  if (base.value_mods && base.value_mods.length > 0 && !ethFail) {
    let valueVerdict: Verdict | null = null;
    for (const mod of base.value_mods) {
      const v = valueMods?.[mod.id];
      if (v === undefined || Number.isNaN(v) || v <= 0) continue;
      const checkAt = mod.check_at ?? mod.keep_at;
      if (v >= mod.keep_at) {
        reasons.push(`${mod.label} ${v} is a premium roll — worth keeping for this alone.`);
        valueVerdict = bestVerdict(valueVerdict ?? "CHUCK", "KEEP");
      } else if (v >= checkAt) {
        reasons.push(`${mod.label} ${v} is decent (premium is ${mod.keep_at}+).`);
        valueVerdict = bestVerdict(valueVerdict ?? "CHUCK", "CHECK");
      } else {
        reasons.push(`${mod.label} ${v} is low — premium is ${mod.keep_at}+.`);
      }
    }
    if (valueVerdict) {
      verdict = bestVerdict(verdict, valueVerdict);
    }
  }

  if (verdict === "KEEP" && reasons.length === 0) {
    reasons.push(base.keep_summary ?? "Meets keep criteria for this base.");
  }

  if (base.notes && verdict !== "CHUCK") {
    reasons.push(base.notes);
  }

  return { verdict, reasons };
}

export function searchBases(query: string, bases: ItemBase[]): ItemBase[] {
  const q = query.trim().toLowerCase();
  if (!q) return bases;

  return bases.filter((b) => {
    if (b.name.toLowerCase().includes(q)) return true;
    if (b.id.replace(/_/g, " ").includes(q)) return true;
    return b.aliases?.some((a) => a.includes(q)) ?? false;
  });
}

export function formatCategory(category: string): string {
  return category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
