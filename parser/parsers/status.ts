import type { Field, StatusData } from "@shared/types";
import { MINERAL_TYPES, WORK_STAGES } from "../data/status";

const EMPTY: StatusData = {
  code: null,
  mineralType: null,
  workStage: null,
  isAnnulled: false,
  protocol: null,
  protocolDate: null,
};

export function parseStatus(raw: string): Field<StatusData> {
  const trimmed = raw.trim();

  if (!trimmed) return { raw, value: EMPTY };

  // Code pattern: 2 Cyrillic letters, optionally with /letter suffix (e.g. "ВЕ", "АЕ/Р")
  if (/^[А-ЯЁ]{2}(?:\/[А-ЯЁ])?$/u.test(trimmed)) {
    const base = trimmed.split("/")[0]!;
    return {
      raw,
      value: {
        code: trimmed,
        mineralType: MINERAL_TYPES[base[0]!] ?? null,
        workStage: WORK_STAGES[base[1]!] ?? null,
        isAnnulled: false,
        protocol: null,
        protocolDate: null,
      },
    };
  }

  // Annulment: starts with "Ан" variant, or contains "протокол", or known annulment phrases
  const isAnnulled =
    trimmed.toLowerCase().startsWith("ан") ||
    /протокол/iu.test(trimmed) ||
    /перечень анн/iu.test(trimmed);

  if (isAnnulled) {
    const protocolMatch = trimmed.match(
      /протокол[а-яё]?\s*(?:№|N|#)?\s*([\d][\d\-А-ЯЁа-яёA-Za-z]*)/iu,
    );
    const dateMatch =
      trimmed.match(/от\s+(\d{1,2}[.\-]\d{2}[.\-]\d{2,4})/iu) ??
      trimmed.match(/(\d{1,2}[.\-]\d{2}[.\-]\d{2,4})(?:г\.?)?/u);
    return {
      raw,
      value: {
        code: null,
        mineralType: null,
        workStage: null,
        isAnnulled: true,
        protocol: protocolMatch ? protocolMatch[1]!.trim() : null,
        protocolDate: dateMatch ? dateMatch[1]!.trim() : null,
      },
    };
  }

  // Unknown / garbage — preserve raw as code
  return {
    raw,
    value: { ...EMPTY, code: trimmed },
  };
}
