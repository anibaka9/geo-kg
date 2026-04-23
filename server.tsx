import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { Layout } from "@web/components/Layout";
import { LicensesTable } from "@web/components/LicensesTable";
import { Pagination } from "@web/components/Pagination";
import { LicensePage } from "@web/components/LicensePage";
import type { License } from "@shared/types";

const licenses = (await Bun.file("./output/licenses.json").json()) as License[];
const byId = new Map(licenses.map((l) => [l.id.value, l]));

const PAGE_SIZE = 10;

new Elysia()
  .use(html())
  .use(staticPlugin())
  .get("/", ({ query }) => {
    const page = Math.max(1, Number(query.page) || 1);
    const totalPages = Math.ceil(licenses.length / PAGE_SIZE);
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * PAGE_SIZE;
    const items = licenses.slice(offset, offset + PAGE_SIZE);

    return (
      <Layout title="Лицензии КР">
        <div>
          <div class="mb-6">
            <h1 class="text-2xl font-semibold tracking-tight text-foreground">
              Лицензии
            </h1>
            <p class="mt-1 text-sm text-muted-foreground">
              Горнодобывающие лицензии Кыргызстана
            </p>
          </div>
          <LicensesTable items={items} offset={offset} />
          <Pagination
            page={safePage}
            totalPages={totalPages}
            total={licenses.length}
            pageSize={PAGE_SIZE}
          />
        </div>
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
