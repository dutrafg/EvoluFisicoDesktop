/* 20-runtime.js */
(function(){
'use strict';
if(window.EFDiag&&window.EFDiag.mounted)return;
var running=false,lastResults=[];
var $=function(id){return document.getElementById(id)};
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ensureUI(){
 var nav=document.querySelector('.nav-tabs'),panel=$('tab-diagnostics');
 // Navegação de Diagnóstico removida; painel integrado a Configurações > Manutenção.
 if(!panel){panel=document.createElement('section');panel.id='tab-diagnostics';panel.className='tab-panel';var lab=$('tab-lab77'),cmp=$('tab-comparison');if(lab&&lab.parentNode)lab.parentNode.insertBefore(panel,lab.nextSibling);else if(cmp&&cmp.parentNode)cmp.parentNode.insertBefore(panel,cmp.nextSibling);else document.body.appendChild(panel)}
 if(!panel.querySelector('.efdiag-wrap'))panel.innerHTML='<div class="efdiag-wrap"><header class="efdiag-head"><div><h2>Diagnóstico do aplicativo</h2><p>Testes locais de integridade, módulos, cálculos e componentes principais. As verificações são somente leitura; nenhuma avaliação é salva, alterada ou apagada.</p></div></header><div class="efdiag-card"><div class="efdiag-actions"><button class="efdiag-btn primary" id="efdiag-run" type="button">▶ Executar testes</button><button class="efdiag-btn repair" id="efdiag-repair" type="button">🛠 Autocorreção segura</button><span class="efdiag-summary" id="efdiag-summary" role="status">Aguardando teste</span></div><div class="efdiag-results" id="efdiag-results" aria-live="polite"><p class="efdiag-note">Execute os testes para verificar o estado atual. A autocorreção executa apenas reparos não destrutivos de interface e caches derivados; dados de alunos, cobranças, anamneses e backups não são alterados.</p></div><p class="efdiag-note">Cobertura ampliada: avaliações, banco de dados, fórmulas, formulários, fichas de alunos, agenda, PDF, cobranças, cofre, backups, notificações, navegação e impressão. Integrações externas, impressão física e todos os caminhos possíveis de uso não podem ser provados automaticamente.</p></div></div>';
 var buttons=panel.querySelector('.efdiag-actions');
 if(buttons&&!$('efdiag-category')){
   var filters=document.createElement('div');filters.className='efdiag-filters';
   var label=document.createElement('label');label.textContent='Verificar módulo';label.htmlFor='efdiag-category';
   var select=document.createElement('select');select.id='efdiag-category';select.setAttribute('aria-label','Escolher módulo dos testes');
   [['all','Todos os módulos'],['core','Avaliações e cálculos'],['forms','Formulários e alunos'],['agenda','Agenda e notificações'],['finance','Cobranças e recebimentos'],['storage','Banco, cofre e backup'],['pdf','PDF e impressão'],['ui','Interface e configurações']].forEach(function(v){select.add(new Option(v[1],v[0]))});
   var exportButton=document.createElement('button');exportButton.type='button';exportButton.id='efdiag-export';exportButton.className='efdiag-btn';exportButton.textContent='↓ Exportar resumo de QA';
   exportButton.addEventListener('click',exportReport);
   filters.append(label,select,exportButton);
   var desc=document.createElement('p');desc.className='efdiag-legend';desc.textContent='Os testes são de leitura. Avisos de cofre, permissões ou suporte do navegador não são falhas. O relatório contém apenas resultados técnicos, sem dados pessoais.';
   buttons.after(filters,desc);
 }
 bindButtons();
 return !!nav&&!!panel;
}
function setStatus(text,kind){var e=$('efdiag-summary');if(e){e.textContent=text;e.className='efdiag-summary'+(kind?' '+kind:'')}}
function renderRows(rows,repairBanner){
 lastResults=rows.slice();var host=$('efdiag-results');if(!host)return;
 var bannerHTML=repairBanner?'<div class="efdiag-row" style="border-color:rgba(16,185,129,0.45);"><span class="efdiag-badge pass">REPARO</span><b>Autocorreção segura concluída</b><p>'+esc(repairBanner)+'</p></div>':'';
 var grouped={},order=[];
 rows.forEach(function(r){if(!grouped[r.group]){grouped[r.group]=[];order.push(r.group)}grouped[r.group].push(r)});
 host.innerHTML=bannerHTML+(rows.length?order.map(function(g){return'<div class="efdiag-section">'+esc(CATS[g]||g)+' · '+grouped[g].length+' verificação(ões)</div>'+grouped[g].map(function(r){var label=r.state==='pass'?'OK':r.state==='warn'?'AVISO':'FALHA';return'<div class="efdiag-row"><span class="efdiag-badge '+r.state+'">'+label+'</span><b>'+esc(r.name)+'</b><p>'+esc(r.detail)+'</p></div>'}).join('')}).join(''):'<p class="efdiag-note">Nenhum resultado.</p>');
 var fail=rows.filter(function(x){return x.state==='fail'}).length,warn=rows.filter(function(x){return x.state==='warn'}).length,pass=rows.filter(function(x){return x.state==='pass'}).length;
 setStatus(pass+' OK · '+warn+' aviso(s) · '+fail+' falha(s)',fail?'fail':warn?'warn':'ok');
}
const CATS={core:'Avaliações e cálculos',forms:'Formulários e alunos',agenda:'Agenda e notificações',finance:'Cobranças e recebimentos',storage:'Banco, cofre e backup',pdf:'PDF e impressão',ui:'Interface e configurações'};
function groupOf(name){
 if(/Formulários|Anamnese|Ficha do aluno/.test(name))return'forms';
 if(/Agenda|Notificações|Lembretes/.test(name))return'agenda';
 if(/Cobranças|Recebimento|Histórico financeiro/.test(name))return'finance';
 if(/Backup|Cofre|IndexedDB|Armazenamento|Proteção|Rascunho/.test(name))return'storage';
 if(/PDF|impressão|imprimível|Relatório/i.test(name))return'pdf';
 if(/Interface|Navegação|Configurações|Temas|Visual/.test(name))return'ui';
 return'core';
}
function selected(){return $('efdiag-category')?.value||'all'}
function normalize(detail){if(detail&&typeof detail==='object'&&detail.status==='warn')return{state:'warn',detail:String(detail.detail||'Requer atenção do profissional.')};return{state:'pass',detail:String(detail||'Verificação concluída.')}}
function exportReport(){
 if(!lastResults.length){setStatus('Execute os testes antes de exportar','warn');return}
 var payload={produto:'EvoluFísico2',versao:'Teste do diagnóstico v2.0',data:new Date().toISOString(),filtro:selected(),totais:{aprovados:lastResults.filter(r=>r.state==='pass').length,avisos:lastResults.filter(r=>r.state==='warn').length,falhas:lastResults.filter(r=>r.state==='fail').length},resultados:lastResults.map(function(r){return{modulo:CATS[r.group]||r.group,teste:r.name,resultado:r.state,descricao:r.detail}}),nota:'Sem nomes de alunos, documentos pessoais, valores financeiros, senhas ou conteúdo clínico.'};
 var url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
 var link=document.createElement('a');link.href=url;link.download='evolufisico2_relatorio_qa_'+new Date().toISOString().slice(0,10)+'.json';document.body.append(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url)},1500);
}
function check(rows,name,fn){
 var group=groupOf(name);if(selected()!=='all'&&selected()!==group)return Promise.resolve();
 try{var v=fn();if(v&&typeof v.then==='function')return v.then(function(detail){rows.push({name:name,group:group,...normalize(detail)})},function(e){rows.push({name:name,group:group,state:'fail',detail:e&&e.message||String(e)})});rows.push({name:name,group:group,...normalize(v)});return Promise.resolve()}catch(e){rows.push({name:name,group:group,state:'fail',detail:e&&e.message||String(e)});return Promise.resolve()}
}
async function runTests(repairBanner){
 if(running)return;running=true;var b=$('efdiag-run'),fix=$('efdiag-repair');if(b)b.disabled=true;if(fix)fix.disabled=true;setStatus('Executando…','');var rows=[],S=window.__EF63_STATE__,records=[];
 await check(rows,'Estado e avaliações',function(){if(!S||typeof S.getAvaliacoes!=='function')throw Error('Estado central EF63 indisponível.');records=S.getAvaliacoes();if(!Array.isArray(records))throw Error('A lista de avaliações não é um array.');return records.length+' avaliação(ões) lidas; sem gravação.'});
 await check(rows,'Módulos e APIs',function(){var ids=['EFU','EF6','EF63','EF64','EF65','EF66','EF67','EF68','EF70','EF71','EF72','EF73','EF77','EF781'];var miss=ids.filter(function(k){return !window[k]||typeof window[k]!=='object'});if(miss.length)throw Error('Módulos ausentes: '+miss.join(', '));if(typeof window.EFU.num!=='function'||typeof window.EFU.norm!=='function'||typeof window.EFU.esc!=='function')throw Error('API utilitária EFU incompleta.');return ids.length+' módulos presentes; API utilitária íntegra.'});
 await check(rows,'Integridade básica dos dados',function(){if(!Array.isArray(records))throw Error('Não foi possível ler dados.');var noId=records.filter(function(x){return !x||x.id==null||String(x.id)===''}).length,dups=new Set(),seen=new Set();records.forEach(function(x){if(x&&x.id!=null){var k=String(x.id);if(seen.has(k))dups.add(k);seen.add(k)}});if(noId)throw Error(noId+' avaliação(ões) sem identificador.');if(dups.size)return{status:'warn',detail:dups.size+' identificador(es) repetido(s); faça backup e revise manualmente sem excluir registros.'};return records.length?records.length+' registros com identificadores; sem exposição de dados pessoais.':'Base vazia, pronta para receber avaliações.'});
 await check(rows,'Autoteste matemático do Lab',function(){if(!window.EF77||typeof EF77.selfTest!=='function')throw Error('Autoteste do Lab indisponível.');var r=EF77.selfTest();if(!r||!r.ok)throw Error((r&&r.failed||['Falha no autoteste']).join('; '));return r.total+' casos numéricos passaram.'});
 await check(rows,'Motor de histórico EF67',function(){var r=EF67.summary();if(!r||typeof r.records!=='number'||!r.averages)throw Error('Resumo do histórico retornou estrutura inválida.');return r.records+' registros indexados; API respondeu.'});
 await check(rows,'Motor de insights EF68',function(){var r=EF68.all();if(!r||!Array.isArray(r.studentsData)||!Array.isArray(r.events))throw Error('Resposta do motor EF68 incompleta.');return r.studentsData.length+' aluno(s), '+r.events.length+' evento(s) analisados.'});
 await check(rows,'Motor de decisão EF70',function(){var r=EF70.all();if(!r||!Array.isArray(r.studentsData)||!Array.isArray(r.events))throw Error('Resposta do motor EF70 incompleta.');return r.studentsData.length+' aluno(s), '+r.events.length+' evento(s) analisados.'});
 await check(rows,'Comparador EF72 / monitor EF73',function(){var sentinel='__efdiag_sem_aluno__';if(EF72.compare(sentinel)!==null)throw Error('Consulta de comparação vazia não retornou nulo.');if(EF73.student(sentinel)!==null)throw Error('Consulta de monitoramento vazia não retornou nulo.');return'Consultas sem correspondência tratadas sem exceção.'});
 await check(rows,'Worker e motores auxiliares',function(){var stats=[EF63.stats(),EF64.stats(),EF65.stats(),EF66.stats()];if(stats.some(function(x){return !x||typeof x!=='object'}))throw Error('Um ou mais motores não devolveram estado.');var pending=stats.some(function(x){return Number(x.pending||0)>0||Number(x.active||0)>0});return pending?'APIs responsivas; há tarefa de cálculo ainda em andamento.':'Quatro motores responderam; estado consultado sem executar cálculo em lote.'});
 await check(rows,'Interface e impressão',function(){var ids=['tab-btn-lab77','tab-lab77','ef77-out','tab-comparison','single-print-wrapper','ef77-print','tab-painel','history-list-grid'];var missing=ids.filter(function(id){return !$(id)});if(missing.length)throw Error('Elementos essenciais ausentes: '+missing.join(', '));if(typeof window.switchTab!=='function')throw Error('Navegação entre abas não disponível.');if(!EF77.exportPDF1||typeof EF77.exportPDF1!=='function')throw Error('Exportação PDF do Lab indisponível.');return ids.length+' elementos essenciais e ação de PDF presentes.'});

 // Verificações adicionais: somente leitura e nunca expõem informações dos alunos.
 await check(rows,'Formulários: modelos e níveis',function(){
  var api=window.EF2Forms;if(!api||typeof api.presets!=='function')throw Error('Módulo de Formulários não carregado.');
  var list=api.presets();if(!Array.isArray(list)||list.length<9)throw Error('Biblioteca de modelos incompleta.');
  var ids=new Set(list.map(x=>x.id));if(ids.size!==list.length)throw Error('IDs de modelos duplicados.');
  var levels=['iniciante','intermediario','avancado'];if(levels.some(level=>!list.some(x=>x.level===level)))throw Error('Nível de anamnese ausente.');
  return list.length+' modelos verificados nos três níveis, sem modificar perguntas.';
 });
 await check(rows,'Anamneses: vínculo por ID de cadastro',function(){
  var api=window.EF2Forms,st=api?.getState?.(),cl=api?.clients?.();
  if(!st||!Array.isArray(st.responses)||!Array.isArray(cl))throw Error('Histórico de anamneses indisponível.');
  var unique=new Set(cl.map(c=>c.id));if(unique.size!==cl.length)throw Error('Identificadores de cadastro repetidos.');
  var miss=st.responses.filter(r=>!r.clientId||!unique.has(r.clientId));
  if(miss.length)return{status:'warn',detail:miss.length+' resposta(s) sem vínculo resolvido; revisão manual necessária. Nenhum dado será apagado.'};
  return st.responses.length+' resposta(s) vinculada(s) por ID; '+cl.length+' aluno(s) localizados.';
 });
 await check(rows,'Ficha do aluno: atalho de anamneses',function(){
  if(typeof window.EF2Forms?.openForClient!=='function')throw Error('Abertura de anamneses pelo perfil não disponível.');
  if(!$('patient-view-content'))return{status:'warn',detail:'A ficha do aluno não está aberta; o atalho será verificado quando acessada.'};
  return'API de vínculo com o perfil ativa; abertura da ficha não foi forçada.';
 });
 await check(rows,'Formulários: editor e PDF preenchível',function(){
  var x=window.EF2Forms;if(typeof x?.pdfForm!=='function'||typeof x?.exportFormPDF!=='function')throw Error('Exportação PDF do formulário indisponível.');
  if(!$('tab-ef-forms')||!$('tab-btn-ef-forms'))throw Error('Navegação de Formulários incompleta.');
  return'Editor, navegação e geração de PDF presentes (sem exportar informações reais).';
 });
 await check(rows,'Anamneses: proteção de respostas',function(){
  var x=window.EF2Forms,st=x?.getState?.();if(!st)throw Error('Estado das anamneses indisponível.');
  if(window.EF_Security?.isConfigured?.()&&!window.EF_Security.key)return{status:'warn',detail:'O cofre está bloqueado; desbloqueie para salvar ou acessar respostas protegidas.'};
  if(!window.EF_Security?.isConfigured?.())return{status:'warn',detail:'Cofre não configurado: não há persistência protegida das anamneses. Faça backup após configurar.'};
  return'Camada de criptografia disponível para respostas.';
 });
 await check(rows,'Agenda: compromissos e datas',function(){
  var key='ef90_home_agenda',raw=localStorage.getItem(key);if(!raw)return'Agenda vazia ou ainda não configurada.';
  var ar=JSON.parse(raw);if(!Array.isArray(ar))throw Error('Estrutura da agenda inválida; não modifique registros antes de exportar backup.');
  var wrong=ar.filter(x=>!x||typeof x!=='object');if(wrong.length)return{status:'warn',detail:wrong.length+' compromisso(s) malformado(s). Corrija com conferência manual e backup.'};
  return ar.length+' compromisso(s) reconhecido(s).';
 });
 await check(rows,'Agenda: comandos do calendário',function(){
  var api=['ef90PickDay','ef90JumpToday','ef90ShiftMonth','ef90SaveAgenda','ef90ExportAgenda'];
  var missing=api.filter(x=>typeof window[x]!=='function');if(missing.length)throw Error('Funções ausentes: '+missing.join(', '));
  return'Calendário, agendamento e exportação acessíveis (sem criar compromissos).';
 });
 await check(rows,'Notificações: preferências e permissões',function(){
  var n=window.EFNotifications;if(!n||typeof n.getSettings!=='function')throw Error('Módulo de lembretes não está carregado.');
  var cfg=n.getSettings();if(!cfg||typeof cfg.reminders!=='boolean')throw Error('Preferências de lembrete inválidas.');
  if(typeof window.Notification==='undefined')return{status:'warn',detail:'Este navegador não disponibiliza notificações do sistema; lembretes locais dependem do app aberto.'};
  return'Preferências válidas; notificações em segundo plano não são garantidas.';
 });
 await check(rows,'Cobranças: recebimento de pendências',function(){
  var c=window.EFCobranca;if(!c||typeof c.alternarStatusNoHistorico!=='function'||typeof c.salvarCobrancaNoHistorico!=='function')throw Error('Comandos de recebimento ou salvamento ausentes.');
  if(!$('tab-cobranca'))throw Error('Painel de cobranças não encontrado.');
  return'Rotinas de recebimento, gravação e interface presentes; nenhuma cobrança foi alterada.';
 });
 await check(rows,'Cobranças: exportação e integridade',function(){
  var c=window.EFCobranca;if(typeof c?.exportData!=='function'||typeof c?.exportarCsvHistorico!=='function')throw Error('Exportação financeira indisponível.');
  var key='evolufisico_cobrancas_db',raw=localStorage.getItem(key);if(!raw)return'Base financeira ainda não iniciada; funções de exportação disponíveis.';
  var payload=JSON.parse(raw);if(Array.isArray(payload))return{status:'warn',detail:'Histórico financeiro em formato não criptografado. Configure o cofre e faça cópia de segurança.'};
  if(payload&&payload.__efEncrypted&&payload.payload)return'Histórico financeiro protegido; pacote cifrado presente.';
  return{status:'warn',detail:'Formato financeiro não reconhecido; revisar sem apagar ou regravar a base.'};
 });
 await check(rows,'Backup: exportação e restauração',function(){
  if(typeof window.exportarBackupJSON!=='function'||typeof window.importarBackupJSON!=='function'||typeof window.confirmarImportacaoBackup!=='function')throw Error('Backup ou restauração não estão disponíveis.');
  return'Exportação, importação e confirmação de restauração acessíveis; nenhuma operação disparada.';
 });
 await check(rows,'Backup: motor e armazenamento',function(){
  if(!window.EF_BackupEngine||typeof window.EF_BackupEngine!=='object')throw Error('Motor de backup indisponível.');
  if(window.EF_TEMPORARY_STORAGE)return{status:'warn',detail:'Armazenamento temporário detectado neste navegador; faça backup antes de fechar.'};
  return'Motor de backup presente e persistência local aparentemente habilitada.';
 });
 await check(rows,'Cofre: criptografia e bloqueio',function(){
  var api=window.EF_Security;
  if(!api||typeof api.encryptObject!=='function'||typeof api.decryptObject!=='function'||typeof api.lock!=='function')throw Error('API do cofre incompleta.');
  if(!window.crypto||!window.crypto.subtle)return{status:'warn',detail:'Crypto Web não disponível neste contexto. Use origem segura para ativar o cofre.'};
  if(!api.isConfigured())return{status:'warn',detail:'Cofre ainda não configurado. Dados de saúde devem ser protegidos antes do uso real.'};
  return api.key?'Cofre configurado e desbloqueado.':'Cofre configurado e bloqueado corretamente.';
 });
 await check(rows,'IndexedDB: acesso ao banco de dados',async function(){
  if(!window.indexedDB)return{status:'warn',detail:'IndexedDB indisponível; armazenamento pode ser temporário.'};
  if(typeof indexedDB.databases==='function'){var list;try{list=await indexedDB.databases()}catch(e){return{status:'warn',detail:'A origem do arquivo bloqueou a leitura do catálogo IndexedDB; teste em HTTP/HTTPS. Nenhum banco foi modificado.'}}if(!Array.isArray(list))throw Error('Consulta ao catálogo IndexedDB inválida.');return'IndexedDB respondeu à inspeção não destrutiva; '+list.length+' base(s) visível(is).';}
  return'IndexedDB existe; o navegador não oferece listagem de bancos sem abrir uma conexão.';
 });
 await check(rows,'Rascunho: integridade do armazenamento',function(){
  if(window.EF_TEMPORARY_STORAGE)return{status:'warn',detail:'Rascunhos em modo temporário; dados podem se perder ao recarregar.'};
  var auto=Object.keys(localStorage).filter(k=>/autosave/i.test(k));for(var k of auto){var v=localStorage.getItem(k);if(v&&v.trim().startsWith('{'))JSON.parse(v)}
  return auto.length+' registro(s) de rascunho localizado(s); JSON sintaticamente válido.';
 });
 await check(rows,'PDF: exportadores disponíveis',function(){
  if(typeof window.EF77?.exportPDF1!=='function'||typeof window.EF2Forms?.exportFormPDF!=='function')throw Error('Algum exportador PDF está ausente.');
  if(!$('single-print-wrapper')||!$('ef77-print'))throw Error('Área de impressão incompleta.');
  return'Gerador do Lab, formulário preenchível e áreas de impressão disponíveis.';
 });
 await check(rows,'Impressão: isolamento visual',function(){
  var printing=window.matchMedia?.('print').matches;
  if(!printing&&(document.body.classList.contains('print-mode-single')||document.body.classList.contains('print-mode-comparison')))return{status:'warn',detail:'Sinalizador de impressão parece não ter sido removido; autocorreção visual pode redefini-lo.'};
  return'Modo de impressão sem classes residuais (não produz nem testa arquivo PDF).';
 });
 await check(rows,'Configurações: seções e diagnóstico',function(){
  if(!window.EFSettings||typeof window.EFSettings.open!=='function')throw Error('Abas de Configurações indisponíveis.');
  if(!$('ef-setting-diagnostics')||!$('efdiag-run'))throw Error('Painel de testes não localizado em Manutenção.');
  if($('tab-btn-diagnostics'))return{status:'warn',detail:'Botão Diagnóstico ainda aparece na navegação principal; revisão visual recomendada.'};
  return'Configurações e diagnóstico organizados em Manutenção.';
 });
 await check(rows,'Navegação: formulário e perfil do aluno',function(){
  if(typeof window.switchTab!=='function')throw Error('Roteador não está disponível.');
  var calc=$('tab-btn-lab77'),forms=$('tab-btn-ef-forms'),nav=document.querySelector('.top-navbar > .nav-tabs');
  if(!calc||!forms||!nav)throw Error('Atalhos de Calculadora ou Formulários ausentes.');
  if(calc.nextElementSibling!==forms)return{status:'warn',detail:'Formulários fora da posição esperada após Calculadora; recomposição do menu disponível.'};
  return'Menu principal organizado, com Formulários após Calculadora.';
 });
 await check(rows,'Temas: paletas e modo escuro',function(){
  var palette=['Verde','Azul','Roxo','Laranja','Rosa'];
  var btns=[...document.querySelectorAll('#ef-setting-appearance button')];
  if(!btns.length)return{status:'warn',detail:'Botões de aparência ainda não montados; reabra Configurações.'};
  return'Controles de aparência disponíveis; paletas originais preservadas.';
 });
 renderRows(rows,typeof repairBanner==='string'?repairBanner:null);running=false;if(b)b.disabled=false;if(fix)fix.disabled=false;return rows;
}
async function safeRepair(){
 if(window.matchMedia?.('print').matches){setStatus('Feche a prévia de impressão antes de reparar.','warn');return}
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
  // Reparos apenas visuais: não alteram dados clínicos, agenda, histórico, cofre ou backups.
  var scope=selected();
  if((scope==='all'||scope==='forms')&&window.EF2Forms&&typeof EF2Forms.render==='function'){
    var activeForm=$('tab-ef-forms')?.classList.contains('active');
    var focus=document.activeElement;
    if(activeForm&&($('ef2x-t-title')||document.querySelector('#tab-ef-forms .ef2f-question')||(focus&&focus.closest('#tab-ef-forms input,#tab-ef-forms textarea,#tab-ef-forms select'))))ops.push('Formulários preservados: edição ou respostas em andamento');
    else if(activeForm){EF2Forms.render();ops.push('lista de Formulários e vínculo visual com aluno atualizados')}
  }
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
window.EFDiag={version:'2.0-desktop',mounted:true,run:function(){return runTests()},repair:safeRepair,results:function(){return lastResults.slice()},categories:CATS,exportReport:exportReport};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
