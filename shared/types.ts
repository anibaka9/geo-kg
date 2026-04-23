export type Field<V, R = string> = {
  raw: R;
  value: V;
};

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
  beneficiaries: Field<Beneficiary[], string>;
  notes: Field<string>;
  sourceYear: 2025 | 2026;
}
