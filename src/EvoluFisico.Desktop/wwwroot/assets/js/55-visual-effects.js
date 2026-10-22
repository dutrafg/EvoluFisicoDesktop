

/* estável: opções de efeitos visuais sem alterar regras clínicas ou os dados de clientes. */
(function(){
  'use strict';
  const KEY='ef2_visual_prebeta_mode_v1';
  const MODES=['advanced','essential'];
  let fallback='advanced';
  const get=()=>{try{let p=localStorage.getItem(KEY);return MODES.includes(p)?p:fallback;}catch(_){return fallback;}};
  const current=()=>document.body?.dataset.efxVisual||get();
  const getControls=()=>document.getElementById('efx-appearance-controls');
  function set(value){
    if(!MODES.includes(value))return false;
    fallback=value;
    try{localStorage.setItem(KEY,value)}catch(_){}
    if(document.body)document.body.dataset.efxVisual=value;
    updateButtons();
    window.dispatchEvent(new CustomEvent('efx-visual-mode-changed',{detail:{mode:value}}));
    return true;
  }
  function updateButtons(){
    document.querySelectorAll('#efx-appearance-controls [data-efx-mode]').forEach(b=>{
      const yes=b.dataset.efxMode===current();
      b.setAttribute('aria-pressed',String(yes));
    });
  }
  function mount(){
    if(!document.body)return;
    document.body.dataset.efxVisual=get();
    document.title='EvoluFísico Desktop 1.0.4 estável';
    const badge=document.querySelector('.brand-version');
    if(badge){badge.textContent='1.0.4 estável';badge.title='Versão 1.0.4 estável';}
    const host=document.getElementById('ef-setting-appearance')?.closest('.ef-settings-card');
    if(!host||getControls())return Boolean(getControls());
    const section=document.createElement('div');section.id='efx-appearance-controls';
    section.setAttribute('aria-label','Personalização dos efeitos visuais');
    section.innerHTML=`
      <div class="efx-label">Efeitos visuais <span class="efx-prebeta-tag">1.0.4 estável</span></div>
      <p class="efx-description">Escolha o estilo visual do aplicativo. O tema claro ou escuro e a paleta continuam configuráveis acima.</p>
      <div class="efx-options" role="group" aria-label="Efeitos visuais">
       <button type="button" class="efx-option" data-efx-mode="advanced" aria-pressed="false"><strong>Avançada</strong><small>Blur moderado, profundidade 3D sutil, contornos e sombras.</small></button>
       <button type="button" class="efx-option" data-efx-mode="essential" aria-pressed="false"><strong>Essencial</strong><small>Desativa os efeitos decorativos para um visual limpo e leve.</small></button>
      </div>
      <p class="efx-why">A escolha vale para Início, Organização e os demais módulos. Não afeta seus dados ou relatórios.</p>`;
    host.appendChild(section);
    section.addEventListener('click',e=>{const btn=e.target.closest('[data-efx-mode]');if(btn)set(btn.dataset.efxMode);});
    updateButtons();return true;
  }
  function initialize(){
    mount();
    if(!getControls()){
      let passes=0;
      const observer=new MutationObserver(()=>{passes++;if(mount()||passes>20)observer.disconnect()});
      observer.observe(document.body,{childList:true,subtree:true});
    }
  }
  window.EFPreBetaVisual={get:current,set,refresh:mount};
  window.addEventListener('storage',e=>{if(e.key===KEY)set(get());});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();

