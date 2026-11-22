-- EXECUTE APÓS schema.sql
-- Substitua o ID abaixo pelo SEU ID REAL do Discord (16 a 21 dígitos).
-- O primeiro Supervisor terá acesso total; não existem cargos Owner ou Direção.
-- Não coloque IDs fictícios em produção.

insert into public.staff_members (name, discord_id, role, status, area)
values ('Supervisor inicial', 'COLE_AQUI_SEU_ID_DISCORD', 'Supervisor', 'Ativo', 'Gestão');
