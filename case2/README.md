# VPBank CRM Update Form — Case 2 (Supabase + Vercel)

**Table**: `public.crm_forms`  
**Row ID**: `vpbank_crm_update_shared_form`  
**Supabase URL**: `https://hjoislprylonxnmawbwo.supabase.co`

## SQL (đã dùng)
```sql
create table if not exists public.crm_forms (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
comment on table public.crm_forms is 'Lưu trữ shared state cho CRM forms - VPBank Customer Service';
insert into public.crm_forms (id, data) 
values ('vpbank_crm_update_shared_form', '{}'::jsonb)
on conflict (id) do nothing;
alter table public.crm_forms disable row level security;
alter publication supabase_realtime add table public.crm_forms;
```

## Deploy
```bash
unzip vpbank-crm-case2-built.zip -d vpbank-crm-case2
cd vpbank-crm-case2
vercel --prod
```