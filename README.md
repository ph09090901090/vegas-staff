# VEGAS RP — Staff Control

**Painel privado para dois supervisores (com a opção de autorizar outros cargos posteriormente).** Site estático compatível com **GitHub Pages**, dados e autenticação no **Supabase**. Identidade visual em preto, branco e cinza. Sem necessidade de pagar por uma VPS para hospedar os arquivos estáticos.

## Funcionalidades incluídas

- **Login por e-mail e senha**; senha definida via convite e opção de recuperação.
- **Permissões independentes dos cargos da cidade:** `owner` (tudo, inclusive convites), `gestor` (gerência operacional e relatórios) e `leitor` (consulta).
- **Cadastro de staff:** nome, ID Discord, ID do jogo, cargo, setor, situação, data de entrada, observações.
- **Hierarquia editável:** cargos iniciais Owner, Diretor Geral, Diretor, Sub Diretor, Supervisor G, Supervisor, ADM, MOD, SUP, Ajudante. Criar, renomear, mudar ordem.
- **Relatórios individuais:** avaliações, ocorrências, advertências, elogios, promoções, acompanhamento, nota de 1 a 5, providências, autoria e data. Arquivo `.txt` individual ou exportação geral CSV.
- **Anotações:** notas gerais ou vinculadas a membros, com opção de fixar.
- **Tarefas:** título, descrição, responsável, prioridade, prazo, andamento e conclusão.
- **Dashboard:** membros ativos, equipe cadastrada, relatórios de 30 dias, demandas pendentes, distribuição por cargos e registros recentes.
- **Histórico automático:** movimentações de staff, relatórios, anotações, tarefas e hierarquia; convites e permissões geridos pela função segura.
- **Desligamento sem perder o histórico:** arquiva o membro (status `desligado`); exclusão permanente é uma ação de owner para pessoas já desligadas.
- **Exportação CSV** com proteção básica contra injeção de fórmulas ao abrir em planilhas.
- **Design responsivo** para desktop e celular.

### Arquivos importantes

```text
vegas-staff-portal/
├─ index.html              # Página inicial / interface
├─ styles.css              # Visual
├─ app.js                  # Funcionalidades do painel
├─ config.js               # URL do Supabase + chave publicável
├─ database.sql            # Tabelas, hierarquia, triggers, regras de acesso
├─ .nojekyll               # GitHub Pages
└─ supabase/
   ├─ config.toml
   └─ functions/
      └─ manage-access/
         └─ index.ts       # Convites/alterações de acesso (servidor seguro)
```

## Instalação passo a passo

### 1. Criar um Supabase

1. Entre em https://supabase.com/ e crie um projeto. Escolha uma senha forte para **o banco do projeto** (essa senha não vai para o GitHub).
2. Vá em **SQL Editor → New query**. Copie **todo** o arquivo `database.sql` e execute. Isso cria as tabelas e a hierarquia inicial.
3. Vá em **Authentication → Providers → Email** e **desative o cadastro público de novos usuários** (a interface pode variar; mantenha convites administrativos habilitados).
4. Em **Authentication → Users → Add user → Send invitation**, envie convites para **o seu e-mail e o do LC**.
5. Depois de criar os dois usuários, execute **somente o bloco BOOTSTRAP** do fim do arquivo `database.sql`, trocando os e-mails de exemplo pelos reais. Esse comando os registra como **owners do painel**. Verifique que a consulta retornou as duas contas:

```sql
select email, display_name, access_role, active
from public.profiles order by email;
```

> **Muito importante:** os dois owners só ganham acesso quando seus registros forem inseridos em `public.profiles`. Não existe e-mail ou senha mestre escondidos no código. Se a tela disser "sem acesso", confira a tabela.

### 2. Conectar a interface ao Supabase

1. No Supabase: **Project Settings → API Keys**, copie a **Project URL** (ou em Settings → Data API) e a chave **publishable** (ou `anon` no modelo legado).
2. Abra `config.js` e substitua os placeholders:

```js
window.VEGAS_CONFIG = {
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabaseAnonKey: 'sb_publishable_SUA_CHAVE_PUBLICAVEL',
};
```

**Nunca coloque a chave secreta `sb_secret_*`, a antiga `service_role`, a senha do projeto ou um token pessoal em `config.js`.** Essa página é pública por natureza, embora os dados permaneçam protegidos no servidor por autenticação e regras RLS.

### 3. Hospedar no GitHub Pages

1. Crie um repositório no GitHub, por exemplo `vegas-staff`. **No GitHub Free, o repositório publicado via Pages normalmente precisa ser público.** É seguro publicar o código, mas não publique credenciais ou dados da staff no repositório.
2. Envie os arquivos para a **raiz** do repositório (`index.html` e `config.js` precisam estar na raiz, não dentro de outra pasta).
3. Entre em **Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/(root)` → Save**.
4. O endereço terá formato `https://SEU_USUARIO.github.io/vegas-staff/`. Abra e teste o login.
5. No Supabase, em **Authentication → URL Configuration**, defina esse endereço como **Site URL** e inclua-o em **Redirect URLs**. Isso é indispensável para links de convite e recuperação de senha.

> Publicar no GitHub Pages **não coloca o banco nem os dados no GitHub**. O navegador conversa com o Supabase, que autentica as contas e verifica as regras de segurança **em cada operação**.

### 4. Ativar convites futuros diretamente no site (Edge Function)

As duas contas iniciais são criadas no passo 1. Para que o botão **Controle de acesso → Convidar usuário** funcione, implante a função `manage-access`. Ela usa credenciais do servidor, sem divulgar a chave secreta no navegador.

No terminal, com Node.js instalado, dentro da pasta extraída:

```bash
npx supabase login
npx supabase link --project-ref REF_DO_SEU_PROJETO
npx supabase functions deploy manage-access
```

Configure no Supabase (**Edge Functions → Secrets**) o segredo:

```text
SITE_URL=https://SEU_USUARIO.github.io/vegas-staff/
```

Ou, via terminal:

```bash
npx supabase secrets set SITE_URL=https://SEU_USUARIO.github.io/vegas-staff/
```

> `SITE_URL` não é senha; é a URL HTTPS autorizada para direcionar convites. Garanta que essa mesma URL aparece na lista de **Redirect URLs**. A função exige uma sessão válida e confirma no banco que o solicitante é `owner`. Não altere `verify_jwt = true` em `supabase/config.toml`.

### 5. Testar em ambiente local (opcional)

Na pasta dos arquivos, com Python instalado:

```bash
python -m http.server 8000
```

Abra `http://localhost:8000`. Se for testar links de recuperação nessa URL, inclua `http://localhost:8000/**` nas URLs de redirecionamento do Supabase.

## Regras de acesso

| Permissão do site | Visualiza registros | Edita staff, relatórios, tarefas, notas, cargos | Convida ou bloqueia usuários |
|---|---|---|---|
| **Owner** (você e LC) | Sim | Sim | Sim |
| **Gestor** | Sim | Sim | Não |
| **Leitor** | Sim | Não | Não |

O cargo **Owner da hierarquia da cidade** é apenas um cargo da staff. Ele **não** garante acesso ao site. As permissões do site só mudam por decisão de um `owner` já autorizado no controle de acesso.

## Limitações e cuidados operacionais

- **Este pacote é o código pronto, não um site já publicado.** Sem projeto Supabase, duas contas e configuração, a tela inicial exibirá "Painel pronto para configurar".
- **Dados reais não foram preenchidos:** a base começa vazia, exceto pelos 10 cargos iniciais.
- **Hospedagem não equivale a privacidade da página:** qualquer pessoa consegue abrir a URL de login do Pages; só contas autorizadas conseguem consultar ou editar os registros. RLS é obrigatório.
- **O histórico de operações registra tipo, item e autor**, mas não mantém versões completas e imutáveis do conteúdo de relatórios; para auditoria formal e prova de alterações, complemente com backups e uma trilha de versões.
- A importação da interface carrega o cliente Supabase por CDN; ela precisa de internet para funcionar.
- Atualizações feitas pelo outro supervisor **aparecem após clicar "Atualizar" ou recarregar a página**. Não há colaboração em tempo real via websocket nesta versão.
- O Supabase pode aplicar **limites de uso e políticas de inatividade** conforme o plano. Consulte seu plano para limites e política de retenção antes de operar exclusivamente nele.
- Se um usuário perder acesso, as regras do banco rejeitam novas leituras e escritas. Um usuário já conectado pode manter registros antigos na tela até atualizar/recarregar, por isso evite compartilhar a tela e mantenha os computadores protegidos.
- **Backup:** exporte CSV periodicamente e use backups do PostgreSQL do projeto. CSV de staff e relatórios é útil, mas **não substitui** um backup de todas as tabelas.
- E-mails de convite podem ser limitados por regras de envio do Supabase. Para produção com muitos convites, configure SMTP próprio.

## Solução de problemas

- **Tela "Painel pronto para configurar"**: `config.js` ainda contém placeholders.
- **"Esta conta ainda não possui acesso"**: execute o bloco BOOTSTRAP para os dois e-mails ou habilite a conta via Controle de acesso.
- **Erro de tabela / "permission denied"**: rode `database.sql` integralmente e verifique se o usuário está ativo em `public.profiles`.
- **Login funciona, mas convite falha**: verifique deploy da Edge Function, segredo `SITE_URL`, autorização de Redirect URLs e logs da função.
- **Convite leva para lugar errado**: ajuste Site URL e Redirect URLs no Supabase.
- **Erro de ID do Discord duplicado**: o banco impede duplicidade de IDs do Discord e de jogo.
- **Erro ao excluir cargo**: transfira a staff desse cargo antes de excluí-lo. Para excluir um cargo vazio, use o botão de lixeira disponível para os owners.

## Fontes técnicas

- [GitHub Pages — configurando a origem da publicação](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Supabase — convite de usuários](https://supabase.com/docs/guides/auth/users)
- [Supabase — RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — segurança de Edge Functions](https://supabase.com/docs/guides/functions/auth)
