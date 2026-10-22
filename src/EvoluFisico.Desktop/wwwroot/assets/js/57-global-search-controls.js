
(function(){
 'use strict';
 const VERSION='1.0.4 estável';
 const svg='<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>';
 function mountSearch(){
  const host=document.getElementById('ef-workspace-heading');
  if(!host)return false;
  if(document.getElementById('efg-header-search'))return true;
  const btn=document.createElement('button');btn.type='button';btn.id='efg-header-search';
  btn.title='Pesquisa global (Ctrl+K)';btn.setAttribute('aria-label','Pesquisar em todo o aplicativo');
  btn.innerHTML=svg+'<span class="efg-search-label">Pesquisar</span>';
  btn.addEventListener('click',()=>{
   if(window.EFGlobalSearch?.open)window.EFGlobalSearch.open();
   else console.warn('[EvoluFísico] Pesquisa global indisponível neste contexto.');
  });
  host.append(btn);return true;
 }
 function refreshVersion(){
  document.title='EvoluFísico Desktop '+VERSION+' — Início e Organização';
  document.documentElement.dataset.efAppVersion='1.0.4-stable';
  document.querySelectorAll('.brand-version').forEach(el=>{el.textContent=VERSION;el.title='EvoluFísico Desktop '+VERSION+' — Versão estável';});
  
  document.querySelectorAll('#efx-appearance-controls .efx-prebeta-tag').forEach(el=>el.textContent=VERSION);
 }
 function init(){
  mountSearch();refreshVersion();
  if(!document.getElementById('efg-header-search')){
   const observer=new MutationObserver(()=>{if(mountSearch()){observer.disconnect();refreshVersion();}});
   observer.observe(document.body,{childList:true,subtree:true});
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.EFAppVersion={version:VERSION,build:'2026-10-22-stable',module:'Inicio, Organizacao, Avaliacoes, Busca Global'};
})();
