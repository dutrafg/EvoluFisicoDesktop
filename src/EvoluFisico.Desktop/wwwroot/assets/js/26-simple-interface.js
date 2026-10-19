/* Interface 9.0-beta: reorganiza os mesmos controles, sem substituir suas funções. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const expanded=new Map();
const routes={
 'tab-painel':['tab-btn-painel','Início'],
 'tab-historico':['tab-btn-history','Avaliações'],
 'tab-comparison':['tab-btn-compare','Evolução'],
 'tab-cobranca':['tab-btn-cobranca','Cobranças'],
 'tab-novo-checkin':['tab-btn-form','Nova avaliação'],
 'tab-lab77':['tab-btn-lab77','Calculadora'],
 'tab-diagnostics':['tab-btn-diagnostics','Diagnóstico'],
 'tab-settings':['tab-btn-settings','Configurações']
};
function fold(id,title,hint,nodes,parent,before=null){
 let d=$(id);if(!d){d=document.createElement('details');d.id=id;d.className='ef-simple-fold';d.open=expanded.get(id)||false;
 const summary=document.createElement('summary');const label=document.createElement('span');label.textContent=title;summary.append(label);
 if(hint){const sub=document.createElement('small');sub.textContent=hint;summary.append(sub)}d.append(summary);
 const content=document.createElement('div');content.className='ef-simple-fold-content';d.append(content);
 d.addEventListener('toggle',()=>expanded.set(id,d.open));parent.insertBefore(d,before);}
 const content=d.querySelector('.ef-simple-fold-content');nodes.filter(Boolean).forEach(n=>{if(n.parentNode!==content)content.append(n)});return d;
}
function arrangeNavigation(){
 const nav=document.querySelector('.top-navbar > .nav-tabs'),menu=$('ef-tools-content'),actions=$('ef-primary-actions');if(!nav||!menu||!actions)return;
 ['tab-painel','tab-historico','tab-comparison','tab-lab77','tab-cobranca'].forEach(route=>{const b=$(routes[route][0]);if(b&&b.parentNode!==nav)nav.append(b)});
 ['tab-diagnostics','tab-settings'].forEach(route=>{const b=$(routes[route][0]);if(b&&b.parentNode!==nav)nav.append(b)});
 const form=$('tab-btn-form');if(form&&form.parentNode!==actions)actions.prepend(form);
 for(const [route,[id,label]] of Object.entries(routes)){
  const b=$(id);if(!b)continue;b.type='button';b.setAttribute('aria-controls',route);
  // Keep the form icon/label and history count IDs used by existing code.
  if(id==='tab-btn-history'){
   if(!b.dataset.simpleLabel){const count=$('history-counter');b.replaceChildren(document.createTextNode('Avaliações '));if(count){count.classList.add('ef-nav-count');b.append(count)}b.dataset.simpleLabel='1';}
  }else if(id==='tab-btn-form'){
   if($('tab-form-label'))$('tab-form-label').textContent=$('avaliacao_id')?.value?'Editar avaliação':label;
   if($('tab-form-icon'))$('tab-form-icon').textContent='+';
  }else if(NAV_ICONS[id]){if(b.dataset.efIconReady!=='1'){b.innerHTML='<span class="ef-local-nav-icon">'+NAV_ICONS[id]+'</span><span>'+label+'</span>';b.dataset.efIconReady='1'}}else if(b.textContent!==label)b.textContent=label;
  const active=$(route)?.classList.contains('active');b.classList.toggle('active',!!active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 }
 const active=document.querySelector('.tab-panel.active');
 if(form)form.hidden=active?.id!=='tab-historico'&&active?.id!=='tab-novo-checkin';
 const heading=$('ef-workspace-title');if(heading)heading.textContent=routes[active?.id]?.[1]||'EvoluFísico';
 $('ef-tools').classList.toggle('ef-tools-active',active?.id==='tab-diagnostics'||active?.id==='tab-settings');
}
function arrangeDetails(){
 const panel=$('ef55-painel');if(panel){
  const nodes=[$('ef68-insights'),$('ef70-engine')].filter(Boolean);
  if(nodes.length){
   let area=$('ef-home-analysis');
   if(!area){area=document.createElement('section');area.id='ef-home-analysis';area.className='ef-analysis-pair';panel.append(area)}
   nodes.forEach((node,index)=>{
    const id=index===0?'ef-home-insights':'ef-home-deep';
    let card=$(id);
    if(!card){card=document.createElement('details');card.id=id;card.className='ef-simple-fold ef-home-compact';card.innerHTML='<summary><span>'+(index===0?'Análises automáticas':'Análise detalhada')+'</span><small>'+(index===0?'Alertas e tendências':'Indicadores e recomendações')+'</small></summary><div class="ef-simple-fold-content"></div>';area.append(card)}
    const slot=card.querySelector('.ef-simple-fold-content');if(node.parentNode!==slot)slot.append(node);
   });
  }
 }
 const patient=$('patient-view-content');if(patient){
  const nodes=[$('ef71-profile'),$('ef72-comparison'),$('ef73-monitoring')].filter(Boolean);
  if(nodes.length)fold('ef-patient-analysis','Explorar a evolução','Perfil, comparação e monitoramento',nodes,patient);
 }
}
function setupForm(){
 const live=$('live-kpi-summary');if(live)fold('ef-live-results','Resultados em tempo real','Composição corporal e índices calculados',[live],live.parentNode,live);
 const step1=document.querySelector('.step[data-step="1"]');
 const pro=$('avaliador_nome')?.closest('.input-row');if(pro&&step1?.contains(pro)){const heading=pro.previousElementSibling;if(heading?.classList.contains('section-subhead'))heading.remove();fold('ef-professional-fields','Dados do profissional','Nome e registro para os relatórios',[pro],step1,pro);}
 const step3=document.querySelector('.step[data-step="3"]');if(step3){
  const titles=[...step3.querySelectorAll(':scope > .section-subhead')];
  const groups=titles.map((title,i)=>{const nodes=[];let n=title.nextElementSibling;while(n&&n!==titles[i+1]){nodes.push(n);n=n.nextElementSibling}return {title,nodes,i}});
  groups.forEach(({title,nodes,i})=>{const d=fold('ef-method-'+i,i?'Bioimpedância':'Dobras cutâneas',i?'Resultados do aparelho, quando disponíveis':'Protocolo de 7 dobras e resultados',nodes,step3,title);if(!i)d.open=true;title.remove()});
 }
 const stats=document.querySelector('#tab-historico > .dashboard-kpi-grid');if(stats)fold('ef-history-summary','Resumo das avaliações','Totais, médias e registros com fotos',[stats],stats.parentNode,stats);
 const bar=document.querySelector('#tab-historico .search-bar-container');
 if(bar){const row=bar.querySelector(':scope > div:last-child');if(row){const items=[...row.children].filter(n=>!n.matches('button[onclick="resetFormulario()"]'));if(items.length)fold('ef-history-export','Exportar ou importar','Backup, planilha e restauração',items,row);}}
 document.querySelectorAll('.step-indicator').forEach(b=>{b.setAttribute('role','button');b.tabIndex=0;b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();b.click()}})});
 document.addEventListener('invalid',e=>{let n=e.target;while(n){if(n.tagName==='DETAILS')n.open=true;n=n.parentElement}},true);
}
const NAV_ICONS={
 'tab-btn-diagnostics':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4l2.5-6 5 12 2.5-6H21"/></svg>',
 'tab-btn-settings':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.4" fill="var(--ef-surface, #fff)"/><circle cx="15" cy="17" r="2.4" fill="var(--ef-surface, #fff)"/></svg>'
};
const COLORS={verde:['#75d7a9','#086849'],azul:['#73aef9','#235cbd'],roxo:['#ad95ff','#6244ba'],laranja:['#f9b276','#a85517'],rosa:['#f3a5c5','#a53c71']};
function applyColor(v){const key=Object.prototype.hasOwnProperty.call(COLORS,v)?v:'verde';const [light,dark]=COLORS[key];document.documentElement.style.setProperty('--ef-selected-color',light);document.documentElement.style.setProperty('--ef-selected-dark',dark);document.documentElement.dataset.efPalette=key;document.body.dataset.efPalette=key;document.querySelectorAll('[data-ef-color]').forEach(b=>{const on=b.dataset.efColor===key;b.setAttribute('aria-pressed',String(on));b.classList.toggle('selected',on)})}
function installColors(){const area=$('ef-setting-appearance');if(!area)return;const field=document.createElement('div');field.className='ef-colors-field';field.innerHTML='<strong>Cor principal do aplicativo</strong><p>Escolha uma das cinco opções. A preferência fica salva neste navegador.</p><div class="ef-colors-list" role="group" aria-label="Escolher cor">'+Object.keys(COLORS).map(key=>'<button type="button" data-ef-color="'+key+'" aria-label="Cor '+key+'" aria-pressed="false" style="--swatch:'+COLORS[key][0]+'"><i></i><span>'+key.charAt(0).toUpperCase()+key.slice(1)+'</span></button>').join('')+'</div>';area.append(field);field.addEventListener('click',e=>{const b=e.target.closest('[data-ef-color]');if(!b)return;try{localStorage.setItem('ef90_paleta',b.dataset.efColor)}catch(_){}applyColor(b.dataset.efColor)});let saved='verde';try{saved=localStorage.getItem('ef90_paleta')||saved}catch(_){}applyColor(saved)}

function mount(){
 document.body.classList.add('ef-simple-ui');
 const header=document.querySelector('.top-navbar'),nav=header?.querySelector(':scope > .nav-tabs'),oldActions=header?.querySelector(':scope > .nav-actions');if(!header||!nav||!oldActions)return;
 nav.setAttribute('aria-label','Navegação principal');
 const workspace=document.createElement('div');workspace.id='ef-workspace-heading';
 const title=document.createElement('span');title.id='ef-workspace-title';workspace.append(title);
 const version=document.createElement('small');version.textContent='9.0-beta';workspace.append(version);header.after(workspace);
 const toggle=document.createElement('button');toggle.type='button';toggle.id='ef-sidebar-toggle';
 toggle.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M9.5 4.5v15"/></svg>';
 function setSidebar(hidden,save){document.body.classList.toggle('ef-sidebar-hidden',hidden);toggle.setAttribute('aria-expanded',String(!hidden));const t=hidden?'Mostrar barra lateral (Ctrl+B)':'Esconder barra lateral (Ctrl+B)';toggle.title=t;toggle.setAttribute('aria-label',t);if(save){try{localStorage.setItem('ef_sidebar_hidden',hidden?'1':'0')}catch(e){}}}
 let saved=false;try{saved=localStorage.getItem('ef_sidebar_hidden')==='1'}catch(e){}
 setSidebar(saved,false);
 toggle.addEventListener('click',()=>setSidebar(!document.body.classList.contains('ef-sidebar-hidden'),true));
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()==='b'){const t=e.target;if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))return;e.preventDefault();toggle.click()}});
 workspace.prepend(toggle);
 const actions=document.createElement('div');actions.id='ef-primary-actions';
 // Navegação direta: Diagnóstico e Configurações são páginas, não submenus.
 const tools=document.createElement('div');tools.id='ef-tools';tools.setAttribute('aria-label','Diagnóstico e configurações');
 const content=document.createElement('div');content.id='ef-tools-content';
 tools.append(content);header.append(tools,actions);
 const settingsBtn=document.createElement('button');settingsBtn.type='button';settingsBtn.id='tab-btn-settings';settingsBtn.className='nav-tab-btn';settingsBtn.textContent='Configurações';settingsBtn.addEventListener('click',()=>window.switchTab('tab-settings'));
 nav.append(settingsBtn);
 const settings=document.createElement('section');settings.className='tab-panel ef-settings-page';settings.id='tab-settings';
 settings.innerHTML=`<div class="ef-settings-header"><div><span class="ef-settings-eyebrow">PREFERÊNCIAS DO SISTEMA</span><h2>Configurações</h2><p>Personalize o ambiente de trabalho, gerencie a segurança e cuide dos dados das suas avaliações.</p></div></div>
 <div class="ef-settings-grid">
 <article class="ef-settings-card"><div class="ef-settings-card-icon">◐</div><h3>Aparência</h3><p>Escolha entre cinco cores e alterne entre os temas claro e escuro.</p><div class="ef-settings-controls" id="ef-setting-appearance"></div></article>
 <article class="ef-settings-card"><div class="ef-settings-card-icon">♙</div><h3>Dados profissionais</h3><p>Configure o nome, o registro CREF e os dados da clínica exibidos em avaliações e relatórios.</p><div class="ef-settings-controls" id="ef-setting-professional"></div></article>
 <article class="ef-settings-card"><div class="ef-settings-card-icon">♢</div><h3>Segurança e privacidade</h3><p>Gerencie a proteção por chave mestra e os recursos de segurança já disponíveis no aplicativo.</p><div class="ef-settings-controls" id="ef-setting-security"></div></article>
 <article class="ef-settings-card"><div class="ef-settings-card-icon">▤</div><h3>Armazenamento local</h3><p>Conecte a pasta de armazenamento quando o navegador oferecer acesso ao sistema de arquivos.</p><div class="ef-settings-controls" id="ef-setting-storage"></div><small>Alguns navegadores não permitem escolher pastas diretamente.</small></article>
 <article class="ef-settings-card ef-settings-card-wide"><div class="ef-settings-card-icon">⇄</div><h3>Backup e restauração</h3><p>Exporte suas avaliações ou restaure um backup com as verificações e confirmações existentes.</p><div class="ef-settings-controls" id="ef-setting-backup"></div></article>
 </div>`;
 document.querySelector('.app-container').append(settings);
 const move=(id,target)=>{const el=$(id);if(el){$(target).append(el);el.classList.add('ef-settings-action')}};
 move('btn-theme-toggle','ef-setting-appearance');
 installColors();
 move('btn-config-profissional','ef-setting-professional');
 move('btn-security-pill','ef-setting-security');
 move('folder-status-pill','ef-setting-storage');
 const backupButtons=[...oldActions.querySelectorAll('button')];backupButtons.forEach(b=>{b.classList.add('ef-settings-action');$('ef-setting-backup').append(b)});
 oldActions.remove();
 const brand=header.querySelector('.brand-wrapper');brand.onclick=e=>{e.preventDefault();window.switchTab('tab-painel')};
 setupForm();arrangeNavigation();arrangeDetails();
 const oldSwitch=window.switchTab;window.switchTab=function(id){const result=oldSwitch.apply(this,arguments);arrangeNavigation();queueMicrotask(arrangeDetails);return result};
 let pending=false;const observer=new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{observer.disconnect();try{arrangeNavigation();arrangeDetails()}finally{pending=false;observer.observe(nav,{childList:true});['ef55-painel','patient-view-content'].forEach(id=>{if($(id))observer.observe($(id),{childList:true,subtree:true})})}})});
 observer.observe(nav,{childList:true});
 ['ef55-painel','patient-view-content'].forEach(id=>{if($(id))observer.observe($(id),{childList:true,subtree:true})});
 // Returning to a draft never resets its fields. Initial home is only a navigation change.
 window.switchTab('tab-painel');
 let printStates=[];window.addEventListener('beforeprint',()=>{printStates=[...document.querySelectorAll('details.ef-simple-fold')].map(d=>[d,d.open]);printStates.forEach(([d])=>d.open=true)});
 window.addEventListener('afterprint',()=>{printStates.forEach(([d,open])=>d.open=open);printStates=[]});
 const edit=window.editarAvaliacao;if(typeof edit==='function')window.editarAvaliacao=function(){const r=edit.apply(this,arguments);const bia=$('ef-method-1');if(bia)bia.open=[...bia.querySelectorAll('input,textarea')].some(x=>x.value.trim());return r};
 window.EFSimpleUI={version:'9.0-beta',arrangeNavigation,arrangeDetails};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
