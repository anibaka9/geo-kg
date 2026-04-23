import type { CanonicalCountry } from "./countries";
import type { CanonicalRegion } from "./regions";

export type Field<V, R = string> = {
  raw: R;
  value: V;
};

export interface CompanyIdentity {
  orgType: string | null;
  name: string;
}

export interface CompanyData {
  identity: Field<CompanyIdentity>;
  inn: Field<string>;
  manager: Field<string>;
  phone: Field<string[]>;
  country: Field<CanonicalCountry[]>;
  address: Field<string>;
  founders: Field<string>;
}

export interface Beneficiary {
  name: Field<string>;
  citizenship: Field<string>;
  position: Field<string>;
  address: Field<string>;
  share: Field<string>;
  year: Field<string>;
}

export interface License {
  id: Field<string>;
  licenseNumber: Field<string>;
  objectName: Field<string>;
  company: CompanyData;
  region: Field<CanonicalRegion | "">;
  district: Field<string>;
  ayilAymak: Field<string>;
  licenseValidity: Field<string>;
  minerals: Field<string[]>;
  workType: Field<string>;
  areaHa: Field<number | null>;
  status: Field<string>;
  polygon: Field<[number, number][], { x: string; y: string }>;
  beneficiaries: Field<Beneficiary[], string>;
  notes: Field<string>;
  sourceYear: 2025 | 2026;
}
