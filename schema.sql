-- VEGAS RP | Gestão de Staff
-- Execute UMA VEZ no SQL Editor do Supabase em um projeto novo.
-- Apenas a Supervisão pode alterar dados. O GitHub Pages publica somente o frontend.

create extension if not exists pgcrypto;

do $$ begin
  create type public.staff_role as enum ('Supervisor','Administrador','Moderador','Suporte','Estagiário');
exception when duplicate_object then null; end $$;

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  discord_id text unique,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 80),
  role public.staff_role not null default 'Estagiário',
  area text not null default '',
  status text not null default 'Ativo' check(status in ('Ativo','Afastado','Desligado')),
  joined_at date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discord_id_numeric check(discord_id is null or discord_id ~ '^[0-9]{16,21}$')
);

create table if not exists public.report_rounds (
  id uuid primary key default gen_random_uuid(),
  period_start timestamptz not null unique,
  created_by uuid references public.staff_members(id) on delete set null,
  is_finalized boolean not null default false,
  finalized_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.report_entries (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.report_rounds(id) on delete cascade,
  staff_id uuid not null references public.staff_members(id) on delete restrict,
  in_call text not null default 'Não verificado' check(in_call in ('Não verificado','Sim','Não','AFK')),
  in_city text not null default 'Não verificado' check(in_city in ('Não verificado','Sim','Não')),
  activity text not null default 'Não verificado' check(activity in ('Não verificado','Atendimento','Ticket','RP','Entrevista','Patrulhamento','Em pausa','AFK','Offline','Outro')),
  notes text not null default '' check(length(notes)<=240),
  updated_by uuid references public.staff_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(round_id,staff_id)
);

create table if not exists public.punishments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_members(id) on delete restrict,
  kind text not null check(kind in ('Aviso','Advertência','Suspensão','Desligamento')),
  reason text not null check(length(trim(reason))>=5),
  status text not null default 'Ativa' check(status in ('Ativa','Revogada')),
  created_by uuid references public.staff_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_records (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_members(id) on delete restrict,
  course_name text not null check(length(trim(course_name))>0),
  status text not null default 'Pendente' check(status in ('Pendente','Concluído')),
  completed_at timestamptz,
  created_by uuid references public.staff_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_members(id) on delete restrict,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  note text not null default '' check(length(note)<=200),
  created_by uuid references public.staff_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_shift_times check(ended_at is null or ended_at>=started_at)
);
create unique index if not exists only_one_open_shift_per_staff on public.time_entries(staff_id) where ended_at is null;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  operation text not null,
  actor_id uuid references public.staff_members(id) on delete set null,
  target_staff_id uuid references public.staff_members(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ix_report_entries_round on public.report_entries(round_id);
create index if not exists ix_report_entries_staff on public.report_entries(staff_id);
create index if not exists ix_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists ix_report_rounds_period_start on public.report_rounds(period_start desc);

-- Funções SECURITY DEFINER evitam políticas RLS recursivas.
create or replace function public.current_staff_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.staff_members where user_id = auth.uid() and status='Ativo' limit 1
$$;
create or replace function public.current_staff_role()
returns text language sql stable security definer set search_path = '' as $$
  select role::text from public.staff_members where user_id = auth.uid() and status='Ativo' limit 1
$$;
create or replace function public.is_supervisor()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_staff_role() = 'Supervisor', false)
$$;

-- Identidade do Discord é retirada de auth.identities (não informada pelo navegador).
-- Um usuário só é vinculado se o Discord autenticado coincide com o cadastro prévio.
create or replace function public.sync_current_user()
returns setof public.staff_members language plpgsql security definer set search_path = '' as $$
declare
  discord_user_id text;
begin
  if auth.uid() is null then
    raise exception 'É necessário autenticar pelo Discord.';
  end if;
  select coalesce(nullif(i.provider_id,''), i.identity_data->>'sub')
    into discord_user_id
    from auth.identities i
    where i.user_id = auth.uid() and i.provider='discord' limit 1;
  if discord_user_id is null then
    raise exception 'Entre usando a conta do Discord cadastrada.';
  end if;
  update public.staff_members
  set user_id=auth.uid()
  where discord_id=discord_user_id and user_id is null;
  return query select s.* from public.staff_members s where s.user_id=auth.uid() limit 1;
end;
$$;

-- Timestamps automáticos.
create or replace function public.stamp_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger staff_updated before update on public.staff_members for each row execute function public.stamp_updated_at();
create trigger entries_updated before update on public.report_entries for each row execute function public.stamp_updated_at();
create trigger punishments_updated before update on public.punishments for each row execute function public.stamp_updated_at();
create trigger training_updated before update on public.training_records for each row execute function public.stamp_updated_at();
create trigger time_entries_updated before update on public.time_entries for each row execute function public.stamp_updated_at();

-- Proteção contra ficar sem nenhum Supervisor ativo, perdendo acesso ao painel.
create or replace function public.protect_last_supervisor()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.role='Supervisor' and old.status='Ativo' and
    (tg_op='DELETE' or new.role<>'Supervisor' or new.status<>'Ativo') and
    (select count(*) from public.staff_members where role='Supervisor' and status='Ativo' and id<>old.id)=0 then
    raise exception 'Não é possível desativar o último Supervisor ativo.';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
create trigger keep_supervisor before update or delete on public.staff_members for each row execute function public.protect_last_supervisor();

-- Auditoria: inserida por trigger, não pelo frontend.
create or replace function public.audit_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
  affected uuid;
  payload jsonb;
begin
  select id into actor from public.staff_members where user_id=auth.uid() limit 1;
  if tg_op='INSERT' then
    payload=jsonb_build_object('depois',to_jsonb(new));
  elsif tg_op='DELETE' then
    payload=jsonb_build_object('antes',to_jsonb(old));
  else
    payload=jsonb_build_object('antes',to_jsonb(old),'depois',to_jsonb(new));
  end if;
  if tg_table_name='staff_members' then
    -- Em DELETE o registro já não existe: manter ID apenas no JSON para evitar FK inválida.
    affected=case when tg_op='DELETE' then null else new.id end;
  elsif tg_table_name in ('report_entries','punishments','training_records','time_entries') then
    affected=case when tg_op='DELETE' then old.staff_id else new.staff_id end;
  end if;
  insert into public.audit_logs(entity,operation,actor_id,target_staff_id,details)
  values(tg_table_name,tg_op,actor,affected,payload);
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
create trigger audit_staff after insert or update or delete on public.staff_members for each row execute function public.audit_changes();
create trigger audit_rounds after insert or update or delete on public.report_rounds for each row execute function public.audit_changes();
create trigger audit_entries after insert or update or delete on public.report_entries for each row execute function public.audit_changes();
create trigger audit_punishments after insert or update or delete on public.punishments for each row execute function public.audit_changes();
create trigger audit_training after insert or update or delete on public.training_records for each row execute function public.audit_changes();
create trigger audit_time_entries after insert or update or delete on public.time_entries for each row execute function public.audit_changes();

-- Proteção por linha: os dados nunca dependem de ocultar botões no navegador.
alter table public.staff_members enable row level security;
alter table public.report_rounds enable row level security;
alter table public.report_entries enable row level security;
alter table public.punishments enable row level security;
alter table public.training_records enable row level security;
alter table public.time_entries enable row level security;
alter table public.audit_logs enable row level security;

create policy staff_read on public.staff_members for select to authenticated
 using (public.current_staff_role() in ('Supervisor','Administrador') or id=public.current_staff_id());
create policy staff_insert on public.staff_members for insert to authenticated with check(public.is_supervisor());
create policy staff_update on public.staff_members for update to authenticated using(public.is_supervisor()) with check(public.is_supervisor());
create policy staff_delete on public.staff_members for delete to authenticated using(public.is_supervisor());

create policy rounds_read on public.report_rounds for select to authenticated
 using (public.current_staff_role() in ('Supervisor','Administrador')
        or exists (select 1 from public.report_entries e where e.round_id=id and e.staff_id=public.current_staff_id()));
create policy rounds_insert on public.report_rounds for insert to authenticated with check(public.is_supervisor());
create policy rounds_update on public.report_rounds for update to authenticated using(public.is_supervisor()) with check(public.is_supervisor());
create policy rounds_delete on public.report_rounds for delete to authenticated using(public.is_supervisor());

create policy entries_read on public.report_entries for select to authenticated
 using(public.current_staff_role() in ('Supervisor','Administrador') or staff_id=public.current_staff_id());
create policy entries_insert on public.report_entries for insert to authenticated with check(public.is_supervisor());
create policy entries_update on public.report_entries for update to authenticated using(public.is_supervisor()) with check(public.is_supervisor());
create policy entries_delete on public.report_entries for delete to authenticated using(public.is_supervisor());

create policy punishments_read on public.punishments for select to authenticated
 using(public.current_staff_role() in ('Supervisor','Administrador') or staff_id=public.current_staff_id());
create policy punishments_insert on public.punishments for insert to authenticated with check(public.is_supervisor());
create policy punishments_update on public.punishments for update to authenticated using(public.is_supervisor()) with check(public.is_supervisor());
create policy punishments_delete on public.punishments for delete to authenticated using(public.is_supervisor());

create policy training_read on public.training_records for select to authenticated
 using(public.current_staff_role() in ('Supervisor','Administrador') or staff_id=public.current_staff_id());
create policy training_insert on public.training_records for insert to authenticated with check(public.is_supervisor());
create policy training_update on public.training_records for update to authenticated using(public.is_supervisor()) with check(public.is_supervisor());
create policy training_delete on public.training_records for delete to authenticated using(public.is_supervisor());

create policy time_entries_read on public.time_entries for select to authenticated
 using(public.current_staff_role() in ('Supervisor','Administrador') or staff_id=public.current_staff_id());
create policy time_entries_insert on public.time_entries for insert to authenticated with check(public.is_supervisor());
create policy time_entries_update on public.time_entries for update to authenticated using(public.is_supervisor()) with check(public.is_supervisor());
create policy time_entries_delete on public.time_entries for delete to authenticated using(public.is_supervisor());

create policy audit_read on public.audit_logs for select to authenticated using(public.is_supervisor());
-- Sem políticas de inserção/edição/exclusão: somente triggers de banco podem escrever auditoria.

-- Permissões SQL complementares; RLS restringe por função e usuário autenticado.
grant usage on schema public to authenticated;
grant select,insert,update,delete on public.staff_members,public.report_rounds,public.report_entries,public.punishments,public.training_records,public.time_entries to authenticated;
grant select on public.audit_logs to authenticated;
revoke all on public.audit_logs from anon;
revoke insert,update,delete on public.audit_logs from authenticated;
grant execute on function public.current_staff_id(),public.current_staff_role(),public.is_supervisor(),public.sync_current_user() to authenticated;
revoke all on function public.sync_current_user() from anon;

-- IMPORTANTE: após executar o schema, abra bootstrap.sql e cadastre o primeiro Supervisor.
