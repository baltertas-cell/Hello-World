# CRM — Реєстр порушень та шахрайства

CRM-система для відстеження порушень, шахрайства та їх результатів з імпортом з Excel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — запустити API сервер (порт 8080)
- `pnpm --filter @workspace/crm run dev` — запустити фронтенд CRM (порт 22444)
- `pnpm run typecheck` — повна перевірка типів по всіх пакетах
- `pnpm run build` — typecheck + збірка всіх пакетів
- `pnpm --filter @workspace/api-spec run codegen` — регенерувати API hooks та Zod schemas з OpenAPI spec
- `pnpm --filter @workspace/db run push` — застосувати зміни схеми БД (тільки dev)
- Необхідна env змінна: `DATABASE_URL` — рядок підключення до Postgres

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + multer (для Excel upload)
- DB: PostgreSQL + Drizzle ORM
- Excel: xlsx (читання та парсинг)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + TanStack Query + wouter + shadcn/ui
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI специфікація (source of truth)
- `lib/db/src/schema/records.ts` — схема таблиці записів (Drizzle)
- `artifacts/api-server/src/routes/records.ts` — всі маршрути для записів + Excel import
- `artifacts/crm/src/pages/` — сторінки фронтенду (dashboard, records list, new, detail/edit)
- `artifacts/crm/src/components/excel-import.tsx` — компонент імпорту Excel
- `artifacts/crm/src/components/record-form.tsx` — форма запису (всі 13 колонок)

## Architecture decisions

- Excel import реалізовано через окремий endpoint `/api/records/import` (multer + xlsx), не через OpenAPI codegen — бо multipart/form-data з File викликає конфлікти типів у Zod
- Всі 13 колонок з оригінальної Excel таблиці збережені в БД як nullable text
- Маршрут `/records/stats` реєструється ДО `/records/:id` щоб уникнути конфлікту параметрів
- Пошук через `ilike` по основних текстових полях (PostgreSQL)

## Product

- Панель управління зі статистикою (всього, шахрайство, внутрішнє, ОВС)
- Повний список записів з пошуком та фільтрацією
- Імпорт даних з Excel файлів (формат відповідає оригінальній таблиці)
- Ручне створення/редагування/видалення записів
- Деталізований перегляд кожного запису

## Колонки Excel (відповідність БД)

| Excel | DB field |
|---|---|
| Дата | date |
| Відносно мережі/ГО | networkOrg |
| по Факту | byFact |
| Підстава | basis |
| Ознаки шахрайства | fraudSigns |
| Внутрішнє шахрайство | internalFraud |
| Виявлено порушень | violationsFound |
| Завдано збитків | damagesCaused |
| Притягнуто до відповідальності/прийняті заходи | measuresTaken |
| Передано в ОВС | transferredToPolice |
| Результат ОВС | policeResult |
| Заявник / Потерпілий | applicantVictim |
| Стан контролю досудового розслідування | investigationStatus |

## Gotchas

- Після будь-яких змін в OpenAPI spec — обов'язково `pnpm --filter @workspace/api-spec run codegen`
- Після змін схеми БД — `pnpm --filter @workspace/db run push`
- Перед запуском api-server потрібен `DATABASE_URL` в env

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
