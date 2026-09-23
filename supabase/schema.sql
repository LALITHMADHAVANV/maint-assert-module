-- Supabase Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table (extends Supabase Auth users)
create table public.users (
  id uuid references auth.users not null primary key,
  uid text unique,
  name text,
  email text,
  role text,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security for users
alter table public.users enable row level security;
create policy "Users can view their own profile." on public.users for select using (auth.uid() = id);
-- Allow all reads for now
create policy "Enable read access for all users" on public.users for select using (true);
create policy "Enable insert for authenticated users only" on public.users for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.users for update using (auth.role() = 'authenticated');


-- Machines Table
create table public.machines (
  id text primary key,
  name text,
  brand text,
  model text,
  category text,
  department text,
  machine_class text,
  type text,
  type_name text,
  motor_type text,
  purchase_date date,
  cost numeric,
  status text,
  current_line text,
  station_no text,
  operator text,
  total_downtime_minutes integer default 0,
  age_years numeric,
  specs text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.machines enable row level security;
create policy "Enable read access for all users" on public.machines for select using (true);
create policy "Enable insert for authenticated users only" on public.machines for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.machines for update using (auth.role() = 'authenticated');


-- Spare Parts Table
create table public.spare_parts (
  id text primary key,
  sku text unique,
  name text,
  category text,
  machine_type_compat text[],
  current_stock integer default 0,
  min_stock_level integer default 0,
  price numeric,
  unit text,
  supplier text,
  location text,
  status text,
  qr_code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.spare_parts enable row level security;
create policy "Enable read access for all users" on public.spare_parts for select using (true);
create policy "Enable insert for authenticated users only" on public.spare_parts for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.spare_parts for update using (auth.role() = 'authenticated');


-- Repair Tickets Table
create table public.repair_tickets (
  id text primary key,
  machine_id text references public.machines(id),
  ticket_type text,
  severity text,
  status text,
  reported_by text,
  reported_at timestamp with time zone,
  assigned_to text,
  resolved_at timestamp with time zone,
  issue_description text,
  actions_taken text,
  parts_used jsonb,
  downtime_minutes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.repair_tickets enable row level security;
create policy "Enable read access for all users" on public.repair_tickets for select using (true);
create policy "Enable insert for authenticated users only" on public.repair_tickets for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.repair_tickets for update using (auth.role() = 'authenticated');


-- PPM Schedules Table
create table public.ppm_schedules (
  id text primary key,
  machine_id text references public.machines(id),
  frequency_days integer,
  last_completed timestamp with time zone,
  next_due_date timestamp with time zone,
  status text,
  checklist jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ppm_schedules enable row level security;
create policy "Enable read access for all users" on public.ppm_schedules for select using (true);
create policy "Enable insert for authenticated users only" on public.ppm_schedules for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.ppm_schedules for update using (auth.role() = 'authenticated');
