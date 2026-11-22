# VEGAS RP · Painel de Gestão da Staff

Site estático pronto para GitHub Pages, com login por Discord e dados compartilhados no Supabase. Não precisa de `npm`, `Node.js` ou build para publicar.

## Funcionalidades

- **Visão geral:** total de staffs, distribuição por cargo, indicadores da última rodada e atividades recentes.
- **Equipe:** cadastro e edição de membros, com nome, ID Discord, cargo, área, status, data de entrada e observações. Exportação CSV.
- **Relatórios a cada 30 minutos:** a Supervisão verifica manualmente, para cada staff, se está em call, se está na cidade e o que está fazendo. Histórico por rodada, observação livre, percentual verificado e finalização. O contador vale enquanto o navegador está aberto.
- **Punições:** avisos, advertências, suspensões, desligamentos e revogação com histórico.
- **Cursos:** Atendimento, Tickets, Comandos ADM, Conduta, Logs e cursos personalizados; marcação de conclusão.
- **Ponto:** entrada e saída de turnos registradas manualmente pela Supervisão.
- **Auditoria:** logs criados pelo banco quando qualquer registro é incluído, alterado ou excluído.
- **Interface responsiva:** preto, branco e cinza; desktop e celular.

**Hierarquia:** Supervisor > Administrador > Moderador > Suporte > Estagiário. Não existem cargos Owner e Direção. Supervisor tem acesso total e gerencia outros Supervisores. Administrador consulta equipe e registros; os demais acessam apenas seus próprios dados. A segurança é implementada por políticas Row Level Security (RLS) no banco, não apenas por visibilidade de botões.

## 1. Testar agora (sem configurar nada)

Para testar sem hospedagem, abra a pasta do projeto em um servidor local simples (por exemplo, **Live Server** no VS Code, ou `python -m http.server 8000`) e visite `http://localhost:8000`. Depois, clique em **Entrar na demonstração**. Como o projeto usa módulos JavaScript, abrir diretamente via `file://` pode ser bloqueado pelo navegador. Você também pode publicar no GitHub Pages e testar a demonstração lá.

O modo de demonstração permite cadastrar staffs, preencher relatórios e testar o painel. Esses registros ficam no armazenamento **local do navegador**: não são compartilhados com outros usuários ou máquinas e não representam um banco de dados de produção. **Não use esta demonstração para controle real da equipe.** Ao configurar o Supabase, a demonstração deixa de aparecer; os dados locais não são migrados automaticamente.

## 2. Configurar banco de dados Supabase

1. Crie um projeto em https://supabase.com.
2. Abra **SQL Editor** e execute integralmente `supabase/schema.sql` **uma vez**. É recomendável um projeto novo para evitar conflitos com tabelas ou políticas existentes.
3. Descubra seu ID do Discord (ative **Modo Desenvolvedor** em Configurações Avançadas do Discord, depois clique com botão direito em seu perfil e escolha **Copiar ID do usuário**).
4. Copie o conteúdo de `supabase/bootstrap.sql` para o editor SQL do Supabase, substitua **somente nessa consulta** `COLE_AQUI_SEU_ID_DISCORD` pelo seu Discord ID real e execute. Não inclua seu ID pessoal em commits públicos. Isso cadastra o **primeiro Supervisor**, obrigatório para liberar o painel. Não deixe esse valor fictício.
5. No Supabase, em **Authentication → Providers → Discord**, ative o provedor. Crie a aplicação OAuth no https://discord.com/developers/applications, escolha sua aplicação, vá à seção OAuth2 e configure a **Redirect URL do Discord** como `https://SEU-PROJETO.supabase.co/auth/v1/callback` (o Supabase mostra o URL exato na configuração do provedor). Copie o **Client ID** e o **Client Secret** do Discord nos campos do Supabase. **Nunca coloque o Client Secret no site ou no GitHub.**
6. No Supabase, em **Authentication → URL Configuration**, informe a URL pública do site no campo **Site URL** e adicione o endereço exato de publicação em **Redirect URLs**, inclusive a barra final quando aplicável, por exemplo `https://USUARIO.github.io/vegas-staff-site/`.
7. Abra **Project Settings → API** (ou **Connect**, dependendo da versão). Copie o **Project URL** e a chave pública **anon / publishable** para `config.js`:

   ```js
   window.VEGAS_CONFIG = {
     supabaseUrl: 'https://SEU-PROJETO.supabase.co',
     supabaseAnonKey: 'SUA_CHAVE_PUBLICA_ANON',
   };
   ```

   **NUNCA** use `service_role`, `sb_secret_` ou qualquer chave secreta no frontend. A chave `anon` / `publishable` é criada para uso público no navegador; a segurança vem das regras RLS que você executou no Supabase.

8. Depois disso, entre pelo botão **Entrar com Discord** usando a conta cadastrada como Supervisor.

## 3. Publicar pelo GitHub

1. Crie um repositório no https://github.com, por exemplo `vegas-staff-site`.
2. Envie **todos os arquivos e pastas deste projeto** para a raiz do repositório (`index.html`, `config.js`, `assets`, `.github`, `supabase`, `.nojekyll`, etc.).
3. Na aba **Settings → Pages → Build and deployment**, selecione **GitHub Actions** como fonte de publicação.
4. O workflow `.github/workflows/pages.yml` publica o site automaticamente em cada envio para a branch `main`.
5. Use a URL exibida pelo GitHub Pages para configurar o endereço permitido no Supabase (passo 2.6). O site deve ser acessado via `https://`.
6. Edite `config.js` e envie a alteração para o GitHub. O workflow publica a versão com integração real.

**Importante:** GitHub Pages hospeda apenas arquivos estáticos. Supabase guarda registros e autentica usuários; seu projeto não deve ser publicado colocando dados ou senhas no repositório.

## 4. Operação dos relatórios de 30 minutos

- Um Supervisor inicia a rodada do horário corrente (por exemplo, 18h00–18h30).
- Preenche, para cada staff ativo: **Em call?**, **Na cidade?**, **O que está fazendo?** e uma observação opcional.
- Clica em **Salvar relatório**, inclusive se ainda houver pendências. Campos não preenchidos ficam como **Não verificado**.
- Quando os três campos de todos os staffs ativos estiverem preenchidos, pode clicar em **Finalizar rodada**.
- A rodada fica no histórico. Supervisores podem corrigir dados; o banco audita as modificações.
- O contador indica quando começa o próximo período. Não existe verificação automática de membros do Discord/FiveM, nem alerta quando a aba está fechada. Uma futura integração com bots/API pode disponibilizar esses recursos.

### Detalhes técnicos e limitações

- Banco: PostgreSQL do Supabase, RLS habilitada em todas as tabelas.
- Identidade vinculada pela tabela `auth.identities` (provedor Discord), não pelo ID digitado no browser.
- Um cadastro sem ID Discord pode existir no sistema, mas **não consegue entrar** até que um Supervisor cadastre o ID real.
- A conta com status **Afastado** ou **Desligado** não acessa o painel.
- O banco impede que o último Supervisor ativo seja afastado, desligado ou rebaixado.
- Horários exibidos em `America/Sao_Paulo`; as rodadas são alinhadas em 00 e 30 minutos. Campos de atividade não são obtidos automaticamente do Discord ou FiveM.
- A auditoria é escrita por triggers SQL. O frontend não pode inserir ou editar registros de auditoria.
- A interface carrega os últimos 120 intervalos e as últimas 200 ações de auditoria, embora o banco preserve o histórico completo. Para consulta de histórico extenso, use o Supabase ou implemente paginação.
- Evite registrar senhas, tokens e outras informações sensíveis em observações.

### Estrutura

```text
vegas-staff-site/
├── index.html
├── config.js
├── assets/
│   ├── app.js
│   ├── api.js
│   ├── styles.css
│   └── favicon.svg
├── supabase/
│   ├── schema.sql
│   └── bootstrap.sql
├── .github/workflows/pages.yml
├── .nojekyll
└── README.md
```

## Próxima etapa

Cadastre a lista real de staffs no painel (ou envie os dados para preparar uma importação em lote). Nenhum funcionário fictício foi incluído nos registros de produção.


## Equipe inicial (18 membros)

A demonstração já abre com 6 Administradores, 3 Moderadores e 9 Suportes. Nenhum Supervisor ou Estagiário foi fornecido. Em produção, execute `supabase/staff_inicial.sql` após `supabase/schema.sql` e configure o Supervisor no `bootstrap.sql`. As áreas refletem apenas as informações disponíveis e devem ser conferidas. Se já abriu a demonstração antes, limpe os dados locais da demonstração para carregar a lista inicial.
