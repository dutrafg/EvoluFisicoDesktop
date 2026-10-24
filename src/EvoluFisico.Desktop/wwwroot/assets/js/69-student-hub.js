/* EvoluFísico Desktop 1.1 — Ficha unificada ligada ao ID persistente, sem duplicação de clientes. */
(function(){
'use strict';
const KEY='ef-desktop-student-goals-v110';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=r=>String(window.EFIdentity?.key?.(r)||r?.cliente_id||'');
let goalState={version:1,items:[]},selected='',loading=false,saving=false,initialized=false;
const records=()=>Array.isArray(window.avaliacoes)?window.avaliacoes.filter(x=>x&&key(x)):[];
function people(){
 const m=new Map();
 for(const r of records()){const id=key(r);if(!m.has(id))m.set(id,{id,name:String(r.nome||'Sem identificação').slice(0,120),records:[]});m.get(id).records.push(r);}
 return [...m.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')||a.id.localeCompare(b.id));
}
const ordered=person=>person.records.slice().sort((a,b)=>String(b.data_avaliacao||b.data||'').localeCompare(String(a.data_avaliacao||a.data||'')));
const selectedPerson=()=>people().find(x=>x.id===selected);
const date=v=>{const s=String(v||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s.split('-').reverse().join('/'): 'Não informada'};
const vault=()=>window.EFNativeStorage;
function notify(message,err=false){const el=$('#efhub-status');if(el){el.textContent=message;el.setAttribute('role',err?'alert':'status');}}
async function load(){
 if(loading)return;loading=true;
 try{if(!vault()?.readJSON)throw Error('SQLite nativo indisponível.');const stored=await vault().readJSON(KEY);
 if(stored?.version===1&&Array.isArray(stored.items))goalState={version:1,items:stored.items.filter(g=>typeof g?.clientId==='string').slice(0,4000)};
 else if(stored)throw Error('Formato de metas incompatível.');
 notify('Perfil Unificado conectado ao SQLite criptografado.');}
 catch(e){notify('Falha ao consultar os objetivos: '+e.message,true);}
 finally{loading=false;render();}
}
async function saveGoal(goal){
 if(saving)throw Error('Outra gravação está em andamento.');saving=true;
 const previous=JSON.parse(JSON.stringify(goalState));
 try{
  // Roll back in-memory draft if encryption or verification fails.
  const existing=goalState.items.find(x=>x.clientId===goal.clientId&&x.metric===goal.metric);
  goalState.items=goalState.items.filter(x=>!(x.clientId===goal.clientId&&x.metric===goal.metric));
  goalState.items.push({...goal,id:existing?.id||crypto.randomUUID?.()||String(Date.now())});
  const result=await vault().writeJSON(KEY,goalState);
  const check=await vault().readJSON(KEY);
  if(result!=='saved'||JSON.stringify(check)!==JSON.stringify(goalState))throw Error('Falha na verificação após gravação cifrada');
  window.dispatchEvent(new Event('ef-desktop-goals-changed'));
  notify('Objetivo salvo e verificado no SQLite criptografado.');return true;
 }catch(e){goalState=previous;notify('Não foi possível salvar a meta: '+e.message,true);return false;}finally{saving=false;render();}
}
function render(){
 const host=$('#efhub-content');if(!host)return;
 const list=people();if(selected&&!list.some(x=>x.id===selected))selected='';
 if(!selected&&list.length)selected=list[0].id;
 const current=selectedPerson();
 const select=$('#efhub-person');if(select){
  select.innerHTML='<option value="">'+(list.length?'Selecione um aluno':'Nenhum aluno com avaliação')+'</option>'+
  list.map(p=>'<option value="'+esc(p.id)+'" '+(p.id===selected?'selected':'')+'>'+esc(p.name)+' · '+p.records.length+' avaliação(ões) · '+esc(p.id.slice(-8))+'</option>').join('');
 }
 if(!current){host.innerHTML='<div class="efhub-empty">Cadastre uma avaliação para abrir o Perfil Unificado de um aluno. Nenhum dado fictício foi criado.</div>';return;}
 const sorted=ordered(current),last=sorted[0]||{},gs=goalState.items.filter(x=>x.clientId===current.id);
 const goalRows=gs.map(g=>{
  const r=window.EF220Desktop?.analyze(g,sorted)||{};
  const label={peso:'Peso corporal',cintura:'Cintura',gordura:'Gordura estimada por dobras'}[g.metric]||g.metric;
  const change=r.status==='descritivo'?' · Última medida: '+r.current+' · Variação: '+(r.delta>=0?'+':'')+r.delta:'';
  return '<article class="efhub-goal"><strong>'+esc(label)+' → '+esc(g.target)+esc(g.metric==='gordura'?'%':' '+(g.metric==='peso'?'kg':'cm'))+'</strong><small>'+esc(r.message)+esc(change)+'</small><span>Prazo: '+esc(date(g.due))+'</span></article>';
 }).join('');
 const measurements=sorted.map(r=>'<tr><td>'+esc(date(r.data_avaliacao||r.data))+'</td><td>'+esc(r.peso??'—')+'</td><td>'+esc(r.perimetria?.cintura??r.cintura??'—')+'</td><td>'+esc(r.dobras_resultado?.percGordura??'—')+'</td></tr>').join('');
 host.innerHTML='<div class="efhub-head"><div><span class="efhub-eyebrow">FICHA CENTRAL DO ALUNO</span><h2>'+esc(current.name)+'</h2><small>ID permanente: '+esc(current.id)+' · '+current.records.length+' avaliação(ões)</small></div><div class="efhub-links">'+
 '<button type="button" data-efhub-open="tab-historico">Avaliações</button><button type="button" data-efhub-open="tab-comparison">Evolução</button><button type="button" data-efhub-open="tab-analises">Análises</button><button type="button" data-efhub-open="forms">Anamnese</button></div></div>'+
 '<div class="efhub-grid"><section class="efhub-panel"><h3>Último cadastro</h3><dl><div><dt>Data</dt><dd>'+esc(date(last.data_avaliacao||last.data))+'</dd></div><div><dt>Peso</dt><dd>'+esc(last.peso??'—')+' kg</dd></div><div><dt>Estatura</dt><dd>'+esc(last.altura??'—')+' cm</dd></div><div><dt>Contato</dt><dd>'+esc(last.whatsapp||last.email||'Não informado')+'</dd></div></dl></section>'+
 '<section class="efhub-panel"><h3>Objetivos individuais</h3><div class="efhub-goals">'+(goalRows||'<p>Sem objetivos registrados nesta ficha.</p>')+'</div><form id="efhub-goal-form"><label>Indicador<select name="metric"><option value="peso">Peso corporal (kg)</option><option value="cintura">Cintura (cm)</option><option value="gordura">Gordura estimada por dobras (%)</option></select></label><label>Valor-alvo<input name="target" type="number" step="0.1" min="1" max="400" required></label><label>Prazo<input name="due" type="date"></label><button type="submit">Salvar objetivo</button></form><small>EF220: resumo determinístico, sem prognóstico. Exige 3 datas distintas e pelo menos 21 dias.</small></section></div>'+
 '<section class="efhub-panel"><h3>Histórico antropométrico</h3><div class="efhub-scroll"><table><thead><tr><th>Data</th><th>Peso (kg)</th><th>Cintura (cm)</th><th>Gordura (%)</th></tr></thead><tbody>'+measurements+'</tbody></table></div><small>Comparabilidade, equipamentos e protocolos devem ser verificados nas Análises.</small></section>';
}
function switchTo(id){
 if(id==='forms'){window.EF2Forms?.openForClient?.(selected);return;}
 if(typeof window.switchTab==='function')window.switchTab(id);
}
function init(){
 if(initialized)return;initialized=true;
 const main=$('#tab-painel'),nav=$('.top-navbar .nav-tabs');
 if(!main||!nav)return;
 const section=document.createElement('section');section.id='tab-alunos';section.className='tab-panel';
 section.innerHTML='<div class="efhub-page"><header><h1>Alunos</h1><p>Perfil Unificado: identificação, avaliações e objetivos em uma ficha.</p><label for="efhub-person">Aluno cadastrado<select id="efhub-person" aria-label="Selecionar aluno"></select></label></header><div id="efhub-status" role="status"></div><div id="efhub-content"></div></div>';
 main.insertAdjacentElement('afterend',section);
 const button=document.createElement('button');button.type='button';button.className='nav-tab-btn';button.id='tab-btn-alunos';button.textContent='Alunos';button.addEventListener('click',()=>switchTo('tab-alunos'));
 const after=$('#tab-btn-history')||$('#tab-btn-painel');after?.insertAdjacentElement('afterend',button);if(!button.isConnected)nav.appendChild(button);
 section.addEventListener('change',e=>{if(e.target.id==='efhub-person'){selected=e.target.value;render();}});
 section.addEventListener('click',e=>{const b=e.target.closest('[data-efhub-open]');if(b)switchTo(b.dataset.efhubOpen)});
 section.addEventListener('submit',async e=>{
  if(e.target.id!=='efhub-goal-form')return;e.preventDefault();
  const form=new FormData(e.target),p=selectedPerson();if(!p)return;
  const metric=String(form.get('metric')||''),target=Number(form.get('target')),due=String(form.get('due')||'');
  if(!['peso','cintura','gordura'].includes(metric)||!Number.isFinite(target)||target<=0||(metric==='gordura'&&target>75)){notify('Meta inválida.',true);return;}
  if(due&&!/^\d{4}-\d{2}-\d{2}$/.test(due)){notify('Prazo inválido.',true);return;}
  await saveGoal({clientId:p.id,metric,target,due});
 });
 const existingSwitch=window.switchTab;
 if(typeof existingSwitch==='function')window.switchTab=function(id){const val=existingSwitch.apply(this,arguments);
  if(id==='tab-alunos'){document.querySelectorAll('.nav-tab-btn').forEach(b=>b.classList.remove('active'));button.classList.add('active');render();}
  return val;};
 window.addEventListener('ef-records-changed',render);
 window.addEventListener('ef-desktop-goals-changed',render);
 load();
}
window.EFStudentHub={refresh:render,open(id){selected=String(id||'');switchTo('tab-alunos');},students:people,getGoals:()=>goalState.items.slice()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();