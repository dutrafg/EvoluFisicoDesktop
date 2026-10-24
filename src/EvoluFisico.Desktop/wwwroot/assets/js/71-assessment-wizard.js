/* 1.1 Pré-Beta — Avaliação em seis etapas, objetivos no passo 2.
   Transfere campos existentes, sem duplicar nomes, sem migração de avaliações. */
(function(){
'use strict';
function initialize(){
 const form=document.getElementById('checkin-form');
 if(!form||form.dataset.efSixSteps==='yes')return;
 const steps=[...form.querySelectorAll('.step')];
 if(steps.length!==5||!steps[0].dataset.step||!steps[4].querySelector('#ef6_meta_peso'))return;
 const targets=steps[4].querySelector('#ef6_meta_peso')?.closest('.ef6-sec');
 if(!targets)return;
 const pane=document.createElement('div');pane.className='step';pane.dataset.name='Definir Objetivos';pane.dataset.step='2';
 pane.innerHTML='<h2 class="step-title">Definir Objetivos</h2><p class="help-text">Registre metas individualizadas. A análise determinística usará apenas medidas válidas e comparáveis.</p>';
 pane.appendChild(targets);
 steps[0].insertAdjacentElement('afterend',pane);
 const all=[...form.querySelectorAll('.step')];
 for(let i=0;i<all.length;i++)all[i].dataset.step=String(i+1);
 const nav=document.querySelector('.stepper-container');
 if(nav){
  const indicators=[...nav.querySelectorAll('.step-indicator')];
  const labels=['Dados','Objetivos','Medidas','Dobras/BIA','Fotos','Parecer'];
  for(const el of indicators)el.remove();
  for(let i=0;i<6;i++){
   const item=document.createElement('div');item.className='step-indicator'+(!i?' active':'');
   item.dataset.stepTarget=String(i+1);item.setAttribute('role','button');item.tabIndex=0;
   item.setAttribute('aria-label','Ir para etapa '+(i+1)+': '+labels[i]);
   item.innerHTML='<div class="step-dot">'+(i+1)+'</div><div class="step-label">'+labels[i]+'</div>';
   item.addEventListener('click',()=>window.irParaEtapa?.(i));
   item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();window.irParaEtapa?.(i);}});
   nav.appendChild(item);
  }
 }
 const subtitle=document.querySelector('.wizard-header-card p');
 if(subtitle)subtitle.textContent='Preencha o cadastro, os objetivos, as medidas e o parecer em seis etapas.';
 const badge=document.getElementById('wizard-progress-badge');
 if(badge)badge.textContent='Etapa 1 de 6 • 17%';
 const count=document.getElementById('current-step-num');
 if(count&&count.parentElement)count.parentElement.lastChild.textContent=' de 6';
 form.dataset.efSixSteps='yes';
}
initialize();
window.EFSixStageAssessment={initialize};
})();