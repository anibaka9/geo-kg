import type { Field } from "@shared/types";
import { parsePassthrough } from "./passthrough";

export function parseLocation(raw: string): { region: Field<string>; district: Field<string> } {
  const [regionRaw = "", ...districtParts] = raw.split(",");
  return {
    region: parsePassthrough(regionRaw),
    district: parsePassthrough(districtParts.join(",").trim()),
  };
}
