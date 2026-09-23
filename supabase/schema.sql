-- Supabase Database Schema (Fixed for camelCase TypeScript compatibility)

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

alter table public.users enable row level security;
create policy "Users can view their own profile." on public.users for select using (auth.uid() = id);
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
  "machineClass" text,
  type text,
  "typeName" text,
  "motorType" text,
  "purchaseDate" text,
  cost numeric,
  status text,
  "currentLine" text,
  "stationNo" text,
  operator text,
  "totalDowntimeMinutes" integer default 0,
  "ageYears" numeric,
  specs jsonb,
  "lastMovedAt" text,
  "lastMovedReason" text,
  "lastMovedBy" text,
  "previousLine" text,
  "previousStation" text,
  "relocationHistory" jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.machines enable row level security;
create policy "Enable read access for all users" on public.machines for select using (true);
create policy "Enable insert for authenticated users only" on public.machines for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.machines for update using (auth.role() = 'authenticated');


-- Spare Parts Table
create table public.spare_parts (
  "partId" text primary key,
  sku text unique,
  name text,
  category text,
  compat text,
  stock integer default 0,
  "minStock" integer default 0,
  "monthlyAllowance" integer default 0,
  "unitCost" numeric,
  unit text,
  supplier text,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.spare_parts enable row level security;
create policy "Enable read access for all users" on public.spare_parts for select using (true);
create policy "Enable insert for authenticated users only" on public.spare_parts for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.spare_parts for update using (auth.role() = 'authenticated');


-- Repair Tickets Table
create table public.repair_tickets (
  id text primary key,
  "machineId" text,
  "machineType" text,
  line text,
  "faultCategory" text,
  "faultDetails" text,
  urgency text,
  status text,
  "reportedAt" text,
  "reportedBy" text,
  "attendedBy" text,
  "resolvedAt" text,
  "downtimeMinutes" integer default 0,
  "actionTaken" text,
  "partsUsed" jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.repair_tickets enable row level security;
create policy "Enable read access for all users" on public.repair_tickets for select using (true);
create policy "Enable insert for authenticated users only" on public.repair_tickets for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.repair_tickets for update using (auth.role() = 'authenticated');


-- PPM Schedules Table
create table public.ppm_schedules (
  id text primary key,
  "machineId" text,
  task text,
  "intervalDays" integer,
  "lastServiced" text,
  "nextDue" text,
  status text,
  "assignedTo" text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ppm_schedules enable row level security;
create policy "Enable read access for all users" on public.ppm_schedules for select using (true);
create policy "Enable insert for authenticated users only" on public.ppm_schedules for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.ppm_schedules for update using (auth.role() = 'authenticated');


-- Requisitions Table
create table public.requisitions (
  id text primary key,
  type text,
  items jsonb,
  "partId" text,
  "partName" text,
  sku text,
  quantity integer,
  unit text,
  "itemCount" integer,
  "estimatedCost" numeric,
  urgency text,
  "requiresCeoApproval" boolean,
  "requestedBy" text,
  "requestedByRole" text,
  "monthYear" text,
  "targetLine" text,
  "targetMachineId" text,
  justification text,
  status text,
  "createdAt" text,
  "reviewerNotes" text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.requisitions enable row level security;
create policy "Enable read access for all users" on public.requisitions for select using (true);
create policy "Enable insert for authenticated users only" on public.requisitions for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.requisitions for update using (auth.role() = 'authenticated');
