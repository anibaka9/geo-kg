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
import { parseCompany } from "./parsers/company";
import { isCanonicalRegion } from "@shared/regions";

export function normalize(raw: RawLicense): License {
  const { district } = parseLocation(raw.location);
  const region = raw.region && isCanonicalRegion(raw.region)
    ? { raw: raw.region, value: raw.region }
    : parseRegion(raw.location);

  return {
    id: parsePassthrough(raw.id),
    licenseNumber: parsePassthrough(raw.licenseNumber),
    objectName: parsePassthrough(raw.objectName),
    company: parseCompany(raw),
    region,
    district,
    ayilAymak: parseAyilAymak(raw.ayilAymak),
    licenseValidity: parseLicenseValidity(raw.licenseValidity),
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
