-- VEGAS RP | Cadastro inicial de 18 staffs
-- Execute após schema.sql e antes de bootstrap.sql.
-- Não há Supervisor cadastrado nesta lista; configure o primeiro Supervisor no bootstrap.sql.
-- Áreas conforme prints; revise atribuições antes de publicar.
insert into public.staff_members (name,discord_id,role,area,status) values
  ('Ian', '320750778782580737', 'Administrador', 'Resp. Hospital', 'Ativo'),
  ('Kadu', '222816111505178624', 'Administrador', 'Não informado', 'Ativo'),
  ('Tralha', '1328491072434995220', 'Administrador', 'Resp. Tickets; Equipe Denúncia', 'Ativo'),
  ('Gomes', '1460890490684706937', 'Administrador', 'Aux. Mecânica; Equipe Denúncia; Equipe Ticket', 'Ativo'),
  ('Isac', '831576618941677631', 'Administrador', 'Resp. Entrevista; Gestão Comunidade; Aux. Bombeiro; Equipe Denúncia; Equipe Ticket', 'Ativo'),
  ('Gaara', '1555609725486239749', 'Administrador', 'Equipe Denúncia; Equipe Ticket', 'Ativo'),
  ('Trash', '1394823041829175418', 'Moderador', 'Equipe Denúncia; Equipe Ticket', 'Ativo'),
  ('Vitor', '537318887050575882', 'Moderador', 'Aux. Streamers; Equipe Denúncia; Equipe Ticket', 'Ativo'),
  ('Silva', '668787841521680384', 'Moderador', 'Equipe Denúncia; Equipe Ticket', 'Ativo'),
  ('Dudu', '853093892974051399', 'Suporte', 'Sem área', 'Ativo'),
  ('Blonno Reis', '1451929254794231849', 'Suporte', 'Sem área', 'Ativo'),
  ('Miguel Ferreira', '1512555643834208377', 'Suporte', 'Sem área', 'Ativo'),
  ('Fantasma', '1490131009138851851', 'Suporte', 'Sem área', 'Ativo'),
  ('Exorcista', '1078141969768923156', 'Suporte', 'Sem área', 'Ativo'),
  ('Pecinha', '1214020821903999057', 'Suporte', 'Sem área', 'Ativo'),
  ('Miguel', '1020589895435177985', 'Suporte', 'Sem área', 'Ativo'),
  ('Pânico', '1497347447410917509', 'Suporte', 'Sem área', 'Ativo'),
  ('Carioca', '1502656883151077396', 'Suporte', 'Sem área', 'Ativo')
on conflict (discord_id) do nothing;
