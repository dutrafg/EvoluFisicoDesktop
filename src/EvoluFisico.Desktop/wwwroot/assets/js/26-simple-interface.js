/* Interface 9.1-beta: reorganiza os mesmos controles, sem substituir suas funções. */
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
 'tab-ef-forms':['tab-btn-ef-forms','Formulários'],
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
 ['tab-painel','tab-historico','tab-comparison','tab-lab77','tab-ef-forms','tab-cobranca'].forEach(route=>{const b=$(routes[route][0]);if(b&&b.parentNode!==nav)nav.append(b)});
 ['tab-settings'].forEach(route=>{const b=$(routes[route][0]);if(b&&b.parentNode!==nav)nav.append(b)});
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
 // Cobranças é sempre um painel principal, independente de Diagnóstico/Configurações.
 const billingPanel=$('tab-cobranca'),workspace=document.querySelector('.app-container'),settingsPanel=$('tab-settings');
 if(workspace&&billingPanel&&billingPanel.parentElement!==workspace){
  workspace.insertBefore(billingPanel,settingsPanel?.parentElement===workspace?settingsPanel:null);
 }
 const active=document.querySelector('.tab-panel.active');
 if(form)form.hidden=active?.id!=='tab-historico'&&active?.id!=='tab-novo-checkin';
 const heading=$('ef-workspace-title');if(heading)heading.textContent=routes[active?.id]?.[1]||'EvoluFísico';
 $('ef-tools').classList.toggle('ef-tools-active',active?.id==='tab-settings');
}
function arrangeDetails(){
 const panel=$('ef55-painel');if(panel){
  const nodes=[$('ef68-insights'),$('ef70-engine')].filter(Boolean);
  if(nodes.length){
   const grid=$('ef90-sortable');
   let area=$('ef-home-analysis'),changed=false;
   if(!grid&&!area){area=document.createElement('section');area.id='ef-home-analysis';area.className='ef-analysis-pair';panel.append(area)}
   nodes.forEach((node,index)=>{
    const id=index===0?'ef-home-insights':'ef-home-deep';
    const homeCard=index===0?'insights':'detalhes';
    let card=$(id);
    if(!card){
     card=document.createElement('details');card.id=id;card.className='ef-simple-fold ef-home-compact';
     card.innerHTML='<summary><span>'+(index===0?'Análises automáticas':'Análise detalhada')+'</span><small>'+(index===0?'Alertas e tendências':'Indicadores e recomendações')+'</small></summary><div class="ef-simple-fold-content"></div>';
     changed=true;
    }
    if(grid){
     card.classList.add('ef55-card','ef90-card');
     card.dataset.efHomeCard=homeCard;
     if(card.parentElement!==grid && !grid.contains(card)){grid.append(card);changed=true}
    }else if(area&&card.parentElement!==area){area.append(card);changed=true}
    const slot=card.querySelector('.ef-simple-fold-content');
    if(slot&&node.parentNode!==slot){slot.append(node);changed=true}
   });
   // Os cartões de análise participam do empacotamento junto com agenda e tarefas.
   if(changed&&grid&&typeof window.ef90RefreshHomeLayout==='function')window.ef90RefreshHomeLayout();
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
 'tab-btn-ef-forms':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/></svg>',
 'tab-btn-settings':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.4" fill="var(--ef-surface, #fff)"/><circle cx="15" cy="17" r="2.4" fill="var(--ef-surface, #fff)"/></svg>'
};
const COLORS={
 verde:['#75d7a9','#086849','#0c241d','#75d7a9'],
 azul:['#73aef9','#235cbd','#0c241d','#73aef9'],
 roxo:['#ad95ff','#6244ba','#0c241d','#ad95ff'],
 laranja:['#f9b276','#a85517','#0c241d','#f9b276'],
 rosa:['#f3a5c5','#a53c71','#0c241d','#f3a5c5'],
 'verde-escuro':['#176b4b','#104a35','#ffffff','#86e5b2'],
 'azul-escuro':['#2459a6','#183d73','#ffffff','#99c5ff'],
 'roxo-escuro':['#6540a8','#422c7c','#ffffff','#cdb5ff'],
 'laranja-escuro':['#ad541c','#75390d','#ffffff','#ffd3a0'],
 'rosa-escuro':['#a62c62','#762149','#ffffff','#ffbad6']
};
function applyColor(value){
 const key=Object.prototype.hasOwnProperty.call(COLORS,value)?value:'verde';
 const [main,dark,onColor,darkAccent]=COLORS[key];
 const root=document.documentElement;
 root.style.setProperty('--ef-selected-color',main);
 root.style.setProperty('--ef-selected-dark',dark);
 root.style.setProperty('--ef-selected-on-color',onColor);
 root.style.setProperty('--ef-selected-darkmode-color',darkAccent);
 root.dataset.efPalette=key;
 document.body.dataset.efPalette=key;
 document.querySelectorAll('[data-ef-color]').forEach(button=>{
  const selected=button.dataset.efColor===key;
  button.setAttribute('aria-pressed',String(selected));
  button.classList.toggle('selected',selected);
 });
}
function installColors(){
 const area=$('ef-setting-appearance');if(!area)return;
 const field=document.createElement('div');field.className='ef-colors-field';
 field.innerHTML='<strong>Cor principal do aplicativo</strong><p>Escolha entre 5 cores suaves e 5 tons intensos. A preferência permanece salva neste dispositivo.</p><div class="ef-colors-list" role="group" aria-label="Escolher cor">'+Object.keys(COLORS).map(key=>{
   const label=key.split('-').map((part,index)=>index===0?part.charAt(0).toUpperCase()+part.slice(1):part).join(' ');
   return '<button type="button" data-ef-color="'+key+'" aria-label="Cor '+label+'" aria-pressed="false" style="--swatch:'+COLORS[key][0]+'"><i aria-hidden="true"></i><span>'+label+'</span></button>';
 }).join('')+'</div>';
 area.append(field);
 field.addEventListener('click',e=>{
  const button=e.target.closest('[data-ef-color]');if(!button)return;
  if(!Object.prototype.hasOwnProperty.call(COLORS,button.dataset.efColor))return;
  try{localStorage.setItem('ef90_paleta',button.dataset.efColor)}catch(_){}
  applyColor(button.dataset.efColor);
 });
 let saved='verde';try{saved=localStorage.getItem('ef90_paleta')||saved}catch(_){}
 applyColor(saved);
}

function mount(){
 document.body.classList.add('ef-simple-ui');
 const header=document.querySelector('.top-navbar'),nav=header?.querySelector(':scope > .nav-tabs'),oldActions=header?.querySelector(':scope > .nav-actions');if(!header||!nav||!oldActions)return;
 nav.setAttribute('aria-label','Navegação principal');
 const workspace=document.createElement('div');workspace.id='ef-workspace-heading';
 const title=document.createElement('span');title.id='ef-workspace-title';workspace.append(title);
 const version=document.createElement('small');version.textContent='9.1.0-beta.4.1';workspace.append(version);header.after(workspace);
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
 <article class="ef-settings-card"><div class="ef-settings-card-icon">♢</div><h3>Segurança e privacidade</h3><p>O SQLite e as novas cópias físicas são criptografados automaticamente com AES-256-GCM e DPAPI, vinculados à sua conta Windows. Para exigir senha ao abrir o aplicativo, configure a chave mestra adicional.</p><div class="ef-settings-controls" id="ef-setting-security"></div></article>
 <article class="ef-settings-card"><div class="ef-settings-card-icon">▤</div><h3>Armazenamento local</h3><p>Escolha a pasta para receber cópias criptografadas das avaliações. Arquivos antigos em JSON ou fotos JPG criados antes desta atualização podem estar sem proteção.</p><div class="ef-settings-controls" id="ef-setting-storage"></div><small>As novas cópias .efx com DPAPI só podem ser abertas pela mesma conta Windows. Faça backup do SQLite antes de trocar de computador.</small></article>
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
 // Desktop on Windows does not support hardware vibration in WebView2.
 // Hide only vibration controls; keep sound and calendar reminders intact.
 if(window.chrome && window.chrome.webview){
   const hideDesktopVibration=()=>{
     // Notification preferences can be rendered asynchronously. Find the actual
     // switch container rather than relying on a particular CSS class name.
     const controls=[...document.querySelectorAll('button,label,h3,h4,strong,span,div,p')];
     for(const el of controls){
       if(el.children.length && el.tagName!=='BUTTON')continue;
       const label=(el.textContent||'').trim().toLocaleLowerCase('pt-BR');
       if(label==='testar vibração'){
         const button=el.closest('button') || el;
         if(!button.hidden)button.hidden=true;
       }else if(label==='vibração'){
         let parent=el;
         for(let depth=0;depth<6 && parent;depth++,parent=parent.parentElement){
           if(parent!==el && parent.querySelector('input[type="checkbox"],[role="switch"]')){
             if(!parent.hidden)parent.hidden=true;
             break;
           }
         }
       }
     }
   };
   hideDesktopVibration();
   const vibrationObserver=new MutationObserver(hideDesktopVibration);
   vibrationObserver.observe(document.body,{childList:true,subtree:true});
 }
 // Desktop-only update panel: does not change the web edition.
 if(window.chrome && window.chrome.webview){
   const grid=$('ef-setting-backup')?.closest('.ef-settings-grid') || $('ef-setting-backup')?.parentElement?.parentElement;
   if(grid){
     const panel=document.createElement('article');
     panel.className='ef-settings-card';
     panel.innerHTML='<h3>Atualizações do aplicativo</h3><p>Verifique se há uma versão mais recente do EvoluFisico Desktop para Windows.</p><div class="ef-settings-controls"><button class="btn btn-outline btn-sm ef-settings-action" id="ef-desktop-check-update" type="button">Verificar atualizações</button><p id="ef-desktop-update-status" role="status" aria-live="polite"></p></div>';
     grid.append(panel);
     if(window.EFDesktopLegacyMigration){
       const migration=document.createElement('article');
       migration.className='ef-settings-card';
       migration.innerHTML='<h3>Proteção dos dados antigos</h3><p>Crie uma cópia criptografada dos dados locais no SQLite. Os dados originais não serão excluídos. Esta operação ainda não substitui o banco utilizado pelos módulos.</p><div class="ef-settings-controls"><button class="btn btn-outline btn-sm ef-settings-action" id="ef-desktop-migrate-legacy" type="button">Copiar dados locais para SQLite</button><p id="ef-desktop-migrate-status" role="status" aria-live="polite"></p></div>';
       grid.append(migration);
       const migrateButton=$('ef-desktop-migrate-legacy'),migrateStatus=$('ef-desktop-migrate-status');
       migrateButton.addEventListener('click',async()=>{
         if(!confirm('Criar cópia criptografada dos dados locais? Nenhum registro original será excluído.'))return;
         migrateButton.disabled=true;migrateStatus.textContent='Copiando e conferindo os registros…';
         try{
           const result=await window.EFDesktopLegacyMigration.migrate();
           migrateStatus.textContent=result.transferred+' registros novos copiados, '+result.alreadyCopied+' já conferidos. Os dados originais foram preservados.';
         }catch(error){migrateStatus.textContent='Migração interrompida: '+error.message+' Os dados originais foram preservados.'}
         finally{migrateButton.disabled=false}
       });
     }
     if(window.EFDesktopIndexedDBInventory){
       const panel=document.createElement('article');
       panel.className='ef-settings-card';
       panel.innerHTML='<h3>Diagnóstico IndexedDB</h3><p>Consulta somente leitura dos bancos antigos.</p><button class="btn btn-outline btn-sm ef-settings-action" id="ef-desktop-inventory" type="button">Verificar bancos</button><p id="ef-desktop-inventory-result" role="status" aria-live="polite"></p>';
       grid.append(panel);
       const button=$('ef-desktop-inventory'),status=$('ef-desktop-inventory-result');
       button.addEventListener('click',async()=>{
         button.disabled=true;status.textContent='Inspecionando…';
         try{const databases=await window.EFDesktopIndexedDBInventory.inventory();status.textContent=databases.flatMap(db=>db.stores.map(s=>db.name+' / '+s.name+': '+s.count+' registros')).join(' | ')||'Nenhum registro encontrado.'}
         catch(error){status.textContent='Falha na inspeção: '+error.message}
         finally{button.disabled=false}
       });
     }
     if(window.EFDesktopIndexedDBSnapshot){
       const panel=document.createElement('article');
       panel.className='ef-settings-card';
       panel.innerHTML='<h3>Cópia protegida dos cadastros IndexedDB</h3><p>Copiar registros compatíveis para SQLite criptografado e conferir o conteúdo. Não exclui os originais nem muda o banco usado pelos módulos.</p><button class="btn btn-outline btn-sm ef-settings-action" id="ef-desktop-snapshot-idb" type="button">Copiar IndexedDB para SQLite</button><p id="ef-desktop-snapshot-status" role="status" aria-live="polite"></p>';
       grid.append(panel);
       const button=$('ef-desktop-snapshot-idb'),status=$('ef-desktop-snapshot-status');
       button.addEventListener('click',async()=>{
         if(!confirm('Criar uma cópia criptografada dos cadastros IndexedDB? Os originais serão mantidos.'))return;
         button.disabled=true;status.textContent='Copiando e conferindo…';
         try{
           const result=await window.EFDesktopIndexedDBSnapshot.snapshot(progress=>{status.textContent='Conferidos '+progress.checked+' de '+progress.total+' registros…';});
           status.textContent=result.copied+' registros copiados; '+result.alreadyCopied+' já conferidos. Originais preservados.';
         }catch(error){status.textContent='Cópia interrompida: '+error.message+'. Originais preservados.'}
         finally{button.disabled=false}
       });
     }
     if(window.EFNativeStorage && typeof window.EFNativeStorage.backup==='function'){
       const panel=document.createElement('article');
       panel.className='ef-settings-card';
       panel.innerHTML='<h3>Backup criptografado do SQLite</h3><p>Salve uma cópia verificada dos registros nativos. A proteção automática do Windows (DPAPI) pode impedir a abertura em outro computador ou usuário. Este backup não inclui automaticamente os dados ainda armazenados no navegador.</p><button class="btn btn-outline btn-sm ef-settings-action" id="ef-desktop-native-backup" type="button">Salvar backup SQLite</button><p id="ef-desktop-native-backup-status" role="status" aria-live="polite"></p>';
       grid.append(panel);
       const button=$('ef-desktop-native-backup'),status=$('ef-desktop-native-backup-status');
       button.addEventListener('click',async()=>{
         button.disabled=true;status.textContent='Preparando cópia verificada…';
         try{const result=await window.EFNativeStorage.backup();status.textContent=result==='saved'?'Backup SQLite salvo e conferido.':result==='cancelled'?'Backup cancelado.':'Resultado inesperado do backup.'}
         catch(error){status.textContent='Não foi possível salvar o backup SQLite. Verifique o banco e tente novamente.'}
         finally{button.disabled=false}
       });
     }
     const btn=$('ef-desktop-check-update'), status=$('ef-desktop-update-status');
     btn.addEventListener('click',()=>{btn.disabled=true;status.textContent='Consultando versões publicadas…';window.chrome.webview.postMessage('check-updates')});
     window.chrome.webview.addEventListener('message',e=>{
       const m=e.data;
       if(!m || m.type!=='desktop-update')return;
       btn.disabled=false;
       status.textContent=m.message||'';
       const releaseKey='ef-desktop-dismissed-update';
       let dismissed=false;
       try{dismissed=localStorage.getItem(releaseKey)===m.downloadUrl}catch(_){/* Storage may be disabled. */}
       if(m.downloadUrl && !dismissed && /^https:\/\/github\.com\/dutrafg\/EvoluFisicoDesktop\/releases\/download\//.test(m.downloadUrl)){
         let banner=$('ef-desktop-update-banner');
         if(!banner){
           banner=document.createElement('div');
           banner.id='ef-desktop-update-banner';
           banner.setAttribute('role','status');
           banner.style.cssText='position:fixed;right:20px;bottom:20px;z-index:10000;max-width:390px;padding:16px;border-radius:10px;background:#16263c;color:white;box-shadow:0 8px 28px #0005;font:14px/1.5 system-ui,sans-serif';
           document.body.append(banner);
         }
         banner.replaceChildren();
         const title=document.createElement('strong');title.textContent='Atualização disponível';banner.append(title);
         const description=document.createElement('p');description.textContent=m.message||'Uma nova versão está disponível.';banner.append(description);
         const download=document.createElement('a');download.href=m.downloadUrl;download.target='_blank';download.rel='noopener noreferrer';download.textContent='Baixar nova versão';download.style.cssText='color:#a9d7ff;text-decoration:underline;margin-right:18px';banner.append(download);
         const close=document.createElement('button');close.type='button';close.textContent='Agora não';close.style.cssText='border:0;background:transparent;color:white;cursor:pointer';close.addEventListener('click',()=>{try{localStorage.setItem(releaseKey,m.downloadUrl)}catch(_){/* Storage may be disabled. */}banner.remove()});banner.append(close);
       }
       if(m.downloadUrl && /^https:\/\/github\.com\/dutrafg\/EvoluFisicoDesktop\/releases\/download\//.test(m.downloadUrl)){
         const a=document.createElement('a');a.href=m.downloadUrl;a.textContent='Baixar instalador';a.target='_blank';a.rel='noopener noreferrer';status.append(' ',a);
       }
     });
     // Check once when the desktop UI starts; never download or install without consent.
     window.chrome.webview.postMessage('check-updates-auto');
   }
 }
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
 window.EFSimpleUI={version:'9.1.0-beta.4.1',arrangeNavigation,arrangeDetails};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
