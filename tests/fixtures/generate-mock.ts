import type { License } from "@shared/types";

function fld<V>(raw: string, value: V): { raw: string; value: V } {
  return { raw, value };
}

function company(orgType: string | null, name: string, country?: string): License["company"] {
  return {
    identity: fld(`${orgType} ${name}`, { orgType, name }),
    inn: fld("", ""),
    manager: fld("Иванов И.И.", "Иванов И.И."),
    phone: fld("0555123456", ["0555123456"]),
    country: fld(country ?? "Кыргызстан", (country ? [country] : ["Кыргызстан"]) as License["company"]["country"]["value"]),
    address: fld("г. Бишкек", "г. Бишкек"),
    founders: fld("Иванов - 100%", "Иванов - 100%"),
  };
}

function status(code: string | null, isAnnulled = false, protocol?: string, protocolDate?: string): License["status"] {
  return fld(code ?? "Аннулирована", {
    code,
    mineralType: null,
    workStage: null,
    isAnnulled,
    protocol: protocol ?? null,
    protocolDate: protocolDate ?? null,
  });
}

function emptyCoords(): License["polygon"] {
  return fld("", []);
}

function pointCoords(lat: number, lon: number): License["polygon"] {
  return fld("", [[lat, lon]]);
}

const regions = [
  "Чуйская область",
  "Ошская область",
  "Баткенская область",
  "Джалал-Абадская область",
  "Иссык-Кульская область",
  "Нарынская область",
  "Таласская область",
] as const;

const mineralTypes = [
  { name: "золото", type: "благородные металлы", group: "металлы" },
  { name: "медь", type: "цветные металлы", group: "металлы" },
  { name: "уголь", type: "каменный уголь", group: "топливо" },
  { name: "песок", type: "строительный песок", group: "строительные материалы" },
  { name: "подземные воды", type: "подземные воды", group: "вода" },
];

const workTypes = [
  ["поисково-оценочные работы"],
  ["разведочные работы"],
  ["эксплуатационные работы"],
  ["поисково-оценочные работы", "разведочные работы"],
];

const countries = ["Кыргызстан", "Китай", "Россия", "Казахстан"] as const;

const orgTypes = ["ОсОО", "АО", "ИП"] as const;

const companyNames = [
  "Кыргызалтын",
  "Горная компания",
  "Золотые недра",
  "Каменный карьер",
  "Водный ресурс",
  "Медный рудник",
  "Талас-Голд",
  "Нарын-Энерго",
  "Баткен-Минералс",
  "Иссык-Куль Инвест",
];

function makeLicense(
  id: number,
  overrides: Partial<{
    region: string;
    minerals: { name: string; type: string; group: string }[];
    workType: string[];
    area: number | null;
    annulled: boolean;
    year: 2025 | 2026;
    country: string;
    orgType: string | null;
    companyName: string;
    coords: "none" | "point" | "borehole";
  }> = {},
): License {
  const r = overrides.region ?? regions[id % regions.length]!;
  const m = overrides.minerals ?? [mineralTypes[id % mineralTypes.length]!];
  const w = overrides.workType ?? workTypes[id % workTypes.length]!;
  const a = overrides.area ?? (overrides.area === null ? null : (id + 1) * 10);
  const y = overrides.year ?? (id % 2 === 0 ? 2025 : 2026);
  const c = overrides.country ?? countries[id % countries.length];
  const org = overrides.orgType ?? orgTypes[id % orgTypes.length]!;
  const name = overrides.companyName ?? companyNames[id % companyNames.length]!;
  const annulled = overrides.annulled ?? (id === 0);

  const objName = id === 0
    ? `скв ${id + 100}` // first is borehole for borehole detection test
    : `Месторождение №${id + 1}`;

  let coords: License["polygon"];
  if (overrides.coords === "none") {
    coords = emptyCoords();
  } else if (overrides.coords === "borehole" || annulled || (id === 0)) {
    coords = pointCoords(42.5 + id * 0.01, 74.5 + id * 0.01);
  } else {
    coords = pointCoords(42.5 + id * 0.01, 74.5 + id * 0.01);
  }

  return {
    id: fld(String(id + 1), String(id + 1)),
    licenseNumber: fld(`НМ ${id + 100}-02`, `НМ ${id + 100}-02`),
    objectName: fld(objName, objName),
    company: company(org, name, c),
    region: fld(r, r),
    district: fld(`${r.replace(" область", "ский")} район`, `${r.replace(" область", "ский")} район`),
    ayilAymak: fld("", ""),
    licenseValidity: fld("с 01.01.2020 по 31.12.2025", "с 01.01.2020 по 31.12.2025"),
    minerals: fld(m.map((x) => x.name).join(", "), m),
    workType: fld(w.join(", "), w),
    areaHa: fld(String(a), a),
    status: status(annulled ? null : "ВЕ", annulled, annulled ? "328" : undefined, annulled ? "23.06.17" : undefined),
    polygon: coords,
    beneficiaries: fld("", []),
    notes: fld("", ""),
    sourceYear: y,
  };
}

// Generate 28 licenses — tests pagination (25 per page → 2 pages)
const licenses: License[] = [];

// License 0: annulled, borehole (скв), Баткенская, золото
licenses.push(makeLicense(0, {
  region: "Баткенская область",
  minerals: [mineralTypes[0]!],
  annulled: true,
  companyName: "Золотые недра",
  orgType: "ОсОО",
  country: "Кыргызстан",
  coords: "borehole",
}));

// Licenses 1-6: Чуйская область, various minerals
for (let i = 1; i < 7; i++) {
  licenses.push(makeLicense(i, { region: "Чуйская область" }));
}

// Licenses 7-12: Ошская область, various minerals
for (let i = 7; i < 13; i++) {
  licenses.push(makeLicense(i, { region: "Ошская область" }));
}

// Licenses 13-18: Джалал-Абадская, water minerals, no coords for some
for (let i = 13; i < 19; i++) {
  licenses.push(makeLicense(i, {
    region: "Джалал-Абадская область",
    minerals: i < 16 ? [mineralTypes[4]!] : [mineralTypes[i % 4]!],
    coords: i % 2 === 0 ? "none" : "point",
  }));
}

// Licenses 19-23: Нарынская, Китай
for (let i = 19; i < 24; i++) {
  licenses.push(makeLicense(i, {
    region: "Нарынская область",
    country: "Китай",
    companyName: "Китайская горная",
    orgType: "АО",
    minerals: [mineralTypes[2]!], // уголь
    workType: workTypes[2]!, // эксплуатация
  }));
}

// Licenses 24-27: Разные регионы, разные страны, для пагинации
licenses.push(makeLicense(24, { region: "Таласская область", country: "Казахстан", coords: "none" }));
licenses.push(makeLicense(25, { region: "Иссык-Кульская область", country: "Россия", coords: "none", area: null }));
licenses.push(makeLicense(26, { region: "Чуйская область", minerals: [mineralTypes[2]!, mineralTypes[0]!], annulled: true, area: 500 }));
licenses.push(makeLicense(27, { region: "Ошская область", workType: workTypes[3]!, area: 200 }));

await Bun.write("tests/fixtures/mock-licenses.json", JSON.stringify(licenses, null, 2));
console.log(`Generated ${licenses.length} mock licenses`);
