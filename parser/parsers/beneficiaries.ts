import type { RawLicense } from "../types";
import type { Beneficiary, Field } from "@shared/types";
import { parsePassthrough } from "./passthrough";

export function parseBeneficiaries(raw: RawLicense): Field<Beneficiary[], string> {
  if (raw.sourceYear === 2026 && raw.beneficiaryName.trim()) {
    return {
      raw: "",
      value: [
        {
          name: parsePassthrough(raw.beneficiaryName),
          citizenship: parsePassthrough(raw.beneficiaryCitizenship),
          position: parsePassthrough(raw.beneficiaryPosition),
          address: parsePassthrough(raw.beneficiaryAddress),
          share: parsePassthrough(raw.beneficiaryShare),
          year: parsePassthrough(raw.beneficiaryYear),
        },
      ],
    };
  }
  return { raw: raw.beneficiariesText, value: [] };
}
