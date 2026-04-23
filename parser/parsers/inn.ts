import type { Field } from "@shared/types";

const INVALID = /^(нет|нету|нет у|кр|нет данных)$/i;
const PREFIX = /^(ИНН|ИИН|ПИН)\s*/i;

export function parseInn(raw: string): Field<string> {
  let value = raw
    .trim()
    .replace(PREFIX, "")
    .trim()
    .replace(/[;,\.]+$/, "")
    .trim();

  if (!value || INVALID.test(value) || !/^\d+$/.test(value)) {
    return { raw, value: "" };
  }

  // Leading zero dropped (e.g. by Excel treating as number)
  if (value.length === 13) value = "0" + value;

  if (value.length !== 14) return { raw, value: "" };

  return { raw, value };
}
