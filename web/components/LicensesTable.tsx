import type { License } from "@shared/types";

interface LicensesTableProps {
  items: License[];
  offset: number;
}

function Truncate({ text, maxW = "max-w-40" }: { text: string; maxW?: string }) {
  if (!text) return <span class="text-muted-foreground">—</span>;
  return (
    <span class={`block truncate ${maxW}`} title={text}>
      {text}
    </span>
  );
}

function YearBadge({ year }: { year: 2025 | 2026 }) {
  return (
    <span class={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
      year === 2026
        ? "bg-green-50 text-green-700 ring-green-600/20"
        : "bg-muted text-muted-foreground ring-border"
    }`}>
      {year}
    </span>
  );
}

export function LicensesTable({ items, offset }: LicensesTableProps) {
  return (
    <div class="rounded-lg border border-border overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border bg-muted/50">
            <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-10">#</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Номер лицензии</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Объект</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Компания</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Регион</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Минералы</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">Га</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">Год</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border bg-card">
          {items.map((license, i) => (
            <tr
              class="hover:bg-muted/40 transition-colors cursor-pointer"
              onclick={`window.location='/license/${license.id.value}'`}
            >
              <td class="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                {offset + i + 1}
              </td>
              <td class="px-4 py-3">
                <a
                  href={`/license/${license.id.value}`}
                  class="text-primary hover:underline underline-offset-4 font-medium"
                  onclick="event.stopPropagation()"
                >
                  <Truncate text={license.licenseNumber.value} maxW="max-w-52" />
                </a>
              </td>
              <td class="px-4 py-3 text-foreground">
                <Truncate text={license.objectName.value} maxW="max-w-44" />
              </td>
              <td class="px-4 py-3 text-foreground">
                <Truncate text={license.company.value} maxW="max-w-52" />
              </td>
              <td class="px-4 py-3 text-foreground">
                <Truncate text={license.region.value} maxW="max-w-32" />
              </td>
              <td class="px-4 py-3 text-foreground">
                <Truncate text={license.minerals.value.join(", ")} maxW="max-w-36" />
              </td>
              <td class="px-4 py-3 tabular-nums text-right text-foreground">
                {license.areaHa.value !== null
                  ? license.areaHa.value
                  : <span class="text-muted-foreground">—</span>}
              </td>
              <td class="px-4 py-3">
                <YearBadge year={license.sourceYear} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
