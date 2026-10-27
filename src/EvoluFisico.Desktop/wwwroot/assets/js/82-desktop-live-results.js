/* RC-9: recolhimento persistente dos KPIs ao vivo, toque e teclado nativos. */
(function(global){
 'use strict';
 const KEY='ef_desktop_live_results_collapsed';
 const read=()=>{try{return global.localStorage.getItem(KEY)==='1'}catch(_){return false}};
 const save=value=>{try{global.localStorage.setItem(KEY,value?'1':'0')}catch(_){}};
 function init(){
  const root=global.document.getElementById('ef-live-summary');
  const button=global.document.getElementById('ef-live-summary-toggle');
  const panel=global.document.getElementById('live-kpi-summary');
  const label=global.document.getElementById('ef-live-summary-action');
  if(!root||!button||!panel||!label||root.dataset.efLiveReady==='1')return false;
  root.dataset.efLiveReady='1';
  function setCollapsed(collapsed,persist){
   const state=Boolean(collapsed);
   root.classList.toggle('is-collapsed',state);
   panel.hidden=state;
   button.setAttribute('aria-expanded',String(!state));
   label.textContent=state?'Expandir':'Recolher';
   if(persist)save(state);
  }
  button.addEventListener('click',()=>setCollapsed(!root.classList.contains('is-collapsed'),true));
  setCollapsed(read(),false);
  global.EFDesktopLiveResults=Object.freeze({setCollapsed,expanded:()=>!root.classList.contains('is-collapsed')});
  return true;
 }
 if(global.document.readyState==='loading')global.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
