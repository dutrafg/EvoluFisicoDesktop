
/* 1.0.4: navegação contextual acionada no próprio Início.
 * Não depende do listener global antigo: mantém a aba-alvo ativa também em tablet. */
(function(){'use strict';
  const orgViews=new Set(['agenda','notes','tasks','goals']);
  const tabIds=new Set(['tab-novo-checkin','tab-historico','tab-comparison','tab-cobranca','tab-settings','tab-analises','tab-painel']);
  const selectTab=id=>{
    if(typeof window.switchTab!=='function')return false;
    window.switchTab(id);
    return document.getElementById(id)?.classList.contains('active')===true;
  };
  function activateShortcut(button){
    const view=button.getAttribute('data-efh-go');
    const module=button.getAttribute('data-efh-module');
    const action=button.getAttribute('data-efh-action');
    if(module){selectTab(module);return;}
    if(action==='evaluation'){selectTab('tab-novo-checkin');return;}
    if(orgViews.has(view)){
      const org=window.EFOrganisation;
      if(org && typeof org.go==='function') org.go(view);
      else selectTab('tab-organizacao');
      // Evita que a troca de módulo mantenha uma posição antiga de rolagem.
      requestAnimationFrame(()=>{
        if(!document.getElementById('tab-organizacao')?.classList.contains('active'))return;
        if(view==='agenda' && /calendário/i.test(button.textContent||'')){
          const cal=document.querySelector('#tab-organizacao .ef90-calendar-grid, #tab-organizacao .ef90-calendar-nav');
          if(cal) {requestAnimationFrame(()=>cal.scrollIntoView({block:'center',behavior:'instant'}));return;}
        }
        const pane=document.querySelector('#tab-organizacao [data-eforg-pane="'+view+'"]');
        if(pane){pane.scrollIntoView({block:'start',behavior:'instant'});}
      });
      return;
    }
    if(view && tabIds.has(view))selectTab(view);
  }
  function setup(){
    const home=document.getElementById('tab-painel');
    if(!home || home.dataset.ef104Shortcuts==='1')return;
    home.dataset.ef104Shortcuts='1';
    home.addEventListener('click',event=>{
      const button=event.target instanceof Element ? event.target.closest('[data-efh-go],[data-efh-module],[data-efh-action]') : null;
      if(!button || !home.contains(button))return;
      event.preventDefault();
      event.stopPropagation(); // O roteador anterior no document não precisa executar de novo.
      activateShortcut(button);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
  window.EF104Navigation={activateShortcut};
})();
