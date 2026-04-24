# Sempre Assessoria Contábil — Sistema SaaS

## Deploy na Vercel
1. Suba este projeto para o GitHub.
2. Na Vercel, clique em **New Project** e selecione o repositório.
3. Framework: **Vite**.
4. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Clique em **Deploy**.

## SQL Supabase
Execute no SQL Editor do Supabase:

```sql
create table if not exists clientes (
  id uuid default gen_random_uuid() primary key,
  nome text unique not null,
  regime text,
  faturamento numeric default 0,
  status text default 'Pendente',
  updated_at timestamptz default now()
);

alter table clientes enable row level security;

create policy "clientes_select" on clientes for select using (true);
create policy "clientes_insert" on clientes for insert with check (true);
create policy "clientes_update" on clientes for update using (true);
```

> Para produção com login real, troque essas policies públicas por policies usando `auth.uid()`.
