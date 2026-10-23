

/* Integração com Dados profissionais (mesma base usada pelos relatórios PDF). */
(function() {
  'use strict';
  const KEYS={name:'evolufisico_pro_nome',nickname:'evolufisico_pro_apelido',cref:'evolufisico_pro_cref',workplace:'evolufisico_pro_clinica'};
  const $=id=>document.getElementById(id);
  const get=key=>{try{return String(localStorage.getItem(key)||'').trim()}catch(_){return ''}};
  const set=(key,val)=>{try{localStorage.setItem(key,val);return true}catch(_){return false}};
  const meaningfulName=x=>typeof x==='string'&&x.trim().length>0;
  const read=()=>({name:get(KEYS.name),nickname:get(KEYS.nickname),cref:get(KEYS.cref),workplace:get(KEYS.workplace)});
  let shown=false;
  let focusBefore=null;
  function prefill(p){$('efprof-name').value=p.name;$('efprof-nickname').value=p.nickname;$('efprof-cref').value=p.cref;$('efprof-workplace').value=p.workplace;}
  function open(force=false){
    const overlay=$('efprof-first-run');if(!overlay)return false;
    if(!force && meaningfulName(read().name))return false;
    if(!overlay.hidden)return true;
    focusBefore=document.activeElement;prefill(read());shown=true;
    $('efprof-error').hidden=true;overlay.hidden=false;
    document.documentElement.classList.add('efprof-open');
    document.body.style.setProperty('--efprof-scroll-lock','1');
    $('efprof-name').focus({preventScroll:true});
    return true;
  }
  function close(){const overlay=$('efprof-first-run');if(overlay)overlay.hidden=true;document.documentElement.classList.remove('efprof-open');if(focusBefore&&document.contains(focusBefore))focusBefore.focus({preventScroll:true});}
  function syncEvaluationInputs(p){
    for(const [id,val] of [['avaliador_nome',p.name],['avaliador_registro',p.cref],['avaliador_clinica',p.workplace],['cfg_pro_nome',p.name],['cfg_pro_apelido',p.nickname],['cfg_pro_cref',p.cref],['cfg_pro_clinica',p.workplace]]){
      const input=$(id);if(input)input.value=val;
    }
  }
  function save(event){
    event.preventDefault();
    const p={name:$('efprof-name').value.trim().replace(/\s+/g,' '),nickname:$('efprof-nickname').value.trim(),cref:$('efprof-cref').value.trim(),workplace:$('efprof-workplace').value.trim()};
    if(!meaningfulName(p.name)){
      $('efprof-error').hidden=false;$('efprof-name').setAttribute('aria-invalid','true');$('efprof-name').focus();return false;
    }
    $('efprof-name').removeAttribute('aria-invalid');$('efprof-error').hidden=true;
    for(const [key,val] of Object.entries(p))set(KEYS[key],val);
    syncEvaluationInputs(p);
    close();
    window.EFHomeDashboard?.refresh?.();
    window.dispatchEvent(new CustomEvent('ef-professional-profile-saved',{detail:{nickname:p.nickname,name:p.name}}));
    return true;
  }
  function handleKey(e){const modal=$('efprof-first-run');if(!modal||modal.hidden)return;
    if(e.key==='Escape'){
      e.preventDefault();e.stopImmediatePropagation();
      $('efprof-error').textContent='Informe seu nome completo para continuar.';$('efprof-error').hidden=false;$('efprof-name').focus();return;
    }
    if(e.key==='Tab'){
      const items=Array.from(modal.querySelectorAll('input, button')).filter(el=>!el.disabled);
      const idx=items.indexOf(document.activeElement);
      if(e.shiftKey&&(idx<=0)){e.preventDefault();items[items.length-1].focus();}
      else if(!e.shiftKey&&(idx===items.length-1||idx<0)){e.preventDefault();items[0].focus();}
    }
  }
  function init(){const form=$('efprof-form');if(!form)return;
    form.addEventListener('submit',save);
    $('efprof-name').addEventListener('input',()=>{if($('efprof-name').value.trim()){$('efprof-name').removeAttribute('aria-invalid');$('efprof-error').hidden=true;}});
    document.addEventListener('keydown',handleKey,true);
    // Exibida somente após o splash finalizar; o primeiro acesso é obrigatório quando falta o nome.
    window.addEventListener('ef-splash-finished',()=>open());
    const splash=$('ef-splash');
    if(!splash||splash.style.display==='none')open();
    else if(splash.classList.contains('dismissed')){
      // Segurança para um splash encerrado antes do registro do listener.
      const observer=new MutationObserver(()=>{if(splash.style.display==='none'){observer.disconnect();open();}});
      observer.observe(splash,{attributes:true,attributeFilter:['style']});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.EFProfessionalProfile={read,open:()=>open(true)};
})();

