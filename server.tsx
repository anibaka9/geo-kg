import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { Layout } from "./src/components/Layout";
import { LicensesTable } from "./src/components/LicensesTable";
import { Pagination } from "./src/components/Pagination";
import type { License } from "./scripts/types";

const licenses = (await Bun.file("./output/licenses.json").json()) as License[];

const PAGE_SIZE = 50;

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
        <div class="max-w-screen-2xl mx-auto">
          <h1 class="text-2xl font-bold text-gray-800 mb-4">
            Горнодобывающие лицензии Кыргызстана
          </h1>
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
  .listen(3000, () => console.log("http://localhost:3000"));
