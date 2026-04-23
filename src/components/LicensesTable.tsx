import type { License } from "../../scripts/types";

interface LicensesTableProps {
  items: License[];
  offset: number;
}

function Truncate({ text, maxW = "max-w-40" }: { text: string; maxW?: string }) {
  if (!text) return <span class="text-gray-300">—</span>;
  return (
    <span class={`block truncate ${maxW}`} title={text}>
      {text}
    </span>
  );
}

export function LicensesTable({ items, offset }: LicensesTableProps) {
  return (
    <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
            <th class="sticky top-0 bg-gray-100 px-3 py-2 border-b border-gray-200 font-semibold w-10">#</th>
            <th class="sticky top-0 bg-gray-100 px-3 py-2 border-b border-gray-200 font-semibold">Номер лицензии</th>
            <th class="sticky top-0 bg-gray-100 px-3 py-2 border-b border-gray-200 font-semibold">Объект</th>
            <th class="sticky top-0 bg-gray-100 px-3 py-2 border-b border-gray-200 font-semibold">Компания</th>
            <th class="sticky top-0 bg-gray-100 px-3 py-2 border-b border-gray-200 font-semibold">Регион</th>
            <th class="sticky top-0 bg-gray-100 px-3 py-2 border-b border-gray-200 font-semibold">Минералы</th>
            <th class="sticky top-0 bg-gray-100 px-3 py-2 border-b border-gray-200 font-semibold w-16 text-right">Га</th>
            <th class="sticky top-0 bg-gray-100 px-3 py-2 border-b border-gray-200 font-semibold w-16">Год</th>
          </tr>
        </thead>
        <tbody>
          {items.map((license, i) => (
            <tr
              class="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors duration-100 cursor-pointer"
              onclick={`window.location='/license/${license.id.value}'`}
            >
              <td class="px-3 py-1.5 border-b border-gray-100 text-gray-400 tabular-nums text-xs">
                {offset + i + 1}
              </td>
              <td class="px-3 py-1.5 border-b border-gray-100">
                <a
                  href={`/license/${license.id.value}`}
                  class="text-blue-600 hover:underline"
                  onclick="event.stopPropagation()"
                >
                  <Truncate text={license.licenseNumber.value} maxW="max-w-52" />
                </a>
              </td>
              <td class="px-3 py-1.5 border-b border-gray-100">
                <Truncate text={license.objectName.value} maxW="max-w-44" />
              </td>
              <td class="px-3 py-1.5 border-b border-gray-100">
                <Truncate text={license.company.value} maxW="max-w-52" />
              </td>
              <td class="px-3 py-1.5 border-b border-gray-100">
                <Truncate text={license.region.value} maxW="max-w-32" />
              </td>
              <td class="px-3 py-1.5 border-b border-gray-100">
                <Truncate
                  text={license.minerals.value.join(", ")}
                  maxW="max-w-36"
                />
              </td>
              <td class="px-3 py-1.5 border-b border-gray-100 tabular-nums text-right text-gray-700">
                {license.areaHa.value !== null ? license.areaHa.value : <span class="text-gray-300">—</span>}
              </td>
              <td class="px-3 py-1.5 border-b border-gray-100">
                <span
                  class={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                    license.sourceYear === 2026
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {license.sourceYear}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
