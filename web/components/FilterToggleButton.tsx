export function FilterToggleButton({ activeCount }: { activeCount: number }) {
  return (
    <button
      type="button"
      aria-expanded="false"
      aria-controls="filter-aside"
      class="lg:hidden inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm"
      onclick="const a=document.getElementById('filter-aside');const open=this.getAttribute('aria-expanded')==='true';this.setAttribute('aria-expanded',String(!open));a.classList.toggle('hidden');this.querySelector('svg')?.classList.toggle('rotate-180')"
    >
      Фильтры
      {activeCount > 0 && (
        <span class="bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5">
          {activeCount}
        </span>
      )}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="transition-transform"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}
