import * as api from './api.js';

const root=document.querySelector('#app');
const TZ='America/Sao_Paulo';
const ROLES=['Supervisor','Administrador','Moderador','Suporte','Estagiário'];
const STATUSES=['Ativo','Afastado','Desligado'];
const CALL=['Não verificado','Sim','Não','AFK'];
const CITY=['Não verificado','Sim','Não'];
const ACTIVITIES=['Não verificado','Atendimento','Ticket','RP','Entrevista','Patrulhamento','Em pausa','AFK','Offline','Outro'];
const COURSES=['Atendimento','Tickets','Comandos ADM','Conduta','Logs','Outro'];
const ICONS={
  dashboard:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h3"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  close:'<path d="M18 6 6 18M6 6l12 12"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v5M12 7h.01"/>',
  alert:'<path d="m10.3 3.3-8.6 15A2 2 0 0 0 3.4 21h17.2a2 2 0 0 0 1.7-2.7l-8.6-15a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/>',
  edit:'<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/>',
  refresh:'<path d="M20 7v5h-5M4 17v-5h5M5 8a8 8 0 0 1 14-1M19 16a8 8 0 0 1-14 1"/>',
  flag:'<path d="M4 22V4m0 1c5-4 9 4 16 0v12c-7 4-11-4-16 0"/>',
  play:'<path d="m8 5 11 7-11 7V5Z"/>',
  circle:'<circle cx="12" cy="12" r="9"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  filter:'<path d="M4 7h16M7 12h10M10 17h4"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
};
function icon(name){return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" aria-hidden="true">${ICONS[name]||ICONS.circle}</svg>`;}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function attr(value){return esc(value);}
function formatDate(value,{dateOnly=false,timeOnly=false}={}){
 if(!value)return '—'; const d=new Date(value);if(Number.isNaN(d.getTime()))return '—';
 return new Intl.DateTimeFormat('pt-BR',{timeZone:TZ,...(dateOnly?{day:'2-digit',month:'2-digit',year:'numeric'}:timeOnly?{hour:'2-digit',minute:'2-digit'}:{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}).format(d);
}
function timeRange(date){return `${formatDate(date,{timeOnly:true})}–${formatDate(new Date(new Date(date).getTime()+30*60*1000),{timeOnly:true})}`;}
function currentSlot(){return new Date(Math.floor(Date.now()/(30*60*1000))*30*60*1000).toISOString();}
function isCurrentSlot(value){return value && new Date(value).getTime()===new Date(currentSlot()).getTime();}
function remaining(){const ms=30*60*1000-(Date.now()%(30*60*1000));return `${String(Math.floor(ms/60000)).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`;}
function roleIndex(role){return ROLES.indexOf(role);}
function avatar(name,light=false){return `<span class="avatar ${light?'light':''}">${esc(String(name||'?').trim().split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase())}</span>`;}
function badge(text){let mood='muted'; if(['Ativo','Concluído','Finalizada','Sim'].includes(text))mood='good'; if(['Afastado','Pendente','Rascunho','AFK','Aviso'].includes(text))mood='warn'; if(['Desligado','Suspensão','Revogada'].includes(text))mood='bad';return `<span class="pill tiny ${mood}">${esc(text||'—')}</span>`;}
function options(items,value){return items.map(item=>`<option value="${attr(item)}" ${item===value?'selected':''}>${esc(item)}</option>`).join('');}
function empty(title,text,action='',compact=false){return `<div class="empty ${compact?'compact':''}"><div class="empty-icon">${icon('list')}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`;}
function personCell(s){return `<div class="person">${avatar(s.name)}<div><strong>${esc(s.name)}</strong><small>${s.discord_id?`Discord · ${esc(s.discord_id)}`:'Discord não vinculado'}</small></div></div>`;}
function btn(action,text,kind='primary',extra=''){return `<button type="button" class="btn ${kind}" data-action="${attr(action)}" ${extra}>${text}</button>`;}
function isSuper(){return state.profile?.role==='Supervisor';}
function isManager(){return ['Supervisor','Administrador'].includes(state.profile?.role);}
function staffName(id){return state.data.staff_members.find(s=>s.id===id)?.name || 'Sistema';}
function recentRound(){return [...state.data.report_rounds].sort((a,b)=>new Date(b.period_start)-new Date(a.period_start))[0];}
function activeStaff(){return state.data.staff_members.filter(s=>s.status==='Ativo');}
function records(table){return state.data[table] || [];}
function countComplete(entry){return entry && entry.in_call!=='Não verificado' && entry.in_city!=='Não verificado' && entry.activity!=='Não verificado';}
function forRound(id){return records('report_entries').filter(e=>e.round_id===id);}
function roundProgress(round){const staff=activeStaff();const entries=forRound(round?.id);return {total:staff.length,done:staff.filter(s=>countComplete(entries.find(e=>e.staff_id===s.id))).length};}
function roundById(id){return records('report_rounds').find(r=>r.id===id);}
const state={auth:'boot',profile:null,user:null,data:{staff_members:[],report_rounds:[],report_entries:[],punishments:[],training_records:[],time_entries:[],audit_logs:[]},tab:'dashboard',menu:false,modal:'',modalId:null,staffSearch:'',staffRole:'Todos',staffStatus:'Todos',reportRoundId:null,reportDraft:{},loading:false,authError:'',demo:false};
let toastTimer;
let searchDebounce;
function toast(message,type='success'){
 let el=document.querySelector('#toast-region');if(!el){el=document.createElement('div');el.id='toast-region';el.className='toast-list';document.body.append(el);}
 const item=document.createElement('div');item.className=`toast ${type}`;item.innerHTML=`${icon(type==='error'?'alert':'check')}<span>${esc(message)}</span>`;el.append(item);clearTimeout(toastTimer);setTimeout(()=>item.remove(),5500);
}
async function bootstrap(){
 try{
  const auth=await api.startAuth();
  if(api.isDemo()) {
    if(localStorage.getItem('vegas_demo_open')!=='1'){state.auth='login';render();return;}
    state.demo=true;state.profile=auth.profile;state.auth='ready';await loadData();render();return;
  }
  if(auth.signedOut){state.auth='login';render();return;}
  if(auth.unauthorized||auth.suspended){state.auth=auth.suspended?'suspended':'unauthorized';state.user=auth.user;state.discordId=auth.discordId;render();return;}
  state.profile=auth.profile;state.user=auth.user;state.auth='ready';await loadData();render();
 }catch(e){state.auth='login';state.authError=e.message;render();}
}
async function loadData(){
 const all=['staff_members','report_rounds','report_entries','punishments','training_records','time_entries','audit_logs'];
 const queries={report_rounds:'order=period_start.desc&limit=120',report_entries:'order=created_at.desc',punishments:'order=created_at.desc&limit=300',training_records:'order=created_at.desc&limit=500',time_entries:'order=started_at.desc&limit=500',audit_logs:'order=created_at.desc&limit=200'};
 const vals=await Promise.all(all.map(table=>api.list(table,queries[table]||'')));
 all.forEach((table,i)=>state.data[table]=vals[i]);
 state.data.staff_members.sort((a,b)=>roleIndex(a.role)-roleIndex(b.role) || a.name.localeCompare(b.name,'pt-BR'));
 if(state.reportRoundId&&!roundById(state.reportRoundId)){state.reportRoundId=null;state.reportDraft={};}
 const slot=records('report_rounds').find(r=>isCurrentSlot(r.period_start));
 if(state.reportRoundId && roundById(state.reportRoundId)) chooseRound(state.reportRoundId);
 else if(slot)chooseRound(slot.id);
}
function chooseRound(id){state.reportRoundId=id;state.reportDraft={};for(const entry of forRound(id))state.reportDraft[entry.staff_id]={in_call:entry.in_call,in_city:entry.in_city,activity:entry.activity,notes:entry.notes||''};}
async function run(task,success='Alteração salva com sucesso.'){
 if(state.loading)return;state.loading=true;
 try{await task();await loadData();if(state.profile?.id&&api.production){const own=state.data.staff_members.find(s=>s.id===state.profile.id);if(own)state.profile=own;}render();toast(success);}
 catch(e){toast(e.message||'Erro desconhecido','error');}
 finally{state.loading=false;}
}
function render(){
 if(state.auth==='boot'){root.innerHTML='<div class="boot"><div class="brand-mark">V</div><span>Carregando painel...</span></div>';return;}
 if(state.auth!=='ready'){root.innerHTML=renderLogin();return;}
 root.innerHTML=renderLayout();
 updateClock();
}
function renderLogin(){
 const access=state.auth==='unauthorized'||state.auth==='suspended';
 const label=api.isDemo()?'ACESSO DE DEMONSTRAÇÃO':access?'ACESSO RESTRITO':'AUTENTICAÇÃO SEGURA';
 return `<div class="auth-page"><section class="auth-left"><div class="auth-wordmark"><div class="brand-mark">V</div><span>VEGAS <span style="color:#81838a">ROLEPLAY</span></span></div><div><h1>Gestão da<br><span>staff, em ordem.</span></h1><p>Uma central para administrar a equipe, acompanhar a atividade e registrar cada decisão com clareza.</p></div><footer>VEGAS RP · SISTEMA INTERNO DE GESTÃO</footer></section><section class="auth-right"><div class="auth-content"><div class="subheading">${label}</div><h2>${access?'Sua conta não tem acesso':'Bem-vindo ao painel.'}</h2><p>${access?'O Discord foi autenticado, mas sua conta não está liberada para usar o painel.':'Entre para acompanhar a equipe, preencher relatórios e consultar o histórico de gestão.'}</p>${state.authError?`<div class="auth-error">${esc(state.authError)}</div>`:''}
 ${access?`<div class="auth-setup"><strong>${state.auth==='suspended'?'Conta afastada':'Discord não cadastrado'}</strong><br>Peça a um Supervisor para cadastrar ou reativar seu Discord na aba Equipe.<br><br>ID do Discord: <code>${esc(state.discordId||'não identificado')}</code></div>${btn('logout',`${icon('logout')} Sair da conta`,'ghost full')}`:
 api.isDemo()?`<div class="auth-setup"><strong>Prévia local</strong><br>Você poderá cadastrar staffs, criar relatórios e testar todas as telas. Os dados desta prévia ficam apenas no navegador, não são compartilhados.</div>${btn('demo-login',`${icon('arrow')} Entrar na demonstração`,'primary full')}`:
 `${btn('login-discord',`${icon('shield')} Entrar com Discord`,'primary full')}<div class="auth-hint"><span class="auth-dot"></span> Acesso liberado somente para Discord cadastrado por um Supervisor.</div>`}
 <div class="auth-hint">${api.isDemo()?'Para usar com várias pessoas, configure Supabase e Discord no arquivo config.js.':'Ambiente protegido por regras de acesso no banco de dados.'}</div></div></section></div>`;
}
const NAV_MAIN=[['dashboard','Visão geral','dashboard'],['staff','Equipe','users'],['reports','Relatórios 30 min','calendar']];
const NAV_MORE=[['punishments','Punições','shield'],['training','Cursos','book'],['shifts','Controle de ponto','clock'],['audit','Auditoria','history']];
function renderNav(items){return items.filter(([id])=>id!=='audit'||isSuper()).map(([id,title,ic])=>`<button type="button" class="${state.tab===id?'active':''}" data-action="navigate" data-id="${id}">${icon(ic)}<span>${title}</span>${id==='reports'&&records('report_rounds').length?`<span class="count">${records('report_rounds').length}</span>`:''}</button>`).join('');}
function renderLayout(){
 const pageNames={dashboard:'Visão geral',staff:'Equipe',reports:'Relatórios',punishments:'Punições',training:'Cursos',shifts:'Controle de ponto',audit:'Auditoria'};
 return `<div class="layout ${state.menu?'menu-open':''}"><div class="mobile-overlay" data-action="close-menu"></div><aside class="sidebar"><div class="identity"><div class="brand-mark">V</div><div><strong>VEGAS RP</strong><small>STAFF MANAGEMENT</small></div></div><div class="side-label">WORKSPACE</div><nav class="nav">${renderNav(NAV_MAIN)}</nav><div class="side-label">ADMINISTRAÇÃO</div><nav class="nav">${renderNav(NAV_MORE)}</nav><div class="side-bottom"><div class="side-box"><span class="side-title"><span class="side-indicator"></span>${api.isDemo()?'Modo demonstração':'Ambiente ativo'}</span><div class="side-desc">${api.isDemo()?'Dados locais para testar o painel. Configure o Supabase para sincronizar a equipe.':'Registros persistidos e protegidos por permissões no banco.'}</div></div><div class="side-user">${avatar(state.profile?.name,true)}<div class="info"><strong>${esc(state.profile?.name)}</strong><small>${esc(state.profile?.role)}</small></div><button class="icon-btn" type="button" title="Sair" aria-label="Sair da conta" data-action="logout">${icon('logout')}</button></div></div></aside><main class="main"><header class="topbar"><button class="icon-btn mobile-menu" type="button" data-action="toggle-menu" title="Menu">${icon('menu')}</button><div class="crumb"><span>Central de Gestão</span><span class="slash">/</span><strong>${pageNames[state.tab]}</strong></div><div class="top-right"><span class="top-time" id="now-time">—</span><span class="pill">${icon('shield')} ${esc(state.profile.role)}</span></div></header><div class="content">${renderPage()}<div class="footer">VEGAS ROLEPLAY · Gestão de equipe · Horário de Brasília (GMT−3)<br>Dados de atividade são preenchidos pela Supervisão; não existe monitoramento automático do Discord ou FiveM.</div></div></main>${state.modal?renderModal():''}</div>`;
}
function renderPage(){return ({dashboard:renderDashboard,staff:renderStaff,reports:renderReports,punishments:renderPunishments,training:renderTraining,shifts:renderShifts,audit:renderAudit})[state.tab]();}
function pageHead(kicker,title,description,actions=''){return `<div class="page-head"><div><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p></div><div class="actions">${actions}</div></div>`;}
function metric(label,number,foot,ic){return `<div class="metric"><div class="metric-top"><span>${esc(label)}</span><span class="metric-icon">${icon(ic)}</span></div><div class="metric-num">${number}</div><div class="metric-foot">${esc(foot)}</div></div>`;}
function renderDashboard(){
 const staff=activeStaff(),round=recentRound(),entries=round?forRound(round.id):[];
 const checked=staff.filter(s=>countComplete(entries.find(e=>e.staff_id===s.id)));
 const inCity=checked.filter(s=>entries.find(e=>e.staff_id===s.id)?.in_city==='Sim').length;
 const inCall=checked.filter(s=>entries.find(e=>e.staff_id===s.id)?.in_call==='Sim').length;
 const attention=round?roundProgress(round):{done:0,total:staff.length};
 const roleCounts=ROLES.map(role=>({role,n:staff.filter(s=>s.role===role).length}));const max=Math.max(1,...roleCounts.map(r=>r.n));
 const logs=[...records('audit_logs')].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5);
 return `${pageHead('PAINEL DE CONTROLE',`Boa ${new Date().getHours()<12?'manhã':new Date().getHours()<18?'tarde':'noite'}, ${state.profile?.name?.split(' ')[0]||'Supervisor'}.`,'Acompanhe o quadro da equipe e as últimas verificações.',isSuper()?btn('navigate',`${icon('calendar')} Abrir relatórios`,'primary','data-id="reports"'):'')}
 ${api.isDemo()?`<div class="callout">${icon('info')}<span><strong>Você está em uma demonstração.</strong> Cadastros e relatórios funcionam localmente, mas não são compartilhados. Para colocar o site em produção, siga o README e configure o banco de dados.</span></div>`:''}
 <div class="cards">${metric('Staffs ativos',staff.length,`${records('staff_members').length} cadastrados no total`,'users')}${metric('Na cidade',round?inCity:'—',round?`Última rodada: ${timeRange(round.period_start)}`:'Sem rodada registrada','activity')}${metric('Em call',round?inCall:'—',round?'Última verificação registrada':'Sem rodada registrada','calendar')}${metric('Staffs verificados',round?`${attention.done}/${attention.total}`:'—',round?'No relatório mais recente':'Aguardando primeiro relatório','check')}</div>
 <div class="grid2"><section class="panel"><div class="panel-header"><div><h2>Distribuição por cargo</h2><p>Quantidade de membros ativos na hierarquia</p></div>${btn('navigate',`${icon('arrow')} Ver equipe`,'ghost small','data-id="staff"')}</div><div class="panel-body">${staff.length?`<div class="stat-bars">${roleCounts.map(r=>`<div class="barline"><label>${r.role}</label><div class="track"><span style="width:${(r.n/max)*100}%"></span></div><small>${r.n}</small></div>`).join('')}</div>`:empty('Nenhum staff cadastrado','Adicione membros à equipe para acompanhar a distribuição por cargo.',isSuper()?btn('open-staff',`${icon('plus')} Cadastrar staff`,'primary small'):'',true)}</div></section>
 <section class="panel"><div class="panel-header"><div><h2>${isSuper()?'Atividade recente':'Últimas verificações'}</h2><p>${isSuper()?'Mudanças registradas no painel':'Histórico dos relatórios disponíveis'}</p></div></div><div class="panel-body">${isSuper()?logs.length?logs.map(l=>`<div class="activity-row"><div class="activity-icon">${icon('history')}</div><div class="activity-content"><strong>${esc(auditTitle(l))}</strong><p>Por ${esc(staffName(l.actor_id))}</p></div><time>${formatDate(l.created_at,{timeOnly:true})}</time></div>`).join(''):empty('Ainda não há movimentações','As alterações realizadas no sistema aparecerão aqui.','',true):records('report_rounds').slice(0,4).map(r=>`<div class="activity-row"><div class="activity-icon">${icon('calendar')}</div><div class="activity-content"><strong>${formatDate(r.period_start,{dateOnly:true})} · ${timeRange(r.period_start)}</strong><p>${r.is_finalized?'Rodada finalizada':'Rodada em andamento'}</p></div></div>`).join('')||empty('Sem relatórios','Aguarde a primeira verificação.','',true)}</div></section></div>
 ${round?`<div class="panel" style="margin-top:17px"><div class="panel-header"><div><h2>Última rodada de atividade</h2><p>${formatDate(round.period_start,{dateOnly:true})} · ${timeRange(round.period_start)} · ${round.is_finalized?'Finalizada':'Em andamento'}</p></div>${btn('open-round',`${icon('arrow')} Abrir relatório`,'ghost small',`data-id="${attr(round.id)}"`)}</div><div class="panel-body"><div class="round-progress" style="max-width:100%;width:100%;margin:0"><strong style="text-align:left">${attention.total?Math.round(attention.done/attention.total*100):0}% verificado</strong><div class="track"><span style="width:${attention.total?attention.done/attention.total*100:0}%"></span></div><small style="text-align:left">${attention.done} de ${attention.total} staffs ativos com situação preenchida</small></div></div></div>`:''}`;
}
function renderStaff(){
 const list=records('staff_members').filter(s=>(state.staffRole==='Todos'||s.role===state.staffRole)&&(state.staffStatus==='Todos'||s.status===state.staffStatus)&&(`${s.name} ${s.discord_id||''} ${s.area||''}`).toLocaleLowerCase('pt-BR').includes(state.staffSearch.toLocaleLowerCase('pt-BR')));
 const action=isSuper()?btn('open-staff',`${icon('plus')} Adicionar staff`):'';
 return `${pageHead('ESTRUTURA ORGANIZACIONAL','Equipe de staff','Cadastre, organize e acompanhe os membros por cargo e situação.',action)}
 <div class="toolbar"><div class="toolbar-group"><div class="searchbox">${icon('search')}<input class="field" id="staff-search" placeholder="Buscar por nome, Discord ou área" value="${attr(state.staffSearch)}"></div><select class="field" id="staff-role">${options(['Todos',...ROLES],state.staffRole)}</select><select class="field" id="staff-status">${options(['Todos',...STATUSES],state.staffStatus)}</select></div><div class="toolbar-group">${btn('export-staff',`${icon('download')} Exportar CSV`,'ghost')}</div></div>
 <div class="panel"><div class="panel-header"><div><h2>Quadro de membros</h2><p>${list.length} ${list.length===1?'registro encontrado':'registros encontrados'}</p></div><span class="pill muted">${records('staff_members').length} cadastrados</span></div>${list.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Staff</th><th>Cargo</th><th>Área</th><th>Status</th><th>Entrada</th>${isSuper()?'<th>Ações</th>':''}</tr></thead><tbody>${list.map(s=>`<tr><td>${personCell(s)}</td><td><span class="pill tiny">${esc(s.role)}</span></td><td>${esc(s.area||'Sem área')}</td><td>${badge(s.status)}</td><td>${s.joined_at?formatDate(`${s.joined_at}T12:00:00-03:00`,{dateOnly:true}):'—'}</td>${isSuper()?`<td><button class="table-action" data-action="open-staff" data-id="${attr(s.id)}">Editar ${icon('edit')}</button></td>`:''}</tr>`).join('')}</tbody></table></div>`:empty('Nenhum membro encontrado',state.staffSearch||state.staffRole!=='Todos'||state.staffStatus!=='Todos'?'Altere os filtros para visualizar outros registros.':'Comece cadastrando os staffs atuais da Vegas RP.',isSuper()?btn('open-staff',`${icon('plus')} Primeiro cadastro`):'')}</div>
 <div class="panel" style="margin-top:18px"><div class="panel-header"><div><h2>Hierarquia oficial</h2><p>Supervisor é o cargo máximo e tem acesso total.</p></div></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${ROLES.map((role,i)=>`<div class="role-summary" style="border-right:1px solid #292b31;border-bottom:0"><strong><span style="color:#757982;margin-right:8px">0${i+1}</span>${esc(role)}</strong><small>${records('staff_members').filter(s=>s.role===role).length} membros</small></div>`).join('')}</div></div>`;
}
function renderReports(){
 const current=records('report_rounds').find(r=>isCurrentSlot(r.period_start));
 const round=state.reportRoundId?roundById(state.reportRoundId):current;
 const total=activeStaff().length;
 const selectedDate=round?`${formatDate(round.period_start,{dateOnly:true})} · ${timeRange(round.period_start)}`:'Rodada atual ainda não iniciada';
 const viewingOld=round?!isCurrentSlot(round.period_start):false;
 const draft=(s)=>state.reportDraft[s.id]||{in_call:'Não verificado',in_city:'Não verificado',activity:'Não verificado',notes:''};
 const done=round?activeStaff().filter(s=>countComplete(draft(s))).length:0;
 const percentage=total?Math.round(done/total*100):0;
 const rounds=[...records('report_rounds')].sort((a,b)=>new Date(b.period_start)-new Date(a.period_start)).slice(0,12);
 return `${pageHead('MONITORAMENTO OPERACIONAL','Relatórios de 30 minutos','A Supervisão registra a presença em call, na cidade e a atividade de cada staff.',`${!current&&isSuper()?btn('create-round',`${icon('plus')} Iniciar rodada atual`):''}${btn('refresh',`${icon('refresh')} Atualizar`,'ghost')}`)}
 <div class="round-top"><div class="round-card"><div><div class="round-title">${round?'RODADA SELECIONADA':'PRÓXIMA VERIFICAÇÃO'}</div><div class="round-clock">${esc(round?selectedDate:timeRange(currentSlot()))}</div><div class="muted">${round?`${round.is_finalized?'Finalizada':'Em preenchimento'} · Horário de Brasília`:'Inicie uma rodada para preencher a situação de toda a equipe'}</div></div><div class="round-progress"><strong id="progress-number">${percentage}%</strong><div class="track"><span id="progress-bar" style="width:${percentage}%"></span></div><small id="progress-text">${done} de ${total} verificados</small></div></div><div class="timer-box"><span>PRÓXIMA RODADA EM</span><strong id="next-round-timer">${remaining()}</strong><small>Intervalos fixos de 30 minutos</small></div></div>
 <div class="callout">${icon('info')}<span><strong>Preenchimento manual pela Supervisão.</strong> “Não verificado” significa ausência de informação, nunca que o staff está offline. A contagem de 30 minutos funciona enquanto a página está aberta.</span></div>
 ${round?`<section class="panel"><div class="panel-header"><div><h2>${viewingOld?'Consulta de rodada anterior':'Verificação da equipe'}</h2><p>${formatDate(round.period_start,{dateOnly:true})} · ${timeRange(round.period_start)} · ${total} staffs ativos</p></div><div class="actions">${round.is_finalized?badge('Finalizada'):badge('Rascunho')}${viewingOld&&current?btn('open-round',`${icon('arrow')} Voltar à atual`,'small',`data-id="${attr(current.id)}"`):''}</div></div>
 ${total?`<div class="table-scroll"><table class="data-table report-table"><thead><tr><th>Staff</th><th>Cargo</th><th>Em call?</th><th>Na cidade?</th><th>O que está fazendo?</th><th>Observação</th><th>Conferido</th></tr></thead><tbody>${activeStaff().map(s=>{const d=draft(s);return `<tr><td>${personCell(s)}</td><td>${esc(s.role)}</td><td><select class="field" data-report="${attr(s.id)}" data-field="in_call" ${!isSuper()?'disabled':''}>${options(CALL,d.in_call)}</select></td><td><select class="field" data-report="${attr(s.id)}" data-field="in_city" ${!isSuper()?'disabled':''}>${options(CITY,d.in_city)}</select></td><td><select class="field activity" data-report="${attr(s.id)}" data-field="activity" ${!isSuper()?'disabled':''}>${options(ACTIVITIES,d.activity)}</select></td><td><input class="field notes" maxlength="240" placeholder="Detalhes (opcional)" data-report="${attr(s.id)}" data-field="notes" value="${attr(d.notes)}" ${!isSuper()?'disabled':''}></td><td><span class="progress-inline" data-check="${attr(s.id)}">${countComplete(d)?badge('Concluído'):badge('Pendente')}</span></td></tr>`}).join('')}</tbody></table></div><div class="footer-controls"><small>Alterações em relatórios salvos são registradas na auditoria. ${round.is_finalized?'Correções posteriores continuam permitidas para Supervisores.':''}</small><div class="actions">${isSuper()?`${btn('save-report',`${icon('check')} Salvar relatório`,'primary')}${round.is_finalized?'':btn('finalize-report',`${icon('flag')} Finalizar rodada`,'ghost',`${done!==total?'disabled':''} id="finalize-report"`)}`:''}</div></div>`:empty('Sem staffs ativos','Cadastre e ative pelo menos um membro da equipe para preencher relatórios.',isSuper()?btn('navigate','Abrir equipe','primary','data-id="staff"'):'')}</section>`:
 `<section class="panel">${empty('Nenhuma rodada aberta',isSuper()?'Crie a rodada atual para começar a verificar todos os staffs cadastrados.':'Aguardando um Supervisor iniciar a rodada.',isSuper()?btn('create-round',`${icon('plus')} Iniciar rodada ${timeRange(currentSlot())}`):'')}</section>`}
 <h3 class="history-title">Histórico de rodadas</h3><section class="panel">${rounds.length?rounds.map(r=>{const progress=roundProgress(r);return `<div class="round-item"><div><strong>${formatDate(r.period_start,{dateOnly:true})} · ${timeRange(r.period_start)}</strong><small>${progress.done}/${progress.total} membros verificados · ${r.is_finalized?'Concluída':'Em andamento'}</small></div><div class="actions">${badge(r.is_finalized?'Finalizada':'Rascunho')}${btn('open-round','Visualizar','small',`data-id="${attr(r.id)}"`)}</div></div>`}).join(''):empty('Sem histórico','As rodadas salvas aparecerão aqui.','',true)}</section>`;
}
function renderPunishments(){
 const arr=[...records('punishments')].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 return `${pageHead('DISCIPLINA E CONDUTA','Punições','Registre advertências, suspensões e medidas disciplinares com histórico.',isSuper()?btn('open-punishment',`${icon('plus')} Nova punição`):'')}
 <div class="panel"><div class="panel-header"><div><h2>Histórico de medidas</h2><p>${arr.length} registros</p></div></div>${arr.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Staff</th><th>Medida</th><th>Motivo</th><th>Aplicada por</th><th>Data</th><th>Situação</th>${isSuper()?'<th>Ação</th>':''}</tr></thead><tbody>${arr.map(x=>`<tr><td><strong>${esc(staffName(x.staff_id))}</strong></td><td>${badge(x.kind)}</td><td style="max-width:390px;white-space:normal">${esc(x.reason)}</td><td>${esc(staffName(x.created_by))}</td><td>${formatDate(x.created_at)}</td><td>${badge(x.status)}</td>${isSuper()?`<td>${x.status==='Ativa'?btn('revoke-punishment','Revogar','small',`data-id="${attr(x.id)}"`):'—'}</td>`:''}</tr>`).join('')}</tbody></table></div>`:empty('Nenhuma punição registrada','As medidas disciplinares aparecerão aqui quando cadastradas.',isSuper()?btn('open-punishment',`${icon('plus')} Registrar punição`):'')}</div>`;
}
function renderTraining(){
 const arr=[...records('training_records')].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 const completed=arr.filter(t=>t.status==='Concluído').length;
 return `${pageHead('CAPACITAÇÃO DA EQUIPE','Cursos e certificações','Acompanhe cursos obrigatórios, pendências e conclusões.',isSuper()?btn('open-training',`${icon('plus')} Atribuir curso`):'')}
 <div class="cards" style="grid-template-columns:repeat(3,minmax(0,1fr))">${metric('Cursos atribuídos',arr.length,'Todos os registros','book')}${metric('Concluídos',completed,'Certificações finalizadas','check')}${metric('Pendentes',arr.length-completed,'Aguardando conclusão','clock')}</div><div class="panel"><div class="panel-header"><div><h2>Acompanhamento de cursos</h2><p>Atendimento, Tickets, Comandos ADM, Conduta e Logs</p></div></div>${arr.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Staff</th><th>Curso</th><th>Status</th><th>Data de atribuição</th><th>Conclusão</th>${isSuper()?'<th>Ação</th>':''}</tr></thead><tbody>${arr.map(x=>`<tr><td><strong>${esc(staffName(x.staff_id))}</strong></td><td><span class="course-name">${esc(x.course_name)}</span></td><td>${badge(x.status)}</td><td>${formatDate(x.created_at)}</td><td>${formatDate(x.completed_at)}</td>${isSuper()?`<td>${btn('toggle-training',x.status==='Concluído'?'Reabrir':'Concluir','small',`data-id="${attr(x.id)}"`)}</td>`:''}</tr>`).join('')}</tbody></table></div>`:empty('Sem cursos atribuídos','Atribua os treinamentos necessários aos membros da staff.',isSuper()?btn('open-training',`${icon('plus')} Atribuir curso`):'')}</div>`;
}
function duration(start,end){if(!start)return '—';const diff=Math.max(0,new Date(end||Date.now())-new Date(start));return `${Math.floor(diff/3600000)}h ${String(Math.floor(diff%3600000/60000)).padStart(2,'0')}min`;}
function renderShifts(){
 const arr=[...records('time_entries')].sort((a,b)=>new Date(b.started_at)-new Date(a.started_at));
 const open=arr.filter(x=>!x.ended_at);
 return `${pageHead('CONTROLE OPERACIONAL','Controle de ponto','Registre o início e o fim de turnos da equipe manualmente.',isSuper()?btn('open-shift',`${icon('plus')} Abrir ponto`):'')}
 <div class="callout">${icon('info')}<span>Os pontos são registrados pela Supervisão. Este módulo não acompanha a presença em tempo real no Discord nem dentro do FiveM.</span></div>
 <div class="cards" style="grid-template-columns:repeat(2,minmax(0,1fr))">${metric('Turnos abertos',open.length,'Sem horário de saída registrado','clock')}${metric('Turnos registrados',arr.length,'Histórico de ponto manual','history')}</div><div class="panel"><div class="panel-header"><div><h2>Histórico de ponto</h2><p>Registros criados pela gestão</p></div></div>${arr.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Staff</th><th>Entrada</th><th>Saída</th><th>Duração</th><th>Observação</th><th>Status</th>${isSuper()?'<th>Ação</th>':''}</tr></thead><tbody>${arr.map(x=>`<tr><td><strong>${esc(staffName(x.staff_id))}</strong></td><td>${formatDate(x.started_at)}</td><td>${formatDate(x.ended_at)}</td><td>${duration(x.started_at,x.ended_at)}</td><td>${esc(x.note||'—')}</td><td>${badge(x.ended_at?'Concluído':'Ativo')}</td>${isSuper()?`<td>${x.ended_at?'—':btn('close-shift','Encerrar','small',`data-id="${attr(x.id)}"`)}</td>`:''}</tr>`).join('')}</tbody></table></div>`:empty('Sem turnos cadastrados','Inicie o primeiro ponto manual da equipe.',isSuper()?btn('open-shift',`${icon('plus')} Abrir ponto`):'')}</div>`;
}
function auditTitle(log){const names={staff_members:'Cadastro da equipe',report_rounds:'Rodada de relatório',report_entries:'Verificação de atividade',punishments:'Punição',training_records:'Curso',time_entries:'Registro de ponto'};const verb={INSERT:'Criado',UPDATE:'Atualizado',DELETE:'Excluído'};return `${verb[log.operation]||log.operation}: ${names[log.entity]||log.entity}`;}
function renderAudit(){
 if(!isSuper())return empty('Acesso exclusivo da Supervisão','Você não tem permissão para visualizar esta página.');
 const logs=[...records('audit_logs')].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 return `${pageHead('RASTREABILIDADE','Auditoria do sistema','Histórico automático de inclusões, edições e exclusões, com responsável e data.',btn('refresh',`${icon('refresh')} Atualizar`,'ghost'))}<div class="panel"><div class="panel-header"><div><h2>Registro de ações</h2><p>Últimos ${logs.length} eventos disponíveis</p></div>${btn('export-audit',`${icon('download')} Exportar CSV`,'ghost small')}</div>${logs.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Operação</th><th>Responsável</th><th>Staff afetado</th><th>Quando</th><th>Detalhes</th></tr></thead><tbody>${logs.map(l=>`<tr><td>${esc(auditTitle(l))}</td><td>${esc(staffName(l.actor_id))}</td><td>${esc(l.target_staff_id?staffName(l.target_staff_id):'—')}</td><td>${formatDate(l.created_at)}</td><td><button class="table-action" data-action="view-audit" data-id="${attr(l.id)}">Visualizar</button></td></tr>`).join('')}</tbody></table></div>`:empty('Nenhuma alteração registrada','Os eventos de auditoria serão exibidos aqui automaticamente.')}</div>`;
}
function textField(label,name,value='',opts={}){const {required=false,placeholder='',type='text',full=false,help='',minlength='',maxlength=''}=opts;return `<div class="form-group ${full?'full':''}"><label for="form-${attr(name)}">${esc(label)}</label><input id="form-${attr(name)}" class="field" type="${attr(type)}" name="${attr(name)}" value="${attr(value||'')}" placeholder="${attr(placeholder)}" ${required?'required':''} ${minlength?`minlength="${attr(minlength)}"`:''} ${maxlength?`maxlength="${attr(maxlength)}"`:''}>${help?`<span class="helper">${esc(help)}</span>`:''}</div>`;}
function selectField(label,name,items,value='',full=false){return `<div class="form-group ${full?'full':''}"><label for="form-${attr(name)}">${esc(label)}</label><select id="form-${attr(name)}" class="field" name="${attr(name)}">${options(items,value)}</select></div>`;}
function textareaField(label,name,value='',help=''){return `<div class="form-group full"><label for="form-${attr(name)}">${esc(label)}</label><textarea id="form-${attr(name)}" name="${attr(name)}" class="field" maxlength="1000">${esc(value)}</textarea>${help?`<span class="helper">${esc(help)}</span>`:''}</div>`;}
function staffSelection(){return `<div class="form-group full"><label for="form-staff_id">Staff</label><select class="field" id="form-staff_id" name="staff_id" required>${activeStaff().map(s=>`<option value="${attr(s.id)}">${esc(`${s.role} | ${s.name}`)}</option>`).join('')}</select></div>`;}
function renderModal(){
 const type=state.modal,id=state.modalId;
 const staff=records('staff_members').find(s=>s.id===id)||{};
 const titles={staff:id?'Editar staff':'Cadastrar staff',punishment:'Registrar punição',training:'Atribuir curso',shift:'Abrir ponto manual',audit:'Detalhes da alteração'};
 let body='',footer='';
 if(type==='staff'){
  body=`<div class="form-grid">${textField('Nome do staff','name',staff.name,{required:true,placeholder:'Nome utilizado na staff',maxlength:80})}${textField('ID do Discord','discord_id',staff.discord_id,{placeholder:'Ex.: 123456789012345678',help:'Opcional no cadastro. Necessário para liberar login pelo Discord.'})}${selectField('Cargo','role',ROLES,staff.role||'Estagiário')}${selectField('Situação','status',STATUSES,staff.status||'Ativo')}${textField('Área de atuação','area',staff.area,{placeholder:'Ex.: Entrevistas, Hospital',maxlength:100})}${textField('Data de entrada','joined_at',staff.joined_at||new Date().toISOString().slice(0,10),{type:'date'})}${textareaField('Observações internas','notes',staff.notes)}</div>`;
  footer=`${btn('close-modal','Cancelar','ghost') }<button type="submit" form="modal-form" class="btn primary">${icon('check')} ${id?'Salvar alterações':'Cadastrar staff'}</button>`;
 }else if(type==='punishment'){
  body=`<div class="form-grid">${staffSelection()}${selectField('Tipo de punição','kind',['Aviso','Advertência','Suspensão','Desligamento'],'Advertência',true)}${textareaField('Motivo / evidências','reason','','Descreva o ocorrido com objetividade. Evite informações pessoais desnecessárias.')}</div>`;
  footer=`${btn('close-modal','Cancelar','ghost')}<button type="submit" form="modal-form" class="btn primary">${icon('check')} Registrar punição</button>`;
 }else if(type==='training'){
  body=`<div class="form-grid">${staffSelection()}${selectField('Curso','course_name',COURSES,'Atendimento',true)}${textField('Outro curso (se selecionar Outro)','custom_course','',{full:true,placeholder:'Nome do treinamento'})}${selectField('Situação inicial','status',['Pendente','Concluído'],'Pendente',true)}</div>`;
  footer=`${btn('close-modal','Cancelar','ghost')}<button type="submit" form="modal-form" class="btn primary">${icon('check')} Atribuir curso</button>`;
 }else if(type==='shift'){
  body=`<div class="form-grid">${staffSelection()}${textField('Observação','note','',{placeholder:'Opcional',full:true, maxlength:200})}</div>`;
  footer=`${btn('close-modal','Cancelar','ghost')}<button type="submit" form="modal-form" class="btn primary">${icon('check')} Registrar entrada</button>`;
 }else if(type==='audit'){
  const log=records('audit_logs').find(l=>l.id===id);
  body=`<div class="callout">${icon('info')}<span>Registro criado automaticamente. Não pode ser editado pelo painel.</span></div><div style="font-size:11px;color:#b8bac2;line-height:1.9"><strong>${esc(auditTitle(log||{}))}</strong><br>Por: ${esc(staffName(log?.actor_id))}<br>Data: ${formatDate(log?.created_at)}</div><pre style="color:#b9bac1;font-size:10px;white-space:pre-wrap;word-break:break-word;max-height:350px;overflow:auto;background:#0e0f12;border:1px solid #33353a;padding:14px;border-radius:9px">${esc(JSON.stringify(log?.details||{},null,2))}</pre>`;
  footer=btn('close-modal','Fechar','ghost');
 }
 return `<div class="modal-backdrop" data-action="backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">${esc(titles[type]||'Informações')}</h2><p>VEGAS RP · Gestão da staff</p></div><button class="icon-btn" type="button" data-action="close-modal" aria-label="Fechar janela">${icon('close')}</button></div><form id="modal-form" data-form="${attr(type)}"><div class="modal-body">${body}</div></form><div class="modal-footer">${footer}</div></div></div>`;
}
function updateClock(){
 const time=document.querySelector('#now-time');if(time)time.textContent=new Intl.DateTimeFormat('pt-BR',{timeZone:TZ,day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date());
 const timer=document.querySelector('#next-round-timer');if(timer)timer.textContent=remaining();
}
function updateReportProgress(){
 const list=activeStaff();const done=list.filter(s=>countComplete(state.reportDraft[s.id])).length;const pct=list.length?Math.round(done/list.length*100):0;
 for(const [selector,value] of [['#progress-number',`${pct}%`],['#progress-text',`${done} de ${list.length} verificados`]]){const el=document.querySelector(selector);if(el)el.textContent=value;}
 const bar=document.querySelector('#progress-bar');if(bar)bar.style.width=`${pct}%`;
 const finalize=document.querySelector('#finalize-report');if(finalize)finalize.disabled=done!==list.length;
 for(const s of list){const el=document.querySelector(`[data-check="${CSS.escape(s.id)}"]`);if(el)el.innerHTML=countComplete(state.reportDraft[s.id])?badge('Concluído'):badge('Pendente');}
}
function exportCSV(name,columns,rows){
 const content='\uFEFF'+[columns.map(x=>x[1]),...rows.map(row=>columns.map(([key])=>row[key]??''))].map(line=>line.map(value=>`"${String(value).replace(/"/g,'""')}"`).join(';')).join('\r\n');
 const b=new Blob([content],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function handleAction(action,id,node){
 switch(action){
  case 'demo-login':localStorage.setItem('vegas_demo_open','1');state.profile=(await api.startAuth()).profile;state.auth='ready';state.demo=true;await loadData();render();break;
  case 'login-discord':api.loginDiscord();break;
  case 'logout':await api.signOut();if(api.isDemo())localStorage.removeItem('vegas_demo_open');state.auth='login';state.profile=null;state.menu=false;render();break;
  case 'toggle-menu':state.menu=!state.menu;render();break;
  case 'close-menu':state.menu=false;render();break;
  case 'navigate':state.tab=id;state.menu=false;state.modal='';render();break;
  case 'close-modal':state.modal='';state.modalId=null;render();break;
  case 'backdrop':if(node?.classList.contains('modal-backdrop')){state.modal='';render();}break;
  case 'open-staff':if(!isSuper())return;state.modal='staff';state.modalId=id||null;render();break;
  case 'open-punishment':if(!isSuper())return;state.modal='punishment';state.modalId=null;render();break;
  case 'open-training':if(!isSuper())return;state.modal='training';state.modalId=null;render();break;
  case 'open-shift':if(!isSuper())return;state.modal='shift';state.modalId=null;render();break;
  case 'view-audit':if(!isSuper())return;state.modal='audit';state.modalId=id;render();break;
  case 'refresh':await run(async()=>{},'Painel atualizado.');break;
  case 'create-round':if(!isSuper())return;await run(async()=>{const slot=currentSlot();let round=records('report_rounds').find(r=>isCurrentSlot(r.period_start));if(!round){round=await api.insert('report_rounds',{period_start:slot,created_by:state.profile.id,is_finalized:false});}chooseRound(round.id);},'Rodada iniciada.');break;
  case 'open-round':chooseRound(id);state.tab='reports';render();break;
  case 'save-report':if(!isSuper())return;await saveReport(false);break;
  case 'finalize-report':if(!isSuper())return;await saveReport(true);break;
  case 'revoke-punishment':if(!isSuper()||!confirm('Revogar esta punição? A ação ficará registrada no histórico.'))return;await run(async()=>api.update('punishments',id,{status:'Revogada'}),'Punição revogada.');break;
  case 'toggle-training':if(!isSuper())return;await run(async()=>{const x=records('training_records').find(v=>v.id===id);if(!x)return;await api.update('training_records',id,{status:x.status==='Concluído'?'Pendente':'Concluído',completed_at:x.status==='Concluído'?null:new Date().toISOString()});},'Status do curso atualizado.');break;
  case 'close-shift':if(!isSuper())return;await run(async()=>api.update('time_entries',id,{ended_at:new Date().toISOString()}),'Ponto encerrado.');break;
  case 'export-staff':exportCSV('vegas-staff-equipe.csv',[['name','Nome'],['discord_id','Discord ID'],['role','Cargo'],['area','Área'],['status','Status'],['joined_at','Entrada']],records('staff_members'));toast('Planilha CSV exportada.');break;
  case 'export-audit':exportCSV('vegas-staff-auditoria.csv',[['entity','Módulo'],['operation','Operação'],['created_at','Data'],['actor_id','ID responsável'],['target_staff_id','ID staff']],records('audit_logs'));toast('Histórico CSV exportado.');break;
 }
}
async function saveReport(finalize){
 const round=roundById(state.reportRoundId);if(!round){toast('Inicie uma rodada primeiro.','error');return;}
 const staff=activeStaff();if(!staff.length){toast('Cadastre ao menos um staff ativo.','error');return;}
 if(finalize&&staff.some(s=>!countComplete(state.reportDraft[s.id]))){toast('Preencha os três campos de todos os staffs antes de finalizar.','error');return;}
 await run(async()=>{
  const rows=staff.map(s=>({round_id:round.id,staff_id:s.id,in_call:state.reportDraft[s.id]?.in_call||'Não verificado',in_city:state.reportDraft[s.id]?.in_city||'Não verificado',activity:state.reportDraft[s.id]?.activity||'Não verificado',notes:state.reportDraft[s.id]?.notes?.trim()||'',updated_by:state.profile.id}));
  await api.upsertMany('report_entries',rows,['round_id','staff_id']);
  if(finalize)await api.update('report_rounds',round.id,{is_finalized:true,finalized_at:new Date().toISOString()});
  chooseRound(round.id);
 },finalize?'Rodada finalizada e salva.':'Relatório salvo.');
}
function formValue(fd,name){return String(fd.get(name)||'').trim();}
async function handleForm(form){
 if(!isSuper())return;
 const fd=new FormData(form);const type=form.dataset.form;
 if(type==='staff'){
  const discord_id=formValue(fd,'discord_id');
  if(discord_id&&!/^\d{16,21}$/.test(discord_id)){toast('O ID do Discord deve ter entre 16 e 21 dígitos.','error');return;}
  const record={name:formValue(fd,'name'),discord_id:discord_id||null,role:formValue(fd,'role'),status:formValue(fd,'status'),area:formValue(fd,'area'),joined_at:formValue(fd,'joined_at')||null,notes:formValue(fd,'notes')};
  if(!record.name){toast('Informe o nome do staff.','error');return;}
  await run(async()=>{if(state.modalId)await api.update('staff_members',state.modalId,record);else await api.insert('staff_members',record);state.modal='';state.modalId=null;},'Cadastro de staff salvo.');
 }else if(type==='punishment'){
  const reason=formValue(fd,'reason');if(reason.length<5){toast('Descreva o motivo da punição (mínimo de 5 caracteres).','error');return;}
  await run(async()=>{await api.insert('punishments',{staff_id:formValue(fd,'staff_id'),kind:formValue(fd,'kind'),reason,status:'Ativa',created_by:state.profile.id});state.modal='';},'Punição registrada.');
 }else if(type==='training'){
  let course=formValue(fd,'course_name');if(course==='Outro')course=formValue(fd,'custom_course');if(!course){toast('Informe o nome do curso.','error');return;}
  const status=formValue(fd,'status');await run(async()=>{await api.insert('training_records',{staff_id:formValue(fd,'staff_id'),course_name:course,status,completed_at:status==='Concluído'?new Date().toISOString():null,created_by:state.profile.id});state.modal='';},'Curso atribuído.');
 }else if(type==='shift'){
  const id=formValue(fd,'staff_id');if(records('time_entries').some(s=>s.staff_id===id&&!s.ended_at)){toast('Este staff já possui um ponto aberto.','error');return;}
  await run(async()=>{await api.insert('time_entries',{staff_id:id,started_at:new Date().toISOString(),note:formValue(fd,'note'),created_by:state.profile.id});state.modal='';},'Ponto de entrada registrado.');
 }
}
root.addEventListener('click',async e=>{
 const t=e.target.closest('[data-action]');if(!t)return;
 const action=t.dataset.action;
 if(action==='backdrop'&&e.target!==t)return;
 if(t.disabled)return;
 try{await handleAction(action,t.dataset.id,t);}catch(err){toast(err.message||'Não foi possível executar a ação.','error');}
});
root.addEventListener('submit',async e=>{const form=e.target.closest('[data-form]');if(!form)return;e.preventDefault();try{await handleForm(form);}catch(err){toast(err.message||'Não foi possível salvar.','error');}});
root.addEventListener('input',e=>{
 const el=e.target;
 if(el.id==='staff-search'){state.staffSearch=el.value;clearTimeout(searchDebounce);const cursor=el.selectionStart;searchDebounce=setTimeout(()=>{render();const newSearch=document.querySelector('#staff-search');if(newSearch){newSearch.focus();newSearch.setSelectionRange(cursor,cursor);}},200);return;}
 if(el.dataset.report){const id=el.dataset.report;if(!state.reportDraft[id])state.reportDraft[id]={in_call:'Não verificado',in_city:'Não verificado',activity:'Não verificado',notes:''};state.reportDraft[id][el.dataset.field]=el.value;updateReportProgress();}
});
root.addEventListener('change',e=>{
 const el=e.target;
 if(el.id==='staff-role'){state.staffRole=el.value;render();return;}
 if(el.id==='staff-status'){state.staffStatus=el.value;render();return;}
 if(el.id==='staff-search'){state.staffSearch=el.value;render();return;}
 if(el.dataset.report){const id=el.dataset.report;if(!state.reportDraft[id])state.reportDraft[id]={in_call:'Não verificado',in_city:'Não verificado',activity:'Não verificado',notes:''};state.reportDraft[id][el.dataset.field]=el.value;updateReportProgress();}
});
root.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.modal){state.modal='';render();}});
setInterval(()=>{if(state.auth==='ready'){updateClock();const selected=roundById(state.reportRoundId);if(state.tab==='reports' && !isCurrentSlot(selected?.period_start) && !state.reportRoundId)render();}},1000);
bootstrap();
