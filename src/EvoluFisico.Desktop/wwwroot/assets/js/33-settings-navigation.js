/* Layout agrupado de Configurações no desktop, preservando ações Windows. */
(function(){'use strict';
 const $=id=>document.getElementById(id);
 function init(){
  const root=$('tab-settings');if(!root||$('efw-settings-tabs'))return;
  const grid=root.querySelector(':scope > .ef-settings-grid');if(!grid)return;
  const tabs=document.createElement('nav');tabs.id='efw-settings-tabs';tabs.className='efw-settings-tabs';tabs.setAttribute('aria-label','Seções de configurações');
  const labels=[['geral','Geral'],['dados','Dados e privacidade'],['manutencao','Manutenção']];
  const container=document.createElement('div');container.className='efw-settings-areas';
  const panels={},grids={};
  for(const [id,label] of labels){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.efwShow=id;b.setAttribute('aria-selected',String(id==='geral'));tabs.append(b);
   const section=document.createElement('section');section.className='efw-settings-panel';section.dataset.efwPanel=id;section.hidden=id!=='geral';section.setAttribute('aria-label',label);
   const g=document.createElement('div');g.className='ef-settings-grid';section.append(g);panels[id]=section;grids[id]=g;container.append(section);
  }
  grid.before(tabs,container);
  const cards=[...grid.querySelectorAll(':scope > .ef-settings-card')];
  const group=card=>{
   const all=card.textContent.toLocaleLowerCase('pt-BR');
   if(card.querySelector('#ef-setting-appearance,#ef-setting-professional')||card.id==='efn-card'||/notificaç(ão|ões)/.test(all))return'geral';
   if(card.querySelector('#ef-setting-security,#ef-setting-storage,#ef-setting-backup')||/backup|cofre|sqlite|armazenamento|dados antigos|proteção dos dados|privacidade/.test(all))return'dados';
   return'manutencao';
  };
  cards.forEach(c=>grids[group(c)].append(c));grid.remove();
  const general=grids.geral,app=$('ef-setting-appearance')?.closest('.ef-settings-card'),pro=$('ef-setting-professional')?.closest('.ef-settings-card'),notes=$('efn-card');
  if(app&&pro){const stack=document.createElement('div');stack.className='efs-general-stack';general.prepend(stack);stack.append(app,pro)}
  if(notes)general.append(notes);
  const diag=$('tab-diagnostics'),diagButton=$('tab-btn-diagnostics');
  if(diagButton)diagButton.remove();
  if(diag){diag.classList.remove('tab-panel');diag.classList.add('efw-diagnostic-inside-settings');grids.manutencao.prepend(diag)}
  tabs.addEventListener('click',event=>{
   const b=event.target.closest('[data-efw-show]');if(!b)return;
   const target=b.dataset.efwShow;
   tabs.querySelectorAll('[data-efw-show]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));
   for(const [id,panel]of Object.entries(panels))panel.hidden=id!==target;
  });
  window.EFWSettings={show:id=>{const b=tabs.querySelector('[data-efw-show="'+id+'"]');if(b)b.click()},groups:labels.map(v=>v[0])};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();