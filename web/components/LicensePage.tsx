import type { License } from "@shared/types";

interface FieldRowProps {
  label: string;
  value: string | number | null | undefined;
}

function FieldRow({ label, value }: FieldRowProps) {
  const display = value !== null && value !== undefined && String(value).trim() !== ""
    ? String(value)
    : null;
  return (
    <div class="grid grid-cols-3 gap-4 py-3 border-b border-border last:border-0">
      <dt class="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
        {label}
      </dt>
      <dd class="text-sm text-foreground col-span-2">
        {display ?? <span class="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

function Card({ title, children }: { title: string; children: JSX.Element | JSX.Element[] }) {
  return (
    <div class="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div class="px-6 py-4 border-b border-border">
        <h2 class="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div class="px-6 py-2">
        <dl>{children}</dl>
      </div>
    </div>
  );
}

export function LicensePage({ license }: { license: License }) {
  const hasBeneficiaries =
    Array.isArray(license.beneficiaries.value) && license.beneficiaries.value.length > 0;

  return (
    <div class="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <a
          href="/"
          class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          ← Все лицензии
        </a>
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold tracking-tight text-foreground">
              {license.objectName.value}
            </h1>
            <p class="mt-1 text-sm text-muted-foreground">{license.licenseNumber.value}</p>
          </div>
          <span class={`shrink-0 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
            license.sourceYear === 2026
              ? "bg-green-50 text-green-700 ring-green-600/20"
              : "bg-muted text-muted-foreground ring-border"
          }`}>
            {license.sourceYear}
          </span>
        </div>
      </div>

      <Card title="Лицензия">
        <FieldRow label="Номер" value={license.licenseNumber.value} />
        <FieldRow label="Вид работ" value={license.workType.value} />
        <FieldRow label="Срок действия" value={license.licenseValidity.value} />
        <FieldRow label="Статус" value={license.status.value} />
        <FieldRow label="Минералы" value={license.minerals.value.join(", ")} />
        <FieldRow label="Площадь, га" value={license.areaHa.value} />
      </Card>

      <Card title="Местоположение">
        <FieldRow label="Регион" value={license.region.value} />
        <FieldRow label="Район" value={license.district.value} />
        <FieldRow label="Айыл аймак" value={license.ayilAymak.value} />
      </Card>

      <Card title="Компания">
        <FieldRow label="Наименование" value={license.company.value} />
        <FieldRow label="ИНН" value={license.inn.value} />
        <FieldRow label="Руководитель" value={license.manager.value} />
        <FieldRow label="Телефон" value={license.phone.value} />
        <FieldRow label="Адрес" value={license.address.value} />
        <FieldRow label="Страна" value={license.country.value} />
        <FieldRow label="Учредители" value={license.founders.value} />
      </Card>

      {hasBeneficiaries && (
        <Card title="Бенефициары">
          {license.beneficiaries.value.map((b, i) => (
            <div class={`py-3 ${i > 0 ? "border-t border-border" : ""}`}>
              <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Бенефициар {i + 1}
              </p>
              <dl>
                <FieldRow label="Имя" value={b.name.value} />
                <FieldRow label="Гражданство" value={b.citizenship.value} />
                <FieldRow label="Должность" value={b.position.value} />
                <FieldRow label="Адрес" value={b.address.value} />
                <FieldRow label="Доля" value={b.share.value} />
                <FieldRow label="Год" value={b.year.value} />
              </dl>
            </div>
          ))}
        </Card>
      )}

      {license.notes.value && (
        <Card title="Примечания">
          <p class="py-3 text-sm text-foreground whitespace-pre-wrap">{license.notes.value}</p>
        </Card>
      )}

      {license.polygon.value.length > 0 && (
        <Card title="Координаты полигона">
          <div class="overflow-x-auto py-3">
            <table class="text-xs font-mono">
              <thead>
                <tr>
                  <th class="pr-8 pb-2 text-left font-medium text-muted-foreground">Широта</th>
                  <th class="pb-2 text-left font-medium text-muted-foreground">Долгота</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                {license.polygon.value.map(([lat, lon]) => (
                  <tr class="hover:bg-muted/40">
                    <td class="pr-8 py-1 tabular-nums text-foreground">{lat.toFixed(6)}</td>
                    <td class="py-1 tabular-nums text-foreground">{lon.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
