/* 20-runtime.js */
(function(){
'use strict';
if(window.EFDiag&&window.EFDiag.mounted)return;
var running=false,lastResults=[];
var $=function(id){return document.getElementById(id)};
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ensureUI(){
 var nav=document.querySelector('.nav-tabs'),panel=$('tab-diagnostics');
 if(nav&&!$('tab-btn-diagnostics'))nav.insertAdjacentHTML('beforeend','<button class="nav-tab-btn" id="tab-btn-diagnostics" type="button" onclick="switchTab(\'tab-diagnostics\')"><span>🩺</span> <span>Diagnóstico</span></button>');
 if(!panel){panel=document.createElement('section');panel.id='tab-diagnostics';panel.className='tab-panel';var lab=$('tab-lab77'),cmp=$('tab-comparison');if(lab&&lab.parentNode)lab.parentNode.insertBefore(panel,lab.nextSibling);else if(cmp&&cmp.parentNode)cmp.parentNode.insertBefore(panel,cmp.nextSibling);else document.body.appendChild(panel)}
 if(!panel.querySelector('.efdiag-wrap'))panel.innerHTML='<div class="efdiag-wrap"><header class="efdiag-head"><div><h2>Diagnóstico do aplicativo</h2><p>Testes locais de integridade, módulos, cálculos e componentes principais. As verificações são somente leitura; nenhuma avaliação é salva, alterada ou apagada.</p></div></header><div class="efdiag-card"><div class="efdiag-actions"><button class="efdiag-btn primary" id="efdiag-run" type="button">▶ Executar testes</button><button class="efdiag-btn repair" id="efdiag-repair" type="button">🛠 Autocorreção segura</button><span class="efdiag-summary" id="efdiag-summary" role="status">Aguardando teste</span></div><div class="efdiag-results" id="efdiag-results" aria-live="polite"><p class="efdiag-note">Execute os testes para verificar o estado atual. A autocorreção só limpa caches derivados e recompõe elementos visuais seguros; não altera dados nem corrige código-fonte.</p></div><p class="efdiag-note">Cobertura: módulos e APIs expostos, estado local, consistência básica de dados, motor analítico, cálculos do Lab e áreas essenciais de interface/impressão. Integrações externas, impressão física e todos os caminhos possíveis de uso não podem ser provados automaticamente.</p></div></div>';
 bindButtons();
 return !!nav&&!!panel;
}
function setStatus(text,kind){var e=$('efdiag-summary');if(e){e.textContent=text;e.className='efdiag-summary'+(kind?' '+kind:'')}}
function renderRows(rows,repairBanner){
 lastResults=rows.slice();var host=$('efdiag-results');if(!host)return;
 var bannerHTML=repairBanner?'<div class="efdiag-row" style="border-color:rgba(16,185,129,0.45);"><span class="efdiag-badge pass">REPARO</span><b>Autocorreção segura concluída</b><p>'+esc(repairBanner)+'</p></div>':'';
 host.innerHTML=bannerHTML+(rows.length?rows.map(function(r){var label=r.state==='pass'?'OK':r.state==='warn'?'AVISO':'FALHA';return'<div class="efdiag-row"><span class="efdiag-badge '+r.state+'">'+label+'</span><b>'+esc(r.name)+'</b><p>'+esc(r.detail)+'</p></div>'}).join(''):'<p class="efdiag-note">Nenhum resultado.</p>');
 var fail=rows.filter(function(x){return x.state==='fail'}).length,warn=rows.filter(function(x){return x.state==='warn'}).length,pass=rows.filter(function(x){return x.state==='pass'}).length;
 setStatus(pass+' OK · '+warn+' aviso(s) · '+fail+' falha(s)',fail?'fail':warn?'warn':'ok');
}
function check(rows,name,fn){try{var v=fn();if(v&&typeof v.then==='function')return v.then(function(detail){rows.push({name:name,state:'pass',detail:String(detail||'Verificação concluída.')})},function(e){rows.push({name:name,state:'fail',detail:e&&e.message||String(e)})});rows.push({name:name,state:'pass',detail:String(v||'Verificação concluída.')});return Promise.resolve()}catch(e){rows.push({name:name,state:'fail',detail:e&&e.message||String(e)});return Promise.resolve()}}
async function runTests(repairBanner){
 if(running)return;running=true;var b=$('efdiag-run'),fix=$('efdiag-repair');if(b)b.disabled=true;if(fix)fix.disabled=true;setStatus('Executando…','');var rows=[],S=window.__EF63_STATE__,records=[];
 await check(rows,'Estado e avaliações',function(){if(!S||typeof S.getAvaliacoes!=='function')throw Error('Estado central EF63 indisponível.');records=S.getAvaliacoes();if(!Array.isArray(records))throw Error('A lista de avaliações não é um array.');return records.length+' avaliação(ões) lidas; sem gravação.'});
 await check(rows,'Módulos e APIs',function(){var ids=['EFU','EF6','EF63','EF64','EF65','EF66','EF67','EF68','EF70','EF71','EF72','EF73','EF77','EF781'];var miss=ids.filter(function(k){return !window[k]||typeof window[k]!=='object'});if(miss.length)throw Error('Módulos ausentes: '+miss.join(', '));if(typeof window.EFU.num!=='function'||typeof window.EFU.norm!=='function'||typeof window.EFU.esc!=='function')throw Error('API utilitária EFU incompleta.');return ids.length+' módulos presentes; API utilitária íntegra.'});
 await check(rows,'Integridade básica dos dados',function(){if(!Array.isArray(records))throw Error('Não foi possível ler dados.');var noId=records.filter(function(x){return !x||x.id==null||String(x.id)===''}).length,dups=new Set(),seen=new Set();records.forEach(function(x){if(x&&x.id!=null){var k=String(x.id);if(seen.has(k))dups.add(k);seen.add(k)}});if(noId)throw Error(noId+' avaliação(ões) sem identificador.');if(dups.size)return'IDs únicos verificados; '+dups.size+' identificador(es) repetido(s) merecem revisão.';return records.length?records.length+' registros com identificadores; sem exposição de dados pessoais.':'Base vazia, pronta para receber avaliações.'});
 await check(rows,'Autoteste matemático do Lab',function(){if(!window.EF77||typeof EF77.selfTest!=='function')throw Error('Autoteste do Lab indisponível.');var r=EF77.selfTest();if(!r||!r.ok)throw Error((r&&r.failed||['Falha no autoteste']).join('; '));return r.total+' casos numéricos passaram.'});
 await check(rows,'Motor de histórico EF67',function(){var r=EF67.summary();if(!r||typeof r.records!=='number'||!r.averages)throw Error('Resumo do histórico retornou estrutura inválida.');return r.records+' registros indexados; API respondeu.'});
 await check(rows,'Motor de insights EF68',function(){var r=EF68.all();if(!r||!Array.isArray(r.studentsData)||!Array.isArray(r.events))throw Error('Resposta do motor EF68 incompleta.');return r.studentsData.length+' aluno(s), '+r.events.length+' evento(s) analisados.'});
 await check(rows,'Motor de decisão EF70',function(){var r=EF70.all();if(!r||!Array.isArray(r.studentsData)||!Array.isArray(r.events))throw Error('Resposta do motor EF70 incompleta.');return r.studentsData.length+' aluno(s), '+r.events.length+' evento(s) analisados.'});
 await check(rows,'Comparador EF72 / monitor EF73',function(){var sentinel='__efdiag_sem_aluno__';if(EF72.compare(sentinel)!==null)throw Error('Consulta de comparação vazia não retornou nulo.');if(EF73.student(sentinel)!==null)throw Error('Consulta de monitoramento vazia não retornou nulo.');return'Consultas sem correspondência tratadas sem exceção.'});
 await check(rows,'Worker e motores auxiliares',function(){var stats=[EF63.stats(),EF64.stats(),EF65.stats(),EF66.stats()];if(stats.some(function(x){return !x||typeof x!=='object'}))throw Error('Um ou mais motores não devolveram estado.');var pending=stats.some(function(x){return Number(x.pending||0)>0||Number(x.active||0)>0});return pending?'APIs responsivas; há tarefa de cálculo ainda em andamento.':'Quatro motores responderam; estado consultado sem executar cálculo em lote.'});
 await check(rows,'Interface e impressão',function(){var ids=['tab-btn-lab77','tab-lab77','ef77-out','tab-comparison','single-print-wrapper','ef77-print','tab-painel','history-list-grid'];var missing=ids.filter(function(id){return !$(id)});if(missing.length)throw Error('Elementos essenciais ausentes: '+missing.join(', '));if(typeof window.switchTab!=='function')throw Error('Navegação entre abas não disponível.');if(!EF77.exportPDF1||typeof EF77.exportPDF1!=='function')throw Error('Exportação PDF do Lab indisponível.');return ids.length+' elementos essenciais e ação de PDF presentes.'});
 renderRows(rows,typeof repairBanner==='string'?repairBanner:null);running=false;if(b)b.disabled=false;if(fix)fix.disabled=false;return rows;
}
async function safeRepair(){
 if(running)return;running=true;var b=$('efdiag-run'),fix=$('efdiag-repair');if(b)b.disabled=true;if(fix)fix.disabled=true;setStatus('Aplicando reparos seguros…','warn');var ops=[],S=window.__EF63_STATE__;
 try{
  document.body.classList.remove('print-mode-single','print-mode-comparison');
  document.body.classList.add('ef-simple-ui');
  if(!$('tab-lab77')&&window.EF77&&typeof EF77.mount==='function'){EF77.mount();ops.push('remontagem do Lab')}
  if(!$('tab-btn-lab77')){var nav=document.querySelector('.nav-tabs');if(nav){nav.insertAdjacentHTML('beforeend','<button class="nav-tab-btn" id="tab-btn-lab77" type="button" onclick="switchTab(\'tab-lab77\')"><span>🧪</span> <span>Lab</span></button>');ops.push('botão do Lab recriado')}}
  if(!$('ef77-print')){var print=document.createElement('div');print.id='ef77-print';print.setAttribute('aria-hidden','true');document.body.appendChild(print);ops.push('área de impressão do Lab recriada')}
  var invalidators=[['EF63','invalidate'],['EF64','clear'],['EF65','invalidate'],['EF66','invalidate'],['EF67','invalidate'],['EF68','invalidate'],['EF70','invalidate'],['EF71','invalidate'],['EF72','invalidate'],['EF73','invalidate']];
  var cleared=0;
  invalidators.forEach(function(x){var api=window[x[0]],fn=api&&api[x[1]];if(typeof fn==='function'){fn.call(api);cleared++}});
  if(cleared)ops.push(cleared+' caches analíticos limpos');
  if(S&&typeof S.getAvaliacoes==='function')S.getAvaliacoes();
  ensureUI();
  var topNav=document.querySelector('.top-navbar'),tools=$('ef-tools'),sup=$('ef-support-section'),pref=$('ef-preferences-section');
  if(topNav){topNav.scrollLeft=0;topNav.scrollTop=0;}
  if(tools){tools.hidden=false;tools.style.display='';if(topNav&&tools.parentNode!==topNav)topNav.appendChild(tools);}
  [sup,pref].forEach(function(sec){if(sec){sec.hidden=false;sec.style.display='';}});
  if(window.EFSimpleUI){
   if(typeof window.EFSimpleUI.arrangeNavigation==='function')window.EFSimpleUI.arrangeNavigation();
   if(typeof window.EFSimpleUI.arrangeDetails==='function')window.EFSimpleUI.arrangeDetails();
   ops.push('menu lateral e navegação recompostos');
  }
  if(typeof window.atualizarContadorHistorico==='function')window.atualizarContadorHistorico();
  if(typeof window.preencherSeletoresComparacao==='function')window.preencherSeletoresComparacao();
  if(typeof window.renderizarHistorico==='function')window.renderizarHistorico();
  if(typeof window.atualizarBotoesTema==='function')window.atualizarBotoesTema(document.documentElement.classList.contains('ef-dark-mode'));
 }catch(e){ops.push('reparo interrompido: '+(e&&e.message||e))}
 running=false;if(b)b.disabled=false;if(fix)fix.disabled=false;
 var summaryMsg=(ops.length?ops.join('; '):'nenhuma ação de reparo necessária')+'. Dados de avaliações preservados.';
 await runTests(summaryMsg);
 if(typeof window.efToast==='function')window.efToast('🛠 Autocorreção concluída: '+ops.length+' ação(ões) aplicada(s).','ok');
}
function bindButtons(){
 var run=$('efdiag-run'),fix=$('efdiag-repair');
 if(run&&!run.__efdiag){run.addEventListener('click',function(){runTests()});run.__efdiag=true}
 if(fix&&!fix.__efdiag){fix.addEventListener('click',safeRepair);fix.__efdiag=true}
}
function mount(){
 ensureUI();
 var old=window.switchTab;if(typeof old==='function'&&!old.__efdiag){var wrapped=function(id){var r=old.apply(this,arguments);if(id==='tab-diagnostics'){document.querySelectorAll('.nav-tab-btn').forEach(function(x){x.classList.remove('active')});var b=$('tab-btn-diagnostics');if(b)b.classList.add('active')}return r};wrapped.__efdiag=true;window.switchTab=wrapped}
 bindButtons();
}
window.EFDiag={version:'1.1',mounted:true,run:function(){return runTests()},repair:safeRepair,results:function(){return lastResults.slice()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
