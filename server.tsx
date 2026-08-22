import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { Layout } from "@web/components/Layout";
import { LicensesListPage } from "@web/components/LicensesListPage";
import { LicensePage } from "@web/components/LicensePage";
import { MapPage } from "@web/components/MapPage";
import { Repository, PAGE_SIZE } from "@web/repository";
import { parseFilters, filtersToQs } from "@web/filters";
import { openDb, resolveDatabasePath } from "./db/client";

if (!(await Bun.file("./public/output.css").exists())) {
  console.error("public/output.css not found. Run: bun run build");
  process.exit(1);
}

let repository: Repository;
try {
  repository = new Repository(openDb(resolveDatabasePath()));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const EMPTY_FILTERS = parseFilters(new URLSearchParams());
const filterOptions = repository.getFilterOptions();

const MAP_HEAD = (
  <>
    <link
      rel="stylesheet"
      href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css"
      data-turbo-track="reload"
    />
    <script
      src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"
      data-turbo-track="reload"
    ></script>
    <script src="/public/map.js" defer data-turbo-track="reload"></script>
  </>
) as JSX.Element;

new Elysia()
  .use(html())
  .use(staticPlugin())
  .get("/", ({ query, request }) => {
    const sp = new URL(request.url).searchParams;
    const filters = parseFilters(sp);

    const total = repository.countLicenses(filters);
    const totalAll = repository.countLicenses(EMPTY_FILTERS);
    const page = Math.max(1, Number(query.page) || 1);
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const safePage = Math.min(page, Math.max(1, totalPages));
    const offset = (safePage - 1) * PAGE_SIZE;
    const items = repository.listLicenses(filters, offset, PAGE_SIZE);
    const qs = filtersToQs(sp);

    return (
      <Layout title="Лицензии КР">
        <LicensesListPage
          filters={filters}
          filterOptions={filterOptions}
          items={items}
          offset={offset}
          page={safePage}
          totalPages={totalPages}
          total={total}
          totalAll={totalAll}
          pageSize={PAGE_SIZE}
          qs={qs || undefined}
        />
      </Layout>
    );
  })
  .get("/map", ({ request }) => {
    const sp = new URL(request.url).searchParams;
    const filters = parseFilters(sp);
    const withCoords = repository.countLicenses(filters, { onlyWithPolygon: true });
    const qs = filtersToQs(sp);

    return (
      <Layout title="Карта лицензий КР" headExtra={MAP_HEAD}>
        <MapPage
          filters={filters}
          filterOptions={filterOptions}
          total={withCoords}
          qs={qs || undefined}
        />
      </Layout>
    );
  })
  .get("/api/features.geojson", ({ request }) => {
    const sp = new URL(request.url).searchParams;
    const filters = parseFilters(sp);
    const body = repository.geojsonBody(filters);
    const etag = `"${Bun.hash(body).toString(36)}"`;

    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } });
    }

    return new Response(body, {
      headers: {
        "Content-Type": "application/geo+json",
        ETag: etag,
        "Cache-Control": "public, max-age=60, must-revalidate",
      },
    });
  })
  .get("/license/:id", ({ params }) => {
    const license = repository.getLicenseById(params.id);
    if (!license) {
      return new Response("Лицензия не найдена", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return (
      <Layout title={`${license.objectName.value} — Лицензии КР`}>
        <LicensePage license={license} />
      </Layout>
    );
  })
  .get("/api/license/:id/fragment", ({ params }) => {
    const license = repository.getLicenseById(params.id);
    if (!license)
      return new Response("Not found", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    return new Response(String(<LicensePage license={license} hideBackLink />), {
      headers: { "Content-Type": "text/html" },
    });
  })
  .listen(Number(process.env.PORT) || 3000, ({ hostname, port }) =>
    console.log(`http://${hostname}:${port}`),
  );
