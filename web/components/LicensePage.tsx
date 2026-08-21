import type { License, MineralEntry, StatusData } from "@shared/types";
import { MineralBadge } from "./MineralBadge";

interface FieldRowProps {
  label: string;
  value: string | number | null | undefined;
  raw?: string;
  href?: string;
}

function FieldValue({ display, href }: { display: string; href?: string }) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary hover:underline underline-offset-4"
      >
        {display}
      </a>
    );
  }
  return <>{display}</>;
}

function FieldRow({ label, value, raw, href }: FieldRowProps) {
  const display =
    value !== null && value !== undefined && String(value).trim() !== "" ? String(value) : null;
  const showRaw = raw !== undefined && raw.trim() !== "" && raw.trim() !== display;
  return (
    <div class="grid grid-cols-3 gap-4 py-3 border-b border-border last:border-0">
      <dt class="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
        {label}
      </dt>
      <dd class="text-sm text-foreground col-span-2">
        {display ? (
          <FieldValue display={display} href={href} />
        ) : (
          <span class="text-muted-foreground">—</span>
        )}
        {showRaw && (
          <details class="mt-1">
            <summary class="text-xs text-muted-foreground/60 cursor-pointer hover:text-muted-foreground select-none w-fit">
              raw
            </summary>
            <p class="text-xs font-mono mt-1 text-muted-foreground break-all whitespace-pre-wrap">
              {raw}
            </p>
          </details>
        )}
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

function WorkTypeRow({ workType }: { workType: License["workType"] }) {
  const { value, raw } = workType;
  const showRaw = raw.trim() !== "" && raw.trim() !== value.join(", ");
  return (
    <div class="grid grid-cols-3 gap-4 py-3 border-b border-border">
      <dt class="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
        Вид работ
      </dt>
      <dd class="col-span-2">
        {value.length > 0 ? (
          <div class="flex flex-wrap gap-1">
            {value.map((v) => (
              <span class="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                {v}
              </span>
            ))}
          </div>
        ) : (
          <span class="text-sm text-muted-foreground">{raw.trim() || "—"}</span>
        )}
        {showRaw && (
          <details class="mt-1">
            <summary class="text-xs text-muted-foreground/60 cursor-pointer hover:text-muted-foreground select-none w-fit">
              raw
            </summary>
            <p class="text-xs font-mono mt-1 text-muted-foreground">{raw.trim()}</p>
          </details>
        )}
      </dd>
    </div>
  );
}

function MineralsRow({ minerals, raw }: { minerals: MineralEntry[]; raw: string }) {
  // Group by type, preserving order of first occurrence
  const byType = new Map<string, MineralEntry[]>();
  for (const m of minerals) {
    if (!byType.has(m.type)) byType.set(m.type, []);
    byType.get(m.type)!.push(m);
  }

  const showRaw = raw.trim() !== "" && raw.trim() !== minerals.map((m) => m.name).join(", ");

  return (
    <div class="grid grid-cols-3 gap-4 py-3 border-b border-border">
      <dt class="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
        Полезные ископаемые
      </dt>
      <dd class="col-span-2 space-y-2">
        {minerals.length === 0 ? (
          <span class="text-sm text-muted-foreground">—</span>
        ) : (
          [...byType.entries()].map(([type, items]) => (
            <div class="flex items-baseline gap-2 flex-wrap">
              <span class="text-xs text-muted-foreground shrink-0">{type}</span>
              <div class="flex flex-wrap gap-1">
                {items.map((m) => (
                  <MineralBadge name={m.name} group={m.group} type={m.type} />
                ))}
              </div>
            </div>
          ))
        )}
        {showRaw && (
          <details class="mt-1">
            <summary class="text-xs text-muted-foreground/60 cursor-pointer hover:text-muted-foreground select-none w-fit">
              raw
            </summary>
            <p class="text-xs font-mono mt-1 text-muted-foreground break-all whitespace-pre-wrap">
              {raw}
            </p>
          </details>
        )}
      </dd>
    </div>
  );
}

function StatusRow({ status, raw }: { status: StatusData; raw: string }) {
  let display: JSX.Element;

  if (status.isAnnulled) {
    display = (
      <div class="space-y-1">
        <span class="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
          Аннулирована
        </span>
        {(status.protocol || status.protocolDate) && (
          <p class="text-xs text-muted-foreground">
            {status.protocol && <>Протокол №{status.protocol}</>}
            {status.protocol && status.protocolDate && " "}
            {status.protocolDate && <>от {status.protocolDate}</>}
          </p>
        )}
      </div>
    );
  } else if (status.code) {
    const decoded = [status.mineralType, status.workStage].filter(Boolean).join(", ");
    display = (
      <div class="space-y-0.5">
        <span class="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          {status.code}
        </span>
        {decoded && <p class="text-xs text-muted-foreground">{decoded}</p>}
      </div>
    );
  } else {
    display = <span class="text-muted-foreground">—</span>;
  }

  const showRaw = raw.trim() !== "" && status.isAnnulled && raw.trim().length > 3;

  return (
    <div class="grid grid-cols-3 gap-4 py-3 border-b border-border last:border-0">
      <dt class="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
        Статус
      </dt>
      <dd class="text-sm text-foreground col-span-2">
        {display}
        {showRaw && (
          <details class="mt-1">
            <summary class="text-xs text-muted-foreground/60 cursor-pointer hover:text-muted-foreground select-none w-fit">
              raw
            </summary>
            <p class="text-xs font-mono mt-1 text-muted-foreground break-all whitespace-pre-wrap">
              {raw}
            </p>
          </details>
        )}
      </dd>
    </div>
  );
}

function companyDisplayName(license: License): string {
  const { orgType, name } = license.company.identity.value;
  if (!orgType) return name;
  return name ? `${orgType} "${name}"` : orgType;
}

export function LicensePage({
  license,
  hideBackLink,
}: {
  license: License;
  hideBackLink?: boolean;
}) {
  const hasBeneficiaries =
    Array.isArray(license.beneficiaries.value) && license.beneficiaries.value.length > 0;

  return (
    <div class="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        {!hideBackLink && (
          <a
            href="/"
            class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            ← Все лицензии
          </a>
        )}
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold tracking-tight text-foreground">
              {license.objectName.value}
            </h1>
            <p class="mt-1 text-sm text-muted-foreground">{license.licenseNumber.value}</p>
          </div>
          <span
            class={`shrink-0 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
              license.sourceYear === 2026
                ? "bg-green-50 text-green-700 ring-green-600/20"
                : "bg-muted text-muted-foreground ring-border"
            }`}
          >
            {license.sourceYear}
          </span>
        </div>
      </div>

      <Card title="Лицензия">
        <FieldRow label="Номер" value={license.licenseNumber.value} />
        <WorkTypeRow workType={license.workType} />
        <FieldRow label="Срок действия" value={license.licenseValidity.value} />
        <StatusRow status={license.status.value} raw={license.status.raw} />
        <MineralsRow minerals={license.minerals.value} raw={license.minerals.raw} />
        <FieldRow label="Площадь, га" value={license.areaHa.value} />
      </Card>

      <Card title="Местоположение">
        <FieldRow label="Регион" value={license.region.value} />
        <FieldRow label="Район" value={license.district.value} />
        <FieldRow label="Айыл аймак" value={license.ayilAymak.value} />
      </Card>

      <Card title="Компания">
        <FieldRow
          label="Наименование"
          value={companyDisplayName(license)}
          raw={license.company.identity.raw}
        />
        <FieldRow
          label="ИНН"
          value={license.company.inn.value}
          raw={license.company.inn.raw}
          href={
            license.company.inn.value
              ? `https://www.osoo.kg/inn/${license.company.inn.value}/`
              : undefined
          }
        />
        <FieldRow
          label="Руководитель"
          value={license.company.manager.value}
          raw={license.company.manager.raw}
        />
        <FieldRow
          label="Телефон"
          value={license.company.phone.value.join(", ")}
          raw={license.company.phone.raw}
        />
        <FieldRow label="Адрес" value={license.company.address.value} />
        {license.company.country.value.length > 0 ? (
          <div class="grid grid-cols-3 gap-4 py-3 border-b border-border last:border-0">
            <dt class="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
              Страна
            </dt>
            <dd class="text-sm text-foreground col-span-2 flex flex-wrap gap-2">
              {license.company.country.value.map((c) => (
                <span class="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                  {c}
                </span>
              ))}
              {license.company.country.raw &&
                license.company.country.raw.trim() !== "" &&
                license.company.country.raw.trim() !== license.company.country.value.join(", ") && (
                  <details class="w-full">
                    <summary class="text-xs text-muted-foreground/60 cursor-pointer hover:text-muted-foreground select-none w-fit">
                      raw
                    </summary>
                    <p class="text-xs font-mono mt-1 text-muted-foreground break-all whitespace-pre-wrap">
                      {license.company.country.raw}
                    </p>
                  </details>
                )}
            </dd>
          </div>
        ) : (
          <div class="grid grid-cols-3 gap-4 py-3 border-b border-border last:border-0">
            <dt class="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
              Страна
            </dt>
            <dd class="text-sm text-foreground col-span-2">
              <span class="text-muted-foreground">—</span>
              {license.company.country.raw && license.company.country.raw.trim() !== "" && (
                <details class="mt-1">
                  <summary class="text-xs text-muted-foreground/60 cursor-pointer hover:text-muted-foreground select-none w-fit">
                    raw
                  </summary>
                  <p class="text-xs font-mono mt-1 text-muted-foreground break-all whitespace-pre-wrap">
                    {license.company.country.raw}
                  </p>
                </details>
              )}
            </dd>
          </div>
        )}
        <FieldRow label="Учредители" value={license.company.founders.value} />
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
