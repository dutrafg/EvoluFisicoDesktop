/* 17-runtime.js */
/* v7.3.1 — acessibilidade: rótulos, teclado e papéis de diálogo */
(function(){
  function run(){
    var L={'filtro-busca':'Buscar avaliações por nome, e-mail ou semana','import-file-input':'Importar backup JSON','web-link-input':'Link do laudo','ef55-q':'Buscar aluno ou ação'};
    Object.keys(L).forEach(function(id){var e=document.getElementById(id);if(e&&!e.getAttribute('aria-label'))e.setAttribute('aria-label',L[id])});
    var rg=document.querySelector('input[name="desafio"]'),g=rg&&rg.closest('.radio-group');if(g){g.setAttribute('role','radiogroup');g.setAttribute('aria-label','Participa de desafio?')}
    document.querySelectorAll('.step-indicator').forEach(function(el){
      el.setAttribute('role','button');el.setAttribute('tabindex','0');
      el.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();el.click()}});
    });
    ['view-modal','web-report-modal','modal-config-profissional','modal-central-backup','ef-security-modal'].forEach(function(id){var m=document.getElementById(id);if(m){m.setAttribute('role','dialog');m.setAttribute('aria-modal','true')}});
    var pv=document.querySelector('.patient-view-overlay');if(pv){pv.setAttribute('role','dialog');pv.setAttribute('aria-modal','true');pv.setAttribute('aria-label','Visão do aluno')}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
