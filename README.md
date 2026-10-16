# ПИВЗАВОД — Архангельск

React + Vite + TypeScript (strict), Tailwind, React Router, React Hook Form + Zod, Vitest.
Бэкенд: serverless-функции Vercel в `/api`, данные в Supabase, вход через Telegram Login Widget.

## Запуск с нуля (можно целиком с телефона)

1. **Бот.** В @BotFather: `/newbot` → получите токен и username. Затем `/setdomain` → домен вашего Vercel-проекта (без https://). Виджет работает только на этом домене.
2. **База.** В Supabase → SQL Editor выполните `supabase/schema.sql` (повторный запуск безопасен, засевает 4 сорта пива).
3. **Vercel.** Импортируйте репозиторий и добавьте переменные из `.env.example`:
   `VITE_TELEGRAM_BOT_USERNAME`, `TELEGRAM_BOT_TOKEN`, `SESSION_SECRET` (32+ символа), `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ADMIN_TELEGRAM_IDS` (ваш числовой id из @userinfobot — вы станете первым администратором).
4. Деплой. Вход: `/login` → Telegram → `/register` (телефон, согласие) → `/account`, `/booking`.

Без Supabase API работает на in-memory хранилище: годится только для проверки.
Локально: `npm i`, `npx vercel dev` (фронт и /api вместе). Telegram-вход на localhost не работает, проверяйте на превью-деплое.

## Структура
- `src/content/site.ts` — весь контент (сорта, блоки, магазин): правится без касания JSX; точка подключения CMS.
- `src/auth` — контекст сессии, защита маршрутов, виджет Telegram.
- `src/lib/schemas.ts` — Zod-схемы, общие для форм и API.
- `api/` — `auth/telegram` (проверка HMAC-подписи), `auth/me`, `auth/logout`, `profile`, `bookings`.
- `api/_lib/db.ts` — единственное место работы с хранилищем: сюда подключаются CRM, платежи, другая БД.

Команды: `npm run dev | build | lint | test | format`.

## Роли и права

| Роль | Как получить | Что может |
|---|---|---|
| Гость | вход через Telegram + регистрация | профиль, свои брони |
| Пивной сомелье | заявка на `/apply` или приглашение | брать свободные экскурсии и заказы «своего пива», подтверждать и закрывать свои, писать заметки сомелье и сочетания к сортам |
| Менеджер | заявка или приглашение | все брони (статус, назначение сомелье), список пользователей, заметки по пиву |
| Администратор | `ADMIN_TELEGRAM_IDS` или приглашение от админа | всё: роли и блокировки, решения по заявкам персонала, приглашения, каталог пива |

Права описаны один раз в `src/lib/roles.ts` и проверяются на сервере (`api/_lib/guard.ts`); интерфейс только скрывает лишнее.
Нельзя менять собственную роль, приглашение одноразовое и с сроком, заблокированный пользователь теряет доступ сразу, все действия персонала пишутся в `audit_log`.

## Маршруты кабинета
`/apply`, `/invite/:code`, `/staff/bookings`, `/staff/beers`, `/staff/users`, `/staff/applications`, `/staff/invites`.
Функций Vercel всего 9 (лимит Hobby — 12): весь кабинет обслуживает `api/staff/[resource].ts`.
