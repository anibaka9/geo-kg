import type { RawLicense } from "./types";
import type { License, Field } from "@shared/types";
import { parsePassthrough } from "./parsers/passthrough";
import { parseMinerals } from "./parsers/minerals";
import { parseArea } from "./parsers/area";
import { parseCoords } from "./parsers/coords";
import { parseLocation } from "./parsers/location";
import { parseRegion } from "./parsers/region";
import { parseAyilAymak } from "./parsers/ayilAymak";
import { parseLicenseValidity } from "./parsers/licenseValidity";
import { parseBeneficiaries } from "./parsers/beneficiaries";
import { parseWorkType } from "./parsers/workType";
import { parseCompany } from "./parsers/company";
import { parseStatus } from "./parsers/status";

export function normalize(raw: RawLicense): License {
  const { district } = parseLocation(raw.location);

  return {
    id: parsePassthrough(raw.id),
    licenseNumber: parsePassthrough(raw.licenseNumber),
    objectName: parsePassthrough(raw.objectName),
    company: parseCompany(raw),
    region: parseRegion(raw.location, raw.region),
    district,
    ayilAymak: parseAyilAymak(raw.ayilAymak),
    licenseValidity: parseLicenseValidity(raw.licenseValidity),
    minerals: parseMinerals(raw.minerals),
    workType: parseWorkType(raw.workType),
    areaHa: parseArea(raw.area),
    status: parseStatus(raw.status),
    polygon: parseCoords(raw.coordX, raw.coordY),
    beneficiaries: parseBeneficiaries(raw),
    notes: parsePassthrough(raw.notes),
    sourceYear: raw.sourceYear,
  };
}
