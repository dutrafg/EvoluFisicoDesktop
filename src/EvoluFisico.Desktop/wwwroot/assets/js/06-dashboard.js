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
var msg='Olá, '+String(a.nome).split(' ')[0]+'! Sua reavaliação física está prevista para '+fd(pd(a.data_proxima_avaliacao))+'. Vamos agendar o melhor horário?';
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
function agendaStats(agenda, base){var s0=startOfWeek(base), s7=addDays(s0,7), t1=addDays(base,1);var todayCount=agenda.filter(function(a){return a.date===toISO(base)}).length;var weekCount=agenda.filter(function(a){var d=pd(a.date);return d&&d>=s0&&d<s7}).length;var pend=agenda.filter(function(a){return a.status!=='concluido'&&pd(a.date)&&pd(a.date)<t1}).length;return {today:todayCount,week:weekCount,pending:pend}}
function buildReturnEvents(alunosList, base){return alunosList.map(function(x){var d=pd(x.last.data_proxima_avaliacao);return d?{id:'ret-'+x.last.id,date:toISO(d),time:'',type:'reavaliacao',student:x.nome,status:(d<base?'atrasado':sameDay(d,base)?'hoje':'agendado'),note:'Retorno automático pela próxima avaliação',source:'return',refId:x.last.id,whatsapp:x.last.whatsapp||''}:null}).filter(Boolean)}
function buildAttention(alunosList, agenda, base){var next30=addDays(base,30);var items=[];
var overdue=alunosList.map(function(x){var d=pd(x.last.data_proxima_avaliacao);return d?{student:x.nome,date:d,refId:x.last.id}:null}).filter(Boolean).filter(function(x){return x.date<base}).sort(function(a,b){return a.date-b.date}).slice(0,4);
overdue.forEach(function(x){var days=Math.round((base-x.date)/864e5);items.push({kind:'warn',title:'Reavaliação em atraso',text:x.student+' está com retorno atrasado há '+days+' dia(s).',refId:x.refId})});
var noNext=alunosList.filter(function(x){return !x.last.data_proxima_avaliacao}).slice(0,3);noNext.forEach(function(x){items.push({kind:'neutral',title:'Definir próximo retorno',text:x.nome+' ainda não tem uma nova data de avaliação definida.',refId:x.last.id})});
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

window.ef90SaveAgenda=function(ev){if(ev&&ev.preventDefault)ev.preventDefault();var date=$('#ef90-date'),time=$('#ef90-time'),type=$('#ef90-type'),student=$('#ef90-student'),note=$('#ef90-note'),durationEl=$('#ef90-duration'),localEl=$('#ef90-location');
if(!date||!date.value){toast('Escolha a data do compromisso.','warn');return false}
var nome=(student&&student.value||'').trim(),horario=(time&&time.value)||'09:00';
if(!nome){toast('Informe o nome do aluno ou do compromisso.','warn');return false}
var duracao=Number(durationEl&&durationEl.value)||60;var items=loadAgenda();if(conflitante(items,date.value,horario,duracao,editingAgendaId)){toast('O horário escolhido se sobrepõe a outro atendimento. Selecione outro intervalo.','warn');return false}
var correspondente=alunoCorrespondente(nome);
var item={id:editingAgendaId||'ag-'+Date.now(),date:date.value,time:horario,duration:duracao,type:(type&&type.value)||'avaliacao',student:nome,local:localNormalizado(localEl&&localEl.value),refId:correspondente?correspondente.last.id:null,note:(note&&note.value||'').trim(),status:editingAgendaId?(items.find(function(x){return x.id===editingAgendaId})||{}).status||'agendado':'agendado',source:'agenda'};
if(editingAgendaId)items=items.filter(function(x){return x.id!==editingAgendaId});items.push(item);items.sort(function(a,b){return (a.date+' '+a.time).localeCompare(b.date+' '+b.time)});saveAgenda(items);toast(editingAgendaId?'Compromisso reagendado.':'Compromisso adicionado à agenda.');editingAgendaId=null;setSelectedDay(item.date);render();return false};

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

function render(){var box=$('#ef55-painel');if(!box)return;
var al=alunos(),av=lista(),base=today(),agenda=loadAgenda(),retornos=buildReturnEvents(al,base),allEvents=agenda.concat(retornos);
var mes=av.filter(function(a){var d=pd(a.data_avaliacao);return d&&d.getMonth()===base.getMonth()&&d.getFullYear()===base.getFullYear()}).length;
var gs=al.map(function(x){return pg(x.last)}).filter(function(v){return v!=null});
var media=gs.length?(gs.reduce(function(s,v){return s+v},0)/gs.length).toFixed(1)+'%':'--';
var ret=al.map(function(x){var d=pd(x.last.data_proxima_avaliacao);return d?{x:x,dias:Math.round((d-base)/864e5)}:null}).filter(function(r){return r&&r.dias<=14}).sort(function(a,b){return a.dias-b.dias});
var atr=ret.filter(function(r){return r.dias<0}).length;
var agendaS=agendaStats(agenda,base);
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
+'<div class="ef90-simple-head"><div><h1>Agenda</h1><p>Organize suas avaliações, atendimentos e tarefas em um só lugar.</p></div><div class="ef90-hero-actions"><button type="button" class="btn btn-primary btn-sm" onclick="switchTab(\'tab-novo-checkin\')">Nova avaliação</button><button type="button" class="btn btn-secondary btn-sm" onclick="ef90JumpToday()">Hoje</button></div></div>'
+'<div class="ef90-simple-stats"><span><strong>'+agendaS.today+'</strong> compromisso(s) hoje</span><span><strong>'+agendaS.week+'</strong> na semana</span><span><strong>'+atr+'</strong> retorno(s) atrasado(s)</span></div>'
+'<div class="ef90-main-grid ef90-simple-grid">'
+'<div class="ef90-left-stack">'
+'<section class="ef55-card ef90-card"><div class="ef90-section-head"><div><h3>Agenda rápida</h3><p>Agende avaliações, reavaliações, retornos e acompanhamentos sem sair da página inicial.</p></div>'+'<button type="button" class="ef90-inline-btn" onclick="ef90ExportAgenda()">Exportar agenda e tarefas</button>'+'</div><form class="ef90-form" onsubmit="return ef90SaveAgenda(event)"><input id="ef90-date" type="date" value="'+esc(selISO)+'"><input id="ef90-time" type="time" value="09:00"><select id="ef90-duration" title="Duração do atendimento"><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60" selected>1 hora</option><option value="90">1h30</option><option value="120">2 horas</option></select><select id="ef90-type"><option value="avaliacao">Avaliação</option><option value="reavaliacao">Reavaliação</option><option value="retorno">Retorno</option><option value="followup">Acompanhamento</option></select><input id="ef90-student" type="text" list="ef90-student-list" placeholder="Nome do aluno ou compromisso"><datalist id="ef90-student-list">'+al.map(function(x){return '<option value="'+esc(x.nome)+'"></option>'}).join('')+'</datalist><label class="ef90-location-field" for="ef90-location"><span>Local do atendimento</span><input id="ef90-location" type="text" list="ef90-location-list" autocomplete="off" placeholder="Ex.: Academia Centro ou Studio A" maxlength="100"><datalist id="ef90-location-list">'+locais.map(function(nome){return '<option value="'+esc(nome)+'"></option>'}).join('')+'</datalist></label><input id="ef90-note" type="text" placeholder="Observação rápida"><button id="ef90-save-button" class="btn btn-primary btn-sm" type="submit">Adicionar</button><button type="button" class="ef90-inline-btn" onclick="ef90CancelEdit()">Cancelar edição</button></form></section>'
+'<section class="ef55-card ef90-card"><div class="ef90-section-head"><div><h3>Calendário e agenda integrados</h3><p>Mês em visão geral com compromissos salvos manualmente e retornos vindos das avaliações.</p></div><div class="ef90-calendar-nav"><button type="button" class="btn btn-secondary btn-sm" onclick="ef90ShiftMonth(-1)">◀</button><strong>'+esc(monthLabel(monthDate))+'</strong><button type="button" class="btn btn-secondary btn-sm" onclick="ef90ShiftMonth(1)">▶</button></div></div>'+calendarGrid(eventosDoLocal,monthDate,selISO)+'<div class="ef90-day-panel"><div class="ef90-day-head"><h4>'+esc(dayHuman)+'</h4><div class="ef90-filter-wrap"><label for="ef90-filter-local">Local</label><select id="ef90-filter-local" onchange="ef90FiltrarLocal(this.value)" aria-label="Filtrar agenda por local de atendimento"><option value="__todos__"'+(localFiltro==='__todos__'?' selected':'')+'>Todos os locais</option><option value="__sem__"'+(localFiltro==='__sem__'?' selected':'')+'>Sem local informado</option>'+locais.map(function(nome){return '<option value="'+esc(nome)+'"'+(localFiltro===nome?' selected':'')+'>'+esc(nome)+'</option>'}).join('')+'</select><label for="ef90-filter">Ver</label><select id="ef90-filter" onchange="ef90Filter(this.value)"><option value="dia"'+(mode==='dia'?' selected':'')+'>Dia</option><option value="semana"'+(mode==='semana'?' selected':'')+'>Semana</option><option value="mes"'+(mode==='mes'?' selected':'')+'>Mês</option></select><button type="button" class="ef90-inline-btn" onclick="ef90QuickSchedule(\''+selISO+'\')">Agendar neste dia</button><span>'+dayList.length+' compromisso(s)</span></div></div>'+rows(dayList,function(e){var typeLabel={avaliacao:'Avaliação',reavaliacao:'Reavaliação',retorno:'Retorno',followup:'Acompanhamento'}[e.type]||'Compromisso';var action=e.source==='return'?'<button class="ef55-wa" onclick="ef90OpenWhatsapp(\''+jsEsc(e.student||'')+'\',\''+jsEsc(e.whatsapp||'')+'\',\''+jsEsc(e.date)+'\')">WhatsApp</button>':'<div class="ef90-row-actions"><button type="button" class="ef90-inline-btn" onclick="ef90EditAgenda(\''+jsEsc(e.id)+'\')">Reagendar</button><select class="ef90-status-select" aria-label="Situação do atendimento" onchange="ef90SetStatus(\''+jsEsc(e.id)+'\',this.value)">'+[['agendado','Agendado'],['confirmado','Confirmado'],['concluido','Concluído'],['faltou','Não compareceu'],['cancelado','Cancelado']].map(function(pair){return '<option value="'+pair[0]+'"'+((e.status||'agendado')===pair[0]?' selected':'')+'>'+pair[1]+'</option>'}).join('')+'</select><button type="button" class="ef90-inline-btn danger" onclick="ef90RemoveAgenda(\''+jsEsc(e.id)+'\')">Excluir</button></div>';return '<div class="ef90-day-item"><div class="ef90-day-time">'+esc(e.time||'—')+(e.source==='agenda'?' · '+esc(String(e.duration||60))+' min':'')+'</div><div class="ef90-day-body"><div><b>'+esc(e.student||typeLabel)+'</b>'+pill(e.source==='return'?'warn':'ok',typeLabel)+'</div><p>'+esc(e.note||'Sem observações.')+'</p><small>'+(e.local?'<span class="ef90-place-label">📍 '+esc(e.local)+'</span> · ':'')+(e.source==='return'?'Gerado automaticamente a partir da próxima avaliação':(({agendado:'Agendado',confirmado:'Presença confirmada',concluido:'Atendimento concluído',faltou:'Não compareceu',cancelado:'Cancelado'})[e.status]||'Agendado'))+'</small></div>'+action+'</div>'},'Nenhum compromisso neste dia.')+'</div></section>'
+'</div>'
+'<div class="ef90-right-stack">'
+'<section class="ef55-card ef90-card"><div class="ef90-section-head"><div><h3>Tarefas do dia</h3><p>Lista de tarefas para documentos, contatos e acompanhamentos.</p></div>'+pill('soft','lista de tarefas')+'</div><form class="ef90-task-form" onsubmit="event.preventDefault();ef90NewTask()"><input id="ef90-task-input" placeholder="Ex.: Confirmar avaliação de amanhã"><button type="submit" class="btn btn-primary btn-sm">Adicionar</button></form>'+rows(getTasks().filter(function(x){return x.date===selISO}),function(x){return '<div class="ef90-task-item"><input type="checkbox" '+(x.done?'checked ':'')+'onchange="ef90TaskDone(\''+jsEsc(x.id)+'\')"><span class="'+(x.done?'done':'')+'">'+esc(x.name)+'</span><button class="ef90-inline-btn danger" type="button" onclick="ef90TaskDelete(\''+jsEsc(x.id)+'\')">Excluir</button></div>'},'Nenhuma tarefa anotada para esta data.')+'</section>'
+'<section class="ef55-card ef90-card"><div class="ef90-section-head"><div><h3>Reavaliações próximas</h3><p>Retornos automáticos vindos do cadastro das avaliações.</p></div></div>'+rows(ret,function(r){var a=r.x.last,c=r.dias<0?'bad':r.dias<=3?'warn':'ok',tx=r.dias<0?'Atrasado '+(-r.dias)+'d':r.dias===0?'Hoje':'em '+r.dias+'d';return '<div class="ef55-row" onclick="ef55Abrir(\''+jsEsc(a.id)+'\')"><div class="ef55-av">'+esc(ini(a.nome))+'</div><div class="t"><b>'+esc(a.nome)+'</b><span>'+fd(pd(a.data_proxima_avaliacao))+'</span></div><span class="ef55-pill '+c+'">'+tx+'</span><button class="ef55-wa" onclick="ef55Zap(event,\''+jsEsc(a.id)+'\')">WhatsApp</button></div>'},'Nenhuma reavaliação próxima.')+'</section>'
+'</div>'
+'</div>'
+'</section>'}

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
