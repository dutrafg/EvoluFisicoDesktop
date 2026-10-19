/* 09-runtime.js */
/* ============================================================================
   EvoluFísico v6.6 — CALCULATION ENGINE / ADAPTIVE WORKER POOL
   ============================================================================ */
(function(){
'use strict';
var S=window.__EF63_STATE__;
if(!S)return;

var version='6.5', pool=[], queue=[], jobs=new Map(), seq=0;
var currentVersion=-1, snapshot=null, snapshotPromise=null;
var cache=new Map(), active=0, started=false;
var fallback=(window.EF64&&window.EF64.renderHistory)|| (window.EF63&&window.EF63.renderHistory);

function esc(v){return EFU.esc(v)}
var jsEsc=function(s){return esc(String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r/g,'\\r').replace(/\n/g,'\\n'))};
function normalize(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function n(v){var x=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(x)?x:null}
function fat(a){var x=a&&a.dobras_resultado&&n(a.dobras_resultado.percGordura);if(x!=null)return x;return a&&a.bioimpedancia?n(a.bioimpedancia.pgordura):null}
function lean(a){return EFMeasures.lean(a)}
function light(a){return {
 cliente_id:EFIdentity.key(a),id:String(a.id),nome:String(a.nome||''),email:String(a.email||''),whatsapp:String(a.whatsapp||''),
 data:String(a.data_avaliacao||''),timestamp:String(a.timestamp||''),retorno:String(a.data_proxima_avaliacao||''),
 checkin:String(a.checkin_semana||''),peso:n(a.peso),altura:n(a.altura),g:fat(a),m:lean(a),
 imc:a&&a.bioimpedancia?n(a.bioimpedancia.imc):null, fotos:!!(a.fotos&&(a.fotos.frente||a.fotos.perfil_direito||a.fotos.perfil_esquerdo||a.fotos.costas||a.fotos.extra))
}}
function source(){return S.getAvaliacoes?S.getAvaliacoes():[]}
function buildSnapshot(){return source().map(light)}
function workerSource(){return `
'use strict';
function norm(v){return String(v==null?'':v).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim()}
function avg(a,k){var s=0,c=0;for(var i=0;i<a.length;i++){var v=a[i][k];if(v!=null&&isFinite(v)){s+=v;c++}}return c?s/c:null}
function metrics(a){var gs=avg(a,'g'),ms=avg(a,'m'),ps=0;for(var i=0;i<a.length;i++)if(a[i].fotos)ps++;return {total:a.length,mediaG:gs==null?'--%':gs.toFixed(1)+'%',mediaM:ms==null?'-- kg':ms.toFixed(1)+' kg',photos:ps}}
function match(a,t){if(!t)return true;var q=norm(t),digits=String(t).replace(/\\D/g,'');return norm(a.nome).indexOf(q)>-1||norm(a.email).indexOf(q)>-1||norm(a.checkin).indexOf(q)>-1||a.data.indexOf(t)>-1||(digits&&!/[a-zA-Z]/.test(t)&&String(a.whatsapp||'').replace(/\\D/g,'').indexOf(digits)>-1)}
function ordered(a){return a.slice().sort(function(x,y){return y.data.localeCompare(x.data)||y.timestamp.localeCompare(x.timestamp)})}
function groups(a){var m=new Map();for(var i=0;i<a.length;i++){var k=a[i].cliente_id||a[i].id;if(!m.has(k))m.set(k,{nome:a[i].nome||'Sem nome',count:0,last:null,ids:[]});var g=m.get(k);g.count++;g.ids.push(a[i].id);if(!g.last||a[i].data>g.last.data)g.last=a[i]}return Array.from(m.values()).sort(function(x,y){return (y.last?y.last.data:'').localeCompare(x.last?x.last.data:'')})}
function compare(a,b){if(!a||!b)return null;var r={};if(a.peso!=null&&b.peso!=null)r.peso={base:a.peso,current:b.peso,delta:b.peso-a.peso};if(a.g!=null&&b.g!=null)r.g={base:a.g,current:b.g,delta:b.g-a.g};if(a.m!=null&&b.m!=null)r.m={base:a.m,current:b.m,delta:b.m-a.m};if(a.imc!=null&&b.imc!=null)r.imc={base:a.imc,current:b.imc,delta:b.imc-a.imc};return r}
function trend(a){var x=ordered(a),out=[];for(var i=x.length-1;i>0;i--){var cur=x[i-1],prev=x[i];out.push({id:cur.id,previousId:prev.id,deltaPeso:cur.peso!=null&&prev.peso!=null?cur.peso-prev.peso:null,deltaG:cur.g!=null&&prev.g!=null?cur.g-prev.g:null,deltaM:cur.m!=null&&prev.m!=null?cur.m-prev.m:null})}return out}
self.onmessage=function(e){var d=e.data||{},a=d.records||[];if(d.type==='metrics')return self.postMessage({job:d.job,version:d.version,result:metrics(a)});if(d.type==='filter'){var ids=[];for(var i=0;i<a.length;i++)if(match(a[i],d.filter))ids.push(a[i].id);return self.postMessage({job:d.job,version:d.version,result:{ids:ids,metrics:metrics(a)}})}if(d.type==='groups')return self.postMessage({job:d.job,version:d.version,result:groups(a)});if(d.type==='compare'){var m=new Map();for(var i=0;i<a.length;i++)m.set(a[i].id,a[i]);return self.postMessage({job:d.job,version:d.version,result:compare(m.get(String(d.base)),m.get(String(d.current)))});}if(d.type==='trend')return self.postMessage({job:d.job,version:d.version,result:trend(a)});};
`}
function createWorker(){
 if(!window.Worker||!window.Blob||!window.URL||!URL.createObjectURL)return null;
 try{var u=URL.createObjectURL(new Blob([workerSource()],{type:'application/javascript'}));var w=new Worker(u);URL.revokeObjectURL(u);w.__busy=false;w.onmessage=onMessage;w.onerror=function(){w.__dead=true;try{w.terminate()}catch(e){}};return w}catch(e){return null}
}
function size(){var hc=navigator.hardwareConcurrency||2,mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent||'');return mobile?1:Math.min(2,Math.max(1,hc-1))}
function boot(){if(started)return;started=true;for(var i=0;i<size();i++){var w=createWorker();if(w)pool.push(w)} }
function onMessage(e){var d=e.data||{},job=jobs.get(d.job);active=Math.max(0,active-1);if(!job)return;jobs.delete(d.job);if(d.version!==S.version){job.reject(new Error('stale-version'));pump();return}cache.set(job.key,{version:d.version,result:d.result});job.resolve(d.result);pump()}
function pump(){for(var i=0;i<pool.length&&queue.length;i++){var w=pool[i];if(w.__busy||w.__dead)continue;var job=queue.shift();w.__busy=true;active++;jobs.set(job.id,job);w.__busyJob=job;var done=function(worker){return function(){worker.__busy=false;worker.__busyJob=null;pump()}}(w);try{w.onmessage=(function(orig,worker){return function(e){worker.__busy=false;worker.__busyJob=null;orig(e);}})(onMessage,w);w.postMessage({type:job.type,job:job.id,version:S.version,records:snapshot,filter:job.filter,base:job.base,current:job.current})}catch(e){w.__busy=false;jobs.delete(job.id);job.reject(e);done();}}}
function ensureSnapshot(){var v=S.version;if(currentVersion===v&&snapshot)return Promise.resolve();if(snapshotPromise)return snapshotPromise;boot();if(!pool.length)return Promise.reject(new Error('worker-unavailable'));snapshotPromise=new Promise(function(resolve,reject){try{snapshot=buildSnapshot();currentVersion=v;snapshotPromise=null;resolve()}catch(e){snapshotPromise=null;reject(e)}});return snapshotPromise}
function run(type,key,extra){var k=type+'|'+String(key||'');var c=cache.get(k);if(c&&c.version===S.version)return Promise.resolve(c.result);return ensureSnapshot().then(function(){return new Promise(function(resolve,reject){var id=String(++seq);jobs.set(id,{id:id,key:k,type:type,filter:extra&&extra.filter,base:extra&&extra.base,current:extra&&extra.current,resolve:resolve,reject:reject});queue.push(jobs.get(id));pump()})})}
function invalidate(){currentVersion=-1;snapshot=null;snapshotPromise=null;cache.clear()}
function mapById(){var m=new Map();source().forEach(function(a){m.set(String(a.id),a)});return m}
function renderHistory(filter){return run('filter',String(filter||''),{filter:String(filter||'')}).then(function(d){var grid=document.getElementById('history-list-grid'),empty=document.getElementById('history-empty-state');if(!grid||!empty)return;var map=mapById(),wanted=new Set(d.ids.map(String));Array.prototype.slice.call(grid.children).forEach(function(el){var id=String(el.dataset.ef65Id||el.dataset.ef64Id||el.dataset.ef63Id||'');if(!wanted.has(id))el.remove()});var frag=document.createDocumentFragment();d.ids.forEach(function(id){var old=grid.querySelector('[data-ef65-id="'+CSS.escape(String(id))+'"]')||grid.querySelector('[data-ef64-id="'+CSS.escape(String(id))+'"]')||grid.querySelector('[data-ef63-id="'+CSS.escape(String(id))+'"]');if(!old){var a=map.get(String(id));if(a){var n=document.createElement('div');n.className='history-card';n.dataset.ef65Id=String(a.id);var b=a.bioimpedancia||{},d=a.dobras_resultado||{},id=jsEsc(a.id);
    n.innerHTML='<div><div class="history-card-header"><div><div class="history-client-name">'+esc(a.nome)+'</div><div style="font-size:0.75rem;color:var(--text-muted);">'+esc(a.email||'')+'</div></div><span class="history-badge">'+esc(a.checkin_semana||'Check-in')+'</span>'+((typeof retornoAtrasado==='function'&&retornoAtrasado(a))?' <span class="history-badge" style="background:#fee2e2;color:#b91c1c;">⏰ Retorno atrasado</span>':'')+'</div><div class="history-meta"><span>📅 <strong>Data:</strong> '+formatarData(a.data_avaliacao)+' &bull; <strong>Retorno:</strong> '+(formatarData(a.data_proxima_avaliacao)||'Não definido')+'</span><span>🧬 <strong>%G Pollock:</strong> '+(d.percGordura?d.percGordura+'%':'-')+' &bull; <strong>%G BIA:</strong> '+(b.pgordura?b.pgordura+'%':'-')+'</span><span>📏 <strong>Soma Perimetria:</strong> '+(a.perimetria_soma?a.perimetria_soma+' cm':'-')+' &bull; <strong>IMC:</strong> '+(b.imc||'-')+'</span></div><div class="history-stats-preview"><div class="history-stat-mini"><span class="h-val">'+(a.peso>0?a.peso.toFixed(1):'-')+'</span><span class="h-lbl">Peso (kg)</span></div><div class="history-stat-mini"><span class="h-val">'+(b.mme!=null?Number(b.mme).toFixed(1):'-')+'</span><span class="h-lbl">Massa Musc.</span></div><div class="history-stat-mini"><span class="h-val">'+(a.fotos&&a.fotos.frente?'Sim':'Não')+'</span><span class="h-lbl">Fotos</span></div></div></div><div class="history-actions" style="display:flex;flex-wrap:wrap;gap:6px;"><button class="btn btn-primary btn-sm" onclick="abrirVisualizacaoPacienteWeb(\''+id+'\')">👁️ Visão do Aluno</button><button class="btn btn-success btn-sm" onclick="imprimirAvaliacaoIndividualPDF(\''+id+'\')">🖨️ PDF</button><button class="btn btn-secondary btn-sm" onclick="abrirModalDetalhes(\''+id+'\')">🔍 Detalhes</button><button class="btn btn-warning btn-sm" onclick="editarAvaliacao(\''+id+'\')">✏️</button><button class="btn btn-danger btn-sm" onclick="excluirAvaliacao(\''+id+'\')">🗑️</button></div>';frag.appendChild(n)}}});grid.appendChild(frag);var cur=Array.prototype.map.call(grid.children,function(x){return String(x.dataset.ef65Id||x.dataset.ef64Id||x.dataset.ef63Id||'')});if(cur.join('|')!==d.ids.join('|')){var f=document.createDocumentFragment();d.ids.forEach(function(id){var el=grid.querySelector('[data-ef65-id="'+CSS.escape(String(id))+'"]')||grid.querySelector('[data-ef64-id="'+CSS.escape(String(id))+'"]')||grid.querySelector('[data-ef63-id="'+CSS.escape(String(id))+'"]');if(el)f.appendChild(el)});grid.appendChild(f)}empty.classList.toggle('hidden',d.ids.length>0);grid.classList.toggle('hidden',!d.ids.length);return d})}

var oldTouch=S.touch;S.touch=function(){if(typeof oldTouch==='function')oldTouch.apply(S,arguments);invalidate()};
window.EF65={
 version:version,
 stats:function(){return {engine:version,workers:pool.length,queue:queue.length,active:active,version:S.version,snapshotVersion:currentVersion,cacheEntries:cache.size}},
 renderHistory:renderHistory,
 metrics:function(){return run('metrics','all',{})},
 groups:function(){return run('groups','all',{})},
 trend:function(){return run('trend','all',{})},
 compare:function(base,current){return run('compare',String(base)+'|'+String(current),{base:base,current:current})},
 invalidate:invalidate
};
window.filtrarAvaliacoes=function(){var i=document.getElementById('filtro-busca');renderHistory(i?i.value:'').catch(function(){if(typeof fallback==='function')fallback(i?i.value:'')})};
window.addEventListener('DOMContentLoaded',function(){setTimeout(function(){boot();if(window.requestIdleCallback)requestIdleCallback(function(){run('metrics','all',{}).catch(function(){})},{timeout:1500});else setTimeout(function(){run('metrics','all',{}).catch(function(){})},250)},0)});
})();
