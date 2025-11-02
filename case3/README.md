# VPBank HR Workflow — Case 3 (Supabase + Vercel)

**Table**: `public.hr_forms`  
**Row ID**: `use-case-3-hr-workflow`  
**Supabase URL**: `https://hjoislprylonxnmawbwo.supabase.co`

## SQL (tạo bảng & bật realtime)
```sql
-- 1) Tạo bảng HR riêng
create table if not exists public.hr_forms (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 2) Thêm mô tả
comment on table public.hr_forms is 'Lưu trữ shared state cho HR workflow forms';

-- 3) Seed sẵn một row cho Case 3
insert into public.hr_forms (id, data)
values ('use-case-3-hr-workflow', '{}'::jsonb)
on conflict (id) do nothing;

-- 4) TẮT RLS (demo/test) — Production nên bật RLS + policy
alter table public.hr_forms disable row level security;

-- 5) Bật Realtime cho bảng
alter publication supabase_realtime add table public.hr_forms;
```

## Deploy
```bash
unzip vpbank-hr-case3-built.zip -d vpbank-hr-case3
cd vpbank-hr-case3
vercel --prod
```