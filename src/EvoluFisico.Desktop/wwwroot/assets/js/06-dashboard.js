/* 04-runtime.js */
(function(){'use strict';
var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
// Escapa separadamente o contexto JavaScript de handlers gerados no HTML.
var jsEsc=function(s){return esc(String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r/g,'\\r').replace(/\n/g,'\\n'))};
var norm=function(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()};
var pd=function(s){var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null};
var fd=function(d){return d?d.toLocaleDateString('pt-BR'):'—'};
var num=function(v){var n=parseFloat(String(v).replace(',','.'));return isFinite(n)?n:null};
var lista=function(){try{return Array.isArray(avaliacoes)?avaliacoes:[]}catch(e){return[]}};
var pg=function(a){var r=a.dobras_resultado&&num(a.dobras_resultado.percGordura);return r!=null?r:num(a.bioimpedancia&&a.bioimpedancia.pgordura)};
var mm=function(a){return EFMeasures.lean(a)};
var ini=function(n){var p=String(n||'?').trim().split(/\s+/).filter(Boolean);return p.length?(p[0][0]+(p.length>1?p[p.length-1][0]:'')):'?'};
var addDays=function(d,n){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x};
var startOfWeek=function(d){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());var day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x};
var sameDay=function(a,b){return a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()};
var toISO=function(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
var monthLabel=function(d){return d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})};
var STORAGE='ef90_home_agenda';
var LOCATION_FILTER_KEY='ef90_agenda_local_filtro';
var SELDAY='ef90_home_selected_day';
var MONTHOFF='ef90_home_month_offset';
var RECHECK_INTERVAL='ef90_return_interval_months_v1';
var today=function(){var d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())};

function toast(msg,tipo){var c=$('#ef55-toasts');if(!c){c=document.createElement('div');c.id='ef55-toasts';c.className='no-print';document.body.appendChild(c)}
var t=document.createElement('div');t.className='ef55-toast '+(tipo||'');t.textContent=msg;t.style.cursor='pointer';t.onclick=function(){t.remove()};c.appendChild(t);
setTimeout(function(){t.classList.add('out');setTimeout(function(){t.remove()},300)},4200)}
window.efToast=toast;

function alunos(){var m={};lista().forEach(function(a){var k=EFIdentity.key(a);if(k)(m[k]=m[k]||[]).push(a)});
return Object.keys(m).map(function(k){var l=m[k].sort(function(x,y){return(x.data_avaliacao||'').localeCompare(y.data_avaliacao||'')});return{nome:l[l.length-1].nome,list:l,first:l[0],last:l[l.length-1]}})}

function abrir(id){var fn=['abrirModalDetalhes','verDetalhesAvaliacao','visualizarAvaliacao','abrirDetalhesAvaliacao','verAvaliacao'].filter(function(n){return typeof window[n]==='function'})[0];
if(fn)window[fn](id);else window.switchTab('tab-historico')}
window.ef55Abrir=abrir;
window.ef55Zap=function(ev,id){ev.stopPropagation();var a=lista().filter(function(x){return x.id===id})[0];if(!a)return;
var d=String(a.whatsapp||'').replace(/\D/g,'');if(!d){toast('Aluno sem WhatsApp cadastrado.','warn');return}
var resolved=recheckDate(a);if(!resolved){toast('Sem data definida de reavaliação.','warn');return}var msg='Olá, '+String(a.nome).split(' ')[0]+'! Podemos combinar sua próxima reavaliação física? '+(resolved.estimated?'Sugestão de data: ':'Data prevista: ')+fd(resolved.date)+'. Vamos agendar o melhor horário?';
window.open('https://api.whatsapp.com/send?phone='+(d.length<=11?'55':'')+d+'&text='+encodeURIComponent(msg),'_blank','noopener,noreferrer')};

function chip(v,un,bomSeNeg){if(v==null||isNaN(v))return'';var cls=Math.abs(v)<0.05?'':((v<0)===bomSeNeg?'ok':'bad');
return'<span class="ef55-pill '+cls+'">'+(v>0?'+':'')+v.toFixed(1)+un+'</span>'}
function rows(arr,fn,empty){return arr.length?arr.map(fn).join(''):'<div class="ef55-empty">'+(empty||'Nada por aqui ainda.')+'</div>'}
function kpi(icon,t,v,s){return '<div class="ef90-kpi"><div class="ef90-kpi-icon">'+icon+'</div><div><small>'+t+'</small><strong>'+v+'</strong><span>'+s+'</span></div></div>'}
function pill(cls,txt){return '<span class="ef90-chip '+cls+'">'+esc(txt)+'</span>'}
function storageGet(k,fb){try{var v=localStorage.getItem(k);return v==null?fb:v}catch(e){return fb}}
function storageSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function loadAgenda(){try{var raw=JSON.parse(storageGet(STORAGE,'[]'));return Array.isArray(raw)?raw.filter(Boolean):[]}catch(e){return[]}}
function saveAgenda(list){storageSet(STORAGE,JSON.stringify(list||[]))}
function localNormalizado(valor){return String(valor||'').trim().replace(/\s+/g,' ')}
function locaisConhecidos(agenda){
 var vistos={};return (agenda||[]).slice().reverse().map(function(a){return localNormalizado(a.local)}).filter(function(n){
 if(!n)return false;var k=norm(n);if(vistos[k])return false;vistos[k]=true;return true
 }).slice(0,50).sort(function(a,b){return a.localeCompare(b,'pt-BR')})
}
function filtroLocalSelecionado(locais){var v=storageGet(LOCATION_FILTER_KEY,'__todos__');
 if(v==='__todos__'||v==='__sem__')return v;
 return locais.some(function(nome){return norm(nome)===norm(v)})?v:'__todos__'
}
function eventoDoLocal(e,local){
 if(local==='__todos__')return true;
 if(local==='__sem__')return !localNormalizado(e.local);
 return norm(e.local)===norm(local)
}
window.ef90FiltrarLocal=function(local){storageSet(LOCATION_FILTER_KEY,local||'__todos__');render()};
function selectedDay(){var iso=storageGet(SELDAY,toISO(today()));return /^\d{4}-\d{2}-\d{2}$/.test(iso)?iso:toISO(today())}
function setSelectedDay(iso){storageSet(SELDAY,iso)}
function monthOffset(){var v=parseInt(storageGet(MONTHOFF,'0'),10);return isFinite(v)?v:0}
function setMonthOffset(v){storageSet(MONTHOFF,String(v))}
function agendaStats(agenda, base){var s0=startOfWeek(base),s7=addDays(s0,7),t1=addDays(base,1);var ativos=(agenda||[]).filter(function(a){return a&&a.status!=='cancelado'});var todayCount=ativos.filter(function(a){return a.date===toISO(base)}).length;var weekCount=ativos.filter(function(a){var d=pd(a.date);return d&&d>=s0&&d<s7}).length;var pend=ativos.filter(function(a){var d=pd(a.date);return a.status!=='concluido'&&d&&d<t1}).length;return {today:todayCount,week:weekCount,pending:pend}}
function recheckInterval(){var v=Number(storageGet(RECHECK_INTERVAL,'0'));return [0,1,2,3,4,6,9,12].indexOf(v)>=0?v:0}
function addMonthsSafe(d,months){var day=d.getDate(),target=new Date(d.getFullYear(),d.getMonth()+months,1);target.setDate(Math.min(day,new Date(target.getFullYear(),target.getMonth()+1,0).getDate()));return target}
function recheckDate(a){
 var explicit=pd(a&&a.data_proxima_avaliacao);
 if(explicit)return {date:explicit,estimated:false};
 var months=recheckInterval(),previous=pd(a&&a.data_avaliacao);
 return months&&previous?{date:addMonthsSafe(previous,months),estimated:true}:null;
}
window.ef90SetRecheckInterval=function(value){
 var months=Number(value);if([0,1,2,3,4,6,9,12].indexOf(months)<0)return false;
 storageSet(RECHECK_INTERVAL,String(months));render();return true;
};
function buildReturnEvents(alunosList, base){return alunosList.map(function(x){var r=recheckDate(x.last),d=r&&r.date;return d?{id:'ret-'+x.last.id,date:toISO(d),time:'',type:'reavaliacao',student:x.nome,status:(d<base?'atrasado':sameDay(d,base)?'hoje':'agendado'),note:r.estimated?'Data estimada pelo intervalo escolhido; confirme com o aluno.':'Retorno programado na avaliação',source:'return',estimated:r.estimated,refId:x.last.id,whatsapp:x.last.whatsapp||''}:null}).filter(Boolean)}
function buildAttention(alunosList, agenda, base){var next30=addDays(base,30);var items=[];
var overdue=alunosList.map(function(x){var r=recheckDate(x.last),d=r&&r.date;return d?{student:x.nome,date:d,refId:x.last.id,estimated:r.estimated}:null}).filter(Boolean).filter(function(x){return x.date<base}).sort(function(a,b){return a.date-b.date}).slice(0,4);
overdue.forEach(function(x){var days=Math.round((base-x.date)/864e5);items.push({kind:'warn',title:'Reavaliação em atraso',text:x.student+' está com retorno atrasado há '+days+' dia(s).',refId:x.refId})});
var noNext=alunosList.filter(function(x){return !recheckDate(x.last)}).slice(0,3);noNext.forEach(function(x){items.push({kind:'neutral',title:'Definir próximo retorno',text:x.nome+' ainda não tem uma nova data de avaliação definida.',refId:x.last.id})});
var lateAgenda=agenda.filter(function(a){var d=pd(a.date);return a.status!=='concluido'&&d&&d<base}).slice(0,4);lateAgenda.forEach(function(a){items.push({kind:'warn',title:'Atendimento pendente na agenda',text:(a.student||'Compromisso')+' ficou pendente desde '+fd(pd(a.date))+' às '+(a.time||'—')+'.'})});
return items.slice(0,8)}
function calendarGrid(events, monthDate, selISO){var first=new Date(monthDate.getFullYear(),monthDate.getMonth(),1);var start=new Date(first);start.setDate(first.getDate()-((first.getDay()+6)%7));var names=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
var buckets={};events.forEach(function(e){(buckets[e.date]=buckets[e.date]||[]).push(e)});
var head=names.map(function(n){return '<div class="ef90-cal-head">'+n+'</div>'}).join('');
var cells='';
for(var i=0;i<42;i++){
  var d=addDays(start,i), iso=toISO(d), sameMonth=d.getMonth()===monthDate.getMonth(), list=buckets[iso]||[];
  var cls='ef90-cal-day'+(sameMonth?'':' muted')+(iso===selISO?' selected':'')+(iso===toISO(today())?' today':'')+(list.length?' has-events':'');
  cells+='<button type="button" class="'+cls+'" onclick="ef90PickDay(\''+iso+'\')"><span class="num">'+d.getDate()+'</span><span class="dots">'+(list.slice(0,3).map(function(e){return '<i class="'+(e.source==='return'?'ret':'agd')+'"></i>'}).join('')||'')+'</span><small>'+(list.length?list.length+' compromisso(s)':'')+'</small></button>';
 }
 return '<div class="ef90-calendar-grid">'+head+cells+'</div>';
}
function dayEvents(iso, allEvents){return allEvents.filter(function(e){return e.date===iso}).sort(function(a,b){return String(a.time||'').localeCompare(String(b.time||''))})}
function openWhats(student, phone, date){var d=String(phone||'').replace(/\D/g,'');if(!d){toast('Aluno sem WhatsApp cadastrado.','warn');return}
var msg='Olá, '+String(student||'').split(' ')[0]+'! Estou entrando em contato para alinhar sua avaliação do dia '+fd(pd(date))+'.';
window.open('https://api.whatsapp.com/send?phone='+(d.length<=11?'55':'')+d+'&text='+encodeURIComponent(msg),'_blank','noopener,noreferrer')}
window.ef90OpenWhatsapp=openWhats;
window.ef90PickDay=function(iso){setSelectedDay(iso);render()};
window.ef90ShiftMonth=function(delta){setMonthOffset(monthOffset()+delta);render()};
window.ef90JumpToday=function(){setMonthOffset(0);setSelectedDay(toISO(today()));render()};
window.ef90RemoveAgenda=function(id){var items=loadAgenda().filter(function(x){return x.id!==id});saveAgenda(items);if(editingAgendaId===id)editingAgendaId=null;toast('Compromisso removido.');render()};
window.ef90ToggleAgenda=function(id){var items=loadAgenda();items=items.map(function(x){if(x.id===id)x.status=x.status==='concluido'?'agendado':'concluido';return x});saveAgenda(items);render()};
var editingAgendaId=null;
function alunoCorrespondente(nome){return alunos().find(function(x){return norm(x.nome)===norm(nome)})||null}
function intervalo(a){var parts=String(a.time||'09:00').split(':');var start=(parseInt(parts[0],10)||0)*60+(parseInt(parts[1],10)||0);var duration=Number(a.duration)||60;return {start:start,end:start+duration}}
function conflitante(lista,date,time,duration,exclude){var current=intervalo({time:time,duration:duration});return lista.some(function(x){if(x.id===exclude||x.date!==date||x.status==='cancelado')return false;var prior=intervalo(x);return current.start<prior.end&&prior.start<current.end})}
window.ef90SetStatus=function(id,status){var allowed=['agendado','confirmado','concluido','faltou','cancelado'];if(allowed.indexOf(status)<0)return;var items=loadAgenda();items.forEach(function(a){if(a.id===id)a.status=status});saveAgenda(items);render()};
window.ef90EditAgenda=function(id){var a=loadAgenda().find(function(x){return x.id===id});if(!a)return;editingAgendaId=id;setSelectedDay(a.date);setMonthOffset((pd(a.date).getFullYear()-today().getFullYear())*12+pd(a.date).getMonth()-today().getMonth());render();[['ef90-date',a.date],['ef90-time',a.time],['ef90-duration',a.duration||60],['ef90-type',a.type],['ef90-student',a.student],['ef90-location',a.local||''],['ef90-note',a.note]].forEach(function(x){var el=document.getElementById(x[0]);if(el)el.value=x[1]||''});var btn=$('#ef90-save-button');if(btn)btn.textContent='Salvar alteração';var f=$('#ef90-date');if(f)f.focus()};
window.ef90CancelEdit=function(){editingAgendaId=null;render()};
window.ef90ExportAgenda=function(){var data={tipo:'agenda-evolufisico',versao:1,exportadoEm:new Date().toISOString(),compromissos:loadAgenda(),tarefas:getTasks()};var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='evolufisico-agenda-tarefas.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000)};


/* Recorrências são eventos independentes, cada um editável/cancelável.
   A série toda é validada antes de atualizar o armazenamento. */
function planRecurringAppointments(existing,template,repetitions,excludeId){
 var count=Number(repetitions);
 if(![1,2,4,8,12].includes(count))throw new Error('Escolha uma recorrência válida (até 12 semanas).');
 var start=pd(template.date),span=intervalo(template);
 if(!start||!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(template.time||''))||
    !Number.isFinite(Number(template.duration))||span.end>1440||span.end<=span.start)
  throw new Error('Data, horário ou duração inválidos para a agenda.');
 var candidates=[],reserved=existing.filter(function(a){return a.id!==excludeId});
 for(var i=0;i<count;i++){
  var date=toISO(addDays(start,i*7));
  if(conflitante(reserved,date,template.time,template.duration,null))
   throw new Error('Conflito de horário na recorrência de '+fd(pd(date))+'. Nenhum compromisso foi adicionado.');
  var entry=Object.assign({},template,{
   date:date,
   id:i===0&&excludeId?excludeId:'ag-'+Date.now()+'-'+i+'-'+Math.random().toString(36).slice(2,9),
   source:'agenda'
  });
  if(i>0){entry.status='agendado';entry.seriesOrigin=entry.seriesOrigin||template.date}
  candidates.push(entry);reserved.push(entry);
 }
 return candidates;
}
function attendanceSummary(agenda,year,month){
 var rows=agenda.filter(function(e){
  var d=pd(e.date);
  return d&&d.getFullYear()===year&&d.getMonth()===month;
 });
 var done=0,missed=0,cancelled=0;
 rows.forEach(function(e){
  if(e.status==='concluido')done++;
  else if(e.status==='faltou')missed++;
  else if(e.status==='cancelado')cancelled++;
 });
 var reviewed=done+missed;
 return {done:done,missed:missed,cancelled:cancelled,
  planned:rows.length, reviewed:reviewed,rate:reviewed?Math.round(100*done/reviewed):null};
}
function csvCell(value){
 var str=String(value==null?'':value);
 // Neutraliza fórmula ao abrir CSV em Excel/LibreOffice.
 if(/^[\s]*[=+\-@]/.test(str))str="'"+str;
 return '"'+str.replace(/"/g,'""')+'"';
}
function attendanceCsv(agenda,year,month){
 var lines=[['Data','Horário','Aluno ou compromisso','Modalidade','Status','Duração (minutos)','Local','Observações'].map(csvCell).join(';')];
 agenda.filter(function(a){
  var d=pd(a.date);return d&&d.getFullYear()===year&&d.getMonth()===month;
 }).sort(function(a,b){return String(a.date+' '+a.time).localeCompare(String(b.date+' '+b.time))})
 .forEach(function(a){
  lines.push([a.date,a.time,a.student,a.type,a.status||'agendado',a.duration,a.local,a.note].map(csvCell).join(';'));
 });
 return '\uFEFF'+lines.join('\r\n');
}
window.ef90ExportAttendance=function(){
 var base=today(),data=attendanceCsv(loadAgenda(),base.getFullYear(),base.getMonth());
 var blob=new Blob([data],{type:'text/csv;charset=utf-8;'});
 var url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='evolufisico-presenca-'+toISO(new Date(base.getFullYear(),base.getMonth(),1)).slice(0,7)+'.csv';
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(function(){URL.revokeObjectURL(url)},1000);
 toast('Relatório CSV do mês exportado. O arquivo pode conter dados pessoais: armazene-o em local seguro.');
};
window.ef90DuplicateAgenda=function(id){
 var original=loadAgenda().find(function(a){return String(a.id)===String(id)});
 if(!original)return;
 editingAgendaId=null;
 var start=pd(original.date);if(!start)return;
 var next=toISO(addDays(start,7));
 setSelectedDay(next);setMonthOffset((pd(next).getFullYear()-today().getFullYear())*12+pd(next).getMonth()-today().getMonth());
 render();
 [['ef90-date',next],['ef90-time',original.time],['ef90-duration',original.duration||60],
  ['ef90-type',original.type],['ef90-student',original.student],
  ['ef90-location',original.local||''],['ef90-note',original.note||'']].forEach(function(pair){
  var field=document.getElementById(pair[0]);if(field)field.value=pair[1]||'';
 });
 var repeat=document.getElementById('ef90-repeat-weeks');if(repeat)repeat.value='1';
 var focus=document.getElementById('ef90-student');if(focus)focus.focus();
 toast('Compromisso copiado para a próxima semana. Confira e salve.');
};

window.ef90SaveAgenda=function(ev){if(ev&&ev.preventDefault)ev.preventDefault();var date=$('#ef90-date'),time=$('#ef90-time'),type=$('#ef90-type'),student=$('#ef90-student'),note=$('#ef90-note'),durationEl=$('#ef90-duration'),localEl=$('#ef90-location');
if(!date||!date.value){toast('Escolha a data do compromisso.','warn');return false}
var nome=(student&&student.value||'').trim(),horario=(time&&time.value)||'09:00';
if(!nome){toast('Informe o nome do aluno ou do compromisso.','warn');return false}
var duracao=Number(durationEl&&durationEl.value)||60;var items=loadAgenda();
var repeatEl=$('#ef90-repeat-weeks');
var total=editingAgendaId?1:Number(repeatEl&&repeatEl.value||1);
if(![1,2,4,8,12].includes(total)){toast('Selecione um intervalo de recorrência válido.','warn');return false}
var correspondente=alunoCorrespondente(nome);
var item={id:editingAgendaId||'ag-'+Date.now(),date:date.value,time:horario,duration:duracao,type:(type&&type.value)||'avaliacao',student:nome,local:localNormalizado(localEl&&localEl.value),refId:correspondente?correspondente.last.id:null,note:(note&&note.value||'').trim(),status:editingAgendaId?(items.find(function(x){return x.id===editingAgendaId})||{}).status||'agendado':'agendado',source:'agenda'};
var novos;
try{novos=planRecurringAppointments(items,item,total,editingAgendaId)}
catch(error){toast(error.message,'warn');return false}
if(editingAgendaId)items=items.filter(function(x){return x.id!==editingAgendaId});
items.push.apply(items,novos);
items.sort(function(a,b){return (a.date+' '+a.time).localeCompare(b.date+' '+b.time)});
saveAgenda(items);
toast(editingAgendaId?'Compromisso reagendado.':novos.length>1?novos.length+' compromissos semanais criados.':'Compromisso adicionado à agenda.');
editingAgendaId=null;setSelectedDay(item.date);render();return false};

var TASKKEY='ef90_tasks_v2', FILTERKEY='ef90_filter_v2';
function getTasks(){try{var x=JSON.parse(storageGet(TASKKEY,'[]'));return Array.isArray(x)?x:[]}catch(e){return[]}}
function putTasks(x){storageSet(TASKKEY,JSON.stringify(x))}
window.ef90NewTask=function(){var input=$('#ef90-task-input');var name=input&&input.value.trim();if(!name){toast('Escreva a tarefa.','warn');return}var a=getTasks();a.push({id:'task-'+Date.now(),name:name,done:false,date:selectedDay()});putTasks(a);render()};
window.ef90TaskDone=function(id){putTasks(getTasks().map(function(x){if(x.id===id)x.done=!x.done;return x}));render()};
window.ef90TaskDelete=function(id){putTasks(getTasks().filter(function(x){return x.id!==id}));render()};
window.ef90Filter=function(mode){storageSet(FILTERKEY,mode);render()};
window.ef90QuickSchedule=function(iso){setSelectedDay(iso);setMonthOffset((pd(iso).getFullYear()-today().getFullYear())*12+pd(iso).getMonth()-today().getMonth());render();var f=$('#ef90-student');if(f)f.focus()};
function filteredAgenda(events,iso,mode){if(mode==='semana'){var st=startOfWeek(pd(iso)),end=addDays(st,7);return events.filter(function(x){var d=pd(x.date);return d&&d>=st&&d<end})}if(mode==='mes'){var dt=pd(iso);return events.filter(function(x){var d=pd(x.date);return d&&d.getMonth()===dt.getMonth()&&d.getFullYear()===dt.getFullYear()})}return events.filter(function(x){return x.date===iso})}
function reminderBox(agenda,returns,base){var tomorrow=addDays(base,1),tomorrowISO=toISO(tomorrow),todayISO=toISO(base);
var due=agenda.filter(function(x){return x.status!=='concluido'&&(x.date===todayISO||x.date===tomorrowISO)});
var overdue=returns.filter(function(x){return pd(x.date)<base}).length;
return '<div class="ef90-alert-strip" role="status"><span class="ef90-alert-icon">!</span><div><b>Lembretes da agenda</b><p>'+due.length+' compromisso(s) hoje ou amanhã · '+overdue+' retorno(s) em atraso. Os avisos são mostrados enquanto o aplicativo estiver aberto; não são notificações externas.</p></div></div>'}


/* Organização dos cards: preferências de layout apenas, sem dados de pacientes. */
var HOME_LAYOUT_KEY='ef90_home_cards_order_v1';
var HOME_SIZE_KEY='ef90_home_card_sizes_v1';
var HOME_CARDS=['agenda','calendario','tarefas','retornos','insights','detalhes'];
var homeOrganizing=false;

function readHomeOrder(){
 var raw;try{raw=JSON.parse(storageGet(HOME_LAYOUT_KEY,'null'))}catch(e){raw=null}
 // Aceita as preferências antigas de 4 cartões sem perder a organização salva.
 var valid=Array.isArray(raw)?raw.filter(function(id){return HOME_CARDS.indexOf(id)>=0}):[];
 var unique=valid.filter(function(id,i){return valid.indexOf(id)===i});
 HOME_CARDS.forEach(function(id){if(unique.indexOf(id)<0)unique.push(id)});
 return unique;
}
function readHomeSizes(){
 var raw;try{raw=JSON.parse(storageGet(HOME_SIZE_KEY,'{}'))}catch(e){raw=null}
 var sizes={};
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return sizes;
 HOME_CARDS.forEach(function(id){
  if(!Object.prototype.hasOwnProperty.call(raw,id))return;
  var item=raw[id];if(!item||typeof item!=='object'||Array.isArray(item))return;
  var width=item.width==='full'?'full':'half';
  var height=[0,80,160,240].indexOf(item.height)>=0?item.height:0;
  if(width==='full'||height!==0)sizes[id]={width:width,height:height};
 });
 return sizes;
}
function getHomeSize(id,sizes){
 var item=(sizes||readHomeSizes())[id]||{};
 return {width:item.width==='full'?'full':'half',height:[0,80,160,240].indexOf(item.height)>=0?item.height:0};
}
function changeHomeSize(id,kind){
 if(HOME_CARDS.indexOf(id)<0)return false;
 var sizes=readHomeSizes(),before=getHomeSize(id,sizes),next={width:before.width,height:before.height};
 if(kind==='wide')next.width=before.width==='full'?'half':'full';
 else if(kind==='larger')next.height=Math.min(240,before.height+80);
 else if(kind==='smaller')next.height=Math.max(0,before.height-80);
 else if(kind==='reset')next={width:'half',height:0};
 else return false;
 if(before.width===next.width&&before.height===next.height)return false;
 if(next.width==='half'&&next.height===0)delete sizes[id];else sizes[id]=next;
 storageSet(HOME_SIZE_KEY,JSON.stringify(sizes));
 homeLastSignature='';
 applyHomeCardLayout();toast('Tamanho do card atualizado.');
 return true;
}
window.ef90ResizeHomeCard=changeHomeSize;
function visibleHomeOrder(grid){
 return readHomeOrder().filter(function(id){return Boolean(grid.querySelector('[data-ef-home-card="'+id+'"]'))});
}
var homeLayoutScheduled=false,homeResizeObserver=null,homeObservedGrid=null,homeLastSignature='',homeLastGrid=null;
function homeMoveCard(id,position){
 var grid=$('#ef90-sortable'),visible=grid?visibleHomeOrder(grid):readHomeOrder();
 var from=visible.indexOf(id),to=Number(position);
 if(from<0||!Number.isInteger(to)||to<0||to>=visible.length)return false;
 if(from===to)return true;
 visible.splice(from,1);visible.splice(to,0,id);
 var trailing=readHomeOrder().filter(function(x){return visible.indexOf(x)<0});
 storageSet(HOME_LAYOUT_KEY,JSON.stringify(visible.concat(trailing)));
 applyHomeCardLayout();
 toast('Nova organização salva.');return true;
}
// Uma partição equilibrada evita o espaço vazio sob cartões baixos.
// Ao contrário de grid em linhas, cada coluna empilha cartões sem reservar a altura da outra.
function chooseHomeLanes(entries,columns){
 if(columns<2||entries.length<2)return [entries.map(function(x){return x.id}),[]];
 var n=entries.length;
 if(n>12){
   var totals=[0,0],lanes=[[],[]];
   entries.forEach(function(item,i){
     var lane=i===0?0:i===1?1:totals[0]<=totals[1]?0:1;
     lanes[lane].push(item.id);totals[lane]+=item.height;
   });
   return lanes;
 }
 var limit=Math.pow(2,n),best=Infinity,winning=1;
 for(var mask=1;mask<limit-1;mask+=2){
  var left=0,right=0,changes=0,last=-1;
  for(var i=0;i<n;i++){
   var lane=(mask>>i)&1;
   if(last!==-1&&lane!==last)changes++;
   last=lane;
   if(lane)left+=entries[i].height;else right+=entries[i].height;
  }
  // Primeiro cartão à esquerda. O desempate prioriza estabilidade visual.
  var penalty=Math.abs(left-right)+changes*5;
  if(penalty<best){best=penalty;winning=mask}
 }
 var lanes=[[],[]];
 entries.forEach(function(e,i){lanes[(winning>>i)&1?0:1].push(e.id)});
 return lanes;
}
function layoutHomeColumns(){
 var grid=$('#ef90-sortable');if(!grid||!grid.isConnected)return;
 var cards=[].slice.call(grid.querySelectorAll('[data-ef-home-card]'));
 if(!cards.length)return;
 var cardMap=new Map(cards.map(function(c){return [c.getAttribute('data-ef-home-card'),c]}));
 var order=visibleHomeOrder(grid).filter(function(id){return cardMap.has(id)});
 var sizes=readHomeSizes(),width=grid.clientWidth||grid.getBoundingClientRect().width||0;
 var columns=width>=920&&order.length>1?2:1;
 var entries=order.map(function(id){
  var card=cardMap.get(id),pref=getHomeSize(id,sizes);
  return {id:id,height:Math.max(card.scrollHeight||0,card.offsetHeight||0,card.getBoundingClientRect().height||0,100)+14,
          width:columns===2?pref.width:'half'};
 });
 var signature=columns+'|'+entries.map(function(e){return e.id+':'+e.width+':'+Math.round(e.height)}).join(';');
 if(grid===homeLastGrid&&signature===homeLastSignature)return;
 var groups=[],pending=[];
 function flush(){if(pending.length){groups.push({type:'pair',entries:pending});pending=[]}}
 entries.forEach(function(entry){
  if(entry.width==='full'&&columns===2){flush();groups.push({type:'wide',id:entry.id})}
  else pending.push(entry);
 });
 flush();
 var fragment=document.createDocumentFragment();
 groups.forEach(function(group){
  if(group.type==='wide'){
   var wide=cardMap.get(group.id);wide.dataset.efCardRenderedWidth='full';fragment.appendChild(wide);return;
  }
  var pair=document.createElement('div');pair.className='ef-home-pair';
  var arrangement=chooseHomeLanes(group.entries,columns);
  arrangement.forEach(function(ids,i){
   var lane=document.createElement('div');lane.className='ef-home-lane';
   lane.setAttribute('data-ef-home-lane',String(i));
   ids.forEach(function(id){
    var card=cardMap.get(id);card.dataset.efCardRenderedWidth='half';lane.appendChild(card);
   });
   pair.appendChild(lane);
  });
  fragment.appendChild(pair);
 });
 grid.classList.toggle('ef-home-single-column',columns===1);
 // Reparentear, sem recriar cards, preserva dados digitados e listeners.
 grid.replaceChildren(fragment);
 homeLastGrid=grid;homeLastSignature=signature;
}
function scheduleHomeLayout(){
 if(homeLayoutScheduled)return;
 homeLayoutScheduled=true;
 var raf=window.requestAnimationFrame||function(cb){return setTimeout(cb,30)};
 raf(function(){homeLayoutScheduled=false;layoutHomeColumns()});
}
function applyHomeCardLayout(){
 var grid=$('#ef90-sortable');if(!grid)return;
 var order=visibleHomeOrder(grid);
 grid.classList.toggle('ef-home-organizing',homeOrganizing);
 var cards=[].slice.call(grid.querySelectorAll('[data-ef-home-card]'));
 cards.forEach(function(card){
  var id=card.getAttribute('data-ef-home-card');
  card.draggable=false;
  var prefs=getHomeSize(id);
  card.dataset.efCardSize=prefs.height===0?'compacto':prefs.height===80?'normal':prefs.height===160?'ampliado':'extra';
  card.dataset.efCardWidth=prefs.width;
  card.style.setProperty('--ef-card-extra',prefs.height+'px');
  var state=(homeOrganizing?'edit|':'view|')+order.join('|')+'|'+prefs.width+'|'+prefs.height;
  if(card.dataset.efHomeControlState!==state){
   var previous=card.querySelector('.ef-home-card-tools');if(previous)previous.remove();
   var tools=document.createElement('div');tools.className='ef-home-card-tools no-print';
   var toggle=document.createElement('button');
   toggle.type='button';toggle.className='ef-home-move-tag';
   toggle.textContent=homeOrganizing?'✓ Concluir':'↕ Mover';
   toggle.setAttribute('aria-label',(homeOrganizing?'Concluir organização':'Reorganizar')+' cards do Início');
   toggle.setAttribute('aria-pressed',String(homeOrganizing));
   toggle.addEventListener('click',function(){homeOrganizing=!homeOrganizing;applyHomeCardLayout()});
   tools.appendChild(toggle);
   if(homeOrganizing){
    var positions=document.createElement('div');positions.className='ef-home-move-actions';
    var index=order.indexOf(id);
    var up=document.createElement('button');up.type='button';up.textContent='↑';up.title='Mover para posição anterior';up.setAttribute('aria-label','Mover card anterior');
    up.disabled=index===0;up.addEventListener('click',function(){homeMoveCard(id,visibleHomeOrder(grid).indexOf(id)-1)});
    positions.appendChild(up);
    var down=document.createElement('button');down.type='button';down.textContent='↓';down.title='Mover para próxima posição';down.setAttribute('aria-label','Mover card seguinte');
    down.disabled=index===order.length-1;down.addEventListener('click',function(){homeMoveCard(id,visibleHomeOrder(grid).indexOf(id)+1)});
    positions.appendChild(down);
    var select=document.createElement('select');select.setAttribute('aria-label','Escolher posição deste card');
    order.forEach(function(_,i){var option=document.createElement('option');option.value=String(i);option.textContent='Posição '+(i+1);select.appendChild(option)});
    select.value=String(index);select.addEventListener('change',function(){homeMoveCard(id,Number(select.value))});
    positions.appendChild(select);
    var drag=document.createElement('span');drag.className='ef-home-drag-handle';
    drag.draggable=true;drag.tabIndex=0;drag.textContent='⠿ Arrastar';
    drag.title='Arraste a alça para outro card';drag.setAttribute('aria-label','Arraste para mover o card');
    positions.appendChild(drag);
    var sizesBar=document.createElement('div');sizesBar.className='ef-home-size-actions';
    function sizeButton(action,label,title,disabled){
     var btn=document.createElement('button');btn.type='button';btn.textContent=label;
     btn.title=title;btn.disabled=Boolean(disabled);btn.setAttribute('aria-label',title);
     btn.addEventListener('click',function(){changeHomeSize(id,action)});
     sizesBar.appendChild(btn);
    }
    sizeButton('smaller','−','Diminuir altura do card',prefs.height===0);
    sizeButton('larger','+','Aumentar altura do card',prefs.height===240);
    sizeButton('wide',prefs.width==='full'?'↔ 1 coluna':'↔ 2 colunas','Alternar largura do card',false);
    sizeButton('reset','Tamanho padrão','Restaurar tamanho do card',prefs.width==='half'&&prefs.height===0);
    tools.appendChild(sizesBar);
    var reset=document.createElement('button');reset.type='button';reset.textContent='Padrão';reset.title='Restaurar a ordem inicial dos cards';
    reset.addEventListener('click',function(){storageSet(HOME_LAYOUT_KEY,JSON.stringify(HOME_CARDS));applyHomeCardLayout();toast('Ordem padrão restaurada.')});
    positions.appendChild(reset);tools.appendChild(positions);
   }
   card.appendChild(tools);
   card.dataset.efHomeControlState=state;
  }
  if(card.dataset.efHomeDnDBound==='true')return;
  card.dataset.efHomeDnDBound='true';
  card.addEventListener('dragstart',function(ev){
   if(!homeOrganizing||!ev.target.closest('.ef-home-drag-handle')){ev.preventDefault();return}
   ev.dataTransfer.effectAllowed='move';ev.dataTransfer.setData('text/plain',id);card.classList.add('ef-home-dragging');
  });
  card.addEventListener('dragover',function(ev){if(!homeOrganizing)return;ev.preventDefault();ev.dataTransfer.dropEffect='move';card.classList.add('ef-home-drop-target')});
  card.addEventListener('dragleave',function(ev){if(!card.contains(ev.relatedTarget))card.classList.remove('ef-home-drop-target')});
  card.addEventListener('drop',function(ev){
   if(!homeOrganizing)return;ev.preventDefault();card.classList.remove('ef-home-drop-target');
   var moving=ev.dataTransfer.getData('text/plain');
   if(HOME_CARDS.indexOf(moving)>=0)homeMoveCard(moving,visibleHomeOrder(grid).indexOf(id));
  });
  card.addEventListener('dragend',function(){grid.querySelectorAll('.ef-home-dragging,.ef-home-drop-target').forEach(function(x){x.classList.remove('ef-home-dragging','ef-home-drop-target')})});
 });
 // Recalcula quando o calendário, as tarefas, a análise ou a janela alteram de tamanho.
 if(typeof window.ResizeObserver==='function'){
  if(!homeResizeObserver)homeResizeObserver=new ResizeObserver(scheduleHomeLayout);
  if(homeObservedGrid!==grid){homeResizeObserver.disconnect();homeObservedGrid=grid}
  homeResizeObserver.observe(grid);
  cards.forEach(function(card){homeResizeObserver.observe(card)});
 }
 scheduleHomeLayout();
}
window.ef90MoveHomeCard=homeMoveCard;
window.ef90RefreshHomeLayout=applyHomeCardLayout;
window.ef90ChooseHomeLanes=chooseHomeLanes;
window.addEventListener('resize',scheduleHomeLayout);

function render(){var box=$('#ef55-painel');if(!box)return;
var retainedHomeAnalysis=[].slice.call(box.querySelectorAll('#ef-home-insights,#ef-home-deep'));
retainedHomeAnalysis.forEach(function(node){node.remove()});
var al=alunos(),av=lista(),base=today(),agenda=loadAgenda(),retornos=buildReturnEvents(al,base),allEvents=agenda.concat(retornos);
var mes=av.filter(function(a){var d=pd(a.data_avaliacao);return d&&d.getMonth()===base.getMonth()&&d.getFullYear()===base.getFullYear()}).length;
var gs=al.map(function(x){return pg(x.last)}).filter(function(v){return v!=null});
var media=gs.length?(gs.reduce(function(s,v){return s+v},0)/gs.length).toFixed(1)+'%':'--';
var ret=al.map(function(x){var r=recheckDate(x.last),d=r&&r.date;return d?{x:x,dias:Math.round((d-base)/864e5),data:d,estimada:r.estimated}:null}).filter(function(r){return r&&r.dias<=14}).sort(function(a,b){return a.dias-b.dias});
var atr=retornos.filter(function(r){return r.status==='atrasado'}).length;
var agendaS=agendaStats(agenda,base);
var presenca=attendanceSummary(agenda,base.getFullYear(),base.getMonth());
var monthDate=new Date(base.getFullYear(),base.getMonth()+monthOffset(),1);
var selISO=selectedDay();
var mode=storageGet(FILTERKEY,'dia');if(['dia','semana','mes'].indexOf(mode)<0)mode='dia';
var locais=locaisConhecidos(agenda),localFiltro=filtroLocalSelecionado(locais);
var eventosDoLocal=allEvents.filter(function(e){return eventoDoLocal(e,localFiltro)});
var dayList=filteredAgenda(eventosDoLocal,selISO,mode).sort(function(a,b){return (a.date+' '+a.time).localeCompare(b.date+' '+b.time)});
var attentions=buildAttention(al,agenda,base);
var evo=al.filter(function(x){return x.list.length>1}).sort(function(a,b){return(b.last.data_avaliacao||'').localeCompare(a.last.data_avaliacao||'')}).slice(0,5);
var rec=av.slice().sort(function(a,b){return(b.data_avaliacao||'').localeCompare(a.data_avaliacao||'')}).slice(0,5);
var dayHuman=fd(pd(selISO));
var weekEnd=addDays(startOfWeek(base),6);
box.innerHTML=''
+'<section class="ef90-home ef90-compact">'
+'<div class="ef90-simple-head"><div><h1>Agenda</h1><p>Organize suas avaliações, atendimentos e tarefas em um só lugar.</p></div><div class="ef90-hero-actions"><button type="button" class="btn btn-primary btn-sm" onclick="ef91NovoCadastro()">Novo cadastro</button><button type="button" class="btn btn-secondary btn-sm" onclick="ef90JumpToday()">Hoje</button></div></div>'
+'<div class="ef90-simple-stats efw-agenda-summary" role="group" aria-label="Resumo da agenda"><span class="efw-agenda-stat"><strong>'+agendaS.today+'</strong> compromisso(s) hoje</span><span class="efw-agenda-stat"><strong>'+agendaS.week+'</strong> na semana</span><span class="efw-agenda-stat"><strong>'+atr+'</strong> retorno(s) atrasado(s)</span></div>'
+'<div class="efw-agenda-presenca" title="Atendimentos concluídos / (concluídos + faltas). Cancelamentos e pendências não entram na taxa.">Presença no mês: <strong>'+(presenca.rate===null?'—':presenca.rate+'%')+'</strong></div>'
+'<section id="ef91-prereg-list" class="ef91-prereg-list" aria-label="Pré-cadastros salvos" hidden></section>'
+'<div class="ef90-main-grid ef90-simple-grid ef-home-sortable" id="ef90-sortable">'
+'<section class="ef55-card ef90-card" data-ef-home-card="agenda"><div class="ef90-section-head"><div><h3>Agenda rápida</h3><p>Agende avaliações, reavaliações e atendimentos semanais sem sair do Início.</p></div><div class="ef90-agenda-toolbar"><button type="button" class="ef90-inline-btn" onclick="ef90ExportAgenda()">Backup da agenda</button><button type="button" class="ef90-inline-btn" onclick="ef90ExportAttendance()">Exportar presença CSV</button></div></div><form class="ef90-form" onsubmit="return ef90SaveAgenda(event)"><input id="ef90-date" type="date" value="'+esc(selISO)+'"><input id="ef90-time" type="time" value="09:00"><select id="ef90-duration" title="Duração do atendimento"><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60" selected>1 hora</option><option value="90">1h30</option><option value="120">2 horas</option></select><select id="ef90-type"><option value="avaliacao">Avaliação</option><option value="reavaliacao">Reavaliação</option><option value="retorno">Retorno</option><option value="followup">Acompanhamento</option></select><input id="ef90-student" type="text" list="ef90-student-list" placeholder="Nome do aluno ou compromisso"><datalist id="ef90-student-list">'+al.map(function(x){return '<option value="'+esc(x.nome)+'"></option>'}).join('')+'</datalist><label class="ef90-location-field" for="ef90-location"><span>Local do atendimento</span><input id="ef90-location" type="text" list="ef90-location-list" autocomplete="off" placeholder="Ex.: Academia Centro ou Studio A" maxlength="100"><datalist id="ef90-location-list">'+locais.map(function(nome){return '<option value="'+esc(nome)+'"></option>'}).join('')+'</datalist></label><input id="ef90-note" type="text" placeholder="Observação rápida"><label class="ef90-repeat-field" for="ef90-repeat-weeks">Repetir semanalmente<select id="ef90-repeat-weeks" aria-label="Quantidade de atendimentos semanais"><option value="1">Não repetir</option><option value="2">2 semanas</option><option value="4">4 semanas</option><option value="8">8 semanas</option><option value="12">12 semanas</option></select></label><button id="ef90-save-button" class="btn btn-primary btn-sm" type="submit">Adicionar</button><button type="button" class="ef90-inline-btn ef90-cancel-edit" onclick="ef90CancelEdit()">Cancelar edição</button></form></section>'
+'<section class="ef55-card ef90-card" data-ef-home-card="calendario"><div class="ef90-section-head"><div><h3>Calendário e agenda integrados</h3><p>Mês em visão geral com compromissos salvos manualmente e retornos vindos das avaliações.</p></div><div class="ef90-calendar-nav"><button type="button" class="btn btn-secondary btn-sm" onclick="ef90ShiftMonth(-1)">◀</button><strong>'+esc(monthLabel(monthDate))+'</strong><button type="button" class="btn btn-secondary btn-sm" onclick="ef90ShiftMonth(1)">▶</button></div></div>'+calendarGrid(eventosDoLocal,monthDate,selISO)+'<div class="ef90-day-panel"><div class="ef90-day-head"><h4>'+esc(dayHuman)+'</h4><div class="ef90-filter-wrap"><label for="ef90-filter-local">Local</label><select id="ef90-filter-local" onchange="ef90FiltrarLocal(this.value)" aria-label="Filtrar agenda por local de atendimento"><option value="__todos__"'+(localFiltro==='__todos__'?' selected':'')+'>Todos os locais</option><option value="__sem__"'+(localFiltro==='__sem__'?' selected':'')+'>Sem local informado</option>'+locais.map(function(nome){return '<option value="'+esc(nome)+'"'+(localFiltro===nome?' selected':'')+'>'+esc(nome)+'</option>'}).join('')+'</select><label for="ef90-filter">Ver</label><select id="ef90-filter" onchange="ef90Filter(this.value)"><option value="dia"'+(mode==='dia'?' selected':'')+'>Dia</option><option value="semana"'+(mode==='semana'?' selected':'')+'>Semana</option><option value="mes"'+(mode==='mes'?' selected':'')+'>Mês</option></select><button type="button" class="ef90-inline-btn" onclick="ef90QuickSchedule(\''+selISO+'\')">Agendar neste dia</button><span>'+dayList.length+' compromisso(s)</span></div></div>'+rows(dayList,function(e){var typeLabel={avaliacao:'Avaliação',reavaliacao:'Reavaliação',retorno:'Retorno',followup:'Acompanhamento'}[e.type]||'Compromisso';var action=e.source==='return'?'<button class="ef55-wa" onclick="ef90OpenWhatsapp(\''+jsEsc(e.student||'')+'\',\''+jsEsc(e.whatsapp||'')+'\',\''+jsEsc(e.date)+'\')">WhatsApp</button>':'<div class="ef90-row-actions"><button type="button" class="ef90-inline-btn" onclick="ef90EditAgenda(\''+jsEsc(e.id)+'\')">Reagendar</button><button type="button" class="ef90-inline-btn" onclick="ef90DuplicateAgenda(\''+jsEsc(e.id)+'\')">Duplicar</button><select class="ef90-status-select" aria-label="Situação do atendimento" onchange="ef90SetStatus(\''+jsEsc(e.id)+'\',this.value)">'+[['agendado','Agendado'],['confirmado','Confirmado'],['concluido','Concluído'],['faltou','Não compareceu'],['cancelado','Cancelado']].map(function(pair){return '<option value="'+pair[0]+'"'+((e.status||'agendado')===pair[0]?' selected':'')+'>'+pair[1]+'</option>'}).join('')+'</select><button type="button" class="ef90-inline-btn danger" onclick="ef90RemoveAgenda(\''+jsEsc(e.id)+'\')">Excluir</button></div>';return '<div class="ef90-day-item"><div class="ef90-day-time">'+esc(e.time||'—')+(e.source==='agenda'?' · '+esc(String(e.duration||60))+' min':'')+'</div><div class="ef90-day-body"><div><b>'+esc(e.student||typeLabel)+'</b>'+pill(e.source==='return'?'warn':'ok',typeLabel)+'</div><p>'+esc(e.note||'Sem observações.')+'</p><small>'+(e.local?'<span class="ef90-place-label">📍 '+esc(e.local)+'</span> · ':'')+(e.source==='return'?'Gerado automaticamente a partir da próxima avaliação':(({agendado:'Agendado',confirmado:'Presença confirmada',concluido:'Atendimento concluído',faltou:'Não compareceu',cancelado:'Cancelado'})[e.status]||'Agendado'))+'</small></div>'+action+'</div>'},'Nenhum compromisso neste dia.')+'</div></section>'
+'<section class="ef55-card ef90-card" data-ef-home-card="tarefas"><div class="ef90-section-head"><div><h3>Tarefas do dia</h3><p>Lista de tarefas para documentos, contatos e acompanhamentos.</p></div>'+pill('soft','lista de tarefas')+'</div><form class="ef90-task-form" onsubmit="event.preventDefault();ef90NewTask()"><input id="ef90-task-input" placeholder="Ex.: Confirmar avaliação de amanhã"><button type="submit" class="btn btn-primary btn-sm">Adicionar</button></form>'+rows(getTasks().filter(function(x){return x.date===selISO}),function(x){return '<div class="ef90-task-item"><input type="checkbox" '+(x.done?'checked ':'')+'onchange="ef90TaskDone(\''+jsEsc(x.id)+'\')"><span class="'+(x.done?'done':'')+'">'+esc(x.name)+'</span><button class="ef90-inline-btn danger" type="button" onclick="ef90TaskDelete(\''+jsEsc(x.id)+'\')">Excluir</button></div>'},'Nenhuma tarefa anotada para esta data.')+'</section>'
+'<section class="ef55-card ef90-card" data-ef-home-card="retornos"><div class="ef90-section-head"><div><h3>Reavaliações próximas</h3><p>Datas informadas nas avaliações têm prioridade. Quando não houver data, é possível estimar um intervalo sem modificar o cadastro.</p></div><label class="ef90-recheck-pref">Prazo padrão <select id="ef90-recheck-months" aria-label="Intervalo estimado de reavaliação" onchange="ef90SetRecheckInterval(this.value)">'+[[0,'Somente datas informadas'],[1,'1 mês'],[2,'2 meses'],[3,'3 meses'],[4,'4 meses'],[6,'6 meses'],[9,'9 meses'],[12,'12 meses']].map(function(v){return '<option value="'+v[0]+'"'+(recheckInterval()===v[0]?' selected':'')+'>'+v[1]+'</option>'}).join('')+'</select></label></div>'+rows(ret,function(r){var a=r.x.last,c=r.dias<0?'bad':r.dias<=3?'warn':'ok',tx=r.dias<0?'Atrasado '+(-r.dias)+'d':r.dias===0?'Hoje':'em '+r.dias+'d';return '<div class="ef55-row" onclick="ef55Abrir(\''+jsEsc(a.id)+'\')"><div class="ef55-av">'+esc(ini(a.nome))+'</div><div class="t"><b>'+esc(a.nome)+'</b><span>'+fd(r.data)+(r.estimada?' · data estimada':'')+'</span></div><span class="ef55-pill '+c+'">'+tx+'</span><button class="ef55-wa" onclick="ef55Zap(event,\''+jsEsc(a.id)+'\')">WhatsApp</button></div>'},'Nenhuma reavaliação próxima.')+'</section>'
+'</div>'
+'</section>';
var homeGrid=$('#ef90-sortable');
retainedHomeAnalysis.forEach(function(card){if(homeGrid)homeGrid.appendChild(card)});
applyHomeCardLayout();if(typeof window.ef91RefreshPreCadastros==='function')window.ef91RefreshPreCadastros()}

var nav=$('.nav-tabs');
if(nav){nav.insertAdjacentHTML('afterbegin','<button class="nav-tab-btn" id="tab-btn-painel" onclick="switchTab(\'tab-painel\')"><span>📊</span> <span>Painel</span></button>')}
var first=$('#tab-novo-checkin');
if(first)first.insertAdjacentHTML('beforebegin','<section id="tab-painel" class="tab-panel"><div id="ef55-painel"></div></section>');
var _sw=window.switchTab;
window.switchTab=function(id){_sw(id);if(id==='tab-painel'){document.querySelectorAll('.nav-tab-btn').forEach(function(b){b.classList.remove('active')});$('#tab-btn-painel').classList.add('active');render()}};

var pal=document.createElement('div');pal.id='ef55-pal';pal.className='no-print';
pal.innerHTML='<div class="box"><input id="ef55-q" placeholder="Buscar aluno ou ação…" autocomplete="off"><ul id="ef55-l"></ul><div class="foot">↑↓ navegar · Enter abrir · Esc fechar</div></div>';document.body.appendChild(pal);
var acoes=[['✨ Rever Abertura','Alt+0',function(){reabrirAbertura()}],['📊 Painel','Alt+1',function(){window.switchTab('tab-painel')}],['📝 Nova Avaliação','Alt+2',function(){window.switchTab('tab-novo-checkin')}],['📋 Histórico de Avaliações','Alt+3',function(){window.switchTab('tab-historico')}],['⚖️ Comparar Evolução','Alt+4',function(){window.switchTab('tab-comparison')}],
['🗓️ Ir para hoje','',function(){window.switchTab('tab-painel');window.ef90JumpToday()}],['⬇️ Fazer Backup (JSON)','',function(){if(window.abrirModalCentralBackup)window.abrirModalCentralBackup('exportar');else window.exportarBackupJSON()}],['⬆️ Importar Backup','',function(){if(window.abrirModalCentralBackup)window.abrirModalCentralBackup('importar');else{var i=$('#import-file-input');if(i)i.click()}}],['🛡️ Central de Backup','',function(){if(window.abrirModalCentralBackup)window.abrirModalCentralBackup('exportar');else window.exportarBackupJSON()}],['🔐 Segurança / Chave Mestra','',function(){abrirConfiguracaoCriptografia()}],['👨‍⚕️ Dados do Profissional / CREF','',function(){if(window.abrirModalConfigProfissional)window.abrirModalConfigProfissional()}]];
var itens=[],sel=0;
function lerPal(){var q=norm($('#ef55-q').value);
itens=acoes.filter(function(a){return!q||norm(a[0]).indexOf(q)>-1}).map(function(a){return{t:a[0],k:a[1],f:a[2]}});
if(q)alunos().filter(function(x){return norm(x.nome).indexOf(q)>-1}).slice(0,8).forEach(function(x){itens.push({t:'👤 '+x.nome,k:x.list.length+' aval.',f:function(){abrir(x.last.id)}})});
sel=0;pintar()}
function pintar(){$('#ef55-l').innerHTML=itens.length?itens.map(function(i,n){return'<li data-n="'+n+'" class="'+(n===sel?'sel':'')+'">'+esc(i.t)+'<small>'+esc(i.k)+'</small></li>'}).join(''):'<li>Nenhum resultado</li>'}
function abrirPal(){pal.classList.add('open');$('#ef55-q').value='';lerPal();$('#ef55-q').focus()}
function fecharPal(){pal.classList.remove('open')}
function exec(n){var i=itens[n];if(!i)return;fecharPal();i.f()}
$('#ef55-q').addEventListener('input',lerPal);
$('#ef55-l').addEventListener('click',function(e){var li=e.target.closest('li[data-n]');if(li)exec(+li.dataset.n)});
pal.addEventListener('mousedown',function(e){if(e.target===pal)fecharPal()});
document.addEventListener('keydown',function(e){
if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();pal.classList.contains('open')?fecharPal():abrirPal();return}
if(pal.classList.contains('open')){if(e.key==='Escape')fecharPal();else if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(itens.length-1,sel+1);pintar()}else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(0,sel-1);pintar()}else if(e.key==='Enter'){e.preventDefault();exec(sel)}return}
if(e.altKey&&!e.ctrlKey&&!e.metaKey){var m={'1':'tab-painel','2':'tab-novo-checkin','3':'tab-historico','4':'tab-comparison'}[e.key];if(m){e.preventDefault();window.switchTab(m)}}});

var _bk=window.exportarBackupJSON;
if(typeof _bk==='function'&&!_bk.__ef55Wrapped){
    var wrapped=function(){
        try{localStorage.setItem('ef55_last_backup',String(Date.now()))}catch(e){}
        return _bk.apply(this,arguments);
    };
    wrapped.__ef55Wrapped=true;
    window.exportarBackupJSON=wrapped;
}
setTimeout(function(){try{if(!lista().length)return;var t=+localStorage.getItem('ef55_last_backup')||0;
if(Date.now()-t>7*864e5)toast(window.innerWidth<=768 ? 'Faz mais de 7 dias sem backup. Acesse Ferramentas › Backup.' : 'Faz mais de 7 dias sem backup. Use Ctrl+K › Fazer Backup.','warn')}catch(e){}},2500);
})();
