create extension if not exists btree_gist;

create table users (
  id serial primary key,
  name text not null,
  email text not null unique,
  phone text,
  organisation text,
  password_hash text not null,
  role text not null default 'organizer'
    check (role in ('organizer','super_admin','booking_manager','accounts','management')),
  created_at timestamptz not null default now()
);

create table venues (
  id serial primary key,
  slug text not null unique,
  name text not null,
  kind text not null,
  description text not null,
  capacity int not null,
  area_sqft int,
  amenities text[] not null default '{}',
  tariff_per_day numeric(12,2) not null,
  sort int not null default 0,
  active boolean not null default true
);

create sequence booking_seq;
create table bookings (
  id serial primary key,
  ref text not null unique default ('BK-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('booking_seq')::text, 4, '0')),
  organizer_id int not null references users(id),
  venue_id int not null references venues(id),
  event_name text not null,
  event_type text not null,
  attendance int not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'submitted'
    check (status in ('submitted','under_scrutiny','provisional','approved','confirmed','completed','rejected','cancelled')),
  total_amount numeric(12,2),
  remarks text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index on bookings (organizer_id);
create index on bookings (status);

-- One row per held/blocked date range. The exclusion constraint is what
-- actually prevents double booking, even under concurrent requests.
create table calendar_entries (
  id serial primary key,
  venue_id int not null references venues(id),
  start_date date not null,
  end_date date not null,
  status text not null check (status in ('provisional','confirmed','blocked')),
  booking_id int references bookings(id) on delete cascade,
  reason text,
  created_by int references users(id),
  created_at timestamptz not null default now(),
  check (end_date >= start_date),
  exclude using gist (venue_id with =, daterange(start_date, end_date, '[]') with &&)
);

create table installments (
  id serial primary key,
  booking_id int not null references bookings(id) on delete cascade,
  label text not null,
  amount numeric(12,2) not null check (amount > 0),
  due_date date not null,
  paid_amount numeric(12,2) not null default 0,
  paid_on date,
  mode text,
  reference text,
  recorded_by int references users(id)
);

create table booking_documents (
  id serial primary key,
  booking_id int not null references bookings(id) on delete cascade,
  filename text not null,
  stored_name text not null,
  size int not null,
  uploaded_at timestamptz not null default now()
);

create table notices (
  id serial primary key,
  title text not null,
  body text not null,
  category text not null default 'notice' check (category in ('notice','tender','announcement')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  publish_on date not null default current_date,
  created_by int references users(id),
  created_at timestamptz not null default now()
);

create table events (
  id serial primary key,
  title text not null,
  description text not null default '',
  venue_id int references venues(id),
  start_date date not null,
  end_date date not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);

create table enquiries (
  id serial primary key,
  name text not null,
  email text,
  phone text,
  message text not null,
  status text not null default 'new' check (status in ('new','replied','closed')),
  created_at timestamptz not null default now()
);

create table settings (key text primary key, value text not null);

create table audit_log (
  id bigserial primary key,
  actor_id int references users(id),
  entity text not null,
  entity_id int,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index on audit_log (entity, entity_id);
