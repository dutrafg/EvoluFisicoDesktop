/* 10-runtime.js */
/* ============================================================================
   EvoluFísico v6.6 — CALCULATION ENGINE
   ============================================================================ */
(function(){
'use strict';
var S=window.__EF63_STATE__;
if(!S)return;
var version='6.6', worker=null, ready=false, seq=0, pending=new Map();
var calcCache=new Map(), snapshotVersion=-1, snapshot=null, booted=false;
function num(v){var x=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(x)?x:null}
function source(){return S.getAvaliacoes?S.getAvaliacoes():[]}
function pollock(a){
  a=a||{}; var d=a.dobras||{}, sexo=a.sexo==='M'?'M':'F', idade=num(a.idade)||0, peso=num(a.peso)||0;
  var keys=['triceps','subescapular','peitoral','axilar','suprailiaca','abdominal','coxa'], soma=0;
  for(var i=0;i<keys.length;i++){var v=num(d[keys[i]]);if(v==null||v<=0)return null;soma+=v;}
  if(soma<=0||!(idade>0)||!(peso>0))return null;
  var densidade=sexo==='M'
    ?1.112-(0.00043499*soma)+(0.00000055*Math.pow(soma,2))-(0.00028826*idade)
    :1.097-(0.00046971*soma)+(0.00000056*Math.pow(soma,2))-(0.00012828*idade);
  var pg=((4.95/densidade)-4.50)*100; pg=Math.max(3,Math.min(60,pg));
  var mg=peso>0?peso*(pg/100):0, mm=peso>0?peso-mg:0;
  var c='Normal';
  if(sexo==='M'){if(pg<6)c='Essencial / Muito Baixo';else if(pg<=13)c='Excelente (Atleta)';else if(pg<=17)c='Bom (Fitness)';else if(pg<=24)c='Médio / Aceitável';else c='Elevado / Sobrepeso'}
  else {if(pg<14)c='Essencial / Muito Baixo';else if(pg<=20)c='Excelente (Atleta)';else if(pg<=24)c='Bom (Fitness)';else if(pg<=31)c='Médio / Aceitável';else c='Elevado / Sobrepeso'}
  return {soma:soma.toFixed(1),densidade:densidade.toFixed(4),percGordura:pg.toFixed(1),massaGorda:mg.toFixed(1),massaMagra:mm.toFixed(1),classificacao:c};
}
function derived(a){
  var p=num(a.peso), h=num(a.altura), per=a.perimetria||{}, rcq=null, imc=null;
  if(p!=null&&h>0)imc=p/Math.pow(h/100,2);
  var cintura=num(per.cintura), quadril=num(per.quadril); if(cintura!=null&&quadril>0)rcq=cintura/quadril;
  var r=pollock(a);
  return {cliente_id:a.cliente_id||String(a.id),id:String(a.id),nome:String(a.nome||''),peso:p,altura:h,idade:num(a.idade),imc:imc,rcq:rcq,pollock:r};
}
function snapshotNow(){var v=S.version;if(snapshotVersion===v&&snapshot)return snapshot;snapshot=source().map(derived);snapshotVersion=v;return snapshot}
function workerSource(){return `
'use strict';
function n(v){var x=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(x)?x:null}
function pollock(a){var d=a.dobras||{},sexo=a.sexo==='M'?'M':'F',idade=n(a.idade)||0,peso=n(a.peso)||0,k=['triceps','subescapular','peitoral','axilar','suprailiaca','abdominal','coxa'],s=0;for(var i=0;i<k.length;i++){var v=n(d[k[i]]);if(v==null||v<=0)return null;s+=v}if(s<=0||!(idade>0)||!(peso>0))return null;var den=sexo==='M'?1.112-(.00043499*s)+(.00000055*Math.pow(s,2))-(.00028826*idade):1.097-(.00046971*s)+(.00000056*Math.pow(s,2))-(.00012828*idade);var pg=((4.95/den)-4.5)*100;pg=Math.max(3,Math.min(60,pg));var mg=peso>0?peso*pg/100:0,mm=peso>0?peso-mg:0,c='Normal';if(sexo==='M'){if(pg<6)c='Essencial / Muito Baixo';else if(pg<=13)c='Excelente (Atleta)';else if(pg<=17)c='Bom (Fitness)';else if(pg<=24)c='Médio / Aceitável';else c='Elevado / Sobrepeso'}else{if(pg<14)c='Essencial / Muito Baixo';else if(pg<=20)c='Excelente (Atleta)';else if(pg<=24)c='Bom (Fitness)';else if(pg<=31)c='Médio / Aceitável';else c='Elevado / Sobrepeso'}return{soma:s.toFixed(1),densidade:den.toFixed(4),percGordura:pg.toFixed(1),massaGorda:mg.toFixed(1),massaMagra:mm.toFixed(1),classificacao:c}}
function calc(a){var p=n(a.peso),h=n(a.altura),per=a.perimetria||{},c=n(per.cintura),q=n(per.quadril);return{cliente_id:a.cliente_id||String(a.id),id:String(a.id),nome:String(a.nome||''),peso:p,altura:h,idade:n(a.idade),imc:p!=null&&h>0?p/Math.pow(h/100,2):null,rcq:c!=null&&q>0?c/q:null,pollock:pollock(a)}}
function all(records){return records.map(calc)}
self.onmessage=function(e){var d=e.data||{};if(d.type==='all')self.postMessage({job:d.job,version:d.version,result:all(d.records||[])});else if(d.type==='one')self.postMessage({job:d.job,version:d.version,result:calc(d.record||{})});else if(d.type==='validate'){
 var r=calc(d.record||{}),stored=d.stored||{},out={id:r.id,ok:true,differences:[]};if(r.pollock&&stored.percGordura!=null&&Math.abs(parseFloat(stored.percGordura)-parseFloat(r.pollock.percGordura))>.11){out.ok=false;out.differences.push('percGordura')}if(r.pollock&&stored.massaMagra!=null&&Math.abs(parseFloat(stored.massaMagra)-parseFloat(r.pollock.massaMagra))>.11){out.ok=false;out.differences.push('massaMagra')}if(r.pollock&&stored.massaGorda!=null&&Math.abs(parseFloat(stored.massaGorda)-parseFloat(r.pollock.massaGorda))>.11){out.ok=false;out.differences.push('massaGorda')}self.postMessage({job:d.job,version:d.version,result:out})}
};`}
function boot(){if(booted)return;booted=true;if(!window.Worker||!window.Blob)return;try{var u=URL.createObjectURL(new Blob([workerSource()],{type:'application/javascript'}));worker=new Worker(u);URL.revokeObjectURL(u);worker.onmessage=function(e){var d=e.data||{},j=pending.get(d.job);if(!j)return;pending.delete(d.job);if(d.version!==S.version){j.reject(new Error('stale-version'));return}j.resolve(d.result)};worker.onerror=function(){ready=false;try{worker.terminate()}catch(e){}worker=null};ready=true}catch(e){worker=null;ready=false}}
function fallbackRun(type,record,stored){if(type==='one')return Promise.resolve(derived(record));if(type==='validate'){var r=derived(record),s=stored||{},dif=[],p=r.pollock;if(p&&s.percGordura!=null&&Math.abs(parseFloat(s.percGordura)-parseFloat(p.percGordura))>.11)dif.push('percGordura');if(p&&s.massaMagra!=null&&Math.abs(parseFloat(s.massaMagra)-parseFloat(p.massaMagra))>.11)dif.push('massaMagra');if(p&&s.massaGorda!=null&&Math.abs(parseFloat(s.massaGorda)-parseFloat(p.massaGorda))>.11)dif.push('massaGorda');return Promise.resolve({id:r.id,ok:!dif.length,differences:dif})}return Promise.resolve(snapshotNow())}
function run(type,record,stored,key){boot();var k=key||type+'|'+(record&&record.id||'all');var c=calcCache.get(k);if(c&&c.version===S.version)return Promise.resolve(c.result);if(!ready)return fallbackRun(type,record,stored).then(function(r){calcCache.set(k,{version:S.version,result:r});return r});return new Promise(function(resolve,reject){var id=String(++seq);pending.set(id,{resolve:resolve,reject:reject});worker.postMessage({type:type,job:id,version:S.version,record:record,stored:stored,records:type==='all'?source():undefined})}).then(function(r){calcCache.set(k,{version:S.version,result:r});return r})}
function invalidate(){snapshotVersion=-1;snapshot=null;calcCache.clear()}
var oldTouch=S.touch;S.touch=function(){if(typeof oldTouch==='function')oldTouch.apply(S,arguments);invalidate()};
window.EF66={version:version,ready:function(){return ready},stats:function(){return{engine:version,worker:ready,version:S.version,cacheEntries:calcCache.size,pending:pending.size}},calculate:function(id){var a=source().find(function(x){return String(x.id)===String(id)});return a?run('one',a,null,'one|'+String(id)):Promise.reject(new Error('assessment-not-found'))},calculateAll:function(){return run('all',null,null,'all')},validate:function(id){var a=source().find(function(x){return String(x.id)===String(id)});if(!a)return Promise.reject(new Error('assessment-not-found'));return run('validate',a,a.dobras_resultado||{},'validate|'+String(id))},invalidate:invalidate};
window.addEventListener('DOMContentLoaded',function(){setTimeout(function(){boot();if(window.requestIdleCallback)requestIdleCallback(function(){window.EF66.calculateAll().catch(function(){})},{timeout:1800})},0)});
})();
