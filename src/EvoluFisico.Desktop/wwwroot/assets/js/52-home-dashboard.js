
(function(){
 'use strict';
 const $=s=>document.querySelector(s);
 const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icon=(name,size=18)=>{const paths={
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  check:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',
  flag:'<path d="M5 21V4m0 0h14l-3 5 3 5H5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  spark:'<path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2zM20 18l.8 1.9L23 21l-2.2 1.1L20 24l-.8-1.9L17 21l2.2-1.1z"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  alert:'<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 4h.01"/>',
  note:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 15a4 4 0 0 1 3 4v1"/>',
  layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>'};return `<svg class="efh-svg" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.check}</svg>`};
 const validISO=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x||''))&&!Number.isNaN(new Date(String(x)+'T12:00:00').getTime());
 const localDate=(date)=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 const now=()=>new Date();
 const today=()=>localDate(now());
 const addDays=(start,n)=>{const d=new Date(start+'T12:00:00');d.setDate(d.getDate()+n);return localDate(d)};
 const strDate=(iso,opts={day:'2-digit',month:'short'})=>validISO(iso)?new Intl.DateTimeFormat('pt-BR',opts).format(new Date(iso+'T12:00:00')):'Sem data';
 const organization=()=>window.EFOrganisation;
 const readAgenda=()=>{try{const v=JSON.parse(localStorage.getItem('ef90_home_agenda')||'[]');return Array.isArray(v)?v:[]}catch(_){return []}};
 const state=()=>{
   const api=organization();const raw=api?.getData?.()||{notes:[],goals:[]};
   const goals=Array.isArray(raw.goals)?raw.goals:[];
   const notes=Array.isArray(raw.notes)?raw.notes:[];
   const tasks=api?.getTasks?.()||[];
   const t=today();
   const appt=readAgenda().filter(x=>validISO(x.date)&&x.status!=='cancelado');
   const dues=api?.calendarItems?.()||[];
   const dueActive=dues.filter(x=>validISO(x.date)&&x.status!=='concluido');
   const allEvents=appt.map(x=>({...x,source:x.source||'appointment',type:x.type||'agenda'})).concat(dueActive);
   const lateTasks=tasks.filter(x=>!x.done&&validISO(x.date||x.due)&&(x.date||x.due)<t);
   const lateGoals=goals.filter(x=>x.status!=='Concluída'&&validISO(x.due)&&x.due<t);
   const urgents=tasks.filter(x=>!x.done&&['urgente','alta'].includes(String(x.priority||'').toLocaleLowerCase('pt-BR')));
   const todays=allEvents.filter(x=>x.date===t);
   return {t,goals,notes,tasks,appt,allEvents,lateTasks,lateGoals,urgents,todays};
 };

 /* Camada executiva — dados somente dos registros efetivamente armazenados. */
 const evaluations=()=>{
  let list=[];
  try{list=window.__EF63_STATE__?.getAvaliacoes?.()||window.avaliacoes||[]}catch(_){list=[]}
  if(!Array.isArray(list))list=[];
  const groups=new Map();
  const clean=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('pt-BR');
  list.forEach(a=>{
   if(!a||typeof a!=='object')return;
   const contact=clean(a.email), phone=String(a.whatsapp||'').replace(/\D/g,''), name=clean(a.nome);
   const key=String(a.cliente_id||'').trim() || (contact?'mail:'+contact:phone?'phone:'+phone:'id:'+String(a.id||''));
   if(!key)return;
   const old=groups.get(key), date=validISO(a.data_avaliacao)?a.data_avaliacao:'';
   if(!old||date>old.date||date===old.date&&String(a.id||'')>String(old.item?.id||''))groups.set(key,{date,item:a});
  });
  const t=today(),end=addDays(t,14),clients=[...groups.values()].map(x=>x.item);
  const due=clients.filter(a=>validISO(a.data_proxima_avaliacao)).map(a=>({name:String(a.nome||'Cliente sem nome'),due:a.data_proxima_avaliacao,id:a.id}));
  const overdue=due.filter(x=>x.due<t).sort((a,b)=>a.due.localeCompare(b.due));
  const upcoming=due.filter(x=>x.due>=t&&x.due<=end).sort((a,b)=>a.due.localeCompare(b.due));
  return {clients:clients.length,records:list.length,overdue,upcoming,missing:clients.length-due.length,dated:due.length};
 };

 const evolutionSummary=()=>{
  let rows=[];try{rows=window.__EF63_STATE__?.getAvaliacoes?.()||window.avaliacoes||[]}catch(_){rows=[]}
  if(!Array.isArray(rows))return {withHistory:0,changes:[]};
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('pt-BR');
  const groups=new Map();
  for(const a of rows){if(!a||!validISO(a.data_avaliacao))continue;
    const mail=norm(a.email),phone=String(a.whatsapp||'').replace(/\D/g,''),name=norm(a.nome);
    const id=String(a.cliente_id||'').trim() || (mail?'mail:'+mail:phone?'phone:'+phone:'id:'+String(a.id||''));
    if(!groups.has(id))groups.set(id,[]);groups.get(id).push(a);
  }
  let withHistory=0;const changes=[];
  const measure=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)&&n>0&&n<500?n:null};
  for(const list of groups.values()){
    list.sort((a,b)=>String(b.data_avaliacao).localeCompare(String(a.data_avaliacao)));
    const dates=new Set(list.map(x=>x.data_avaliacao));if(dates.size<2)continue;
    withHistory++;
    const newest=list[0],previous=list.find(x=>x.data_avaliacao<newest.data_avaliacao);
    if(!previous)continue;
    const latest=measure(newest.peso),before=measure(previous.peso);
    if(latest===null||before===null)continue;
    changes.push({name:String(newest.nome||'Cliente sem nome'),date:newest.data_avaliacao,delta:latest-before});
  }
  changes.sort((a,b)=>b.date.localeCompare(a.date));return {withHistory,changes:changes.slice(0,4)};
 };

 const currency=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
 function showFinance(home){
  const target=home.querySelector('#efh-finance-content'),badge=home.querySelector('#efh-finance-status');
  if(!target||!window.EFCobranca?.exportData)return;
  const loadingToken=(home.__efhFinanceToken=(home.__efhFinanceToken||0)+1);
  Promise.resolve().then(()=>window.EFCobranca.exportData()).then(records=>{
   if(home.__efhFinanceToken!==loadingToken||!target.isConnected)return;
   if(!Array.isArray(records))throw Error('Lista indisponível');
   const accepted=records.filter(r=>r&&Number.isFinite(Number(r.valorTotal))&&Number(r.valorTotal)>=0);
   const pending=accepted.filter(r=>r.status==='pendente');
   const paid=accepted.filter(r=>r.status==='pago');
   const t=today().slice(0,7);
   const paidMonth=paid.filter(r=>validISO(r.data)&&r.data.slice(0,7)===t).reduce((sum,r)=>sum+Number(r.valorTotal),0);
   const pendingTotal=pending.reduce((sum,r)=>sum+Number(r.valorTotal),0);
   if(badge)badge.textContent='Registros locais';
   const kpi=home.querySelector('#efh-finance-kpi');if(kpi)kpi.textContent=currency(pendingTotal);
   const kpiSub=home.querySelector('#efh-finance-kpi-sub');if(kpiSub)kpiSub.textContent=pending.length+' cobrança(s) pendente(s)';
   const label=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date());
   target.innerHTML=`<div class="efh-finance-numbers"><div><small>Marcadas como pagas em ${safe(label)}</small><strong>${safe(currency(paidMonth))}</strong></div><div><small>Total pendente (todos os períodos)</small><strong>${safe(currency(pendingTotal))}</strong></div></div>`+
    (pending.length?`<div class="efh-finance-pending"><span class="efh-eyebrow">Próximas ações de cobrança</span>${pending.slice().sort((a,b)=>String(a.data||'').localeCompare(String(b.data||''))).slice(0,3).map(c=>`<button type="button" class="efh-finance-row" data-efh-module="tab-cobranca"><span><strong>${safe(c.aluno1?.nome||c.aluno2?.nome||'Cobrança sem cliente')}</strong><small>Registro: ${safe(strDate(c.data,{day:'2-digit',month:'long',year:'numeric'}))} · Pagamento pendente</small></span><b>${safe(currency(c.valorTotal))}</b>${icon('arrow',15)}</button>`).join('')}</div>`:
    '<p class="efh-empty">Nenhuma cobrança pendente registrada. Os valores consideram apenas lançamentos salvos.</p>');
  }).catch(()=>{
   if(home.__efhFinanceToken!==loadingToken||!target.isConnected)return;
   if(badge)badge.textContent='Acesso protegido';
   const kpi=home.querySelector('#efh-finance-kpi');if(kpi)kpi.textContent='—';
   const sub=home.querySelector('#efh-finance-kpi-sub');if(sub)sub.textContent='Abra Cobranças para consultar os dados';
   target.innerHTML='<p class="efh-empty">O histórico financeiro está indisponível ou o cofre está bloqueado. Os valores não foram estimados.</p>';
  });
 }

 const sourceToGo=x=>x.source==='orga-task'?'tasks':x.source==='orga-goal'?'goals':x.source==='orga-note'?'notes':'agenda';
 const labelFor=x=>({tarefa:'Tarefa',meta:'Meta',nota:'Lembrete',avaliacao:'Avaliação',reavaliacao:'Reavaliação',retorno:'Retorno',followup:'Acompanhamento'})[x.type]||'Agenda';
 const eventTitle=x=>x.name||x.student||x.title||'Compromisso';
 const openEvent=x=>{if(String(x.source||'').startsWith('orga-'))organization()?.openFromCalendar(x.source,x.id);else if(validISO(x.date))organization()?.openDate(x.date);else organization()?.go('agenda')};
 let rendered=false;
 /* Início v6.7: síntese operacional sem widgets/edição.
    Reutiliza os dados e os componentes originais de avaliações, evolução e cobrança. */
 function remodelInicio(home, context){
   const {s,ev,overdue,pending,activeGoals,prioritized,next,week,mx,professionalName}=context;
   const oldRoot=home.querySelector('#efh-dashboard');if(!oldRoot)return;
   const hero=oldRoot.querySelector('.efh-hero');
   const evaluationsCard=oldRoot.querySelector('.efh-evaluation-panel');
   const evolutionCard=oldRoot.querySelector('.efh-evolution-panel');
   const financeCard=oldRoot.querySelector('.efh-finance-panel');
   const weekCard=oldRoot.querySelector('[aria-label="Próximos sete dias"]');
   if(!hero||!evaluationsCard||!evolutionCard||!financeCard||!weekCard)return;
   const quickEvaluation=hero.querySelector('[data-efh-action="evaluation"]');if(quickEvaluation)quickEvaluation.remove();
   const heading=hero.querySelector('h1');
   if(heading){ const greeting=String(heading.textContent||'').split(',')[0].split('!')[0];
     heading.textContent=greeting+(professionalName?', '+professionalName:'')+'! Seu dia em foco.';
   }
   const heroDescription=hero.querySelector('.efh-hero-copy p');
   if(heroDescription)heroDescription.textContent='Compromissos, pendências e a próxima ação, com informações dos módulos já existentes.';
   const todaySorted=s.todays.slice().sort((a,b)=>String(a.time||'99:99').localeCompare(String(b.time||'99:99')));
   const eventRefs=todaySorted.concat(next.filter(x=>!todaySorted.includes(x)));
   const totalLate=overdue+ev.overdue.length;
   const overdueItems=[
     {value:s.lateTasks.length,label:'Tarefas',go:'tasks',ico:'check'},
     {value:s.lateGoals.length,label:'Metas',go:'goals',ico:'target'},
     {value:ev.overdue.length,label:'Reavaliações',module:'tab-alunos',ico:'users'}
   ];
   const action=ev.overdue.length?
    {title:'Revisar reavaliações vencidas',detail:`${ev.overdue.length} aluno(s) com data de retorno vencida.`,module:'tab-alunos',ico:'users'}:
    s.lateTasks.length?{title:'Resolver tarefas atrasadas',detail:`${s.lateTasks.length} tarefa(s) fora do prazo.`,go:'tasks',ico:'check'}:
    s.lateGoals.length?{title:'Atualizar metas com prazo vencido',detail:`${s.lateGoals.length} meta(s) precisa(m) de revisão.`,go:'goals',ico:'target'}:
    s.urgents.length?{title:'Ver tarefas prioritárias',detail:`${s.urgents.length} tarefa(s) marcada(s) como prioridade alta ou urgente.`,go:'tasks',ico:'flag'}:
    todaySorted.length?{title:'Conferir agenda de hoje',detail:'Confira os próximos atendimentos e lembretes do dia.',go:'agenda',ico:'calendar'}:
    ev.upcoming.length?{title:'Planejar reavaliações próximas',detail:`${ev.upcoming.length} retorno(s) registrado(s) para os próximos 14 dias.`,module:'tab-alunos',ico:'users'}:
    next.length?{title:'Preparar o próximo compromisso',detail:`Próximo registro: ${eventTitle(next[0])} — ${strDate(next[0].date,{day:'2-digit',month:'long'})}.`,go:'agenda',ico:'calendar'}:
    {title:'Organizar os próximos atendimentos',detail:'Não há eventos ou tarefas urgentes nos registros locais consultados.',go:'agenda',ico:'calendar'};
   const actionAttrs=x=>x.module?`data-efh-module="${x.module}"`:`data-efh-go="${x.go||'agenda'}"`;
   const todayList=todaySorted.length?todaySorted.slice(0,4).map((x,i)=>`<button type="button" class="efb-event" data-efh-event="${i}" aria-label="Abrir ${safe(eventTitle(x))}"><span class="efb-event-time">${safe(x.time||'Hoje')}</span><span class="efb-event-copy"><strong>${safe(eventTitle(x))}</strong><small>${safe(labelFor(x))}${x.note?' · '+safe(String(x.note).slice(0,80)):''}</small></span>${icon('arrow',15)}</button>`).join(''):
     `<div class="efb-empty"><strong>Nenhum compromisso previsto para hoje.</strong><span>Os registros cadastrados na Organização aparecerão aqui.</span></div>`;
   const lateList=overdueItems.map(x=>`<button type="button" class="efb-late-item ${x.value?'has-late':''}" ${actionAttrs(x)}><span class="efb-late-icon">${icon(x.ico,18)}</span><span class="efb-late-copy"><strong>${safe(x.label)}</strong><small>${x.value?`${x.value} registro(s) vencido(s)`:'Nenhum vencimento encontrado'}</small></span><b>${x.value}</b></button>`).join('');
   const weekData=week.map(x=>`<span class="efb-day ${x.date===s.t?'is-today':''}"><small>${safe(strDate(x.date,{weekday:'short'}).replace('.',''))}</small><strong>${x.count}</strong><i style="height:${Math.max(4,Math.round(x.count/mx*100))}%"></i></span>`).join('');
   const shell=document.createElement('div');shell.className='efh-page efb-home';shell.id='efh-dashboard';
   shell.setAttribute('aria-label','Início — central de trabalho');
   shell.innerHTML=`
    <div class="efb-hero-slot"></div>
    <div class="efb-summary" aria-label="Resumo operacional">
       <button type="button" class="efb-summary-item" data-efh-go="agenda"><span class="efb-summary-icon">${icon('calendar')}</span><span><small>Compromissos de hoje</small><strong>${s.todays.length}</strong></span></button>
       <button type="button" class="efb-summary-item ${totalLate?'is-alert':''}" data-efh-go="tasks"><span class="efb-summary-icon">${icon('alert')}</span><span><small>Prazos e retornos vencidos</small><strong>${totalLate}</strong></span></button>
       <button type="button" class="efb-summary-item" data-efh-module="tab-alunos"><span class="efb-summary-icon">${icon('users')}</span><span><small>Reavaliações em 14 dias</small><strong>${ev.upcoming.length}</strong></span></button>
       <button type="button" class="efb-summary-item" data-efh-module="tab-cobranca"><span class="efb-summary-icon">${icon('flag')}</span><span><small>Valores a receber</small><strong id="efh-finance-kpi">—</strong><span id="efh-finance-kpi-sub" class="efb-finance-small">Consulte os registros em Cobranças</span></span></button>
    </div>
    <div class="efb-focus-grid" aria-label="O que tenho hoje e o que está atrasado">
      <section class="efb-panel efb-today"><div class="efb-panel-top"><div><span class="efb-section-label">01 · MINHA ROTINA</span><h2>O que tenho hoje?</h2><p>${s.todays.length?`${s.todays.length} item(ns) na agenda de hoje`:'Dia livre nos registros cadastrados'}</p></div><button type="button" class="efb-text-action" data-efh-go="agenda">Abrir agenda ${icon('arrow',15)}</button></div><div class="efb-today-list">${todayList}</div></section>
      <section class="efb-panel efb-late"><div class="efb-panel-top"><div><span class="efb-section-label">02 · PENDÊNCIAS</span><h2>O que está atrasado?</h2><p>${totalLate?`${totalLate} registro(s) que merecem atenção`:'Sem prazos vencidos encontrados'}</p></div></div><div class="efb-late-list">${lateList}</div></section>
    </div>
    <section class="efb-next" aria-label="Próxima ação recomendada"><span class="efb-next-symbol">${icon(action.ico,21)}</span><div><span class="efb-section-label">03 · PRÓXIMA AÇÃO</span><h2>Qual é minha próxima ação?</h2><strong>${safe(action.title)}</strong><p>${safe(action.detail)}</p></div><button type="button" class="efb-next-button" ${actionAttrs(action)}>Abrir ${icon('arrow',15)}</button></section>
    <div class="efb-section-heading"><div><span class="efb-section-label">ACOMPANHAMENTO</span><h2>Visão complementar</h2><p>Alunos, evolução e financeiro — resumos vinculados aos registros existentes.</p></div></div>
    <div class="efb-followup-grid"><div class="efb-followup-left"></div><div class="efb-followup-right"></div></div>
    <footer class="efb-disclaimer">Dados locais disponíveis no dispositivo. Nenhuma pendência ou diagnóstico é presumido quando o registro não possui informações suficientes.</footer>`;
   shell.querySelector('.efb-hero-slot').append(hero);
   shell.querySelector('.efb-followup-left').append(evaluationsCard,evolutionCard);
   shell.querySelector('.efb-followup-right').append(financeCard,weekCard);
   home.replaceChildren(shell);
   home.__efh_events=eventRefs;
   home.dataset.efHomeMode='operational';
 }
 function render(){
  const home=$('#tab-painel');if(!home||!organization())return;
  const s=state();const ev=evaluations();const progress=evolutionSummary();const date=new Date();const hour=date.getHours();
  const greeting=hour<12?'Bom dia':hour<18?'Boa tarde':'Boa noite';
  const professionalName=String(localStorage.getItem('evolufisico_pro_apelido')||localStorage.getItem('evolufisico_pro_nome')||'').trim().slice(0,100);
  const dateText=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'}).format(date);
  const overdue=s.lateTasks.length+s.lateGoals.length;
  const pending=s.tasks.filter(x=>!x.done).length;
  const activeGoals=s.goals.filter(x=>x.status!=='Concluída').length;
  const critical=s.lateTasks.length+s.lateGoals.length;
  const alertCounts=critical+ev.overdue.length+s.urgents.filter(x=>!s.lateTasks.some(y=>y.id===x.id)).length;
  const prioritized=[];
  if(ev.overdue.length)prioritized.push({title:`${ev.overdue.length} cliente${ev.overdue.length===1?'':'s'} com reavaliação vencida`,text:'Confira os últimos retornos registrados e agende acompanhamento.',level:'critical',module:'tab-historico',ico:'users'});
  if(s.lateTasks.length)prioritized.push({title:`${s.lateTasks.length} tarefa${s.lateTasks.length===1?'':'s'} fora do prazo`,text:'Revise as datas ou conclua as pendências vencidas.',level:'critical',go:'tasks',ico:'alert'});
  if(s.lateGoals.length)prioritized.push({title:`${s.lateGoals.length} meta${s.lateGoals.length===1?'':'s'} com prazo vencido`,text:'Atualize o acompanhamento e redefina os próximos passos.',level:'critical',go:'goals',ico:'target'});
  const notLateUrgent=s.urgents.filter(x=>!s.lateTasks.some(y=>y.id===x.id));
  if(notLateUrgent.length)prioritized.push({title:`${notLateUrgent.length} tarefa${notLateUrgent.length===1?'':'s'} de alta prioridade`,text:'São as próximas pendências recomendadas para revisão.',level:'high',go:'tasks',ico:'flag'});
  if(s.todays.length)prioritized.push({title:`${s.todays.length} evento${s.todays.length===1?'':'s'} previsto${s.todays.length===1?'':'s'} para hoje`,text:'Abra a agenda para conferir compromissos e lembretes.',level:'normal',go:'agenda',ico:'calendar'});
  if(!prioritized.length)prioritized.push({title:'Sem alertas prioritários no momento',text:'Nenhum prazo vencido ou tarefa urgente foi encontrado nos dados locais de teste.',level:'normal',go:'agenda',ico:'check'});
  const insights=[];
  if(critical)insights.push({title:'Revisar prazos vencidos',text:`Há ${critical} registro${critical===1?'':'s'} atrasado${critical===1?'':'s'}. Priorize essa revisão.`,go:s.lateTasks.length?'tasks':'goals',ico:'alert',level:'critical'});
  if(!critical&&s.todays.length)insights.push({title:'Hoje está organizado',text:`${s.todays.length} ${s.todays.length===1?'item':'itens'} no calendário de hoje, sem prazos vencidos.`,go:'agenda',ico:'check',level:'normal'});
  if(ev.upcoming.length)insights.push({title:'Retornos nas próximas duas semanas',text:`${ev.upcoming.length} cliente${ev.upcoming.length===1?'':'s'} com reavaliação prevista nos próximos 14 dias.`,module:'tab-historico',ico:'users',level:'normal'});
  if(s.goals.length&&!s.goals.some(x=>x.status==='Concluída'))insights.push({title:'Metas em acompanhamento',text:`${activeGoals} meta${activeGoals===1?'':'s'} ativa${activeGoals===1?'':'s'}. Registre a evolução dos objetivos periodicamente.`,go:'goals',ico:'target',level:'normal'});
  if(s.notes.filter(x=>!x.archived).length&&s.notes.some(x=>x.pinned&&!x.archived))insights.push({title:'Notas importantes fixadas',text:'Você tem anotações destacadas para consulta rápida.',go:'notes',ico:'note',level:'normal'});
  if(!s.tasks.length&&!s.goals.length&&!s.notes.length&&!s.appt.length){insights.push({title:'Estruture sua rotina',text:'Comece cadastrando um compromisso, uma tarefa ou uma meta em Organização.',go:'agenda',ico:'spark',level:'normal'});insights.push({title:'Vincule informações aos clientes',text:'Notas e objetivos podem ser associados aos clientes, sem duplicar seus cadastros.',go:'notes',ico:'users',level:'normal'});}
  if(!insights.length)insights.push({title:'Acompanhamento em dia',text:'Sem sinalizações adicionais nos registros atualmente disponíveis.',go:'agenda',ico:'check',level:'normal'});
  const next=s.allEvents.filter(x=>validISO(x.date)&&x.date>=s.t).sort((a,b)=>a.date.localeCompare(b.date)||String(a.time||'').localeCompare(String(b.time||''))).slice(0,5);
  const week=Array.from({length:7},(_,i)=>({date:addDays(s.t,i)}));
  week.forEach(day=>{day.count=s.allEvents.filter(x=>x.date===day.date).length});const mx=Math.max(1,...week.map(x=>x.count));
  const eventsHtml=next.length?next.map((x,i)=>`<button type="button" class="efh-activity" data-efh-event="${i}"><span class="efh-time">${safe(strDate(x.date))}${x.time?'<br>'+safe(x.time):''}</span><span class="efh-a-content"><strong>${safe(eventTitle(x))}</strong><small>${safe(labelFor(x))}${x.note?' · '+safe(String(x.note).slice(0,85)):''}</small></span>${icon('arrow')}</button>`).join(''):'<p class="efh-empty">Nenhum compromisso ou lembrete futuro cadastrado. A agenda permanece disponível em Organização.</p>';
  const number=(v)=>String(v);
  home.innerHTML=`<div class="efh-page" id="efh-dashboard" aria-label="Painel Início - informações gerenciais">
  <header class="efh-hero"><div class="efh-hero-copy"><div class="efh-hero-date">${icon('calendar',14)} ${safe(dateText)}</div><h1>${greeting}${professionalName?", "+safe(professionalName):""}! Veja o que precisa da sua atenção.</h1><p>Seu panorama profissional em um só lugar: insights, avisos e próximos passos — sem misturar com as telas de gestão.</p></div><div class="efh-hero-actions"><button class="efh-btn" data-efh-go="agenda">${icon('layout')} Abrir Organização</button><button class="efh-btn efh-btn-ghost" data-efh-action="evaluation">${icon('plus')} Nova avaliação</button></div></header>
  <div class="efh-stat-grid" aria-label="Indicadores do período"><button class="efh-stat" data-efh-go="agenda"><span class="efh-bubble">${icon('calendar')}</span><span><strong>${number(s.todays.length)}</strong><small>Eventos de hoje</small></span></button><button class="efh-stat ${overdue?'danger':''}" data-efh-go="tasks"><span class="efh-bubble">${icon('alert')}</span><span><strong>${number(overdue)}</strong><small>Prazos vencidos</small></span></button><button class="efh-stat ${pending?'warn':''}" data-efh-go="tasks"><span class="efh-bubble">${icon('check')}</span><span><strong>${number(pending)}</strong><small>Tarefas pendentes</small></span></button><button class="efh-stat" data-efh-go="goals"><span class="efh-bubble">${icon('target')}</span><span><strong>${number(activeGoals)}</strong><small>Metas ativas</small></span></button></div>
  <div class="efh-strategy-kpis" aria-label="Indicadores de avaliações e financeiro">
    <button class="efh-strategy-kpi" data-efh-module="tab-historico"><span class="efh-eyebrow">Alunos acompanhados</span><strong>${ev.clients}</strong><small>Com avaliação cadastrada</small></button>
    <button class="efh-strategy-kpi ${ev.overdue.length?'is-late':''}" data-efh-module="tab-historico"><span class="efh-eyebrow">Retornos vencidos</span><strong>${ev.overdue.length}</strong><small>Na última avaliação de cada aluno</small></button>
    <button class="efh-strategy-kpi" data-efh-module="tab-cobranca"><span class="efh-eyebrow">A receber</span><strong id="efh-finance-kpi">…</strong><small id="efh-finance-kpi-sub">Consultando histórico financeiro</small></button>
  </div>
  <div class="efh-grid"><div class="efh-stack">
    <section class="efh-card" aria-label="Avisos e prioridades"><div class="efh-section-top"><div><span class="efh-eyebrow">PRIORIDADES</span><h2>${icon('bell')} Avisos que exigem atenção</h2><p>${alertCounts?`${alertCounts} alerta${alertCounts===1?'':'s'} de prazo ou prioridade`:'Situação calculada a partir das tarefas, metas e agenda'}</p></div><button class="efh-btn" data-efh-go="tasks">Ver tarefas ${icon('arrow')}</button></div><div class="efh-insight-list">${prioritized.slice(0,4).map(x=>`<div class="efh-insight ${x.level}"><span class="efh-mark">${icon(x.ico)}</span><div><strong>${safe(x.title)}</strong><p>${safe(x.text)}</p><button ${x.module?`data-efh-module="${x.module}"`:`data-efh-go="${x.go}"`}>Consultar ${icon('arrow',12)}</button></div></div>`).join('')}</div></section>
    <section class="efh-card" aria-label="Próximos registros"><div class="efh-section-top"><div><span class="efh-eyebrow">AGENDA UNIFICADA</span><h2>${icon('clock')} Próximos acontecimentos</h2></div><button class="efh-btn" data-efh-go="agenda">Calendário ${icon('arrow')}</button></div><div id="efh-next-events">${eventsHtml}</div></section>
    </div><div class="efh-stack">
    <section class="efh-card" aria-label="Insights operacionais"><div class="efh-section-top"><div><span class="efh-eyebrow">INTELIGÊNCIA OPERACIONAL</span><h2>${icon('spark')} Insights da sua rotina</h2><p>Orientações baseadas em regras, não em diagnósticos automáticos.</p></div></div><div class="efh-insight-list">${insights.slice(0,3).map(x=>`<div class="efh-insight ${x.level}"><span class="efh-mark">${icon(x.ico)}</span><div><strong>${safe(x.title)}</strong><p>${safe(x.text)}</p><button ${x.module?`data-efh-module="${x.module}"`:`data-efh-go="${x.go}"`}>Explorar ${icon('arrow',12)}</button></div></div>`).join('')}</div></section>
    <section class="efh-card" aria-label="Próximos sete dias"><div class="efh-section-top"><div><span class="efh-eyebrow">TENDÊNCIA</span><h2>${icon('calendar')} Próximos 7 dias</h2><p>Itens previstos no calendário, incluindo tarefas e lembretes.</p></div></div><div class="efh-week">${week.map(x=>`<div class="efh-day" title="${safe(strDate(x.date,{weekday:'long',day:'numeric',month:'long'}))}: ${x.count} item(ns)"><span>${safe(strDate(x.date,{weekday:'short'}).replace('.',''))}</span><div class="efh-bar-track"><span class="efh-bar" style="height:${Math.max(2,Math.round(x.count/mx*100))}%"></span></div><strong>${x.count}</strong></div>`).join('')}</div></section>
    <section class="efh-card" aria-label="Ações rápidas"><div class="efh-section-top"><div><span class="efh-eyebrow">ACESSO RÁPIDO</span><h2>${icon('layout')} Ações do dia</h2></div></div><div class="efh-quick"><button class="efh-btn" data-efh-go="agenda">${icon('calendar')} Agenda</button><button class="efh-btn" data-efh-go="tasks">${icon('check')} Tarefas</button><button class="efh-btn" data-efh-go="notes">${icon('note')} Notas</button><button class="efh-btn" data-efh-go="goals">${icon('target')} Metas</button></div><p class="efh-note">Cadastros e gerenciamento foram transferidos para Organização. Este painel apresenta somente resumos e alertas.</p></section>
    <section class="efh-card efh-evaluation-panel" aria-label="Acompanhamento de alunos"><div class="efh-section-top"><div><span class="efh-eyebrow">ACOMPANHAMENTO DE ALUNOS</span><h2>${icon('users')} Reavaliações que precisam de atenção</h2><p>Última avaliação de cada aluno, sem diagnóstico automático.</p></div><button type="button" class="efh-btn" data-efh-module="tab-historico">Abrir Avaliações ${icon('arrow')}</button></div>
      <div class="efh-followup-kpis"><div><strong>${ev.records}</strong><small>Avaliações registradas</small></div><div><strong>${ev.upcoming.length}</strong><small>Retornos em até 14 dias</small></div><div><strong>${ev.missing}</strong><small>Sem próximo retorno informado</small></div></div>
      ${ev.overdue.length||ev.upcoming.length?`<div class="efh-followup-list">${[...ev.overdue.map(x=>({...x,late:true})),...ev.upcoming.map(x=>({...x,late:false}))].slice(0,5).map(x=>`<button type="button" class="efh-followup-row ${x.late?'is-late':''}" data-efh-module="tab-historico"><span><strong>${safe(x.name)}</strong><small>${x.late?'Reavaliação vencida':'Retorno previsto'} · ${safe(strDate(x.due,{day:'2-digit',month:'long',year:'numeric'}))}</small></span>${icon('arrow',15)}</button>`).join('')}</div>`:'<p class="efh-empty">Nenhum retorno atrasado ou previsto para os próximos 14 dias nos registros disponíveis.</p>'}
      <p class="efh-note">A ausência de uma data de retorno não significa que o aluno abandonou o acompanhamento.</p>
    </section>
    <section class="efh-card efh-evolution-panel" aria-label="Evolução registrada dos alunos"><div class="efh-section-top"><div><span class="efh-eyebrow">EVOLUÇÃO DOS ALUNOS</span><h2>${icon('spark')} Mudanças entre avaliações</h2><p>${progress.withHistory} aluno${progress.withHistory===1?'':'s'} com pelo menos duas datas de avaliação.</p></div><button class="efh-btn" type="button" data-efh-module="tab-comparison">Ver Evolução ${icon('arrow')}</button></div>
      ${progress.changes.length?`<div class="efh-followup-list">${progress.changes.map(x=>`<button type="button" class="efh-followup-row" data-efh-module="tab-comparison"><span><strong>${safe(x.name)}</strong><small>Diferença de peso entre as duas últimas avaliações · ${safe(strDate(x.date,{day:'2-digit',month:'long',year:'numeric'}))}</small></span><b>${x.delta>=0?'+':''}${safe(x.delta.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}))} kg</b>${icon('arrow',15)}</button>`).join('')}</div>`:'<p class="efh-empty">Sem pares de avaliações com datas distintas e peso registrado nos dois momentos. Cadastre uma reavaliação para comparar.</p>'}
      <p class="efh-note">A mudança isolada no peso não determina sucesso ou insucesso. Consulte medidas, composição corporal e objetivos na Evolução.</p></section>
    <section class="efh-card efh-finance-panel" aria-label="Visão financeira"><div class="efh-section-top"><div><span class="efh-eyebrow">GESTÃO FINANCEIRA · COBRANÇAS</span><h2>${icon('flag')} Recebimentos e pendências</h2><p id="efh-finance-status">Consultando registros locais</p></div><button type="button" class="efh-btn" data-efh-module="tab-cobranca">Abrir Cobranças ${icon('arrow')}</button></div><div id="efh-finance-content" aria-live="polite"><p class="efh-empty">Carregando informações financeiras…</p></div><p class="efh-note">Valores pagos são os lançamentos marcados como pagos, conforme a data do registro. Não representam conciliação bancária nem projeção de receita.</p></section>
    </div></div><div class="efh-last"><span>Indicadores calculados a partir dos registros locais. Os insights não substituem análise profissional.</span></div>
  </div>`;
  remodelInicio(home,{s,ev,overdue,pending,activeGoals,prioritized,next,week,mx,professionalName});
  showFinance(home);
  rendered=true;
  window.EFHomeCardLayout?.mount?.();
 }
 function navigate(id){if(id==='evaluation'){window.switchTab?.('tab-novo-checkin');return;}organization()?.go(id||'agenda');}
 document.addEventListener('click',ev=>{const item=ev.target.closest('[data-efh-event]');if(item){const home=$('#tab-painel');const record=home?.__efh_events?.[Number(item.dataset.efhEvent)];if(record)openEvent(record);return}const btn=ev.target.closest('[data-efh-module],[data-efh-go],[data-efh-action]');if(btn){if(btn.dataset.efhModule){window.switchTab?.(btn.dataset.efhModule);return;}navigate(btn.dataset.efhGo||btn.dataset.efhAction);}});
 function init(){
  // Controls in the old Inicio are now wholly preserved in the Organization section.
  const home=$('#tab-painel');const org=$('#tab-organizacao');if(!home||!org)return;
  const original=window.switchTab;
  if(typeof original==='function')window.switchTab=function(id){const v=original.apply(this,arguments);if(id==='tab-painel')render();return v;};
  // Avoid invented notifications: data are re-read whenever Home is revisited.
  render();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&$('#tab-painel')?.classList.contains('active'))render()});
  window.EFHomeDashboard={refresh:render,inspect:state,inspectEvaluations:evaluations,inspectEvolution:evolutionSummary};
  window.addEventListener('ef-professional-profile-saved',()=>{if($('#tab-painel')?.classList.contains('active'))render()});
  if(!home.classList.contains('active')){ /* non-home pages keep their current selection */ }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

