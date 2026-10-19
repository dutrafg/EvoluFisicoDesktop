/* 08-runtime.js */
/* ============================================================================
   EvoluFísico v6.5 — WORKER ANALYTICS ENGINE
   ============================================================================ */
(function(){
'use strict';
var S=window.__EF63_STATE__;
if(!S)return;

var W=null, ready=false, seq=0, pending={}, workerVersion=-1, syncedVersion=-1, syncPromise=null, resultCache=new Map();
var fallback=window.EF63&&window.EF63.renderHistory;

function norm(v){return EFU.norm(v)}
function num(v){return EFU.num(v)}
function pg(a){var x=a&&a.dobras_resultado&&num(a.dobras_resultado.percGordura);return x!=null?x:num(a&&a.bioimpedancia&&a.bioimpedancia.pgordura)}
function mm(a){return EFMeasures.lean(a)}
function photo(a){var f=a&&a.fotos;return !!(f&&(f.frente||f.perfil_direito||f.perfil_esquerdo||f.costas||f.extra||f.lado))}
function lightweight(av){
  return av.map(function(a){return {
    cliente_id:EFIdentity.key(a),id:String(a.id), nome:String(a.nome||''), email:String(a.email||''), whatsapp:String(a.whatsapp||''),
    checkin:String(a.checkin_semana||''), data:String(a.data_avaliacao||''), timestamp:String(a.timestamp||''),
    retorno:String(a.data_proxima_avaliacao||''), g:pg(a), m:mm(a), fotos:photo(a)
  }})
}
function makeWorker(){
  if(!window.Worker||!window.Blob||!window.URL||!URL.createObjectURL)return false;
  var src=`
  'use strict';
  function norm(v){return String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim()}
  function calc(a){var sumG=0,cG=0,sumM=0,cM=0,photos=0;for(var i=0;i<a.length;i++){var x=a[i];if(x.g!=null&&x.g>0){sumG+=x.g;cG++}if(x.m!=null&&x.m>0){sumM+=x.m;cM++}if(x.fotos)photos++}return {total:a.length,mediaG:cG?(sumG/cG).toFixed(1)+'%':'--%',mediaM:cM?(sumM/cM).toFixed(1)+' kg':'-- kg',photos:photos}}
  function match(a,t){if(!t)return true;var q=norm(t),qd=String(t).replace(/\\D/g,'');return norm(a.nome).indexOf(q)>-1||norm(a.email).indexOf(q)>-1||(qd&&!/[a-zA-Z]/.test(t)&&a.whatsapp&&String(a.whatsapp).replace(/\\D/g,'').indexOf(qd)>-1)||norm(a.checkin).indexOf(q)>-1||a.data.indexOf(t)>-1}
  var state={version:-1,records:[]};
  self.onmessage=function(e){var d=e.data||{};
    if(d.type==='sync'){state.version=d.version;state.records=(d.records||[]).slice().sort(function(x,y){return y.data.localeCompare(x.data)||y.timestamp.localeCompare(x.timestamp)});self.postMessage({type:'synced',seq:d.seq,version:d.version,metrics:calc(state.records)});return}
    var t=String(d.filter||''),a=state.records,ids=[];for(var i=0;i<a.length;i++)if(match(a[i],t))ids.push(a[i].id);
    self.postMessage({type:'result',seq:d.seq,version:state.version,filter:t,ids:ids,metrics:calc(a)});
  }`;
  try{var u=URL.createObjectURL(new Blob([src],{type:'application/javascript'}));W=new Worker(u);URL.revokeObjectURL(u);}
  catch(e){return false}
  W.onmessage=function(e){var d=e.data||{},p=pending[d.seq];if(!p)return;delete pending[d.seq];if(d.version!==S.version)return;if(d.type==='synced'){workerVersion=d.version;syncedVersion=d.version;syncPromise=null;p(d);return}workerVersion=d.version;resultCache.set(String(d.filter),d);p(d)};
  W.onerror=function(){ready=false;try{W.terminate()}catch(e){}W=null};
  ready=true;return true;
}
function ensureWorker(){if(!ready)makeWorker();return ready}
function syncWorker(){
  var v=S.version;if(syncedVersion===v)return Promise.resolve();
  if(syncPromise)return syncPromise;
  if(!ensureWorker())return Promise.reject(new Error('worker-unavailable'));
  syncPromise=new Promise(function(resolve){var id=++seq;pending[id]=resolve;W.postMessage({type:'sync',seq:id,version:v,records:lightweight(S.getAvaliacoes())})});
  return syncPromise;
}
function request(filter){
  var key=String(filter||''),v=S.version,cached=resultCache.get(key);
  if(cached&&cached.version===v)return Promise.resolve(cached);
  return syncWorker().then(function(){return new Promise(function(resolve){var id=++seq;pending[id]=resolve;W.postMessage({type:'filter',seq:id,version:v,filter:key})})});
}
function esc(v){return EFU.esc(v)}
var jsEsc=function(s){return esc(String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r/g,'\\r').replace(/\n/g,'\\n'))};
function getById(){var m=new Map();(S.getAvaliacoes()||[]).forEach(function(a){m.set(String(a.id),a)});return m}
function overdue(a){if(typeof retornoAtrasado==='function')return retornoAtrasado(a);if(!a||!a.data_proxima_avaliacao)return false;return new Date(a.data_proxima_avaliacao+'T23:59:59')<new Date()}
function card(a){var b=a.bioimpedancia||{},d=a.dobras_resultado||{},id=jsEsc(a.id);var el=document.createElement('div');el.className='history-card';el.dataset.ef64Id=a.id;
 el.innerHTML='<div><div class="history-card-header"><div><div class="history-client-name">'+esc(a.nome)+'</div><div style="font-size:0.75rem;color:var(--text-muted);">'+esc(a.email||'')+'</div></div><span class="history-badge">'+esc(a.checkin_semana||'Check-in')+'</span>'+(overdue(a)?' <span class="history-badge" style="background:#fee2e2;color:#b91c1c;">⏰ Retorno atrasado</span>':'')+'</div><div class="history-meta"><span>📅 <strong>Data:</strong> '+formatarData(a.data_avaliacao)+' &bull; <strong>Retorno:</strong> '+(formatarData(a.data_proxima_avaliacao)||'Não definido')+'</span><span>🧬 <strong>%G Pollock:</strong> '+(d.percGordura?d.percGordura+'%':'-')+' &bull; <strong>%G BIA:</strong> '+(b.pgordura?b.pgordura+'%':'-')+'</span><span>📏 <strong>Soma Perimetria:</strong> '+(a.perimetria_soma?a.perimetria_soma+' cm':'-')+' &bull; <strong>IMC:</strong> '+(b.imc||'-')+'</span></div><div class="history-stats-preview"><div class="history-stat-mini"><span class="h-val">'+(a.peso>0?a.peso.toFixed(1):'-')+'</span><span class="h-lbl">Peso (kg)</span></div><div class="history-stat-mini"><span class="h-val">'+(b.mme!=null?Number(b.mme).toFixed(1):'-')+'</span><span class="h-lbl">Massa Musc.</span></div><div class="history-stat-mini"><span class="h-val">'+(a.fotos&&a.fotos.frente?'Sim':'Não')+'</span><span class="h-lbl">Fotos</span></div></div></div><div class="history-actions" style="display:flex;flex-wrap:wrap;gap:6px;"><button class="btn btn-primary btn-sm" onclick="abrirVisualizacaoPacienteWeb(\''+id+'\')">👁️ Visão do Aluno</button><button class="btn btn-success btn-sm" onclick="imprimirAvaliacaoIndividualPDF(\''+id+'\')">🖨️ PDF</button><button class="btn btn-secondary btn-sm" onclick="abrirModalDetalhes(\''+id+'\')">🔍 Detalhes</button><button class="btn btn-warning btn-sm" onclick="editarAvaliacao(\''+id+'\')">✏️</button><button class="btn btn-danger btn-sm" onclick="excluirAvaliacao(\''+id+'\')">🗑️</button></div>';
 return el}
async function render(filter){
 var grid=document.getElementById('history-list-grid'),empty=document.getElementById('history-empty-state');if(!grid||!empty)return;
 var d;try{d=await request(filter)}catch(e){if(typeof fallback==='function')return fallback(filter);return}
 if(d.version!==S.version)return;
 var map=getById(), ids=d.ids, wanted=new Set(ids.map(String));
 Array.prototype.slice.call(grid.children).forEach(function(n){if(!wanted.has(String(n.dataset.ef64Id||n.dataset.ef63Id)))n.remove()});
 var frag=document.createDocumentFragment();ids.forEach(function(id){var n=grid.querySelector('[data-ef64-id="'+CSS.escape(String(id))+'"]')||grid.querySelector('[data-ef63-id="'+CSS.escape(String(id))+'"]');if(!n){var a=map.get(String(id));if(a)frag.appendChild(card(a))}});grid.appendChild(frag);
 var cur=Array.prototype.map.call(grid.children,function(x){return String(x.dataset.ef64Id||x.dataset.ef63Id||'')});if(cur.join('|')!==ids.join('|')){var f=document.createDocumentFragment();ids.forEach(function(id){var n=grid.querySelector('[data-ef64-id="'+CSS.escape(String(id))+'"]')||grid.querySelector('[data-ef63-id="'+CSS.escape(String(id))+'"]');if(n)f.appendChild(n)});grid.appendChild(f)}
 empty.classList.toggle('hidden',ids.length>0);grid.classList.toggle('hidden',!ids.length);
 var k=[['kpi-total-avaliacoes',d.metrics.total],['kpi-media-gordura',d.metrics.mediaG],['kpi-media-massa',d.metrics.mediaM],['kpi-com-fotos',d.metrics.photos]];k.forEach(function(x){var e=document.getElementById(x[0]);if(e)e.textContent=x[1]});
}
var oldFilter=window.filtrarAvaliacoes;
window.filtrarAvaliacoes=function(){var i=document.getElementById('filtro-busca');render(i?i.value:'')};
window.EF64={
 version:'6.4',worker:function(){return !!W&&ready},
 stats:function(){return {version:S.version,worker:!!W&&ready,syncedVersion:syncedVersion,cachedFilters:resultCache.size,pending:Object.keys(pending).length}},
 renderHistory:render,
 clear:function(){resultCache.clear();workerVersion=-1;syncedVersion=-1;syncPromise=null}
};
S.touch=function(){S.version++;resultCache.clear();workerVersion=-1;syncedVersion=-1;syncPromise=null};
window.addEventListener('DOMContentLoaded',function(){setTimeout(function(){ensureWorker();var grid=document.getElementById('history-list-grid');if(grid&&!grid.classList.contains('hidden'))render('')},0)});
})();
