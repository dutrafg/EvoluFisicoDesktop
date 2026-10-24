/* Desktop 1.1 — minipainéis funcionais sem banco paralelo. */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function parse(key){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch(_){return[]}}
function panel(){
 const home=$('#efh-dashboard'),grid=$('.efh-stat-grid',home);if(!home||!grid)return null;
 let root=$('#ef-mini-apps',home);
 if(!root){root=document.createElement('section');root.id='ef-mini-apps';root.className='ef-mini-apps';root.setAttribute('aria-label','Miniaplicativos do Início');grid.insertAdjacentElement('afterend',root);}
 return root;
}
function mount(){
 const host=panel();if(!host)return;
 const tasks=parse('ef90_tasks_v2'),agenda=parse('ef90_home_agenda').filter(x=>x?.status!=='cancelado');
 const upcoming=agenda.filter(x=>typeof x.date==='string'&&x.date>=new Date().toISOString().slice(0,10)).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
 const open=tasks.filter(x=>x&&!x.done).slice(0,4);
 host.innerHTML='<article class="ef-mini-widget"><h3>Agenda rápida</h3><p>Próximos compromissos</p><div class="ef-mini-list">'+(upcoming.map(x=>'<div><strong>'+esc(x.student||'Compromisso')+'</strong><small>'+esc(x.date)+' · '+esc(x.time||'Horário livre')+'</small></div>').join('')||'<small>Nenhum evento próximo.</small>')+'</div><button type="button" data-ef-mini="agenda">Abrir calendário</button></article>'+
 '<article class="ef-mini-widget"><h3>Tarefas do dia</h3><p>Marque como concluídas ou crie tarefas.</p><div class="ef-mini-list">'+(open.map(x=>'<label><input type="checkbox" data-ef-mini-done="'+esc(x.id)+'"> '+esc(x.name||'Tarefa')+'</label>').join('')||'<small>Sem tarefas pendentes.</small>')+'</div><form id="ef-mini-task-form"><input aria-label="Nova tarefa" maxlength="150" name="task" required placeholder="Adicionar tarefa"><button type="submit">Adicionar</button></form></article>'+
 '<article class="ef-mini-widget"><h3>Calculadora rápida</h3><p>IMC de referência — não substitui avaliação corporal.</p><form id="ef-mini-imc-form"><label>Peso (kg)<input name="weight" type="number" min="20" max="400" step="any" required></label><label>Altura (cm)<input name="height" type="number" min="100" max="250" step="any" required></label><button type="submit">Calcular IMC</button></form><output id="ef-mini-imc-result" aria-live="polite"></output></article>';
}
document.addEventListener('change',e=>{
 const input=e.target.closest('[data-ef-mini-done]');if(!input)return;
 window.ef90TaskDone?.(input.dataset.efMiniDone);mount();
});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-ef-mini="agenda"]');if(b)window.EFOrganisation?.go?.('agenda');
});
document.addEventListener('submit',e=>{
 if(e.target.id==='ef-mini-task-form'){
  e.preventDefault();
  const raw=new FormData(e.target),name=String(raw.get('task')||'').trim().slice(0,150);
  if(!name)return;
  const arr=parse('ef90_tasks_v2');
  arr.push({id:'task-'+(crypto.randomUUID?.()||Date.now()),name,date:new Date().toISOString().slice(0,10),done:false});
  try{localStorage.setItem('ef90_tasks_v2',JSON.stringify(arr));window.EFOrganisation?.refresh?.();mount();}
  catch(err){const out=$('#ef-mini-apps');if(out)out.setAttribute('data-save-error','Falha ao salvar tarefa');}
 }
 if(e.target.id==='ef-mini-imc-form'){
  e.preventDefault();const f=new FormData(e.target);
  const w=Number(f.get('weight')),h=Number(f.get('height'))/100,out=$('#ef-mini-imc-result');
  if(out)out.textContent=Number.isFinite(w)&&Number.isFinite(h)&&w>0&&h>0?'IMC: '+(w/(h*h)).toFixed(1)+' kg/m² — indicador geral, não avaliação de composição.':'Informe valores válidos.';
 }
});
window.EFDesktopMiniApps={mount};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();