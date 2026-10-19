/* 16-runtime.js */
/* ============================================================================
   EvoluFísico v7.3 — Evolution Monitoring Engine
   ============================================================================ */
(function(){
'use strict';
var S=window.__EF63_STATE__||null;
if(!S||!window.EF70||!window.EF72)return;
var VERSION='7.3',cache=new Map(),lastRenderId=null;
var MET={
 gordura:{label:'Gordura',unit:'%',lowerBetter:true,key:'gordura'},
 massaMagra:{label:'Massa magra',unit:' kg',lowerBetter:false,key:'massaMagra'},
 cintura:{label:'Cintura',unit:' cm',lowerBetter:true,key:'cintura'},
 peso:{label:'Peso',unit:' kg',lowerBetter:null,key:'peso'}
};
function norm(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function esc(v){return EFU.esc(v)}
function num(v){var n=Number(v);return Number.isFinite(n)?n:null}
function fmt(v,d){var n=num(v);return n==null?'—':n.toFixed(d==null?1:d)}
function fmtDate(v){if(!v)return'—';var d=new Date(v+'T00:00:00');return isNaN(d)?String(v):d.toLocaleDateString('pt-BR')}
function source(){return S.getAvaliacoes?S.getAvaliacoes():[]}
function sorted(name){return source().filter(function(a){return EFIdentity.key(a)===EFIdentity.key(name)}).map(function(a){return {a:a,date:new Date((a.data_avaliacao||a.data||'')+'T00:00:00')}}).filter(function(x){return !isNaN(x.date)}).sort(function(x,y){return x.date-y.date})}
// CORREÇÃO CIRÚRGICA: val(a, key) extrai dobras_resultado, bioimpedancia e perimetria sem falhar
function val(a,key){
  if(!a)return null;
  var d=a.dobras_resultado||{},b=a.bioimpedancia||{},p=a.perimetria||{};
  if(key==='gordura'){var g=num(d.percGordura!=null?d.percGordura:b.pgordura);if(g!=null)return g}
  if(key==='massaMagra'){var m=num(d.massaMagra);if(m!=null)return m}
  if(key==='cintura'){var c=num(p.cintura!=null?p.cintura:a.cintura);if(c!=null)return c}
  if(key==='peso'){var w=num(a.peso!=null?a.peso:b.peso);if(w!=null)return w}
  var n=num(a[key]);if(n!=null)return n;
  var aliases={gordura:['percentualGordura','percentual_gordura','gorduraPercentual'],massaMagra:['massa_magra','massaMagraKg'],cintura:['cinturaAbdominal','cintura_abdominal'],peso:['pesoKg','peso_kg']};
  var arr=aliases[key]||[];
  for(var i=0;i<arr.length;i++){n=num(a[arr[i]]);if(n!=null)return n}
  return null;
}
function delta(first,last){return first==null||last==null?null:last-first}
function pct(first,last){return first==null||!first?null:(last-first)/Math.abs(first)*100}
function signFor(key,d){var m=MET[key];if(d==null)return'neutral';if(m.lowerBetter===true)return d<0?'good':d>0?'attention':'neutral';if(m.lowerBetter===false)return d>0?'good':d<0?'attention':'neutral';return d===0?'neutral':'neutral'}
function analyze(name){
 var list=sorted(name);if(!list.length)return null;
 var last=list[list.length-1],prev=list.length>1?list[list.length-2]:null,ef72=window.EF72.compare(name)||{};
 var metrics={},alerts=[],changes=[];
 Object.keys(MET).forEach(function(k){
  var first=val(list[0].a,k),latest=val(last.a,k),d=delta(first,latest),recent=prev?delta(val(prev.a,k),latest):null;
  var vals=list.map(function(x){return val(x.a,k)}).filter(function(x){return x!=null});
  var volatility=null;if(vals.length>=3){var diffs=[];for(var i=1;i<vals.length;i++)diffs.push(Math.abs(vals[i]-vals[i-1]));volatility=diffs.reduce(function(a,b){return a+b},0)/diffs.length}
  var plateau=false;if(list.length>=3){var recentVals=list.slice(-3).map(function(x){return val(x.a,k)}).filter(function(x){return x!=null});if(recentVals.length===3){var range=Math.max.apply(null,recentVals)-Math.min.apply(null,recentVals),base=Math.max(Math.abs(recentVals[0]),1);plateau=range/base<0.01}}
  metrics[k]={first:first,latest:latest,delta:d,pct:pct(first,latest),recent:recent,volatility:volatility,plateau:plateau,state:signFor(k,d)};
  if(recent!=null&&list.length>=2){var s1=signFor(k,d),s2=signFor(k,recent);if(s1==='good'&&s2==='attention')changes.push({kind:'warning',title:'Reversão em '+MET[k].label,text:'A direção recente passou a contrariar a direção acumulada.'});}
  if(plateau)changes.push({kind:'neutral',title:'Platô em '+MET[k].label,text:'As três avaliações mais recentes ficaram dentro de uma faixa estreita.'});
 });
 if(list.length<2)alerts.push({kind:'neutral',title:'Base histórica curta',text:'Há apenas uma avaliação. O monitoramento longitudinal será ampliado a partir da próxima avaliação.'});
 var missing=Object.keys(MET).filter(function(k){return metrics[k].latest==null});
 if(missing.length)alerts.push({kind:'attention',title:'Dados incompletos',text:'Sem valor recente para: '+missing.map(function(k){return MET[k].label}).join(', ')+'.'});
 var reversals=changes.filter(function(x){return x.title.indexOf('Reversão')===0});
 if(reversals.length)alerts.unshift({kind:'warning',title:'Reversão detectada',text:'Uma ou mais métricas mudaram recentemente de direção em relação à trajetória acumulada.'});
 else if(list.length>=2){
  var positive=Object.keys(metrics).filter(function(k){return metrics[k].state==='good'}).length;
  var attention=Object.keys(metrics).filter(function(k){return metrics[k].state==='attention'}).length;
  if(positive>0&&attention===0)alerts.push({kind:'good',title:'Trajetória favorável nas métricas monitoradas',text:'As métricas com direção definida mantêm mudança compatível com o objetivo configurado.'});
  else if(attention>0)alerts.push({kind:'attention',title:'Acompanhamento recomendado',text:'Há pelo menos uma métrica recente em direção de atenção; o histórico deve ser acompanhado antes de concluir tendência.'});
 }
 var quality={assessments:list.length,withDates:list.length,missingLatest:missing.length,complete:missing.length===0};
 return {name:name,count:list.length,first:list[0].a,last:last.a,metrics:metrics,alerts:alerts,changes:changes,quality:quality,ef72:ef72};
}
function student(name){var key=EFIdentity.key(name)+'|'+S.version,c=cache.get(key);if(c)return c;var r=analyze(name);if(r)cache.set(key,r);return r}
function render(id){
 var host=document.getElementById('patient-view-content'),a=source().find(function(x){return String(x.id)===String(id)});if(!host||!a)return;
 var d=student(a);if(!d)return;
 var old=document.getElementById('ef73-monitoring');if(old)old.remove();
 var cards=Object.keys(MET).map(function(k){var m=d.metrics[k];return '<div class="ef73-kpi"><small>'+esc(MET[k].label)+'</small><strong>'+fmt(m.latest,2)+esc(MET[k].unit)+'</strong><span>'+(m.delta==null?'sem comparação':(m.delta>0?'+':'')+fmt(m.delta,2)+esc(MET[k].unit)+' desde o início'+(m.plateau?' · platô recente':''))+'</span></div>'}).join('');
 var alerts=d.alerts.map(function(x){return '<div class="ef73-alert '+esc(x.kind)+'"><b>'+esc(x.title)+'</b><p>'+esc(x.text)+'</p></div>'}).join('');
 var changes=d.changes.map(function(x){return '<div class="ef73-alert '+esc(x.kind)+'"><b>'+esc(x.title)+'</b><p>'+esc(x.text)+'</p></div>'}).join('');
 var card=document.createElement('section');card.id='ef73-monitoring';card.className='ef73-card';card.innerHTML='<div class="ef73-head"><div><div class="ef73-kicker">Acompanhamento da evolução</div><h2>🧭 Monitoramento inteligente da evolução</h2><p>Detecta mudanças recentes, platôs, reversões e lacunas de dados usando a inteligência já produzida pelas camadas anteriores.</p></div><div class="ef73-count">'+d.count+' avaliações</div></div><div class="ef73-grid">'+cards+'</div><div class="ef73-alerts">'+(alerts||'<div class="ef73-alert neutral"><b>Monitoramento estável</b><p>Nenhum evento operacional relevante foi identificado.</p></div>')+'</div>'+(changes?'<div class="ef73-alerts" style="margin-top:9px">'+changes+'</div>':'')+'<div class="ef73-foot">Acompanhamento atualizado sempre que novas avaliações são registradas.</div>';
 var profile=document.getElementById('ef71-profile');var comparison=document.getElementById('ef72-comparison');if(comparison&&comparison.parentNode)comparison.parentNode.insertBefore(card,comparison.nextSibling);else if(profile&&profile.parentNode)profile.parentNode.insertBefore(card,profile.nextSibling);else host.insertBefore(card,host.firstChild);lastRenderId=String(id);
}
function invalidate(){cache.clear();if(lastRenderId)render(lastRenderId)}
var oldTouch=S.touch;S.touch=function(){if(typeof oldTouch==='function')oldTouch.apply(S,arguments);invalidate()};
window.EF73={version:VERSION,student:student,analyze:analyze,render:render,invalidate:invalidate,stats:function(){return{engine:VERSION,cacheEntries:cache.size,version:S.version}}};
var oldOpen=window.abrirVisualizacaoPacienteWeb;
if(typeof oldOpen==='function'&&!oldOpen.__ef73){
    var f=function(id){
        var r=oldOpen.apply(this,arguments);
        setTimeout(function(){render(id)},0);
        return r;
    };
    f.__ef73=true;
    window.abrirVisualizacaoPacienteWeb=f;
}
window.addEventListener('DOMContentLoaded',function(){setTimeout(function(){var id=window.avaliacaoEmVisualizacaoId;if(id!=null)render(id)},120)});
})();
