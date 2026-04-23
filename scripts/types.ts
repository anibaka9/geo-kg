export type Field<V, R = string> = {
  raw: R;
  value: V;
};

// ---------------------------------------------------------------------------
// Raw types — plain strings extracted from CSV, no parsing yet
// ---------------------------------------------------------------------------

export interface RawLicense {
  id: string;
  licenseNumber: string;
  objectName: string;
  company: string;
  location: string; // "Область, район" — split later
  licenseValidity: string;
  minerals: string;
  workType: string;
  area: string;
  status: string;
  inn: string;
  manager: string;
  phone: string;
  country: string;
  coordX: string;
  coordY: string;
  address: string;
  founders: string;
  ayilAymak: string;
  beneficiariesText: string;       // 2025: raw text blob
  beneficiaryName: string;         // 2026
  beneficiaryCitizenship: string;  // 2026
  beneficiaryPosition: string;     // 2026
  beneficiaryAddress: string;      // 2026
  beneficiaryShare: string;        // 2026
  beneficiaryYear: string;         // 2026
  notes: string;
  sourceYear: 2025 | 2026;
}

// ---------------------------------------------------------------------------
// Normalized types — parsed and typed values with raw preserved
// ---------------------------------------------------------------------------

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
  company: Field<string>;
  region: Field<string>;
  district: Field<string>;
  ayilAymak: Field<string>;
  licenseValidity: Field<string>;
  minerals: Field<string[]>;
  workType: Field<string>;
  areaHa: Field<number | null>;
  status: Field<string>;
  inn: Field<string>;
  manager: Field<string>;
  phone: Field<string>;
  country: Field<string>;
  polygon: Field<[number, number][], { x: string; y: string }>;
  address: Field<string>;
  founders: Field<string>;
  // 2026: structured; 2025: raw text → value is [] until parsed later
  beneficiaries: Field<Beneficiary[], string>;
  notes: Field<string>;
  sourceYear: 2025 | 2026;
}
