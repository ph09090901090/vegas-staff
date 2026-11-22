// Vegas RP — gateway de dados. Em produção, todas as permissões são validadas no PostgreSQL (RLS).
const config = window.VEGAS_CONFIG || {};
export const production = Boolean(config.supabaseUrl?.trim() && config.supabaseAnonKey?.trim());
const url = (config.supabaseUrl || '').replace(/\/+$/, '');
const key = config.supabaseAnonKey || '';
const AUTH_STORAGE = 'vegas_staff_auth_v1';
const DEMO_STORAGE = 'vegas_staff_demo_v1';
const INITIAL_STAFF = [{"id":"initial-01","name":"Ian","discord_id":"320750778782580737","role":"Administrador","area":"Resp. Hospital","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-02","name":"Kadu","discord_id":"222816111505178624","role":"Administrador","area":"Não informado","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-03","name":"Tralha","discord_id":"1328491072434995220","role":"Administrador","area":"Resp. Tickets; Equipe Denúncia","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-04","name":"Gomes","discord_id":"1460890490684706937","role":"Administrador","area":"Aux. Mecânica; Equipe Denúncia; Equipe Ticket","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-05","name":"Isac","discord_id":"831576618941677631","role":"Administrador","area":"Resp. Entrevista; Gestão Comunidade; Aux. Bombeiro; Equipe Denúncia; Equipe Ticket","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-06","name":"Gaara","discord_id":"1555609725486239749","role":"Administrador","area":"Equipe Denúncia; Equipe Ticket","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-07","name":"Trash","discord_id":"1394823041829175418","role":"Moderador","area":"Equipe Denúncia; Equipe Ticket","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-08","name":"Vitor","discord_id":"537318887050575882","role":"Moderador","area":"Aux. Streamers; Equipe Denúncia; Equipe Ticket","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-09","name":"Silva","discord_id":"668787841521680384","role":"Moderador","area":"Equipe Denúncia; Equipe Ticket","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-10","name":"Dudu","discord_id":"853093892974051399","role":"Suporte","area":"Sem área","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-11","name":"Blonno Reis","discord_id":"1451929254794231849","role":"Suporte","area":"Sem área","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-12","name":"Miguel Ferreira","discord_id":"1512555643834208377","role":"Suporte","area":"Sem área","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-13","name":"Fantasma","discord_id":"1490131009138851851","role":"Suporte","area":"Sem área","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-14","name":"Exorcista","discord_id":"1078141969768923156","role":"Suporte","area":"Sem área","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-15","name":"Pecinha","discord_id":"1214020821903999057","role":"Suporte","area":"Sem área","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-16","name":"Miguel","discord_id":"1020589895435177985","role":"Suporte","area":"Sem área","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-17","name":"Pânico","discord_id":"1497347447410917509","role":"Suporte","area":"Sem área","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."},{"id":"initial-18","name":"Carioca","discord_id":"1502656883151077396","role":"Suporte","area":"Sem área","status":"Ativo","joined_at":null,"notes":"Cadastro inicial a partir da lista enviada; conferir áreas antes de publicar."}];
const DEFAULT_DEMO = { staff_members: INITIAL_STAFF, report_rounds: [], report_entries: [], punishments: [], training_records: [], time_entries: [], audit_logs: [] };
let session = null;
let demoData = null;

function randomId() { return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function clone(v) { return JSON.parse(JSON.stringify(v)); }
function getDemo() {
  if (demoData) return demoData;
  try { demoData = {...clone(DEFAULT_DEMO), ...(JSON.parse(localStorage.getItem(DEMO_STORAGE) || '{}'))}; }
  catch { demoData = clone(DEFAULT_DEMO); }
  return demoData;
}
function saveDemo() { localStorage.setItem(DEMO_STORAGE, JSON.stringify(getDemo())); }
function appendDemoLog(table, operation, before, after) {
  if (table === 'audit_logs') return;
  getDemo().audit_logs.unshift({id:randomId(),entity:table,operation,actor_id:'demo-supervisor',target_staff_id:(after || before)?.staff_id || ((table === 'staff_members') ? (after || before)?.id : null),details:{before,after},created_at:new Date().toISOString()});
}
function refreshDeadline() { return Number(session?.expires_at || 0) - Date.now()/1000 < 90; }
async function authRequest(path, opts={}) {
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method:opts.method||'GET', headers:{'apikey':key, ...(opts.body?{'Content-Type':'application/json'}:{}), ...(opts.token?{'Authorization':`Bearer ${opts.token}`}:{})},
    body:opts.body?JSON.stringify(opts.body):undefined
  });
  let value={}; try { value=await response.json(); } catch {}
  if (!response.ok) throw new Error(value.msg || value.error_description || value.message || value.error || `Erro de autenticação (${response.status})`);
  return value;
}
async function renewSession() {
  if (!session?.refresh_token) { session=null; localStorage.removeItem(AUTH_STORAGE); return false; }
  try {
    const result = await authRequest('token?grant_type=refresh_token', {method:'POST',body:{refresh_token:session.refresh_token}});
    session = {access_token:result.access_token,refresh_token:result.refresh_token,expires_at:Math.floor(Date.now()/1000)+result.expires_in};
    localStorage.setItem(AUTH_STORAGE,JSON.stringify(session)); return true;
  } catch { session=null; localStorage.removeItem(AUTH_STORAGE); return false; }
}
export async function startAuth() {
  if (!production) return {demo:true,profile:{id:'demo-supervisor',name:'Supervisor Demo',role:'Supervisor',status:'Ativo',discord_id:''}};
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.has('error')) {
    history.replaceState(null,'',location.pathname+location.search);
    throw new Error(hash.get('error_description') || 'Não foi possível entrar pelo Discord.');
  }
  if (hash.get('access_token')) {
    session = {access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token'),expires_at:Number(hash.get('expires_at') || (Math.floor(Date.now()/1000)+Number(hash.get('expires_in')||3600)))};
    localStorage.setItem(AUTH_STORAGE,JSON.stringify(session));
    history.replaceState(null,'',location.pathname+location.search);
  } else {
    try { session=JSON.parse(localStorage.getItem(AUTH_STORAGE)||'null'); } catch { session=null; }
  }
  if (!session) return {signedOut:true};
  if (refreshDeadline() && !(await renewSession())) return {signedOut:true};
  let user;
  try { user=await authRequest('user',{token:session.access_token}); }
  catch { if (!(await renewSession())) return {signedOut:true}; user=await authRequest('user',{token:session.access_token}); }
  const profileResult=await rpc('sync_current_user',{});
  const profile=Array.isArray(profileResult)?profileResult[0]:profileResult;
  const discordIdentity=user.identities?.find(x=>x.provider==='discord');
  const discordId=discordIdentity?.identity_id || discordIdentity?.id || user.user_metadata?.provider_id || user.user_metadata?.sub || '';
  if (!profile || profile.status==='Desligado') return {unauthorized:true,discordId,user};
  if (profile.status==='Afastado') return {suspended:true,discordId,user};
  return {profile,user};
}
export function loginDiscord() {
  const destination=location.origin+location.pathname;
  location.href=`${url}/auth/v1/authorize?provider=discord&redirect_to=${encodeURIComponent(destination)}`;
}
export async function signOut() {
  if (production && session?.access_token) { try { await authRequest('logout',{method:'POST',token:session.access_token}); } catch {} }
  localStorage.removeItem(AUTH_STORAGE);session=null;
}
async function getToken() {
  if (!session) throw new Error('Sessão expirada. Entre novamente.');
  if (refreshDeadline() && !(await renewSession())) throw new Error('Sessão expirada. Entre novamente.');
  return session.access_token;
}
async function rest(method,path,body=null,options={}) {
  const token=await getToken();
  const response=await fetch(`${url}/rest/v1/${path}`,{
    method,
    headers:{'apikey':key,'Authorization':`Bearer ${token}`,'Accept':'application/json',
      ...(body!==null?{'Content-Type':'application/json','Prefer':options.upsert?'resolution=merge-duplicates,return=representation':'return=representation'}:{}),
      ...(options.range?{'Range':options.range}:{}),
    },body:body!==null?JSON.stringify(body):undefined
  });
  const raw=await response.text();let value=[];
  if(raw) {try{value=JSON.parse(raw);}catch{value=raw;}}
  if(!response.ok) throw new Error(value.message || value.hint || value.details || `Erro ao salvar dados (${response.status})`);
  return value;
}
export async function rpc(func,body={}) {
  if(!production) throw new Error('RPC indisponível na demonstração.');
  return await rest('POST',`rpc/${func}`,body);
}
export async function list(table,params='') {
  if(!production) return clone(getDemo()[table] || []);
  let items=[];
  for(let offset=0;offset<10000;offset+=1000) {
    const page=await rest('GET',`${table}?select=*${params?`&${params}`:''}`,null,{range:`${offset}-${offset+999}`});
    if(!Array.isArray(page)) throw new Error(`Resposta inesperada de ${table}`);
    items.push(...page);
    if(page.length<1000) break;
  }
  return items;
}
export async function insert(table,record) {
  if(!production){const row={id:randomId(),created_at:new Date().toISOString(),...record};getDemo()[table].push(row);appendDemoLog(table,'INSERT',null,clone(row));saveDemo();return clone(row);}
  const result=await rest('POST',`${table}?select=*`,record);return result[0];
}
export async function update(table,id,patch) {
  if(!production){const rows=getDemo()[table];const idx=rows.findIndex(x=>x.id===id);if(idx<0)throw new Error('Registro não encontrado');const before=clone(rows[idx]);rows[idx]={...rows[idx],...patch,updated_at:new Date().toISOString()};appendDemoLog(table,'UPDATE',before,clone(rows[idx]));saveDemo();return clone(rows[idx]);}
  const result=await rest('PATCH',`${table}?id=eq.${encodeURIComponent(id)}&select=*`,patch);if(!result[0])throw new Error('Registro não encontrado');return result[0];
}
export async function upsertMany(table,records,conflictCols) {
  if(!records.length)return [];
  if(!production){const rows=getDemo()[table],result=[];for(const record of records){let idx=rows.findIndex(r=>conflictCols.every(col=>r[col]===record[col]));if(idx<0){const row={id:randomId(),created_at:new Date().toISOString(),...record};rows.push(row);appendDemoLog(table,'INSERT',null,clone(row));result.push(clone(row));}else{const before=clone(rows[idx]);rows[idx]={...rows[idx],...record,updated_at:new Date().toISOString()};appendDemoLog(table,'UPDATE',before,clone(rows[idx]));result.push(clone(rows[idx]));}}saveDemo();return result;}
  return await rest('POST',`${table}?on_conflict=${encodeURIComponent(conflictCols.join(','))}&select=*`,records,{upsert:true});
}
export async function remove(table,id) {
  if(!production){const rows=getDemo()[table],idx=rows.findIndex(x=>x.id===id);if(idx>=0){appendDemoLog(table,'DELETE',clone(rows[idx]),null);rows.splice(idx,1);saveDemo();}return;}
  await rest('DELETE',`${table}?id=eq.${encodeURIComponent(id)}`);
}
export function isDemo() {return !production;}
export function resetDemo() { localStorage.removeItem(DEMO_STORAGE);demoData=null; }
