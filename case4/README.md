# Use Case 4 — Compliance Reporting (DB-only Sync)

- No LocalStorage
- No HTML5 `required` (form uses `novalidate`)
- Clear without modal (UI reset + Supabase row wipe)
- Realtime + debounce 300ms + upsert into `public.compliance_forms` with `id = use-case-4-compliance-reporting`

## Supabase SQL

```sql
create table if not exists public.compliance_forms (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

insert into public.compliance_forms (id, data)
values ('use-case-4-compliance-reporting', '{}'::jsonb)
on conflict (id) do nothing;

alter table public.compliance_forms disable row level security;

alter publication supabase_realtime add table public.compliance_forms;
```

## Deploy

```bash
unzip use-case-4-compliance-reporting.zip -d uc4
cd uc4
vercel --prod
```
