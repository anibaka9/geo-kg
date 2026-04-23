interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export function Pagination({ page, totalPages, total, pageSize }: PaginationProps) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages: (number | "...")[] = [];
  const delta = 2;
  const left = page - delta;
  const right = page + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
      <span class="text-gray-500">
        Записи {from}–{to} из {total}
      </span>
      <div class="flex items-center gap-1">
        {page > 1 ? (
          <a
            href={`/?page=${page - 1}`}
            class="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
          >
            ← Пред.
          </a>
        ) : (
          <span class="px-3 py-1.5 rounded border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed">
            ← Пред.
          </span>
        )}

        {pages.map((p) =>
          p === "..." ? (
            <span class="px-2 py-1.5 text-gray-400">…</span>
          ) : p === page ? (
            <span class="px-3 py-1.5 rounded border border-blue-500 bg-blue-500 text-white font-medium">
              {p}
            </span>
          ) : (
            <a
              href={`/?page=${p}`}
              class="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
            >
              {p}
            </a>
          )
        )}

        {page < totalPages ? (
          <a
            href={`/?page=${page + 1}`}
            class="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
          >
            След. →
          </a>
        ) : (
          <span class="px-3 py-1.5 rounded border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed">
            След. →
          </span>
        )}
      </div>
    </div>
  );
}
