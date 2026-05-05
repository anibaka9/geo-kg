import type { Field, CompanyData, CompanyIdentity } from "@shared/types";
import type { RawLicense } from "../types";
import { parseInn } from "./inn";
import { parsePassthrough } from "./passthrough";
import { parseCountry } from "./country";
import { parsePhone } from "./phone";
import { parseAddress } from "./address";
import { parseFounders } from "./founders";
import overrides from "../overrides/company";
import managerOverrides from "../overrides/manager";
import {
  COMPANY_NORMALIZATIONS,
  ORG_TYPES,
  INVALID_MANAGERS,
  MANAGER_PREFIX_STRIP,
} from "../data/company";

function parseIdentity(raw: string): Field<CompanyIdentity> {
  const overridden = overrides[raw.trim()] ?? raw;
  let normalized = overridden.trim();

  for (const [pattern, replacement] of COMPANY_NORMALIZATIONS) {
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

function cleanManager(value: string): string {
  for (const pattern of MANAGER_PREFIX_STRIP) {
    value = value.replace(pattern, "");
  }
  value = value.replace(/\s*%$/, "");
  value = value.replace(/\s*-\s*100\s*%?\s*$/, "");
  value = value.replace(/\(Написано по ЛС.*?\)/gi, "").trim();
  value = value.replace(/\s+/g, " ");

  // Висячие дефисы: "Фамилия И.О.-", "Фамилия Имя Отчество -"
  value = value.replace(/[-\s]+$/, "");

  // Запятая вместо пробела в ФИО: "Лю,Юаньлунь" → "Лю Юаньлунь"
  value = value.replace(/([а-яёa-z])\s*,\s*([а-яёa-z])/gi, "$1 $2");

  // Инициалы перед фамилией: "С.М.Ахунбаев" → "Ахунбаев С.М."
  const initialsFirst = value.match(/^([А-ЯЁ]\.\s*[А-ЯЁ]\.\s*)([А-ЯЁ][а-яё]+)/);
  if (initialsFirst) {
    value = `${initialsFirst[2]!} ${initialsFirst[1]!.trim()}`;
  }

  // Добавляем точку если инициалы без точки на конце: "Зикиров А.А" → "Зикиров А.А."
  const missingDot = value.match(/^(.+?\s+)?([А-ЯЁ]\.[А-ЯЁ])$/);
  if (missingDot && !value.endsWith(".")) {
    value = value + ".";
  }

  // Точка в конце полного ФИО (не инициалы): "Иванов Иван Иванович." → "Иванов Иван Иванович"
  const fullNamWithDot = value.match(/^[А-ЯЁ][а-яё]+(\s+[А-ЯЁ][а-яё]+)+\.$/);
  if (fullNamWithDot) {
    value = value.slice(0, -1);
  }

  return value;
}

function parseManager(raw: string): Field<string> {
  const trimmed = raw.trim().replace(/\s+/g, " ");

  if (INVALID_MANAGERS.has(trimmed)) {
    return { raw, value: "" };
  }

  const cleaned = cleanManager(trimmed);

  const overridden = managerOverrides[cleaned];
  if (overridden !== undefined) {
    return { raw, value: overridden };
  }

  return {
    raw,
    value: cleaned,
  };
}

export function parseCompany(raw: RawLicense): CompanyData {
  return {
    identity: parseIdentity(raw.company),
    inn: parseInn(raw.inn),
    manager: parseManager(raw.manager),
    phone: parsePhone(raw.phone),
    country: parseCountry(raw.country),
    address: parseAddress(raw.address),
    founders: parseFounders(raw.founders),
  };
}
