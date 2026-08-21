# CLAUDE.md — geo-kg

## Команды

| Команда | Назначение |
|---------|-----------|
| `bun run dev` | Собрать CSS и запустить сервер с HMR |
| `bun run dev:server` | Запустить сервер с `--hot` (авто-перезагрузка) |
| `bun run dev:css` | Собрать CSS и пересобирать при изменениях |
| `bun run parse` | Прочитать `data/*.csv`, нормализовать, записать `output/licenses.json` |
| `bun run build:css` | Собрать CSS один раз (минифицированный) |
| `bun run typecheck` | Проверить типы — `bunx tsc --noEmit` |

## Суть проекта

Веб-приложение для просмотра лицензий на недропользование в Кыргызстане. Состоит из двух частей:
- **Parser** — пайплайн, который из грязных CSV-выгрузок госреестра делает чистый JSON
- **Web-сервер** — читает JSON и отдаёт SSR-страницы с таблицей и картой

## Стек

- **Bun** — рантайм, пакетный менеджер, бандлер. Никакого Node.js.
- **Elysia** — HTTP-фреймворк. Маршруты в `server.tsx`.
- **@kitajs/html** — рендерит JSX в HTML-строки на сервере. Реакта нет.
- **Tailwind CSS v4** — стили. Конфиг в `web/input.css`, выход в `public/output.css`.
- **Hotwire Turbo** — SPA-навигация без релоада страницы.
- **MapLibre GL** — карта на клиенте. Бандл: `public/map.js` (собирается из `web/map.ts`).
- **PapaParse** — парсинг CSV.
- **proj4** — конвертация координат СК-42 → WGS84.

## Где что лежит

```
server.tsx              # Точка входа: Elysia-сервер, маршруты, SSR
shared/                 # Типы и справочники — импортируются и парсером, и веб-слоем
parser/                 # Пайплайн CSV → JSON
  parse.ts              # CLI-вход: читает CSV, дедуплицирует, пишет JSON
  csv.ts                # Загрузка CSV (PapaParse) + маппинг колонок
  normalize.ts          # Оркестратор: применяет парсеры полей к RawLicense
  parsers/*.ts          # Парсеры отдельных полей (18 штук)
  data/*.ts             # Справочные данные для парсеров (имя → каноническое имя)
  overrides/*.ts        # Ручные правки, которые нельзя вычислить
web/                    # Веб-слой
  data.ts               # Загружает licenses.json, строит FilterOptions
  filters.ts            # parseFilters, applyFilters, filtersToQs
  geojson.ts            # License → GeoJSON Feature
  map.ts                # Клиентский JS для MapLibre GL (компилируется в public/map.js)
  input.css             # Tailwind CSS вход
  components/*.tsx      # JSX-компоненты для SSR
public/                 # Скомпилированные ассеты (в .gitignore кроме map.js)
```

## Как работает парсинг

```
CSV (data/2025.csv, data/2026.csv)
  → csv.ts: PapaParse, нормализация заголовков, fixColumnShift
  → parse.ts: дедупликация по короткому номеру лицензии (2026 побеждает 2025)
  → normalize.ts: применяет 18 парсеров к каждой строке
  → output/licenses.json
```

### Добавление нового парсера

1. Создать `parser/parsers/newField.ts` с функцией `parseNewField(raw: string) => Field<T>`
2. Импортировать и вызвать в `parser/normalize.ts`
3. Добавить поле в интерфейс `License` в `shared/types.ts`
4. Если нужно, добавить справочные данные в `parser/data/`

### Справочные данные и overrides

- `parser/data/` — маппинги вида `"грязное название" → "каноническое название"`. Только то, что вычисляется по правилам.
- `parser/overrides/` — ручные правки. Применяются в конце: overrides побеждают автоматический парсинг. Формат: ключ — короткий номер лицензии.

## Как работает веб-слой

Сервер при старте загружает `output/licenses.json` в память. Фильтры из query string (`?region=Chui&region=Osh&q=золото`) применяются через `Array.filter`. Пагинация — `slice(offset, offset + PAGE_SIZE)`. Базы данных нет.

### Добавление нового фильтра

1. Добавить поле в `ActiveFilters` в `web/filters.ts`
2. Добавить логику фильтрации в `applyFilters`
3. Добавить подсчёт опций в `buildFilterOptions`
4. Добавить UI в `FilterPanel.tsx`
5. Добавить парсинг из query string в `parseFilters`

### Компоненты

Все в `web/components/` — plain functions, возвращающие JSX.Element. Никакого React, состояния, хуков. Входные данные приходят через props. Компоненты рендерятся на сервере через `@kitajs/html`.

CSS-классы — Tailwind. Используются кастомные токены из темы в `web/input.css`:
- `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`
- Отдельные компоненты используют shadcn-like паттерн: `bg-card`, `bg-muted`

Интерактивность — через HTML-атрибуты:
- Фильтры: `<form method="GET">` — submit делает полный релоад страницы с query string
- Пагинация: обычные `<a href="/?page=2&...">`
- Сортировка: ссылки с query string
- Карта: отдельный JS-бандл (`web/map.ts`), только на `/map`

## Типы

### Field<V, R>

Каждое поле хранит и оригинал, и нормализованное значение:

```ts
type Field<V, R = string> = { raw: R; value: V }
```

Импортировать из `@shared/types`. В компонентах использовать `.value` для отображения (нормализованное), `.raw` — когда нужно показать оригинал для аудита.

### License

Корневой тип в `shared/types.ts`. Содержит ~20 полей, все — `Field<T>`. Примеры:
```ts
{ id: Field<string>, licenseNumber: Field<string>, minerals: Field<MineralEntry[]>, ... }
```

### RawLicense

Плоский тип в `parser/types.ts` — соответствует одной строке CSV. Все поля — `string`.

## Конвенции кода

- **Импорты**: использовать алиасы `@shared/*`, `@web/*`, `@parser/*`. Без относительных путей.
- **JSX**: функции, не стрелки. `export function Component(props: Props)`.
- **Типы**: интерфейсы для props компонентов, type для объединений/утилит.
- **Имена**: camelCase для переменных/функций, PascalCase для компонентов/типов.
- **noUncheckedIndexedAccess**: включён в tsconfig. Обращаться к массивам через `[0]!` или проверять.

## Нет тестов

В проекте нет тестов. Если добавляешь новую логику в парсеры или фильтры — стоит написать тесты через `bun test`.

## Карта

`web/map.ts` — единственный клиентский JS. Компилируется через `Bun.build()` в `public/map.js`. Использует глобальный `maplibre-gl` (загружается через CDN в `server.tsx`). Данные берёт через `/api/features.geojson`.

При редактировании `map.ts` сервер нужно перезапустить — `Bun.build()` выполняется при старте.
