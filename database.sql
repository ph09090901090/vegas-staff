-- VEGAS RP | STAFF CONTROL
-- Cole o arquivo inteiro no SQL Editor do Supabase, em um projeto NOVO.
-- Segurança: Row Level Security em todas as tabelas operacionais.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  access_role text not null default 'leitor' check (access_role in ('owner','gestor','leitor')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_active_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.active);
$$;
create or replace function public.can_write() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.active and p.access_role in ('owner','gestor'));
$$;
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.active and p.access_role = 'owner');
$$;

create table if not exists public.ranks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 2 and 60),
  position integer not null check (position between 1 and 999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  discord_id text not null unique check (discord_id ~ '^[0-9]{16,22}$'),
  game_id text not null unique check (char_length(trim(game_id)) between 1 and 30),
  rank_id uuid references public.ranks(id) on delete restrict,
  status text not null default 'ativo' check (status in ('ativo','ausente','afastado','desligado')),
  department text not null default 'Geral',
  joined_on date not null default current_date,
  observation text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_reports (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.staff_members(id) on delete set null,
  staff_name_snapshot text not null,
  title text not null check (char_length(trim(title)) between 3 and 160),
  category text not null check (category in ('avaliacao','ocorrencia','advertencia','elogio','promocao','acompanhamento','outro')),
  rating integer check (rating between 1 and 5),
  details text not null check (char_length(trim(details)) >= 5),
  next_steps text not null default '',
  event_on date not null default current_date,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_notes (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.staff_members(id) on delete set null,
  staff_name_snapshot text not null default 'Nota geral',
  title text not null check (char_length(trim(title)) between 3 and 160),
  content text not null check (char_length(trim(content)) >= 2),
  pinned boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text not null default '',
  staff_id uuid references public.staff_members(id) on delete set null,
  status text not null default 'pendente' check (status in ('pendente','em_andamento','concluida')),
  priority text not null default 'media' check (priority in ('baixa','media','alta')),
  due_on date,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  entity text not null,
  entity_id uuid not null,
  action text not null,
  label text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_staff_rank on public.staff_members(rank_id);
create index if not exists idx_reports_staff on public.staff_reports(staff_id);
create index if not exists idx_reports_date on public.staff_reports(event_on desc);
create index if not exists idx_notes_staff on public.staff_notes(staff_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_audit_recent on public.audit_logs(created_at desc);

-- Proteção no banco dos autores e horários. Não confie nos campos enviados pelo navegador.
create or replace function public.stamp_record() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
  else
    new.updated_at := now();
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;
create or replace function public.touch_record() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.write_audit_log() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  record_json jsonb;
  row_id uuid;
  row_label text;
begin
  record_json := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  row_id := (record_json->>'id')::uuid;
  row_label := coalesce(record_json->>'name', record_json->>'title', record_json->>'display_name', 'Registro');
  insert into public.audit_logs(actor_id, entity, entity_id, action, label)
  values(auth.uid(), tg_table_name, row_id, tg_op, left(row_label,160));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists stamp_staff on public.staff_members;
create trigger stamp_staff before insert or update on public.staff_members for each row execute function public.stamp_record();
drop trigger if exists stamp_reports on public.staff_reports;
create trigger stamp_reports before insert or update on public.staff_reports for each row execute function public.stamp_record();
drop trigger if exists stamp_notes on public.staff_notes;
create trigger stamp_notes before insert or update on public.staff_notes for each row execute function public.stamp_record();
drop trigger if exists stamp_tasks on public.tasks;
create trigger stamp_tasks before insert or update on public.tasks for each row execute function public.stamp_record();
drop trigger if exists touch_ranks on public.ranks;
create trigger touch_ranks before update on public.ranks for each row execute function public.touch_record();

do $$
declare t text;
begin
  foreach t in array array['ranks','staff_members','staff_reports','staff_notes','tasks'] loop
    execute format('drop trigger if exists audit_change on public.%I',t);
    execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function public.write_audit_log()',t);
  end loop;
end $$;

-- Padronização da hierarquia informada pelos supervisores.
insert into public.ranks(name, position) values
('Owner',1),('Diretor Geral',2),('Diretor',3),('Sub Diretor',4),
('Supervisor G',5),('Supervisor',6),('ADM',7),('MOD',8),('SUP',9),('Ajudante',10)
on conflict (name) do nothing;

alter table public.profiles enable row level security;
alter table public.ranks enable row level security;
alter table public.staff_members enable row level security;
alter table public.staff_reports enable row level security;
alter table public.staff_notes enable row level security;
alter table public.tasks enable row level security;
alter table public.audit_logs enable row level security;

-- Perfis só podem ser editados através do servidor de convite ou pelo SQL Editor.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_owner()));

do $$
declare t text;
begin
  foreach t in array array['ranks','staff_members','staff_reports','staff_notes','tasks'] loop
    execute format('drop policy if exists %I on public.%I',t||'_read',t);
    execute format('drop policy if exists %I on public.%I',t||'_insert',t);
    execute format('drop policy if exists %I on public.%I',t||'_update',t);
    execute format('drop policy if exists %I on public.%I',t||'_delete',t);
    execute format('create policy %I on public.%I for select to authenticated using ((select public.is_active_member()))',t||'_read',t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select public.can_write()))',t||'_insert',t);
    execute format('create policy %I on public.%I for update to authenticated using ((select public.can_write())) with check ((select public.can_write()))',t||'_update',t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select public.can_write()))',t||'_delete',t);
  end loop;
end $$;

-- Exclusões irreversíveis de cargos e membros somente por owners autorizados.
drop policy if exists ranks_delete on public.ranks;
create policy ranks_delete on public.ranks for delete to authenticated using ((select public.is_owner()));
drop policy if exists staff_members_delete on public.staff_members;
create policy staff_members_delete on public.staff_members for delete to authenticated using ((select public.is_owner()));

drop policy if exists audit_read on public.audit_logs;
create policy audit_read on public.audit_logs for select to authenticated
using ((select public.can_write()));

-- Proteções adicionais: sem acesso anônimo e sem escrita direta nos perfis/logs.
revoke all on public.profiles, public.ranks, public.staff_members, public.staff_reports,
  public.staff_notes, public.tasks, public.audit_logs from anon;
revoke all on public.profiles, public.audit_logs from authenticated;
grant usage on schema public to authenticated;
grant select on public.profiles, public.audit_logs to authenticated;
grant select, insert, update, delete on public.ranks, public.staff_members,
  public.staff_reports, public.staff_notes, public.tasks to authenticated;
grant execute on function public.is_active_member(), public.can_write(), public.is_owner() to authenticated;

-- BOOTSTRAP: Primeiro crie os usuários dos DOIS supervisores em
-- Authentication -> Users -> Add user -> Send invitation.
-- Depois retire o comentário do bloco abaixo, troque pelos dois e-mails
-- reais e execute APENAS esse bloco no SQL Editor do Supabase.
--
-- insert into public.profiles (user_id,email,display_name,access_role,active)
-- select id,email,
--   case when email = 'SEU_EMAIL@EXEMPLO.COM' then 'Supervisor 1' else 'LC' end,
--   'owner',true
-- from auth.users
-- where lower(email) in ('seu_email@exemplo.com','email_lc@exemplo.com')
-- on conflict (user_id) do update set access_role = 'owner', active = true;
