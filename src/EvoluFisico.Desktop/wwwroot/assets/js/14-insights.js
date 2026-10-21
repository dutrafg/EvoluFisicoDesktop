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
function measure(v,lo,hi){var x=n(v);return x!=null&&x>=lo&&x<=hi?x:null}
function norm(v){return EFU.norm(v)}
function dateVal(a){var v=String(a&&a.data_avaliacao||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return 0;var t=Date.parse(v+'T12:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===v?t:0}
function fmtDate(v){var d=new Date(v);return isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR')}
function diff(a,b){return a!=null&&b!=null?+(a-b).toFixed(2):null}
function pickFat(d,b){var p=measure(d.percGordura,3,65),q=measure(b.pgordura,3,65);return {value:p??q,method:p!=null?'Pollock':q!=null?'BIA':null}}
function val(a){
  var d=a.dobras_resultado||{},b=a.bioimpedancia||{},p=a.perimetria||{};
  var fat=pickFat(d,b),w=measure(a.peso,20,350),lean=measure(d.massaMagra,10,250);if(lean!=null&&w!=null&&lean>w)lean=null;
  return {cliente_id:a.cliente_id||String(a.id),id:String(a.id),nome:String(a.nome||''),key:EFIdentity.key(a),date:dateVal(a),data:a.data_avaliacao||'',peso:w,gordura:fat.value,method:fat.method,massaMagra:lean,massaGorda:measure(d.massaGorda,0,250)??measure(b.gordura_kg,0,250),cintura:measure(p.cintura,40,200),quadril:measure(p.quadril,40,200),timestamp:a.timestamp||''};
}
function build(){
  if(index&&indexVersion===S.version)return index;
  var rs=source(),byName=new Map(),byId=new Map();
  rs.forEach(function(a){var v=val(a);byId.set(v.id,v);if(!byName.has(v.key))byName.set(v.key,[]);byName.get(v.key).push(v)});
  byName.forEach(function(list){list.sort(function(a,b){return a.date-b.date||String(a.timestamp).localeCompare(String(b.timestamp))})});
  index={byId:byId,byName:byName,records:rs.slice()};indexVersion=S.version;return index;
}
function transition(a,b){
  var out={};if(!a.date||!b.date||b.date-a.date<7*86400000){Object.keys(METRICS).forEach(function(k){out[k]=null});return out;}
  Object.keys(METRICS).forEach(function(k){out[k]=k==='gordura'&&(!a.method||a.method!==b.method)?null:diff(b[k],a[k])});
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
  var seen=new Set(),pts=list.slice().reverse().filter(function(x){if(x[metric]==null||!x.date||seen.has(x.date))return false;seen.add(x.date);return true}).reverse();
  if(metric==='gordura'&&new Set(pts.map(x=>x.method)).size>1)return null;
  if(pts.length>=2&&pts.at(-1).date-pts[0].date<21*86400000)return null;
  if(pts.length<3)return null;
  var x0=pts[0].date, xs=pts.map(function(p){return (p.date-x0)/86400000}), ys=pts.map(function(p){return p[metric]}), xm=xs.reduce(function(a,b){return a+b},0)/xs.length,ym=ys.reduce(function(a,b){return a+b},0)/ys.length;
  var den=xs.reduce(function(s,x){return s+Math.pow(x-xm,2)},0);if(!den)return null;
  var sl=xs.reduce(function(s,x,i){return s+(x-xm)*(ys[i]-ym)},0)/den;
  return {perDay:sl,per30:+(sl*30).toFixed(2),per60:+(sl*60).toFixed(2)};
}
function analyzeStudent(key,chosenRecords){
  var list=(chosenRecords?chosenRecords.filter(function(r){return EFIdentity.key(r)===key}).map(val):(build().byName.get(key)||[])).slice(),unique=new Map(),transitions=[];
  list.forEach(function(r){if(r.date)unique.set(r.date,r)});
  var chronological=[...unique.values()].sort(function(a,b){return a.date-b.date});
  for(var i=1;i<chronological.length;i++){var cur=chronological[i],prev=chronological[i-1],d=transition(prev,cur);transitions.push({fromId:prev.id,toId:cur.id,fromDate:prev.data,toDate:cur.data,delta:d})}
  var trends={},cons={};Object.keys(METRICS).forEach(function(k){trends[k]=slope(chronological,k);cons[k]=consistency(transitions.map(x=>({delta:x.delta})),k)});
  return {key:key,name:list.length?list[list.length-1].nome:'',count:list.length,first:chronological[0]||null,last:chronological.at(-1)||null,timeline:list,validTimeline:chronological,transitions:transitions,trends:trends,consistency:cons};
}
function events(a){
  var ev=[];var valid=(a.validTimeline||[]).map(function(x){return x.date});var timeOK=valid.length>=4&&valid.at(-1)-valid[0]>=60*86400000;
  if(!a||!a.count)return ev;
  if(a.count===1)ev.push({type:'baseline',severity:'info',title:'Primeira avaliação',text:'Avaliação inicial registrada; ainda não há série temporal para comparar.'});
  var t=a.transitions,last=t[t.length-1],prev=t[t.length-2];
  if(last){
    ['gordura','massaMagra','cintura'].forEach(function(k){var d=last.delta[k],m=METRICS[k];if(d==null)return;var fav=favorable(k,d);if(Math.abs(d)>=0.5){ev.push({type:fav?'improvement':'change',severity:fav?'good':'warn',title:m.label+' '+(fav?'melhorou':'mudou'),text:m.label+': '+(d>0?'+':'')+d.toFixed(1)+m.unit+' desde '+fmtDate(last.fromDate)+'.',metric:k,delta:d})}});
  }
  ['gordura','massaMagra','cintura'].forEach(function(k){var c=a.consistency[k];if(timeOK&&c&&c.ratio!=null&&c.ratio>=0.8&&c.transitions>=2){ev.push({type:'consistency',severity:'good',title:'Evolução consistente',text:METRICS[k].label+' apresenta direção consistente em '+Math.round(c.ratio*100)+'% das transições.'})}});
  ['gordura','massaMagra','cintura'].forEach(function(k){var c=a.consistency[k],tr=a.trends[k];if(timeOK&&c&&c.ratio!=null&&c.ratio<0.6&&c.transitions>=3){ev.push({type:'oscillation',severity:'warn',title:'Evolução oscilante',text:METRICS[k].label+' alternou direção entre avaliações.'})}if(timeOK&&tr&&Math.abs(tr.per30)<0.05&&a.count>=4){ev.push({type:'plateau',severity:'info',title:'Platô aparente',text:METRICS[k].label+' está praticamente estável na tendência recente.'})}});
  if(prev&&last){['gordura','massaMagra','cintura'].forEach(function(k){var d1=prev.delta[k],d2=last.delta[k];if(d1!=null&&d2!=null&&Math.abs(d1)>0.2&&Math.abs(d2)>0.2&&Math.sign(d1)!==Math.sign(d2)){ev.push({type:'reversal',severity:'warn',title:'Mudança de direção',text:METRICS[k].label+' mudou de direção entre as duas últimas transições.'})}})}
  var all=(a.validTimeline||[]).map(function(x){return x.date}),gaps=[];for(var i=1;i<all.length;i++){var days=Math.round((all[i]-all[i-1])/86400000);if(days>90)gaps.push(days)}
  if(gaps.length)ev.push({type:'gap',severity:'warn',title:'Intervalo longo entre avaliações',text:'Foi identificado pelo menos um intervalo superior a 90 dias na série.'});
  return ev;
}
function project(a,metric){return null;/* Projeções futuras individuais desativadas por falta de validação. */}
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
function render(){ /* Saída visual reunida no painel Análises automáticas; motor EF68 preservado. */ }
window.EF68={version:VERSION,analyzeRecords:function(key,records){if(!Array.isArray(records))return null;var a=analyzeStudent(key,records);a.events=events(a);a.projects={};return a},stats:function(){var d=getAll();return{engine:VERSION,version:S.version,records:d.records,students:d.students,events:d.events.length,cacheEntries:cache.size}},all:getAll,student:function(name){var k=EFIdentity.key(name),d=getAll();return d.studentsData.find(function(x){return x.key===k})||null},events:function(name){var s=this.student(name);return s?s.events:[]},projections:function(name){var s=this.student(name);return s?s.projects:{}},invalidate:invalidate,render:render};
var oldTouch=S.touch;S.touch=function(){if(typeof oldTouch==='function')oldTouch.apply(S,arguments);invalidate();setTimeout(function(){if(document.getElementById('tab-painel')&&document.getElementById('tab-painel').classList.contains('active'))render()},0)};
var oldSwitch=window.switchTab;if(typeof oldSwitch==='function'&&!oldSwitch.__ef68){var sw=function(id){var r=oldSwitch.apply(this,arguments);if(id==='tab-painel')setTimeout(render,0);return r};sw.__ef68=true;window.switchTab=sw}
window.addEventListener('DOMContentLoaded',function(){setTimeout(function(){getAll();if(document.getElementById('tab-painel')&&document.getElementById('tab-painel').classList.contains('active'))render()},0)});
})();
