/* 13-runtime.js */
/* ==========================================================================
   EvoluFísico v7.0 — DECISION & ACTION ENGINE
   ========================================================================== */
(function(){
'use strict';
var S=window.__EF63_STATE__; if(!S)return;
var VERSION='7.0', cache=new Map(), index=null, indexVersion=-1;
var MET={
 gordura:{label:'Gordura corporal',unit:'%',lower:true,weight:35},
 massaMagra:{label:'Massa magra',unit:' kg',higher:true,weight:35},
 cintura:{label:'Cintura',unit:' cm',lower:true,weight:20},
 peso:{label:'Peso',unit:' kg',neutral:true,weight:10}
};
function n(v){return EFU.num(v)}
function measure(v,lo,hi){var x=n(v);return x!=null&&x>=lo&&x<=hi?x:null}
function norm(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function date(a){var d=String(a&&a.data_avaliacao||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return 0;var t=Date.parse(d+'T12:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===d?t:0}
function fatInfo(a){var p=measure(a?.dobras_resultado?.percGordura,3,65),b=measure(a?.bioimpedancia?.pgordura,3,65);return {value:p??b,method:p!=null?'Pollock':b!=null?'BIA':null}}
function fat(a){return fatInfo(a).value}
function lean(a){return measure(EFMeasures.lean(a),10,250)}
function waist(a){var p=a&&a.perimetria||{};return measure(p.cintura!=null?p.cintura:(p.abdomen!=null?p.abdomen:p.cintura_minima),40,200)}
function light(a){var f=fatInfo(a),p=measure(a.peso,20,350),m=lean(a);if(m!=null&&p!=null&&m>p)m=null;return{cliente_id:a.cliente_id||String(a.id),id:String(a.id),nome:String(a.nome||'Sem nome'),date:date(a),data:String(a.data_avaliacao||''),timestamp:String(a.timestamp||''),method:f.method,g:f.value,m:m,c:waist(a),p:p,gordura:f.value,massaMagra:m,cintura:waist(a),peso:p,pairedDelta:(measure(a.dobras_resultado?.percGordura,3,65)!=null&&measure(a.bioimpedancia?.pgordura,3,65)!=null)?Math.abs(measure(a.dobras_resultado.percGordura,3,65)-measure(a.bioimpedancia.pgordura,3,65)):null}}
function source(){return S.getAvaliacoes?S.getAvaliacoes():[]}
function build(){if(index&&indexVersion===S.version)return index;var by=new Map(),records=[];source().forEach(function(a){var r=light(a);records.push(r);var k=EFIdentity.key(a);if(!by.has(k))by.set(k,[]);by.get(k).push(r)});by.forEach(function(v){v.sort(function(a,b){return a.date-b.date||String(a.timestamp).localeCompare(String(b.timestamp))})});index={records:records,byName:by};indexVersion=S.version;return index}
function delta(a,b,k){if(k==='g'||k==='gordura'){if(!a.method||a.method!==b.method)return null}return a[k]!=null&&b[k]!=null?b[k]-a[k]:null}
function favorable(k,d){if(d==null||MET[k].neutral)return null;return MET[k].lower?d<0:d>0}
function transitions(list){var out=[];for(var i=1;i<list.length;i++){var a=list[i-1],b=list[i],d={},valid=a.date&&b.date&&b.date-a.date>=7*86400000;Object.keys(MET).forEach(function(k){d[k]=valid?delta(a,b,k):null});out.push({from:a,to:b,d:d})}return out}
function consistency(ts,k){var ds=ts.map(function(t){return t.d[k]}).filter(function(v){return v!=null&&Math.abs(v)>=0.05});if(ds.length<2)return {ratio:null,n:ds.length,label:'insuficiente'};var pos=ds.filter(function(v){return v>0}).length,neg=ds.length-pos,ratio=Math.max(pos,neg)/ds.length;return{ratio:ratio,n:ds.length,label:ratio>=.8?'consistente':ratio>=.6?'moderada':'oscilante'}}
function slope(list,k){var seen=new Set(),p=list.slice().reverse().filter(function(x){if(x[k]==null||!x.date||seen.has(x.date))return false;seen.add(x.date);return true}).reverse();if((k==='g'||k==='gordura')&&new Set(p.map(x=>x.method)).size>1)return null;if(p.length>=2&&p.at(-1).date-p[0].date<21*86400000)return null;if(p.length<3)return null;var x0=p[0].date,x=p.map(function(a){return(a.date-x0)/86400000}),y=p.map(function(a){return a[k]}),xm=x.reduce(function(a,b){return a+b},0)/x.length,ym=y.reduce(function(a,b){return a+b},0)/y.length,den=x.reduce(function(a,b){return a+Math.pow(b-xm,2)},0);if(!den)return null;var sl=x.reduce(function(a,b,i){return a+(b-xm)*(y[i]-ym)},0)/den;return{perDay:sl,per30:sl*30,per60:sl*60}}
function rangeQuality(list){if(list.length<2)return 35;if(list.length>=5)return 100;if(list.length>=3)return 80;return 60}
function score(a){if(!a||!a.count)return{value:null,label:'sem dados',parts:[]};if(a.list.length<3||a.list.at(-1).date-a.list[0].date<21*86400000||a.list.at(-1).date-a.list.at(-2).date<7*86400000)return{value:null,label:'histórico temporal insuficiente ou última coleta muito próxima',parts:[]};var parts=[],total=0,weight=0;['gordura','massaMagra','cintura'].forEach(function(k){var first=a.list[0][k],last=a.list[a.list.length-1][k];if(first==null||last==null||first===0)return;var d=last-first;if(k==='gordura'&&new Set(a.list.filter(x=>x.gordura!=null).map(x=>x.method)).size>1)return;var rel=Math.abs(d/first),fav=favorable(k,d),pts=Math.min(100,Math.max(0,50+(fav?Math.min(45,rel*100*3):-Math.min(45,rel*100*3))));parts.push({metric:k,label:MET[k].label,points:pts,delta:d});total+=pts*MET[k].weight;weight+=MET[k].weight});if(!weight)return{value:null,label:'sem dados',parts:parts};var consistencyScores=['gordura','massaMagra','cintura'].map(function(k){return a.cons[k].ratio}).filter(function(v){return v!=null});var cs=consistencyScores.length?consistencyScores.reduce(function(x,y){return x+y},0)/consistencyScores.length:0.5;var regular=Math.min(100,rangeQuality(a.list));var val=Math.round((total/weight)*.75+cs*100*.15+regular*.10);return{value:Math.max(0,Math.min(100,val)),label:val>=75?'trajetória consistente':val>=55?'trajetória em acompanhamento':'trajetória instável',parts:parts}}
function confidence(a){
  // Indice HEURISTICO de suficiencia dos dados: NAO e acuracia clinica.
  if(!a||!a.count)return null;
  var list=a.list,days=list.map(x=>x.date),day=86400000;
  if(days.length<3||days.at(-1)-days[0]<21*day)return null;
  var nScore=Math.min(100,list.length>=6?100:list.length*16.7),span=Math.min(100,Math.max(20,(days.at(-1)-days[0])/day/180*100)),complete=list.reduce(function(s,r){return s+(r.g!=null&&r.m!=null?1:0)},0)/list.length*100;
  var v=Math.round(nScore*.45+span*.30+complete*.25);
  // Mesmo que haja historico longo, ultima coleta muito proxima nao gera inferencia robusta.
  if(days.at(-1)-days.at(-2)<7*day)v=Math.min(v,40);
  // Metodos antropometricos diferentes nao sao series equivalentes.
  var methods=new Set(list.map(x=>x.g!=null?x.method:null).filter(Boolean));
  if(methods.size>1)v=Math.min(v,45);
  // Comparacao de medidas do laboratorio nao e um padrao ouro; divergencia exige ressalva.
  if(list.at(-1).pairedDelta!=null&&list.at(-1).pairedDelta>=8)v=Math.min(v,40);
  return Math.max(0,Math.min(100,v));
}
function correlations(a){var out=[];if(a.list.length<2)return out;var dates=[...new Set(a.list.map(x=>x.date).filter(Boolean))],longEnough=dates.length>=4&&dates.at(-1)-dates[0]>=60*86400000;var last=a.list[a.list.length-1],prev=a.list[a.list.length-2];if(!last||!prev||last.date-prev.date<7*86400000)return out;var dg=delta(prev,last,'g'),dm=delta(prev,last,'m'),dc=delta(prev,last,'c'),dp=delta(prev,last,'p');if(dg!=null&&dm!=null&&dc!=null&&dg<-.5&&dm>.3&&dc<-.5)out.push({type:'recomposition',severity:'good',title:'Padrão de recomposição corporal',text:'Gordura e cintura reduziram enquanto a massa magra aumentou na última transição.'});if(dp!=null&&dg!=null&&Math.abs(dp)<.8&&Math.abs(dg)>.5)out.push({type:'composition',severity:'good',title:'Mudança de composição sem grande mudança de peso',text:'O peso variou pouco enquanto a gordura corporal mudou de forma relevante.'});['g','m','c'].forEach(function(k){var tr=a.trends[k];if(longEnough&&tr&&Math.abs(tr.per30)<.05&&a.list.length>=4)out.push({type:'plateau',severity:'info',title:'Estabilidade recente',text:MET[k==='g'?'gordura':k==='m'?'massaMagra':'cintura'].label+' apresenta baixa inclinação na série recente.'})});return out}
function analyze(key,chosenRecords){var original=(chosenRecords?chosenRecords.filter(function(r){return EFIdentity.key(r)===key}).map(light):(build().byName.get(key)||[])).slice(),unique=new Map();original.forEach(x=>{if(x.date)unique.set(x.date,x)});var list=[...unique.values()].sort((a,b)=>a.date-b.date),ts=transitions(list),cons={},trends={};['gordura','massaMagra','cintura','peso'].forEach(function(k){cons[k]=consistency(ts,k);trends[k]=slope(list,k)});var a={key:key,name:original.length?original.at(-1).nome:'',count:original.length,list:list,rawRecords:original,ts:ts,cons:cons,trends:trends};a.score=score(a);a.confidence=confidence(a);a.correlations=correlations(a);return a}
function scenarios(a){return [];/* Extrapolações pessoais futuras desativadas (sem validação). */}
function actions(a){var out=[];if(a.list.length<2)out.push({priority:'info',text:'Registrar uma nova avaliação antes de interpretar tendências.'});if((a.confidence==null||a.confidence<55)&&a.count>1)out.push({priority:'info',text:'Acompanhar novas avaliações para aumentar a confiança da tendência.'});a.correlations.forEach(function(x){if(x.type==='plateau')out.push({priority:'attention',text:'Revisar a evolução recente deste indicador e observar a próxima avaliação.'})});Object.keys(a.cons).forEach(function(k){var c=a.cons[k];if(c.ratio!=null&&c.ratio<.6&&c.n>=3)out.push({priority:'attention',text:'Observar a próxima transição porque '+MET[k].label.toLowerCase()+' apresenta oscilação.'})});if(a.score.value!=null&&a.score.value>=75&&a.confidence!=null&&a.confidence>=60)out.push({priority:'positive',text:'Registrar o marco de evolução e manter o acompanhamento da trajetória atual.'});return out.slice(0,4)}
function all(){var b=build(),students=[];b.byName.forEach(function(_,k){var a=analyze(k);a.scenarios=scenarios(a);a.actions=actions(a);students.push(a)});students.sort(function(a,b){return b.confidence-a.confidence});var events=[];students.forEach(function(a){a.correlations.forEach(function(e){events.push(Object.assign({student:a.name,key:a.key},e))});a.actions.forEach(function(e){events.push({student:a.name,key:a.key,type:'action',severity:e.priority==='attention'?'warn':e.priority==='positive'?'good':'info',title:'Próxima ação',text:e.text})})});return{version:VERSION,records:b.records.length,students:students.length,generatedAt:Date.now(),studentsData:students,events:events}}
function get(){var k='all|'+S.version,c=cache.get(k);if(c)return c;var r=all();cache.set(k,r);return r}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function render(){ /* Saída visual reunida no painel Análises automáticas; motor EF70 preservado. */ }
function invalidate(){cache.clear();index=null;indexVersion=-1}
window.EF70={version:VERSION,analyzeRecords:function(key,records){if(!Array.isArray(records))return null;var a=analyze(key,records);a.scenarios=scenarios(a);a.actions=actions(a);return a},stats:function(){var d=get();return{engine:VERSION,version:S.version,records:d.records,students:d.students,events:d.events.length,cacheEntries:cache.size}},all:get,student:function(name){var k=EFIdentity.key(name);return get().studentsData.find(function(x){return x.key===k})||null},score:function(name){var a=this.student(name);return a?a.score:null},confidence:function(name){var a=this.student(name);return a?a.confidence:null},scenarios:function(name){var a=this.student(name);return a?a.scenarios:[]},actions:function(name){var a=this.student(name);return a?a.actions:[]},insights:function(name){var a=this.student(name);return a?a.correlations:[]},invalidate:invalidate,render:render};
var oldTouch=S.touch;S.touch=function(){if(typeof oldTouch==='function')oldTouch.apply(S,arguments);invalidate();setTimeout(function(){if(document.getElementById('tab-painel')&&document.getElementById('tab-painel').classList.contains('active'))render()},0)};
var oldSwitch=window.switchTab;if(typeof oldSwitch==='function'&&!oldSwitch.__ef70){var sw=function(id){var r=oldSwitch.apply(this,arguments);if(id==='tab-painel')setTimeout(render,0);return r};sw.__ef70=true;window.switchTab=sw}
window.addEventListener('DOMContentLoaded',function(){setTimeout(function(){get();if(document.getElementById('tab-painel')&&document.getElementById('tab-painel').classList.contains('active'))render()},0)});
})();
