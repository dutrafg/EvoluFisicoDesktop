/* EvoluFísico Desktop 1.0.10 — novidades do sistema, sem consultar dados dos alunos. */
(function(){
'use strict';
const VERSION='1.0.10';
const SUMMARY='Ajustes do EvoluFísico Web 2.0.28: controles responsivos do PDF comparativo e filtros de nível de questionário; revisão EFIA; EFIA com oito motores, análise profissional e relatório para o aluno; visualização e impressão local adaptadas ao Windows; editores antigos de cards removidos; Nova avaliação dentro da tela Avaliações e nomes padronizados para PDF; proteção contra recarga acidental; mais segurança ao salvar e confirmar cobranças; melhorias em notas, tarefas e metas; validação de avaliações; 15 cores profissionais e ajustes no layout desktop.';
function make(){
 const card=document.createElement('article');
 card.id='ef-desktop-whatsnew-card';
 card.className='ef-settings-card ef-settings-card-wide efwhatsnew-card';
 card.setAttribute('aria-labelledby','ef-desktop-whatsnew-title');
 const header=document.createElement('div');header.className='efwhatsnew-header';
 const symbol=document.createElement('span');symbol.className='efwhatsnew-symbol';symbol.setAttribute('aria-hidden','true');
 symbol.innerHTML='<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3Z"/><path d="M19 17v4M17 19h4"/></svg>';
 const text=document.createElement('div');text.className='efwhatsnew-text';
 const eyebrow=document.createElement('span');eyebrow.className='efwhatsnew-eyebrow';eyebrow.textContent='ÚLTIMAS MELHORIAS';
 const title=document.createElement('h3');title.id='ef-desktop-whatsnew-title';title.textContent='O que há de novidade';
 text.append(eyebrow,title);
 const version=document.createElement('span');version.className='efwhatsnew-version';version.textContent='v'+VERSION+' estável';
 header.append(symbol,text,version);
 const summary=document.createElement('p');summary.className='efwhatsnew-summary';summary.textContent=SUMMARY;
 card.append(header,summary);
 return card;
}
function mount(){
 if(document.getElementById('ef-desktop-whatsnew-card'))return true;
 const update=document.getElementById('ef-desktop-check-update');
 const updateCard=update?.closest('.ef-settings-card');
 const maintenance=document.querySelector('#tab-settings .efw-settings-panel[data-efw-panel="manutencao"] > .ef-settings-grid');
 if(updateCard&&updateCard.parentElement){
  // O card fica imediatamente após o verificador nativo do Windows, sem duplicá-lo.
  updateCard.insertAdjacentElement('afterend',make());
  return true;
 }
 if(maintenance){maintenance.prepend(make());return true}
 return false;
}
window.EFDesktopWhatsNew={version:VERSION,mount};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
})();