/* Desktop RC-1 | Insights recolhidos inicialmente, sem modificar avaliações. */
(()=>{
  'use strict';
  const KEY='ef_insights_start_collapsed';
  const $=(s)=>document.querySelector(s);
  function collapseByDefault(){
    try{
      const saved=localStorage.getItem(KEY);
      return saved===null?true:saved==='true';
    }catch(_){return true}
  }
  function disclosures(){return Array.from(document.querySelectorAll('#ef-home-insights details'));}
  function applyFirstLoad(){
    disclosures().forEach(details=>{
      if(details.dataset.efiInsightsInitialized==='1')return;
      details.dataset.efiInsightsInitialized='1';
      details.open=!collapseByDefault();
    });
  }
  function mountSettings(){
    const area=$('#ef-setting-appearance');
    if(!area||$('#efi-insights-default'))return;
    const label=document.createElement('label');
    label.id='efi-insights-default';
    label.className='efi-insights-default';
    const input=document.createElement('input');
    input.type='checkbox';
    input.checked=collapseByDefault();
    const copy=document.createElement('span');
    const heading=document.createElement('strong');
    heading.textContent='Iniciar Insights minimizados';
    const hint=document.createElement('small');
    hint.textContent='Ao abrir o Início, o resumo de Insights começa recolhido. A abertura manual continua disponível.';
    copy.append(heading,hint);
    label.append(input,copy);
    area.append(label);
    input.addEventListener('change',()=>{
      try{localStorage.setItem(KEY,String(input.checked));}catch(_){}
      disclosures().forEach(details=>{details.open=!input.checked;});
    });
  }
  function boot(){
    if(!document.body)return;
    applyFirstLoad();mountSettings();
    let pending=false;
    const observer=new MutationObserver(entries=>{
      if(pending||!entries.some(entry=>entry.addedNodes.length))return;
      pending=true;
      queueMicrotask(()=>{pending=false;applyFirstLoad();mountSettings();});
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  window.EFDesktopInsights=Object.freeze({get:collapseByDefault});
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();