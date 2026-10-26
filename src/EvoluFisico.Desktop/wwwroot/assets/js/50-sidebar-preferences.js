/* EvoluFisico2 | Painel lateral: minimizado por padrão, escolha persistente. */
(()=>{
 'use strict';
 const STORAGE='ef_sidebar_hidden';
 const PORTRAIT_STORAGE='ef_sidebar_tablet_portrait_v1';
 function storageKey(){const m=typeof window.matchMedia==='function'&&window.matchMedia('(min-width:601px) and (max-width:1199px) and (orientation: portrait)').matches;
   return m&&document.body.dataset.efLayout==='desktop'?PORTRAIT_STORAGE:STORAGE;}
 const $=selector=>document.querySelector(selector);
 function current(){return document.body.classList.contains('ef-sidebar-hidden')?'min':'max'}
 function sync(){
   const host=$('#ef-sidebar-preferences');if(!host)return;
   host.querySelectorAll('[data-ef-sidebar-choice]').forEach(btn=>{
     btn.setAttribute('aria-pressed',String(btn.dataset.efSidebarChoice===current()));
   });
 }
 function choose(value){
   if(value!=='min'&&value!=='max')return;
   const hidden=value==='min';
   const original=$('#ef-sidebar-toggle');
   if(document.body.classList.contains('ef-sidebar-hidden')!==hidden){
     if(original&&typeof original.click==='function')original.click();
     else {document.body.classList.toggle('ef-sidebar-hidden',hidden);
       try{localStorage.setItem(storageKey(),hidden?'1':'0')}catch(_){}
     }
   }else{
     try{localStorage.setItem(storageKey(),hidden?'1':'0')}catch(_){}
   }
   sync();
 }
 function mount(){
   const layoutCard=$('#ef-setting-appearance');
   if(!layoutCard||$('#ef-sidebar-preferences'))return;
   const controls=document.createElement('div');
   controls.id='ef-sidebar-preferences';
   controls.className='ef-sidebar-preferences';
   controls.innerHTML='<strong>Painel lateral do Windows</strong>'+
     '<p>O painel inicia minimizado. Os ícones continuam acessíveis; maximizado mostra também nomes e controles. Sua escolha fica salva.</p>'+
     '<div role="group" aria-label="Visualização do painel lateral">'+
     '<button type="button" data-ef-sidebar-choice="min" aria-pressed="false">Minimizado</button>'+
     '<button type="button" data-ef-sidebar-choice="max" aria-pressed="false">Maximizado</button></div>';
   layoutCard.append(controls);
   controls.addEventListener('click',ev=>{
     const btn=ev.target.closest('[data-ef-sidebar-choice]');
     if(btn)choose(btn.dataset.efSidebarChoice);
   });
   sync();
 }
 function init(){
   mount();const body=document.body;
   if(!body)return;
   let pending=false;
   new MutationObserver(entries=>{
     if(pending||!entries.some(e=>e.addedNodes.length))return;
     pending=true;queueMicrotask(()=>{pending=false;mount();});
   }).observe(body,{subtree:true,childList:true});
   new MutationObserver(sync).observe(body,{attributes:true,attributeFilter:['class']});
   $('#ef-sidebar-toggle')?.addEventListener('click',()=>queueMicrotask(sync));
 }
 window.EFSidebarPreference=Object.freeze({get:current,set:choose,sync});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();