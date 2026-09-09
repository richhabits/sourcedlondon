-- =========================================================
-- Sourced London template — database schema
-- Run this ONCE in your own Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste all -> Run).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout.
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- Tables ----------

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  year int,
  mileage int,
  spec text,
  price_gbp numeric,
  price_poa boolean not null default false,
  description text,
  photos text[] not null default '{}',
  status text not null default 'available' check (status in ('available','reserved','sold')),
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  vehicle_purchased text,
  quote text not null,
  photo_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  make text,
  model text,
  budget text,
  message text,
  status text not null default 'new' check (status in ('new','contacted','won','lost')),
  created_at timestamptz not null default now()
);

-- Added for the "Sell / Part-Exchange Your Car" funnel and reg-plate lookups.
alter table public.enquiries add column if not exists lead_type text not null default 'purchase' check (lead_type in ('purchase','sell'));
alter table public.enquiries add column if not exists vehicle_reg text;
alter table public.enquiries add column if not exists lookup_data jsonb;

-- Customer-added links/notes about vehicles they've spotted elsewhere (Autotrader, etc.)
create table if not exists public.customer_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  note text,
  created_at timestamptz not null default now()
);

-- In-house messaging between the brand (admin) and a signed-in customer. One thread per customer.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer','admin')),
  body text not null,
  read_by_admin boolean not null default false,
  read_by_customer boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_vehicles (
  user_id uuid references auth.users(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vehicle_id)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  stripe_session_id text,
  amount_gbp numeric,
  status text not null default 'pending' check (status in ('pending','paid','cancelled','refunded')),
  created_at timestamptz not null default now()
);

-- ---------- Helper: is the current user an admin? ----------

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.admin_users where id = auth.uid()
  );
$$;

-- ---------- Auto-create a profile row on signup ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------

alter table public.vehicles enable row level security;
alter table public.testimonials enable row level security;
alter table public.site_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.enquiries enable row level security;
alter table public.saved_vehicles enable row level security;
alter table public.reservations enable row level security;
alter table public.customer_links enable row level security;
alter table public.messages enable row level security;

-- Vehicles: anyone can view; only admins can change.
drop policy if exists "vehicles_select_public" on public.vehicles;
create policy "vehicles_select_public" on public.vehicles for select using (true);
drop policy if exists "vehicles_admin_write" on public.vehicles;
create policy "vehicles_admin_write" on public.vehicles for all using (public.is_admin()) with check (public.is_admin());

-- Testimonials: public sees only published ones; admins see/manage everything.
drop policy if exists "testimonials_select_published" on public.testimonials;
create policy "testimonials_select_published" on public.testimonials for select using (is_published = true or public.is_admin());
drop policy if exists "testimonials_admin_write" on public.testimonials;
create policy "testimonials_admin_write" on public.testimonials for all using (public.is_admin()) with check (public.is_admin());

-- Site settings: public read (contact details etc.); admin write.
drop policy if exists "settings_select_public" on public.site_settings;
create policy "settings_select_public" on public.site_settings for select using (true);
drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

-- Profiles: a user manages their own; admins can view all.
drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles for all using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());

-- Admin users: only admins can read the admin list (bootstrap the first admin from the SQL editor, see SETUP.md).
drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read" on public.admin_users for select using (public.is_admin());

-- Enquiries: anyone can submit one; owners + admins can read; only admins update status.
drop policy if exists "enquiries_insert_anyone" on public.enquiries;
create policy "enquiries_insert_anyone" on public.enquiries for insert with check (true);
drop policy if exists "enquiries_select_own_or_admin" on public.enquiries;
create policy "enquiries_select_own_or_admin" on public.enquiries for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "enquiries_admin_update" on public.enquiries;
create policy "enquiries_admin_update" on public.enquiries for update using (public.is_admin()) with check (public.is_admin());

-- Saved vehicles: user manages their own list.
drop policy if exists "saved_vehicles_owner" on public.saved_vehicles;
create policy "saved_vehicles_owner" on public.saved_vehicles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reservations: owner + admin can read; writes happen via the stripe-checkout edge function
-- using the service role key, which bypasses RLS, so no public insert/update policy is needed.
drop policy if exists "reservations_select_own_or_admin" on public.reservations;
create policy "reservations_select_own_or_admin" on public.reservations for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "reservations_admin_write" on public.reservations;
create policy "reservations_admin_write" on public.reservations for all using (public.is_admin()) with check (public.is_admin());

-- Customer links: owner manages their own; admins can view all (useful sourcing context).
drop policy if exists "customer_links_owner" on public.customer_links;
create policy "customer_links_owner" on public.customer_links for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);

-- Messages: a customer sees/sends only their own thread; admins see and reply to all threads.
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert with check (
  (auth.uid() = user_id and sender_role = 'customer') or (public.is_admin() and sender_role = 'admin')
);
drop policy if exists "messages_update_read" on public.messages;
create policy "messages_update_read" on public.messages for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

-- ---------- Starter content so the site isn't empty on first load ----------

insert into public.site_settings (key, value) values
  ('brand_name', 'Sourced London'),
  ('email', ''),
  ('phone_display', ''),
  ('phone_intl', ''),
  ('whatsapp_intl', ''),
  ('address', ''),
  ('owner_names', 'Dre & Ferrell'),
  ('trustpilot_url', ''),
  ('google_reviews_url', ''),
  ('fca_number', ''),
  ('bvrla_number', '')
on conflict (key) do nothing;
