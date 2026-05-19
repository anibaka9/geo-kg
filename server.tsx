import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { Layout } from "@web/components/Layout";
import { LicensesListPage } from "@web/components/LicensesListPage";
import { LicensePage } from "@web/components/LicensePage";
import { MapPage } from "@web/components/MapPage";
import { licenses, byId, filterOptions, PAGE_SIZE } from "@web/data";
import { parseFilters, applyFilters, filtersToQs } from "@web/filters";
import { toGeoJsonFeatures } from "@web/geojson";

await Bun.build({
  entrypoints: ["./web/map.ts"],
  outdir: "./public",
  target: "browser",
  naming: "map.js",
  minify: true,
});

const MAP_HEAD = (
  <>
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" />
    <script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js" />
    <script src="/public/map.js" defer />
  </>
) as JSX.Element;

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
    const qs = filtersToQs(sp);

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
          qs={qs || undefined}
        />
      </Layout>
    );
  })
  .get("/map", ({ request }) => {
    const sp = new URL(request.url).searchParams;
    const filters = parseFilters(sp);
    const filtered = applyFilters(licenses, filters);
    const withCoords = filtered.filter((l) => l.polygon.value.length >= 1).length;
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
    const filtered = applyFilters(licenses, parseFilters(sp));
    const features = toGeoJsonFeatures(filtered);
    return new Response(JSON.stringify({ type: "FeatureCollection", features }), {
      headers: { "Content-Type": "application/geo+json" },
    });
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
  .get("/api/license/:id/fragment", ({ params }) => {
    const license = byId.get(params.id);
    if (!license) return new Response("Not found", { status: 404 });
    return new Response(String(<LicensePage license={license} hideBackLink />), {
      headers: { "Content-Type": "text/html" },
    });
  })
  .listen(3000, () => console.log("http://localhost:3000"));
