-- Идемпотентная схема v2: безопасно запускать повторно, в том числе поверх первой версии.
create table if not exists users (
  telegram_id   bigint primary key,
  first_name    text not null,
  last_name     text,
  username      text,
  photo_url     text,
  full_name     text,
  phone         text,
  marketing     boolean not null default false,
  registered_at timestamptz,
  created_at    timestamptz not null default now()
);
alter table users add column if not exists role   text not null default 'customer' check (role in ('customer','sommelier','manager','admin'));
alter table users add column if not exists status text not null default 'active'   check (status in ('active','blocked'));

create table if not exists bookings (
  id          uuid primary key default gen_random_uuid(),
  telegram_id bigint not null references users(telegram_id) on delete cascade,
  kind        text not null check (kind in ('table','tour','event','custom-beer')),
  date        date not null,
  guests      int  not null check (guests between 1 and 120),
  comment     text,
  status      text not null default 'new',
  created_at  timestamptz not null default now()
);
alter table bookings add column if not exists assigned_to bigint references users(telegram_id) on delete set null;
alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check check (status in ('new','confirmed','done','cancelled'));

create table if not exists staff_applications (
  id               uuid primary key default gen_random_uuid(),
  telegram_id      bigint not null references users(telegram_id) on delete cascade,
  desired_role     text not null check (desired_role in ('sommelier','manager')),
  about            text not null,
  certificates     text,
  experience_years int  not null check (experience_years between 0 and 60),
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by      bigint,
  review_note      text,
  created_at       timestamptz not null default now()
);

create table if not exists invites (
  code       text primary key,
  role       text not null check (role in ('sommelier','manager','admin')),
  created_by bigint not null,
  expires_at timestamptz not null,
  used_by    bigint,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists beers (
  id            text primary key,
  name          text not null,
  style         text not null,
  family        text not null check (family in ('light','red','dark')),
  abv           text not null default '',
  ibu           int  not null default 0,
  color         text not null default '#D9A04D',
  description   text not null default '',
  tasting_notes text,
  pairing       text,
  published     boolean not null default true,
  sort          int not null default 0,
  updated_by    bigint,
  created_at    timestamptz not null default now()
);

create table if not exists audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor      bigint not null,
  action     text not null,
  target     text not null,
  meta       jsonb,
  created_at timestamptz not null default now()
);

-- Доступ только через серверный service key: политик нет, RLS включён.
alter table users enable row level security;
alter table bookings enable row level security;
alter table staff_applications enable row level security;
alter table invites enable row level security;
alter table beers enable row level security;
alter table audit_log enable row level security;

insert into beers (id, name, style, family, abv, ibu, color, description, sort) values
 ('severnoe','Северное','Светлый эль','light','5,2%',18,'#E8A93A','Лёгкий, освежающий вкус с нотами хлеба и цитрусов.',1),
 ('arhangelskoe','Архангельское','Красный эль','red','5,8%',25,'#9B3B20','Карамельный солод, лёгкая горчинка, аромат ягод.',2),
 ('belomorskiy','Беломорский','Стаут','dark','6,5%',40,'#2A1812','Глубокий вкус с нотами шоколада, кофе и дыма.',3),
 ('kiprey','Кипрей','IPA','light','6,8%',55,'#D9892B','Яркий хмелевой аромат, цитрусовые и цветочные ноты.',4)
on conflict (id) do nothing;

-- ===== Ракурсы: расписание, записи, паспорт гостя =====
create table if not exists rakurs_slots (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  starts_at    timestamptz not null,
  capacity     int  not null check (capacity between 1 and 30),
  price_rub    int  not null default 0 check (price_rub >= 0),
  sommelier_id bigint references users(telegram_id) on delete set null,
  status       text not null default 'open' check (status in ('open','closed','cancelled')),
  created_by   bigint not null,
  created_at   timestamptz not null default now()
);
create table if not exists rakurs_signups (
  id          uuid primary key default gen_random_uuid(),
  slot_id     uuid not null references rakurs_slots(id) on delete cascade,
  telegram_id bigint not null references users(telegram_id) on delete cascade,
  guests      int  not null check (guests between 1 and 10),
  set_beers   text[] not null check (cardinality(set_beers) between 1 and 4),
  focus_beer  text not null,
  comment     text,
  status      text not null default 'registered' check (status in ('registered','attended','no_show','cancelled')),
  created_at  timestamptz not null default now()
);
create unique index if not exists rakurs_one_active on rakurs_signups (slot_id, telegram_id) where status <> 'cancelled';
alter table rakurs_slots enable row level security;
alter table rakurs_signups enable row level security;

-- ===== Список ожидания для заставки «Скоро открытие» =====
create table if not exists waitlist (
  id         uuid primary key default gen_random_uuid(),
  contact    text not null unique,
  kind       text not null check (kind in ('email','phone')),
  created_at timestamptz not null default now()
);
alter table waitlist enable row level security;
