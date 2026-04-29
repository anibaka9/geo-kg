import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { Layout } from "@web/components/Layout";
import { LicensesListPage } from "@web/components/LicensesListPage";
import { LicensePage } from "@web/components/LicensePage";
import { licenses, byId, filterOptions, PAGE_SIZE } from "@web/data";
import { parseFilters, applyFilters, filtersToQs } from "@web/filters";

new Elysia()
  .use(html())
  .use(staticPlugin())
  .get("/", ({ query, request }) => {
    const sp = new URL(request.url).searchParams;
    const filters = parseFilters(sp);
    const filtered = applyFilters(licenses, filters);

    const page = Math.max(1, Number(query.page) || 1);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const safePage = Math.min(page, Math.max(1, totalPages));
    const offset = (safePage - 1) * PAGE_SIZE;

    return (
      <Layout title="Лицензии КР">
        <LicensesListPage
          filters={filters}
          filterOptions={filterOptions}
          items={filtered.slice(offset, offset + PAGE_SIZE)}
          offset={offset}
          page={safePage}
          totalPages={totalPages}
          total={filtered.length}
          totalAll={licenses.length}
          pageSize={PAGE_SIZE}
          qs={filtersToQs(sp) || undefined}
        />
      </Layout>
    );
  })
  .get("/license/:id", ({ params }) => {
    const license = byId.get(params.id);
    if (!license) {
      return new Response("Лицензия не найдена", { status: 404 });
    }
    return (
      <Layout title={`${license.objectName.value} — Лицензии КР`}>
        <LicensePage license={license} />
      </Layout>
    );
  })
  .listen(3000, () => console.log("http://localhost:3000"));
