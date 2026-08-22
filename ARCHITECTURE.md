# Architecture

Веб-приложение для просмотра лицензий на недропользование в Кыргызстане. Данные берутся из CSV-выгрузок госреестра, парсятся и нормализуются, затем отдаются через SSR-сервер.

---

## Структура

```
geo-kg/
├── server.tsx              # HTTP-сервер (Elysia), маршруты, SSR
├── build.ts                # Сборка ассетов (map.js, turbo.js, output.css)
├── shared/                 # Общие типы и справочники
│   ├── types.ts            # License, Field<V,R>, MineralEntry
│   ├── regions.ts          # Канонические названия регионов КР
│   ├── countries.ts        # Канонические названия стран
│   └── geojson.ts          # License → GeoJSON Feature (нужен и db/, и web/)
├── db/                     # SQLite-схема и доступ (общий для parser/ и web/)
│   ├── schema.ts           # DDL + SCHEMA_VERSION
│   ├── client.ts           # openDb(path) — read-only, проверка версии схемы
│   ├── write.ts            # buildDatabase(licenses, outPath) — полная пересборка
│   └── rows.ts             # Типы строк БД, hydrate(row) → License
├── parser/                 # Pipeline парсинга/нормализации CSV
│   ├── parse.ts            # Точка входа: читает CSV, пишет licenses.db
│   ├── csv.ts              # Загрузка CSV (PapaParse)
│   ├── normalize.ts        # Оркестрация парсеров полей
│   ├── types.ts            # RawLicense — схема одной строки CSV
│   ├── parsers/            # Парсеры отдельных полей
│   └── overrides/          # Ручные правки (имена, компании, строки)
├── web/                    # Веб-слой
│   ├── repository.ts       # buildWhere + Repository — все SQL-запросы здесь
│   ├── filters.ts          # Типы ActiveFilters/FilterOptions, parseFilters, filtersToQs
│   ├── map.ts              # Клиентский JS для MapLibre GL
│   ├── input.css           # Tailwind input
│   └── components/         # JSX-компоненты (SSR)
└── public/                 # Скомпилированные ассеты (не в git, собираются bun run build)
    ├── output.css          # Tailwind output
    ├── map.js               # Скомпилированный map.ts
    └── turbo.js             # Скомпилированный Hotwired Turbo
```

---

## Компоненты

### server.tsx

Точка входа сервера. Использует **Elysia** + плагин `@elysiajs/html` для SSR через JSX.

Маршруты:

- `GET /` — таблица лицензий (фильтры + пагинация)
- `GET /map` — карта (MapLibre GL)
- `GET /license/:id` — страница одной лицензии
- `GET /api/features.geojson` — GeoJSON для карты (с фильтрами)
- `GET /api/license/:id/fragment` — HTML-фрагмент для бокового панели карты

Данные читаются из `output/licenses.db` (SQLite) через `web/repository.ts` — ничего не загружается
в память при старте. Каждый запрос выполняет параметризованный SQL-запрос, построенный `buildWhere`.

---

### parser/

**Цель:** превратить грязные CSV-выгрузки в чистую SQLite-базу `licenses.db`.

```
CSV (2025.csv, 2026.csv)
  → csv.ts (PapaParse, нормализация заголовков)
  → parse.ts (дедупликация по номеру лицензии, merge 2025+2026)
  → normalize.ts (применяет parsers/* к каждой строке)
  → db/write.ts::buildDatabase (схема, индексы, FTS5, filter_options)
  → output/licenses.db
```

**Запуск:** `bun run parse` (или `bun parser/parse.ts --json`, чтобы дополнительно
записать diffable `output/licenses.json` — сам сервер его не читает).

#### parsers/

Каждый парсер — функция `(raw: string) => Field<T>` или аналог. Результат всегда содержит и `raw` (оригинал), и `value` (нормализованное значение).

| Парсер               | Что делает                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `coords.ts`          | Конвертация СК-42 (Гаусс-Крюгер, зоны 12/13) → WGS84; repair алгоритм для битых координат |
| `minerals.ts`        | Разбиение строки минералов на массив, нормализация к каноническим именам                  |
| `company.ts`         | Извлечение орг. формы (ОсОО/АО/ИП/...), имени менеджера, ИНН                              |
| `region.ts`          | Fuzzy-matching ~80 regex-паттернов для кириллических вариантов написания                  |
| `status.ts`          | Парсинг статуса лицензии, обнаружение аннулирований                                       |
| `beneficiaries.ts`   | Извлечение данных о бенефициарах (только в 2026)                                          |
| `country.ts`         | Канонизация названий стран                                                                |
| `location.ts`        | Разбиение "регион + район" на отдельные поля                                              |
| `licenseValidity.ts` | Парсинг срока действия лицензии                                                           |
| `workType.ts`        | Категоризация вида работ                                                                  |
| `area.ts`            | Площадь в гектарах                                                                        |
| `phone.ts`           | Нормализация номеров телефонов                                                            |
| `inn.ts`             | Валидация ИНН                                                                             |
| `address.ts`         | Адрес                                                                                     |
| `district.ts`        | Район                                                                                     |
| `founders.ts`        | Учредители                                                                                |
| `ayilAymak.ts`       | Айыл аймак                                                                                |
| `passthrough.ts`     | Identity — без преобразования                                                             |

#### overrides/

Ручные правки для данных, которые невозможно вычислить автоматически:

- `manager.ts` — 16 записей с исправлениями имён руководителей
- `company.ts` — исправления названий компаний
- `country.ts` — исправления стран
- `minerals.ts` — маппинг и расширение названий минералов
- `rows.ts` — правки на уровне отдельных строк CSV

---

### shared/

Типы и справочные данные, используемые и парсером, и веб-слоем.

**`types.ts`** — ключевые типы:

```ts
// Обёртка для каждого поля: сохраняет и оригинал, и нормализованное значение
type Field<V, R = string> = { raw: R; value: V };

type MineralEntry = { name: string; group: MineralGroup };

type License = {
  id: number;
  licenseNumber: Field<string>;
  company: Field<CompanyInfo>;
  minerals: Field<MineralEntry[]>;
  coords: Field<WGS84Coords | null, RawCoords>;
  region: Field<string | null>;
  // ... ~20 полей
};
```

**`regions.ts`** — 9 регионов (7 областей + Бишкек + Ош).

**`countries.ts`** — список канонических названий стран.

---

### web/

#### repository.ts

`buildWhere(filters)` переводит `ActiveFilters` в SQL `WHERE` + параметры — единственное место,
где UI-фильтры превращаются в SQL. `Repository` — тонкий класс поверх открытого `Database`:
`countLicenses`, `listLicenses` (пагинация через `ORDER BY ord LIMIT/OFFSET`), `getLicenseById`,
`getFilterOptions` (читает предвычисленную таблицу `filter_options`, без агрегации по всем
записям на каждый запрос), `geojsonBody` (склеивает предвычисленные `geojson_feature` без
JSON-парсинга/сериализации на каждый запрос).

Поддерживает:

- Мультиселект (`region IN (?, ...)`, `EXISTS` против join-таблиц для minerals/workType/country)
- Диапазоны (`areaMin`, `areaMax`) — невалидное число исключает все записи (сохранённая особенность
  прежней in-memory реализации)
- Полнотекстовый поиск: FTS5 с токенайзером `trigram` (фразовый запрос — сохраняет substring-
  семантику `.includes()`) для запросов от 3 символов; `LIKE` по предвычисленной lowercase-колонке
  для более коротких запросов (trigram не индексирует короче 3 символов, а `LIKE`/`lower()` в SQLite
  не умеют в кириллицу — поэтому lowercase считается в JS на этапе записи)

#### filters.ts

Типы `ActiveFilters`/`FilterOptions` и чистые функции без побочных эффектов: `parseFilters`
(query string → `ActiveFilters`), `filtersToQs` (сериализация обратно, без `page`).

#### map.ts

Клиентский TypeScript. Компилируется в `public/map.js`. Инициализирует MapLibre GL, загружает GeoJSON через `/api/features.geojson`, обрабатывает клики по полигонам (загружает HTML-фрагмент в боковую панель).

#### components/

JSX-компоненты для SSR (рендерятся на сервере в HTML-строку, без React).

| Компонент              | Описание                                            |
| ---------------------- | --------------------------------------------------- |
| `Layout.tsx`           | HTML-оболочка с `<head>`, подключением CSS          |
| `LicensesListPage.tsx` | Главная страница: таблица + боковая панель фильтров |
| `FilterPanel.tsx`      | Форма фильтров (submit → GET /)                     |
| `LicensesTable.tsx`    | Таблица лицензий                                    |
| `Pagination.tsx`       | Постраничная навигация                              |
| `NavTabs.tsx`          | Переключатель "Таблица / Карта"                     |
| `MapPage.tsx`          | Страница карты, подключает MapLibre                 |
| `LicensePage.tsx`      | Страница одной лицензии                             |
| `MineralBadge.tsx`     | Цветной бейдж для типа минерала                     |

---

## Паттерны

### Field<V, R>

Каждое поле хранит и оригинальное, и нормализованное значение:

```ts
type Field<V, R = string> = { raw: R; value: V };
```

Позволяет в UI показывать оригинальные данные рядом с нормализованными, что важно для аудита качества данных.

### Coordinate Repair

Координаты в данных часто битые — неправильная зона, лишние/пропущенные цифры. Алгоритм в `coords.ts`:

1. Определяет зону СК-42 (12 или 13) по величине абсциссы
2. Пробует вставку/удаление цифры в нортинге для repair
3. Проверяет попадание в bounding box Кыргызстана (lat 35–48, lon 60–85)
4. Outlier detection: точки дальше медианы отбрасываются

### SSR без гидратации

Таблица, фильтры и пагинация — чистый HTML. Никакого JS на клиенте для table view. Фильтры — `<form method="GET">`, пагинация — обычные ссылки. Карта использует отдельный клиентский bundle только там где нужна.

### SQLite на каждый запрос

`output/licenses.db` пересобирается из CSV за ~3с (`bun run parse`). Веб-сервер ничего не грузит в
память при старте — каждый запрос выполняет параметризованный SQL через `web/repository.ts`.
Схема — гибридная нормализация: колонки для `WHERE`/`ORDER BY`/`JOIN`, плюс колонка `doc` с полным
`JSON.stringify(License)` на строку — так что `hydrate(row) = JSON.parse(row.doc)` и ни один
SSR-компонент не пришлось переписывать под миграцию.

### Overrides как явный слой

Ручные правки вынесены в отдельную папку `overrides/` и не смешаны с логикой парсеров. Парсер применяет override-карту поверх автоматического результата.

---

## Команды

```sh
# Парсинг данных → output/licenses.db
bun run parse

# Сборка ассетов (map.js, turbo.js, output.css) — один раз, до старта
bun run build

# Сборка ассетов (watch) — второй терминал при разработке
bun run build:watch

# Сервер (dev): собирает ассеты один раз, затем bun --hot server.tsx
bun run dev

# Сервер (prod): без сборки, предполагает что bun run build уже выполнен
bun run start
```
