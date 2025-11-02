# VPBank Shared Form (Inject Build)

Đã nhúng Supabase URL & Anon Key vào `index.html` và thêm realtime sync vào `script.js` (không đổi các trường).
- SUPABASE_URL: https://hjoislprylonxnmawbwo.supabase.co
- Realtime: cần bật cho bảng `public.forms`
- RLS: demo nhanh có thể tắt RLS, production nên bật RLS + policy theo id

## Yêu cầu Supabase
```sql
create table if not exists public.forms (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.forms (id, data) values ('vpbank_loan_kyc_shared_form', '{}'::jsonb)
on conflict (id) do nothing;
```
- Bật Realtime cho `public.forms`.
- Demo: `alter table public.forms disable row level security;`
