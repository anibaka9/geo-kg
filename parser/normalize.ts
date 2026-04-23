import type { RawLicense } from "./types";
import type { License } from "@shared/types";
import { parsePassthrough } from "./parsers/passthrough";
import { parseMinerals } from "./parsers/minerals";
import { parseArea } from "./parsers/area";
import { parseCoords } from "./parsers/coords";
import { parseLocation } from "./parsers/location";
import { parseBeneficiaries } from "./parsers/beneficiaries";
import { parseCompany } from "./parsers/company";

export function normalize(raw: RawLicense): License {
  const { region, district } = parseLocation(raw.location);

  return {
    id: parsePassthrough(raw.id),
    licenseNumber: parsePassthrough(raw.licenseNumber),
    objectName: parsePassthrough(raw.objectName),
    company: parseCompany(raw),
    region,
    district,
    ayilAymak: parsePassthrough(raw.ayilAymak),
    licenseValidity: parsePassthrough(raw.licenseValidity),
    minerals: parseMinerals(raw.minerals),
    workType: parsePassthrough(raw.workType),
    areaHa: parseArea(raw.area),
    status: parsePassthrough(raw.status),
    polygon: parseCoords(raw.coordX, raw.coordY),
    beneficiaries: parseBeneficiaries(raw),
    notes: parsePassthrough(raw.notes),
    sourceYear: raw.sourceYear,
  };
}
