import type { License } from "../../scripts/types";

interface FieldRowProps {
  label: string;
  value: string | number | null | undefined;
}

function FieldRow({ label, value }: FieldRowProps) {
  const display = value !== null && value !== undefined && String(value).trim() !== ""
    ? String(value)
    : null;
  return (
    <div class="grid grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-0">
      <dt class="text-xs font-medium text-gray-500 uppercase tracking-wide col-span-1 pt-0.5">{label}</dt>
      <dd class="text-sm text-gray-900 col-span-2">
        {display ?? <span class="text-gray-300">—</span>}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: JSX.Element | JSX.Element[] }) {
  return (
    <section class="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{title}</h2>
      <dl>{children}</dl>
    </section>
  );
}

export function LicensePage({ license }: { license: License }) {
  const hasBeneficiaries =
    Array.isArray(license.beneficiaries.value) && license.beneficiaries.value.length > 0;

  return (
    <div class="max-w-4xl mx-auto space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <a href="/" class="text-sm text-blue-600 hover:underline">← Все лицензии</a>
          <h1 class="text-xl font-bold text-gray-900 mt-1">{license.objectName.value}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{license.licenseNumber.value}</p>
        </div>
        <span
          class={`shrink-0 mt-1 inline-block px-2 py-1 rounded text-xs font-semibold ${
            license.sourceYear === 2026
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {license.sourceYear}
        </span>
      </div>

      <Section title="Лицензия">
        <FieldRow label="Номер" value={license.licenseNumber.value} />
        <FieldRow label="Вид работ" value={license.workType.value} />
        <FieldRow label="Срок действия" value={license.licenseValidity.value} />
        <FieldRow label="Статус" value={license.status.value} />
        <FieldRow label="Минералы" value={license.minerals.value.join(", ")} />
        <FieldRow label="Площадь, га" value={license.areaHa.value} />
      </Section>

      <Section title="Местоположение">
        <FieldRow label="Регион" value={license.region.value} />
        <FieldRow label="Район" value={license.district.value} />
        <FieldRow label="Айыл аймак" value={license.ayilAymak.value} />
      </Section>

      <Section title="Компания">
        <FieldRow label="Наименование" value={license.company.value} />
        <FieldRow label="ИНН" value={license.inn.value} />
        <FieldRow label="Руководитель" value={license.manager.value} />
        <FieldRow label="Телефон" value={license.phone.value} />
        <FieldRow label="Адрес" value={license.address.value} />
        <FieldRow label="Страна" value={license.country.value} />
        <FieldRow label="Учредители" value={license.founders.value} />
      </Section>

      {hasBeneficiaries && (
        <Section title="Бенефициары">
          {license.beneficiaries.value.map((b, i) => (
            <div class={`py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}>
              <p class="text-xs font-medium text-gray-400 uppercase mb-1">Бенефициар {i + 1}</p>
              <dl class="space-y-0">
                <FieldRow label="Имя" value={b.name.value} />
                <FieldRow label="Гражданство" value={b.citizenship.value} />
                <FieldRow label="Должность" value={b.position.value} />
                <FieldRow label="Адрес" value={b.address.value} />
                <FieldRow label="Доля" value={b.share.value} />
                <FieldRow label="Год" value={b.year.value} />
              </dl>
            </div>
          ))}
        </Section>
      )}

      {license.notes.value && (
        <Section title="Примечания">
          <p class="text-sm text-gray-700 whitespace-pre-wrap">{license.notes.value}</p>
        </Section>
      )}

      {license.polygon.value.length > 0 && (
        <Section title="Координаты полигона">
          <div class="overflow-x-auto">
            <table class="text-xs font-mono border-collapse">
              <thead>
                <tr class="text-gray-400">
                  <th class="pr-6 pb-1 text-left font-medium">Широта</th>
                  <th class="pb-1 text-left font-medium">Долгота</th>
                </tr>
              </thead>
              <tbody>
                {license.polygon.value.map(([lat, lon]) => (
                  <tr class="hover:bg-gray-50">
                    <td class="pr-6 py-0.5 tabular-nums">{lat.toFixed(6)}</td>
                    <td class="py-0.5 tabular-nums">{lon.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}
