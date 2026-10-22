
/* Busca global integrada ao Início — estável. Índice local e efêmero, sem upload de informações. */
(()=>{
'use strict';
const $=(selector,base=document)=>base.querySelector(selector);
const SVG={
 search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
 module:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 setting:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5"/><circle cx="16" cy="17" r="2.5"/>',
 evaluation:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
 client:'<circle cx="12" cy="8" r="3"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
 agenda:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
 task:'<path d="M4 12l5 5L20 6"/><rect x="3" y="3" width="18" height="18" rx="4"/>',
 goal:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 note:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'};
const svg=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">${SVG[name]||SVG.module}</svg>`;
const clean=x=>String(x??'').trim();
const norm=x=>clean(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const safeJSON=(key,fallback=[])=>{try{const data=JSON.parse(localStorage.getItem(key)||'null');return data??fallback;}catch(_){return fallback}};
const entries=[];let shown=[],selected=0,filter='Tudo',previousFocus=null,lastCount=0;
const cats=['Tudo','Módulos','Configurações','Avaliações','Clientes','Agenda','Tarefas','Metas','Notas'];
const routeMap=[
 ['Início','tab-painel','visão geral insights avisos lembretes painel'],
 ['Organização','tab-organizacao','planejamento gestão rotina produtividade calendário'],
 ['Avaliações','tab-historico','histórico fichas avaliação física pacientes'],
 ['Nova avaliação','tab-novo-checkin','cadastrar nova avaliação física exame'],
 ['Evolução','tab-comparison','comparação evolução resultados progresso'],
 ['Calculadora','tab-lab77','fórmulas composição corporal cálculos'],
 ['Formulários','tab-ef-forms','anamnese questionários fichas'],
 ['Análises','tab-analises','indicadores análises automáticas relatórios'],
 ['Cobranças','tab-cobranca','pagamentos contas financeiro clientes serviços'],
 ['Configurações','tab-settings','preferências aparência privacidade backup manutenção dados profissionais']
];
function goto(route){
 if(!document.getElementById(route))return false;
 if(typeof window.switchTab!=='function')return false;
 window.switchTab(route);
 return true;
}
function goSettings(section,selector){
 if(window.EFSettings?.open)window.EFSettings.open(section);
 else goto('tab-settings');
 if(selector)requestAnimationFrame(()=>requestAnimationFrame(()=>{
  const target=$(selector);if(target)target.closest('.ef-settings-card')?.scrollIntoView({block:'center',behavior:'smooth'});
 }));
}
function goRecord(type,id){
 const api=window.EFOrganisation;
 const map={Tarefas:'orga-task',Metas:'orga-goal',Notas:'orga-note'};
 if(api?.openFromCalendar){api.openFromCalendar(map[type],id);return;}
 const tab={Tarefas:'tasks',Metas:'goals',Notas:'notes'}[type];
 api?.go?.(tab);
}
function goAppointment(item){
 const api=window.EFOrganisation;
 if(api?.openDate&&/^\d{4}-\d\d-\d\d$/.test(clean(item.date)))api.openDate(item.date);
 else api?.go?.('agenda');
 requestAnimationFrame(()=>{
  if(typeof window.ef90EditAgenda==='function'&&item.id)window.ef90EditAgenda(item.id);
 });
}
function showEvaluation(item){
 goto('tab-historico');
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(typeof abrirModalDetalhes==='function')abrirModalDetalhes(item.id);
 }));
}
function showClient(name){
 goto('tab-historico');
 requestAnimationFrame(()=>{
  const input=$('#filtro-busca');
  if(input){input.value=name;input.dispatchEvent(new Event('input',{bubbles:true}));}
  $('#history-list-grid')?.scrollIntoView({block:'start',behavior:'smooth'});
 });
}
function add(category,title,details,keywords,action,icon,weight=1){
 if(!clean(title)||typeof action!=='function')return;
 const item={category,title:clean(title),details:clean(details),keywords:clean(keywords),action,icon:icon||'module',weight};
 item.normalized=norm(item.title+' '+item.details+' '+item.keywords);
 entries.push(item);
}
function availableAssessments(){
 try{if(typeof avaliacoes!=='undefined'&&Array.isArray(avaliacoes))return avaliacoes;}
 catch(_){}
 return Array.isArray(window.avaliacoes)?window.avaliacoes:[];
}
function rebuild(){
 entries.length=0;
 for(const [label,route,terms] of routeMap){
  if(!document.getElementById(route))continue;
  add('Módulos',label,'Abrir módulo '+label,terms,()=>goto(route),'module',5);
 }
 for(const [label,section,target,terms] of [
  ['Dados profissionais','geral','#ef-setting-professional','nome completo apelido profissional cref local de trabalho avaliador clínica'],
  ['Aparência e temas','geral','#ef-setting-appearance','tema claro escuro cores paleta personalização'],
  ['Efeitos visuais','geral','#efx-appearance-controls','blur sombras profundidade 3d avançada essencial personalização'],
  ['Segurança e privacidade','dados','#ef-setting-security','senha criptografia cofre segurança chave'],
  ['Armazenamento local','dados','#ef-setting-storage','pasta dados armazenamento local'],
  ['Backup e restauração','dados','#ef-setting-backup','exportar importar restaurar cópia segurança'],
  ['Manutenção e diagnóstico','manutencao','#ef-setting-diagnostics','diagnóstico integridade testes reparo manutenção']
 ]){
  if(document.querySelector(target))add('Configurações',label,'Configurações • '+(section==='geral'?'Geral':section==='dados'?'Dados e privacidade':'Manutenção'),terms,()=>goSettings(section,target),'setting',6);
 }
 for(const [label,subtab,words] of [
  ['Agenda e calendário','agenda','compromissos agendar eventos agenda retornos'],
  ['Notas','notes','anotações observações lembretes'],
  ['Tarefas','tasks','pendências prazos urgentes atividades'],
  ['Metas','goals','objetivos resultados clientes progresso']
 ]){
  if($('#tab-organizacao'))add('Módulos',label,'Organização • '+label,words,()=>window.EFOrganisation?.go?.(subtab),subtab==='notes'?'note':subtab==='tasks'?'task':subtab==='goals'?'goal':'agenda',5);
 }
 const records=availableAssessments().filter(x=>x&&typeof x==='object');
 const clients=new Map();
 for(const a of records){
  const name=clean(a.nome),date=clean(a.data_avaliacao),id=a.id;
  if(!name||id==null)continue;
  const summary=[date?('Data: '+date):'',clean(a.checkin_semana)].filter(Boolean).join(' · ');
  add('Avaliações',name,summary,[a.email,a.whatsapp,date,a.checkin_semana,a.cliente_id].map(clean).join(' '),()=>showEvaluation(a),'evaluation',3);
  const k=norm(name);if(!clients.has(k))clients.set(k,{name,count:0});clients.get(k).count++;
 }
 for(const c of clients.values())add('Clientes',c.name,`${c.count} avaliação(ões) cadastrada(s)`,'aluno paciente perfil cadastro',()=>showClient(c.name),'client',3);
 const org=window.EFOrganisation;
 const raw=org?.getData?.()||safeJSON('ef2_organization_v1_data',{notes:[],goals:[]});
 const tasks=org?.getTasks?.()||safeJSON('ef90_tasks_v2',[]);
 for(const t of (Array.isArray(tasks)?tasks:[])){
  if(!t||t.id==null)continue;
  const title=clean(t.name||t.title);if(!title)continue;
  add('Tarefas',title,[t.date||t.due,t.client,t.done?'Concluída':t.priority].filter(Boolean).join(' · '),[t.body,t.client,t.priority].join(' '),()=>goRecord('Tarefas',t.id),'task',4);
 }
 for(const m of (Array.isArray(raw?.goals)?raw.goals:[])){
  if(!m||m.id==null||!clean(m.title))continue;
  add('Metas',m.title,[m.client,m.due,m.status].filter(Boolean).join(' · '),[m.progress,m.client].join(' '),()=>goRecord('Metas',m.id),'goal',4);
 }
 for(const n of (Array.isArray(raw?.notes)?raw.notes:[])){
  if(!n||n.id==null||!clean(n.title))continue;
  add('Notas',n.title,[n.client,n.reminder,n.archived?'Arquivada':''].filter(Boolean).join(' · '),[n.body,n.client].join(' '),()=>goRecord('Notas',n.id),'note',4);
 }
 const events=safeJSON('ef90_home_agenda',[]);
 for(const a of (Array.isArray(events)?events:[])){
  if(!a||a.id==null)continue;
  const title=clean(a.student||a.title||a.name||'Compromisso');
  add('Agenda',title,[a.date,a.time,a.type,a.status].filter(Boolean).join(' · '),[a.note,a.local,a.location,a.type].join(' '),()=>goAppointment(a),'agenda',3);
 }
 // Indexar títulos estruturais de telas adicionais — não ler o texto de formulários nem senhas.
 for(const [route,title] of [['tab-lab77','Calculadora'],['tab-ef-forms','Formulários'],['tab-analises','Análises'],['tab-cobranca','Cobranças']]){
  const parent=$('#'+route);if(!parent)continue;
  const names=new Set();
  for(const heading of parent.querySelectorAll('h2,h3')){
   const label=clean(heading.textContent).replace(/\s+/g,' ').slice(0,90);
   if(label.length<4||label.length>70||names.has(norm(label)))continue;
   names.add(norm(label));
   add('Módulos',label,title+' • Seção','ferramentas seção '+title,()=>{
    if(!goto(route))return;
    requestAnimationFrame(()=>heading.scrollIntoView({block:'center',behavior:'smooth'}));
   },'module',1);
   if(names.size>=22)break;
  }
 }
 lastCount=entries.length;
 return lastCount;
}
function score(e,q){
 if(!q)return e.weight*6;
 const s=e.normalized,ttl=norm(e.title);
 if(!s.includes(q)){
  // Todos os termos precisam aparecer, em qualquer ordem.
  if(!q.split(/\s+/).every(t=>s.includes(t)))return -1;
 }
 return (ttl===q?100:ttl.startsWith(q)?76:ttl.includes(q)?55:25)+e.weight*4;
}
function results(){
 const q=norm($('#efg-input')?.value||'').replace(/\s+/g,' ');
 const possible=entries.filter(e=>filter==='Tudo'||e.category===filter);
 return possible.map((e,i)=>({e,i,score:score(e,q)})).filter(o=>o.score>=0).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,q?65:14).map(o=>o.e);
}
function draw(){
 const list=$('#efg-results');if(!list)return;
 shown=results();selected=0;list.replaceChildren();
 if(!shown.length){const empty=document.createElement('div');empty.className='efg-empty';empty.innerHTML='<strong>Nenhum resultado encontrado.</strong>Tente outro termo ou selecione uma categoria diferente.';list.append(empty)}
 else shown.forEach((item,i)=>{
  const b=document.createElement('button');b.className='efg-result'+(i===selected?' efg-selected':'');b.type='button';b.dataset.efgIdx=String(i);
  b.setAttribute('role','option');b.setAttribute('aria-selected',String(i===selected));
  const wrap=document.createElement('span');wrap.className='efg-result-icon';wrap.innerHTML=svg(item.icon);
  const copy=document.createElement('span');copy.className='efg-result-copy';
  const cat=document.createElement('em');cat.textContent=item.category;
  const title=document.createElement('strong');title.textContent=item.title;
  copy.append(cat,title);
  if(item.details){const small=document.createElement('small');small.textContent=item.details;copy.append(small)}
  const arrow=document.createElement('span');arrow.className='efg-arrow';arrow.textContent='›';
  b.append(wrap,copy,arrow);list.append(b);
 });
 $('#efg-count').textContent=`${shown.length} resultado(s) exibido(s) • ${lastCount} itens indexados localmente`;
}
function toggleCategory(button){
 filter=button.dataset.efgCat;
 document.querySelectorAll('[data-efg-cat]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 draw();$('#efg-input')?.focus();
}
function choose(i){const item=shown[i];if(!item)return;close();try{item.action()}catch(e){console.error('Falha ao abrir resultado da busca',e)}}
function open(){
 if($('#efprof-first-run')&&!$('#efprof-first-run').hidden)return;
 const overlay=$('#efg-overlay');if(!overlay)return;
 previousFocus=document.activeElement;
 filter='Tudo';
 document.querySelectorAll('[data-efg-cat]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.efgCat==='Tudo')));
 $('#efg-input').value='';rebuild();overlay.hidden=false;
 $('#efg-input').focus();draw();
}
function close(){
 const overlay=$('#efg-overlay');if(!overlay||overlay.hidden)return;
 overlay.hidden=true;
 if(previousFocus&&document.contains(previousFocus))previousFocus.focus({preventScroll:true});
}
function mount(){
 if($('#efg-overlay'))return;
 const overlay=document.createElement('div');overlay.id='efg-overlay';overlay.className='efg-overlay';overlay.hidden=true;
 overlay.setAttribute('role','presentation');
 overlay.innerHTML=`<section class="efg-dialog" role="dialog" aria-modal="true" aria-label="Busca global do EvoluFísico2"><div class="efg-top"><div class="efg-topline"><h2>Busca global</h2><button type="button" class="efg-close" data-efg-close aria-label="Fechar busca">×</button></div><label class="efg-field" aria-label="Pesquisar em todos os módulos">${svg('search')}<input id="efg-input" type="search" autocomplete="off" spellcheck="false" placeholder="Buscar avaliações, clientes, metas, configurações…" aria-controls="efg-results"></label><p class="efg-tip">Resultados do próprio aplicativo. Toque para abrir o registro ou módulo correspondente.</p></div><div class="efg-categories" role="group" aria-label="Filtrar por categoria">${cats.map((c,i)=>`<button class="efg-category" type="button" data-efg-cat="${c}" aria-pressed="${i===0}">${c}</button>`).join('')}</div><div class="efg-results" id="efg-results" role="listbox" aria-label="Resultados de pesquisa"></div><footer class="efg-footer"><span id="efg-count" aria-live="polite"></span><span>↑ ↓ Navegar · Enter Abrir · Esc Fechar</span></footer></section>`;
 document.body.append(overlay);
 const input=$('#efg-input');input.addEventListener('input',draw);
 $('#efg-overlay').addEventListener('click',ev=>{
  if(ev.target===overlay||ev.target.closest('[data-efg-close]'))close();
  const category=ev.target.closest('[data-efg-cat]');if(category)toggleCategory(category);
  const hit=ev.target.closest('[data-efg-idx]');if(hit)choose(Number(hit.dataset.efgIdx));
 });
}
function mountTrigger(){
 const host=$('#tab-painel .efh-hero-actions');if(!host||$('#tab-painel .efg-search-trigger'))return;
 const b=document.createElement('button');b.type='button';b.className='efg-search-trigger';
 b.setAttribute('aria-label','Pesquisar em todo o aplicativo');b.title='Busca global (Ctrl+K)';
 b.innerHTML=svg('search')+'<span>Buscar em tudo</span>';
 b.addEventListener('click',open);
 host.append(b);
}
function init(){
 mount();mountTrigger();
 const home=$('#tab-painel');
 if(home)new MutationObserver(mountTrigger).observe(home,{childList:true});
 document.addEventListener('keydown',e=>{
  const active=$('#efg-overlay');if(active&&!active.hidden){
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    if(!shown.length)return;e.preventDefault();selected=(selected+(e.key==='ArrowDown'?1:-1)+shown.length)%shown.length;
    document.querySelectorAll('[data-efg-idx]').forEach((b,i)=>{const yes=i===selected;b.classList.toggle('efg-selected',yes);b.setAttribute('aria-selected',String(yes));if(yes)b.scrollIntoView({block:'nearest'})});return;
   }
   if(e.key==='Enter'&&document.activeElement?.id==='efg-input'){e.preventDefault();choose(selected);return;}
   if(e.key==='Tab'){const els=[...active.querySelectorAll('button,input')].filter(n=>n.getClientRects().length);const i=els.indexOf(document.activeElement);if(!e.shiftKey&&i===els.length-1){e.preventDefault();els[0].focus();}else if(e.shiftKey&&i===0){e.preventDefault();els[els.length-1].focus();}}
  }
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();e.stopPropagation();open();return;}
  if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){const t=e.target;
   if(!t?.isContentEditable&&!['INPUT','TEXTAREA','SELECT'].includes(t?.tagName)){e.preventDefault();open()}
  }
 });
 window.EFGlobalSearch={open,close,rebuild,count:()=>lastCount,search:(q,category='Tudo')=>{rebuild();filter=category;return entries.map(e=>({e,score:score(e,norm(q))})).filter(x=>x.score>=0&&(filter==='Tudo'||x.e.category===filter)).sort((a,b)=>b.score-a.score).map(x=>({category:x.e.category,title:x.e.title,details:x.e.details}));}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

