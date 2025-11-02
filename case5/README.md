# VPBank Use Case 5 — Operations Validation

Deployable static form that syncs with Supabase (no localStorage, no HTML required, clear without modal).

## Supabase SQL
```sql
create table if not exists public.operations_forms (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.operations_forms (id, data)
values ('use-case-5-operations-validation', '{}'::jsonb)
on conflict (id) do nothing;

alter table public.operations_forms disable row level security;
alter publication supabase_realtime add table public.operations_forms;
```
## Deploy
```bash
unzip vpbank-uc5-operations-validation.zip -d vpbank-uc5
cd vpbank-uc5
vercel --prod
```
