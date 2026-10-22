
/* A barra é filha do cabeçalho. backdrop-filter no ancestral cria um
   containing block para position:fixed, deslocando a barra para o topo.
   Um override inline !important vence o tema Aprimorado sem remover seus
   efeitos dos demais módulos. */
(function(){'use strict';
  function applyNavigationContext(){
    const header=document.querySelector('.top-navbar');
    if(!header)return;
    const mobile=window.matchMedia('(max-width:1199px)').matches;
    for(const prop of ['backdrop-filter','-webkit-backdrop-filter']){
      if(mobile)header.style.setProperty(prop,'none','important');
      else header.style.removeProperty(prop);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyNavigationContext,{once:true});
  else applyNavigationContext();
  window.addEventListener('resize',applyNavigationContext,{passive:true});
  window.addEventListener('pageshow',applyNavigationContext);
  window.EF104Navigation=Object.assign(window.EF104Navigation||{}, {fixMobileNavigation:applyNavigationContext});
})();
