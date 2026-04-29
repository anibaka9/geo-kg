interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  qs?: string;
}

export function Pagination({ page, totalPages, total, pageSize, qs }: PaginationProps) {
  const href = (p: number) => (qs ? `/?${qs}&page=${p}` : `/?page=${p}`);
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

  const btnBase = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 border";
  const btnDefault = `${btnBase} border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground`;
  const btnActive = `${btnBase} border-primary bg-primary text-primary-foreground`;
  const btnDisabled = `${btnBase} border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50`;

  return (
    <div class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p class="text-sm text-muted-foreground">
        Показано <span class="font-medium text-foreground">{from}–{to}</span> из{" "}
        <span class="font-medium text-foreground">{total}</span> записей
      </p>
      <div class="flex items-center gap-1">
        {page > 1 ? (
          <a href={href(page - 1)} class={btnDefault}>← Назад</a>
        ) : (
          <span class={btnDisabled}>← Назад</span>
        )}

        {pages.map((p) =>
          p === "..." ? (
            <span class="inline-flex items-center justify-center h-9 w-9 text-sm text-muted-foreground">
              …
            </span>
          ) : p === page ? (
            <span class={btnActive}>{p}</span>
          ) : (
            <a href={href(p)} class={btnDefault}>{p}</a>
          )
        )}

        {page < totalPages ? (
          <a href={href(page + 1)} class={btnDefault}>Далее →</a>
        ) : (
          <span class={btnDisabled}>Далее →</span>
        )}
      </div>
    </div>
  );
}
