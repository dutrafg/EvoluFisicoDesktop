/* 07-runtime.js */
/* ==========================================================================
   EvoluFísico v6.3 — INCREMENTAL JS ENGINE
   ========================================================================== */
(function(){
'use strict';
var S=window.__EF63_STATE__;
if(!S)return;

var originalHistory=window.renderizarHistorico;
var originalCompare=window.renderizarComparacao;
var originalDonut=window.renderDonutChartSvg;
var originalBar=window.renderBarChartSvg;
var originalPdf=window.imprimirAvaliacaoIndividualPDF;

var cache={
  version:-1,
  records:new Map(),
  byName:new Map(),
  historyOrder:[],
  metrics:{},
  filtered:new Map(),
  panel:null,
  compareKey:'',
  compareVersion:-1,
  chartDonut:new Map(),
  chartBar:new Map(),
  pdf:new Map()
};

function data(){return S.getAvaliacoes?S.getAvaliacoes():[]}
function norm(v){return EFU.norm(v)}
function n(v){return EFU.num(v)}
function esc(v){return EFU.esc(v)}
var jsEsc=function(s){return esc(String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r/g,'\\r').replace(/\n/g,'\\n'))};
function pg(a){var x=a&&a.dobras_resultado&&n(a.dobras_resultado.percGordura);return x!=null?x:n(a&&a.bioimpedancia&&a.bioimpedancia.pgordura)}
function mm(a){return EFMeasures.lean(a)}
function hasFotos(a){var f=a&&a.fotos;return !!(f&&(f.frente||f.perfil_direito||f.perfil_esquerdo||f.costas||f.extra||f.lado))}
function retornoAtrasadoLocal(a){
  if(typeof retornoAtrasado==='function')return retornoAtrasado(a);
  if(!a||!a.data_proxima_avaliacao)return false;
  return new Date(a.data_proxima_avaliacao+'T23:59:59')<new Date();
}
function touchVersion(){cache.version=S.version;cache.records.clear();cache.byName.clear();cache.historyOrder=[];cache.filtered.clear();cache.panel=null;cache.compareKey='';cache.compareVersion=-1}
function sync(){
  if(cache.version!==S.version)touchVersion();
}
function ensureIndex(){
  sync();
  var av=data();
  if(cache.records.size===av.length && cache.records.size>0)return;
  cache.records.clear();cache.byName.clear();
  av.forEach(function(a){
    cache.records.set(a.id,a);
    var k=EFIdentity.key(a);
    if(k){var arr=cache.byName.get(k);if(!arr)cache.byName.set(k,arr=[]);arr.push(a)}
  });
  cache.byName.forEach(function(arr){arr.sort(function(x,y){return String(x.data_avaliacao||'').localeCompare(String(y.data_avaliacao||''))||String(x.timestamp||'').localeCompare(String(y.timestamp||''))})});
  cache.historyOrder=av.slice().sort(function(a,b){return String(b.data_avaliacao||'').localeCompare(String(a.data_avaliacao||''))||String(b.timestamp||'').localeCompare(String(a.timestamp||''))});
}
function calcMetrics(){
  sync();
  if(cache.metrics.version===S.version)return cache.metrics;
  var av=data(),sumG=0,cG=0,sumM=0,cM=0,photos=0;
  for(var i=0;i<av.length;i++){
    var g=pg(av[i]),m=mm(av[i]);
    if(g!=null&&g>0){sumG+=g;cG++}
    if(m!=null&&m>0){sumM+=m;cM++}
    if(hasFotos(av[i]))photos++;
  }
  cache.metrics={version:S.version,total:av.length,mediaG:cG?(sumG/cG).toFixed(1)+'%':'--%',mediaM:cM?(sumM/cM).toFixed(1)+' kg':'-- kg',photos:photos};
  return cache.metrics;
}
function setKpis(){
  var m=calcMetrics(), ids=[['kpi-total-avaliacoes',String(m.total)],['kpi-media-gordura',m.mediaG],['kpi-media-massa',m.mediaM],['kpi-com-fotos',String(m.photos)]];
  ids.forEach(function(x){var e=document.getElementById(x[0]);if(e)e.textContent=x[1]});
}
function matches(a,t){
  if(!t)return true;
  var q=norm(t),qd=String(t).replace(/\D/g,'');
  return norm(a.nome).indexOf(q)>-1||norm(a.email).indexOf(q)>-1||
    (a.whatsapp&&String(a.whatsapp).replace(/\D/g,'').indexOf(qd||'\u0000')>-1)||
    norm(a.checkin_semana).indexOf(q)>-1||String(a.data_avaliacao||'').indexOf(t)>-1;
}
function card(a){
  var b=a.bioimpedancia||{},d=a.dobras_resultado||{};
  var el=document.createElement('div');el.className='history-card';el.dataset.ef63Id=a.id;
  el.innerHTML='<div><div class="history-card-header"><div>'+
    '<div class="history-client-name">'+esc(a.nome)+'</div>'+
    '<div style="font-size:0.75rem;color:var(--text-muted);">'+esc(a.email||'')+'</div></div>'+
    '<span class="history-badge">'+esc(a.checkin_semana||'Check-in')+'</span>'+
    (retornoAtrasadoLocal(a)?' <span class="history-badge" style="background:#fee2e2;color:#b91c1c;">⏰ Retorno atrasado</span>':'')+
    '</div><div class="history-meta">'+
    '<span>📅 <strong>Data:</strong> '+formatarData(a.data_avaliacao)+' &bull; <strong>Retorno:</strong> '+(formatarData(a.data_proxima_avaliacao)||'Não definido')+'</span>'+
    '<span>🧬 <strong>%G Pollock:</strong> '+(d.percGordura?d.percGordura+'%':'-')+' &bull; <strong>%G BIA:</strong> '+(b.pgordura?b.pgordura+'%':'-')+'</span>'+
    '<span>📏 <strong>Soma Perimetria:</strong> '+(a.perimetria_soma?a.perimetria_soma+' cm':'-')+' &bull; <strong>IMC:</strong> '+(b.imc||'-')+'</span>'+
    '</div><div class="history-stats-preview">'+
    '<div class="history-stat-mini"><span class="h-val">'+(a.peso>0?a.peso.toFixed(1):'-')+'</span><span class="h-lbl">Peso (kg)</span></div>'+
    '<div class="history-stat-mini"><span class="h-val">'+(b.mme!=null?Number(b.mme).toFixed(1):'-')+'</span><span class="h-lbl">Massa Musc.</span></div>'+
    '<div class="history-stat-mini"><span class="h-val">'+(a.fotos&&a.fotos.frente?'Sim':'Não')+'</span><span class="h-lbl">Fotos</span></div>'+
    '</div></div>'+
    ''+
    '<div class="history-actions" style="display:flex;flex-wrap:wrap;gap:6px;">'+
    '<button class="btn btn-primary btn-sm" onclick="abrirVisualizacaoPacienteWeb(\''+jsEsc(a.id)+'\')">👁️ Visão do Aluno</button>'+
    ''+
    '<button class="btn btn-success btn-sm" onclick="imprimirAvaliacaoIndividualPDF(\''+jsEsc(a.id)+'\')">🖨️ PDF</button>'+
    '<button class="btn btn-secondary btn-sm" onclick="abrirModalDetalhes(\''+jsEsc(a.id)+'\')">🔍 Detalhes</button>'+
    '<button class="btn btn-warning btn-sm" onclick="editarAvaliacao(\''+jsEsc(a.id)+'\')">✏️</button>'+
    '<button class="btn btn-danger btn-sm" onclick="excluirAvaliacao(\''+jsEsc(a.id)+'\')">🗑️</button></div>';
  return el;
}
function updateHistory(filtro){
  ensureIndex();setKpis();
  var grid=document.getElementById('history-list-grid'),empty=document.getElementById('history-empty-state');
  if(!grid||!empty)return;
  var key=String(filtro||'').trim();
  var list=cache.filtered.get(key);
  if(!list){
    list=cache.historyOrder.filter(function(a){return matches(a,key)});
    cache.filtered.set(key,list);
  }
  var wanted=new Set(list.map(function(a){return a.id}));
  Array.prototype.slice.call(grid.children).forEach(function(node){
    if(!wanted.has(node.dataset.ef63Id))node.remove();
  });
  var fragment=document.createDocumentFragment();
  list.forEach(function(a,idx){
    var node=grid.querySelector('[data-ef63-id="'+CSS.escape(String(a.id))+'"]');
    if(!node){fragment.appendChild(card(a));}
  });
  if(fragment.childNodes.length)grid.appendChild(fragment);
  var current=Array.prototype.map.call(grid.children,function(x){return x.dataset.ef63Id});
  var wantedIds=list.map(function(a){return String(a.id)});
  if(current.join('|')!==wantedIds.join('|')){
    var frag2=document.createDocumentFragment();
    wantedIds.forEach(function(id){
      var node=grid.querySelector('[data-ef63-id="'+CSS.escape(id)+'"]');if(node)frag2.appendChild(node);
    });
    grid.appendChild(frag2);
  }
  var none=!list.length;
  empty.classList.toggle('hidden',!none);grid.classList.toggle('hidden',none);
}
function invalidate(id){
  sync();cache.metrics={};cache.panel=null;cache.compareKey='';cache.compareVersion=-1;
  if(id)cache.records.delete(id);
}
function patchSave(){
  var fn=window.salvarAvaliacaoNoDB;if(typeof fn!=='function'||fn.__ef63)return;
  var wrap=async function(registro){var r=await fn.apply(this,arguments);invalidate(registro&&registro.id);return r};wrap.__ef63=true;window.salvarAvaliacaoNoDB=wrap;
}
function patchDelete(){
  var fn=window.deletarAvaliacaoDoDB;if(typeof fn!=='function'||fn.__ef63)return;
  var wrap=async function(id){var r=await fn.apply(this,arguments);invalidate(id);return r};wrap.__ef63=true;window.deletarAvaliacaoDoDB=wrap;
}
function patchCharts(){
  if(typeof originalDonut==='function')window.renderDonutChartSvg=function(a,b){
    var k=String(a)+'|'+String(b);if(cache.chartDonut.has(k))return cache.chartDonut.get(k);
    var v=originalDonut.apply(this,arguments);cache.chartDonut.set(k,v);return v;
  };
  if(typeof originalBar==='function')window.renderBarChartSvg=function(a,b){
    var k=String(a)+'|'+String(b);if(cache.chartBar.has(k))return cache.chartBar.get(k);
    var v=originalBar.apply(this,arguments);cache.chartBar.set(k,v);return v;
  };
}
function patchHistory(){
  window.renderizarHistorico=function(filtroTexto){updateHistory(filtroTexto||'')};
}
function patchCompare(){
  if(typeof originalCompare!=='function')return;
  window.renderizarComparacao=function(){
    var b=document.getElementById('compare-baseline-select'),c=document.getElementById('compare-current-select');
    var key=(b?b.value:'')+'|'+(c?c.value:'');
    if(key&&cache.compareKey===key&&cache.compareVersion===S.version)return;
    originalCompare.apply(this,arguments);cache.compareKey=key;cache.compareVersion=S.version;
  };
}
function patchPdf(){
  // PDF sempre é montado de novo, preservando a chamada direta de impressão.
  // O atalho anterior fechava print-mode-single em 1000ms e podia gerar PDF vazio.
  if(typeof originalPdf!=='function')return;
  window.imprimirAvaliacaoIndividualPDF=function(){
    return originalPdf.apply(this,arguments);
  };
}
function patchPainel(){
  var originalSwitch=window.switchTab;
  if(typeof originalSwitch!=='function'||originalSwitch.__ef63)return;
  var wrap=function(id){
    if(id==='tab-painel'&&cache.panel===S.version){
      document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.toggle('active',p.id===id)});
      document.querySelectorAll('.nav-tab-btn').forEach(function(b){b.classList.toggle('active',b.id==='tab-btn-painel')});
      return;
    }
    var r=originalSwitch.apply(this,arguments);
    if(id==='tab-painel')cache.panel=S.version;
    return r;
  };
  wrap.__ef63=true;window.switchTab=wrap;
}
patchSave();patchDelete();patchCharts();patchHistory();patchCompare();patchPdf();patchPainel();

var oldFilter=window.filtrarAvaliacoes;
window.filtrarAvaliacoes=function(){
  var input=document.getElementById('filtro-busca');updateHistory(input?input.value:'');
};

window.EF63={
  stats:function(){ensureIndex();return{
    version:S.version,records:data().length,indexedRecords:cache.records.size,
    indexedNames:cache.byName.size,historyCache:cache.filtered.size,
    donutCache:cache.chartDonut.size,barCache:cache.chartBar.size,pdfCache:cache.pdf.size
  }},
  invalidate:function(){invalidate();},
  renderHistory:function(f){updateHistory(f||'')}
};

window.addEventListener('DOMContentLoaded',function(){
  setTimeout(function(){
    ensureIndex();
    calcMetrics();
  },0);
});
})();
