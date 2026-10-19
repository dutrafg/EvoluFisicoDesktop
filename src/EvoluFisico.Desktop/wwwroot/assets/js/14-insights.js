/* 12-runtime.js */
(function(){
'use strict';
var VERSION='6.8';
var S=window.__EF63_STATE__||{};
if(!S||!S.getAvaliacoes)return;
var cache=new Map(), index=null, indexVersion=-1;
var METRICS={
  gordura:{label:'% Gordura',unit:'%',lowerBetter:true,field:'gordura'},
  massaMagra:{label:'Massa magra',unit:' kg',higherBetter:true,field:'massaMagra'},
  cintura:{label:'Cintura',unit:' cm',lowerBetter:true,field:'cintura'},
  peso:{label:'Peso',unit:' kg',field:'peso'}
};
function source(){return S.getAvaliacoes?S.getAvaliacoes():[]}
function n(v){return EFU.num(v)}
function norm(v){return EFU.norm(v)}
function dateVal(a){var t=Date.parse(a&&a.data_avaliacao||a&&a.timestamp||'');return isNaN(t)?0:t}
function fmtDate(v){var d=new Date(v);return isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR')}
function diff(a,b){return a!=null&&b!=null?+(a-b).toFixed(2):null}
function val(a){
  var d=a.dobras_resultado||{},b=a.bioimpedancia||{},p=a.perimetria||{};
  return {cliente_id:a.cliente_id||String(a.id),id:String(a.id),nome:String(a.nome||''),key:EFIdentity.key(a),date:dateVal(a),data:a.data_avaliacao||'',peso:n(a.peso),gordura:n(d.percGordura!=null?d.percGordura:b.pgordura),massaMagra:n(d.massaMagra),massaGorda:n(d.massaGorda!=null?d.massaGorda:b.gordura_kg),cintura:n(p.cintura),quadril:n(p.quadril),timestamp:a.timestamp||''};
}
function build(){
  if(index&&indexVersion===S.version)return index;
  var rs=source(),byName=new Map(),byId=new Map();
  rs.forEach(function(a){var v=val(a);byId.set(v.id,v);if(!byName.has(v.key))byName.set(v.key,[]);byName.get(v.key).push(v)});
  byName.forEach(function(list){list.sort(function(a,b){return a.date-b.date||String(a.timestamp).localeCompare(String(b.timestamp))})});
  index={byId:byId,byName:byName,records:rs.slice()};indexVersion=S.version;return index;
}
function transition(a,b){
  var out={};
  Object.keys(METRICS).forEach(function(k){out[k]=diff(b[k],a[k])});
  return out;
}
function direction(delta){return delta==null?'insuficiente':delta>0.05?'alta':delta<-0.05?'queda':'estável'}
function favorable(metric,delta){var m=METRICS[metric];if(delta==null||!m||!m.lowerBetter&&!m.higherBetter)return null;return m.lowerBetter?delta< -0.05:delta>0.05}
function consistency(list,metric){
  var ds=list.map(function(x){return x.delta&&x.delta[metric]}).filter(function(v){return v!=null&&Math.abs(v)>0.05});
  if(ds.length<2)return {ratio:null,label:'dados insuficientes',transitions:ds.length};
  var signs=ds.map(function(v){return v>0?1:-1}),pos=signs.filter(function(v){return v===1}).length,neg=signs.length-pos,ratio=Math.max(pos,neg)/signs.length;
  return {ratio:+ratio.toFixed(2),label:ratio>=0.8?'consistente':ratio>=0.6?'moderadamente consistente':'oscilante',transitions:ds.length};
}
function slope(list,metric){
  var pts=list.filter(function(x){return x[metric]!=null&&x.date});
  if(pts.length<3)return null;
  var x0=pts[0].date, xs=pts.map(function(p){return (p.date-x0)/86400000}), ys=pts.map(function(p){return p[metric]}), xm=xs.reduce(function(a,b){return a+b},0)/xs.length,ym=ys.reduce(function(a,b){return a+b},0)/ys.length;
  var den=xs.reduce(function(s,x){return s+Math.pow(x-xm,2)},0);if(!den)return null;
  var sl=xs.reduce(function(s,x,i){return s+(x-xm)*(ys[i]-ym)},0)/den;
  return {perDay:sl,per30:+(sl*30).toFixed(2),per60:+(sl*60).toFixed(2)};
}
function analyzeStudent(key){
  var list=(build().byName.get(key)||[]).slice(), transitions=[];
  for(var i=1;i<list.length;i++){var cur=list[i],prev=list[i-1],d=transition(prev,cur);transitions.push({fromId:prev.id,toId:cur.id,fromDate:prev.data,toDate:cur.data,delta:d})}
  list.forEach(function(x,i){x.delta=i?transitions[i-1].delta:null});
  var trends={},cons={};Object.keys(METRICS).forEach(function(k){trends[k]=slope(list,k);cons[k]=consistency(list,k)});
  return {key:key,name:list.length?list[list.length-1].nome:'',count:list.length,first:list[0]||null,last:list[list.length-1]||null,timeline:list,transitions:transitions,trends:trends,consistency:cons};
}
function events(a){
  var ev=[];
  if(!a||!a.count)return ev;
  if(a.count===1)ev.push({type:'baseline',severity:'info',title:'Primeira avaliação',text:'Avaliação inicial registrada; ainda não há série temporal para comparar.'});
  var t=a.transitions,last=t[t.length-1],prev=t[t.length-2];
  if(last){
    ['gordura','massaMagra','cintura'].forEach(function(k){var d=last.delta[k],m=METRICS[k];if(d==null)return;var fav=favorable(k,d);if(Math.abs(d)>=0.5){ev.push({type:fav?'improvement':'change',severity:fav?'good':'warn',title:m.label+' '+(fav?'melhorou':'mudou'),text:m.label+': '+(d>0?'+':'')+d.toFixed(1)+m.unit+' desde '+fmtDate(last.fromDate)+'.',metric:k,delta:d})}});
  }
  ['gordura','massaMagra','cintura'].forEach(function(k){var c=a.consistency[k];if(c&&c.ratio!=null&&c.ratio>=0.8&&c.transitions>=2){ev.push({type:'consistency',severity:'good',title:'Evolução consistente',text:METRICS[k].label+' apresenta direção consistente em '+Math.round(c.ratio*100)+'% das transições.'})}});
  ['gordura','massaMagra','cintura'].forEach(function(k){var c=a.consistency[k],tr=a.trends[k];if(c&&c.ratio!=null&&c.ratio<0.6&&c.transitions>=3){ev.push({type:'oscillation',severity:'warn',title:'Evolução oscilante',text:METRICS[k].label+' alternou direção entre avaliações.'})}if(tr&&Math.abs(tr.per30)<0.05&&a.count>=3){ev.push({type:'plateau',severity:'info',title:'Platô aparente',text:METRICS[k].label+' está praticamente estável na tendência recente.'})}});
  if(prev&&last){['gordura','massaMagra','cintura'].forEach(function(k){var d1=prev.delta[k],d2=last.delta[k];if(d1!=null&&d2!=null&&Math.abs(d1)>0.2&&Math.abs(d2)>0.2&&Math.sign(d1)!==Math.sign(d2)){ev.push({type:'reversal',severity:'warn',title:'Mudança de direção',text:METRICS[k].label+' mudou de direção entre as duas últimas transições.'})}})}
  var all=t.map(function(x){return x.toDate?dateVal({data_avaliacao:x.toDate}):0}).filter(Boolean),gaps=[];for(var i=1;i<all.length;i++){var days=Math.round((all[i]-all[i-1])/86400000);if(days>90)gaps.push(days)}
  if(gaps.length)ev.push({type:'gap',severity:'warn',title:'Intervalo longo entre avaliações',text:'Foi identificado pelo menos um intervalo superior a 90 dias na série.'});
  return ev;
}
function project(a,metric){
  var tr=a.trends[metric],last=a.last;if(!tr||!last||last[metric]==null)return null;
  return {metric:metric,current:last[metric],in30:+(last[metric]+tr.per30).toFixed(2),in60:+(last[metric]+tr.per60).toFixed(2),basis:'tendência linear simples das avaliações disponíveis'};
}
function all(){
  var b=build(),students=[];b.byName.forEach(function(_,key){var a=analyzeStudent(key);a.events=events(a);a.projects={};['gordura','massaMagra','cintura'].forEach(function(k){a.projects[k]=project(a,k)});students.push(a)});
  students.sort(function(a,b){return (b.last?b.last.date:0)-(a.last?a.last.date:0)});
  var flat=[];students.forEach(function(s){s.events.forEach(function(e){flat.push(Object.assign({student:s.name,key:s.key},e))})});
  return {version:VERSION,records:b.records.length,students:students.length,generatedAt:Date.now(),studentsData:students,events:flat};
}
function getAll(){var k='all|'+S.version,c=cache.get(k);if(c)return c;var r=all();cache.set(k,r);return r}
function invalidate(){cache.clear();index=null;indexVersion=-1}
function escapeHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function eventClass(e){return e.severity==='good'?'ok':e.severity==='warn'?'bad':'warn'}
function render(){
  var box=document.getElementById('ef55-painel');if(!box)return;
  var data=getAll(), old=document.getElementById('ef68-insights');if(old)old.remove();
  var actionable=data.events.filter(function(e){return e.type!=='baseline'}).slice(0,10);
  var byType={good:0,warn:0,info:0};data.events.forEach(function(e){byType[e.severity]=(byType[e.severity]||0)+1});
  var top=data.studentsData.filter(function(s){return s.events.some(function(e){return e.severity==='good'})}).slice(0,5);
  var card=document.createElement('div');card.className='ef55-card ef68-insights-card';card.id='ef68-insights';
  var rows=actionable.length?actionable.map(function(e){return '<div class="ef68-event"><div class="ef68-event-icon '+eventClass(e)+'">'+(e.severity==='good'?'↑':e.severity==='warn'?'!':'•')+'</div><div class="ef68-event-main"><div><b>'+escapeHtml(e.title)+'</b><span class="ef68-student">'+escapeHtml(e.student)+'</span></div><p>'+escapeHtml(e.text)+'</p></div><button class="ef68-open" onclick="ef68Open(decodeURIComponent(&quot;'+encodeURIComponent(e.key||'')+'&quot;))">Abrir</button></div>'}).join(''):'<div class="ef55-empty">Nenhuma mudança relevante identificada.</div>';
  var consistency=top.map(function(s){var items=['gordura','massaMagra','cintura'].map(function(k){var c=s.consistency[k];return c&&c.ratio!=null&&c.transitions>=2?METRICS[k].label+' '+Math.round(c.ratio*100)+'%':null}).filter(Boolean).slice(0,2);return items.length?'<span class="ef68-chip">'+escapeHtml(s.name)+': '+escapeHtml(items.join(' · '))+'</span>':''}).filter(Boolean).join('');
  card.innerHTML='<div class="ef68-head"><div><h3>🧠 Análises automáticas <em>'+actionable.length+'</em></h3><p class="ef68-subtitle">Mudanças, consistência, platôs e sinais de atenção calculados uma única vez pela camada de dados.</p></div><div class="ef68-summary"><span class="ok">'+byType.good+' favoráveis</span><span class="warn">'+byType.warn+' atenção</span></div></div><div class="ef68-events">'+rows+'</div>'+(consistency?'<div class="ef68-consistency"><b>Consistência da evolução</b><div>'+consistency+'</div></div>':'')+'<div class="ef68-foot">'+data.students+' alunos · '+data.records+' avaliações · motor '+VERSION+'</div>';
  var cols=box.querySelector('.ef55-cols');if(cols)cols.insertBefore(card,cols.firstChild);else box.appendChild(card);
}
window.ef68Open=function(key){var a=getAll().studentsData.find(function(x){return x.key===key});if(a&&a.last){var fn=['abrirModalDetalhes','abrirVisualizacaoPacienteWeb','verDetalhesAvaliacao'].find(function(n){return typeof window[n]==='function'});if(fn)window[fn](a.last.id);else if(window.switchTab)window.switchTab('tab-historico')}};
window.EF68={version:VERSION,stats:function(){var d=getAll();return{engine:VERSION,version:S.version,records:d.records,students:d.students,events:d.events.length,cacheEntries:cache.size}},all:getAll,student:function(name){var k=EFIdentity.key(name),d=getAll();return d.studentsData.find(function(x){return x.key===k})||null},events:function(name){var s=this.student(name);return s?s.events:[]},projections:function(name){var s=this.student(name);return s?s.projects:{}},invalidate:invalidate,render:render};
var oldTouch=S.touch;S.touch=function(){if(typeof oldTouch==='function')oldTouch.apply(S,arguments);invalidate();setTimeout(function(){if(document.getElementById('tab-painel')&&document.getElementById('tab-painel').classList.contains('active'))render()},0)};
var oldSwitch=window.switchTab;if(typeof oldSwitch==='function'&&!oldSwitch.__ef68){var sw=function(id){var r=oldSwitch.apply(this,arguments);if(id==='tab-painel')setTimeout(render,0);return r};sw.__ef68=true;window.switchTab=sw}
window.addEventListener('DOMContentLoaded',function(){setTimeout(function(){getAll();if(document.getElementById('tab-painel')&&document.getElementById('tab-painel').classList.contains('active'))render()},0)});
})();
