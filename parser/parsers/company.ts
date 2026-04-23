import type { Field, CompanyData, CompanyIdentity } from "@shared/types";
import type { RawLicense } from "../types";
import { parseInn } from "./inn";
import { parsePassthrough } from "./passthrough";
import overrides from "../overrides/company.json";

const NORMALIZATIONS: [RegExp, string][] = [
  // Case normalization
  [/^Ип\s+/i, "ИП "],
  [/^Чп\s+/i, "ЧП "],
  [/^аО\s+/i, "АО "],
  // Dotted / slash variants
  [/^Ч[\./]П\.?\s*/i, "ЧП "],
  [/^К\.Х\.\s*/i, "КХ "],
  [/^К\/х\s*/i, "КХ "],
  [/^Ф\.Х\.\s*/i, "ФХ "],
  // Cyrillic/latin mix
  [/^ОСОО\s*/i, "ОсОО "],
  [/^ОсОO\s*/i, "ОсОО "],  // latin O at end
  // Missing space between type and quote
  [/^(ЗАО|ИП|ОАО|ОсОО|ЧП|АО)"/, '$1 "'],
  // Prefixes before ОсОО
  [/^К-Р\s+/, ""],
  [/^С?К{1,2}[КРС]?\s+(?=ОсОО)/i, ""],
  [/^Совм\.\s*\S+\.?(ОсОО)/i, "$1"],
  [/^Совместн\S*\s+\S+\s+(ОсОО)/i, "$1"],
];

const ORG_TYPES = [
  "ОсОО", "АООТ", "АОЗТ", "ГАО", "ГКП", "ГП", "ГУ", "ЗАО", "ИП", "КФ",
  "КХ", "МП", "НАО", "ОАО", "ОДО", "ОО", "ОФ", "ОЮЛ", "ПАО", "ПК", "РГП",
  "СП", "ТОО", "ФГУ", "ФГУП", "ФХ", "ЧП", "ГУП", "КГП", "АО",
];

function parseIdentity(raw: string): Field<CompanyIdentity> {
  const overridden = (overrides as Record<string, string>)[raw.trim()] ?? raw;
  let normalized = overridden.trim();

  for (const [pattern, replacement] of NORMALIZATIONS) {
    normalized = normalized.replace(pattern, replacement);
  }

  let orgType: string | null = null;
  let name = normalized;

  for (const t of ORG_TYPES) {
    if (normalized.startsWith(t + " ") || normalized.startsWith(t + ".") || normalized === t) {
      orgType = t;
      name = normalized.slice(t.length).trim().replace(/^["«\s]+|["»\s]+$/g, "").trim();
      break;
    }
  }

  return { raw, value: { orgType, name } };
}

export function parseCompany(raw: RawLicense): CompanyData {
  return {
    identity: parseIdentity(raw.company),
    inn: parseInn(raw.inn),
    manager: parsePassthrough(raw.manager),
    phone: parsePassthrough(raw.phone),
    country: parsePassthrough(raw.country),
    address: parsePassthrough(raw.address),
    founders: parsePassthrough(raw.founders),
  };
}
