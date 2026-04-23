import Papa from "papaparse";
import { readFileSync } from "fs";
import type { RawLicense } from "./types";

function normalizeKey(k: string): string {
  return k.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getCol(row: Record<string, string>, ...candidates: string[]): string {
  for (const c of candidates) {
    const key = Object.keys(row).find((k) => normalizeKey(k) === normalizeKey(c));
    if (key !== undefined && row[key] !== undefined) return String(row[key]);
  }
  return "";
}


function rowToRaw(row: Record<string, string>, year: 2025 | 2026): RawLicense | null {
  const licenseNumber = getCol(row, "Номер лицензии", "№ лицензии");
  if (!licenseNumber.trim()) return null;

  return {
    id: getCol(row, "№"),
    licenseNumber,
    objectName: getCol(row, "Название объекта"),
    company: getCol(row, "Недропользователь"),
    location: getCol(row, "Месторасположение объекта, область, район"),
    licenseValidity: getCol(row, "№ и срок действия ЛС"),
    minerals: getCol(row, "Вид полезного ископаемого"),
    workType: getCol(row, "Целевое назначение работ"),
    area: getCol(row, "Размер площади, га"),
    status: getCol(row, "вид недр-я", "Статус"),
    inn: getCol(row, "ИНН"),
    manager: getCol(row, "ФИО руководителя", "Руководитель"),
    phone: getCol(row, "Телефон"),
    country: getCol(row, "Страны"),
    coordX: getCol(row, "координаты Х"),
    coordY: getCol(row, "координаты У"),
    address: getCol(
      row,
      "Адрес недропользователя",
      "Адрес, телефон, факс недропользователя, ФИО руководителя",
    ),
    founders: getCol(row, "Сведения об учредителях"),
    ayilAymak: getCol(row, "Айыльный аймак"),
    beneficiariesText: getCol(row, "Информация о бенефициарах (зеленый есть;синий ОсОО; красный нету)"),
    beneficiaryName: getCol(row, "ФИО бенефициара"),
    beneficiaryCitizenship: getCol(row, "Гражданство"),
    beneficiaryPosition: getCol(row, "Должность бенефициара"),
    beneficiaryAddress: getCol(row, "Контактный адрес"),
    beneficiaryShare: getCol(row, "Доля участия / доля голосов"),
    beneficiaryYear: getCol(row, "Год"),
    notes: getCol(row, "примечание"),
    sourceYear: year,
  };
}

export function loadRaw(filePath: string, year: 2025 | 2026): RawLicense[] {
  const content = readFileSync(filePath, "utf-8");
  const { data } = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  return data.flatMap((row) => {
    const raw = rowToRaw(row, year);
    return raw ? [raw] : [];
  });
}
