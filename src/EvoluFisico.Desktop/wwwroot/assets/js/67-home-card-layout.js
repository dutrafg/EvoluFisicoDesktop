/* EvoluFísico Desktop — editor local dos cards do Início (sem dados clínicos). */
(function(){
'use strict';
const KEY='ef_desktop_inicio_layout_v2';
const GROUPS={
 stats:{selector:'.efh-stat-grid',items:'.efh-stat',keys:['eventos','prazos','tarefas','metas'],sizes:{p:3,m:6,g:12},defaultSize:'p'},
 strategy:{selector:'.efh-strategy-kpis',items:'.efh-strategy-kpi',keys:['alunos','retornos','cobrancas'],sizes:{p:4,m:6,g:12},defaultSize:'p'},
 cards:{selector:'.efh-grid',items:'.efh-card',keys:['avisos','acontecimentos','insights','semana','acoes','acompanhamento','evolucao','financeiro'],sizes:{p:4,m:6,g:8,total:12},defaultSize:'m'}
};
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
let editing=false,root=null;
const fresh=()=>({stats:{order:[],sizes:{}},strategy:{order:[],sizes:{}},cards:{order:[],sizes:{}}});
let state=fresh();
const valid=(group,id)=>GROUPS[group].keys.includes(id);
const defaultSizes=group=>Object.fromEntries(GROUPS[group].keys.map(k=>[k,group==='cards'?'m':'p']));
function load(){
 try{
  let saved=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!saved){const old=JSON.parse(localStorage.getItem('ef2_layout_inicio_organizacao_v1')||'null');
    if(old)saved={stats:old.homeStats,cards:old.homeCards};}
  if(!saved||typeof saved!=='object')return;
  for(const group of Object.keys(GROUPS)){
   const record=saved[group];if(!record||typeof record!=='object')continue;
   const fromOrder=Array.isArray(record.order)?record.order:[];
   const aliases=group==='stats'?Object.fromEntries(GROUPS.stats.keys.map((k,i)=>['kpi-'+i,k])):{};
   state[group].order=[...new Set(fromOrder.map(k=>aliases[k]||k).filter(k=>valid(group,k)))];
   for(const [id,size] of Object.entries(record.sizes||{})){
    const key=aliases[id]||id;
    if(valid(group,key)&&Object.hasOwn(GROUPS[group].sizes,size))state[group].sizes[key]=size;
   }
  }
 }catch(error){console.warn('Layout do Início: preferências inválidas ignoradas',error);}
}
load();
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(state));return true;}
 catch(error){console.warn('Não foi possível guardar o layout do Início',error);message('Não foi possível salvar o layout neste dispositivo.');return false;}
}
function message(t){const live=$('#efhc-status',root);if(live)live.textContent=t;}
function cells(group){return $$('.efhc-cell[data-efhc-group="'+group+'"]',root);}
function sort(group,items){
 const prior=state[group].order;
 return [...items].sort((a,b)=>{
  const ka=a.dataset.efhcKey,kb=b.dataset.efhcKey;
  const pa=prior.indexOf(ka),pb=prior.indexOf(kb);
  return (pa<0?100+GROUPS[group].keys.indexOf(ka):pa)-(pb<0?100+GROUPS[group].keys.indexOf(kb):pb);
 });
}
function apply(group){
 const grid=$(GROUPS[group].selector,root);if(!grid)return;
 const ordered=sort(group,cells(group));
 for(const el of ordered)grid.appendChild(el);
 // Compacta cada linha de doze colunas sem ocultar cards ou alterar seu conteúdo.
 let used=0,last=null;
 for(const el of ordered){
  const key=el.dataset.efhcKey,choice=state[group].sizes[key]||GROUPS[group].defaultSize;
  const width=GROUPS[group].sizes[choice]||GROUPS[group].sizes[GROUPS[group].defaultSize];
  if(used+width>12&&used>0){if(last)last.style.setProperty('--efhc-span',Number(last.dataset.efhcApplied)+12-used);used=0;}
  el.dataset.efhcApplied=String(width);el.style.setProperty('--efhc-span',width);
  used+=width;last=el;
  if(used===12){used=0;last=null;}
  const input=$('.efhc-size',el);if(input)input.value=choice;
  el.classList.toggle('efhc-editing',editing);
 }
 if(last&&used<12)last.style.setProperty('--efhc-span',Number(last.dataset.efhcApplied)+12-used);
 ordered.forEach((el,i)=>{const up=$('[data-efhc-action="up"]',el),down=$('[data-efhc-action="down"]',el);
  if(up)up.disabled=i===0;if(down)down.disabled=i===ordered.length-1;});
}
function applyAll(){if(!root)return;apply('stats');apply('strategy');apply('cards');if(root)root.classList.toggle('efhc-edit-mode',editing);
 const btn=$('#efhc-edit',root);if(btn){btn.textContent=editing?'Concluir edição':'Editar';btn.setAttribute('aria-pressed',String(editing));}
}
function storeOrder(group){state[group].order=cells(group).map(n=>n.dataset.efhcKey);save();}
function move(group,key,target){
 const items=cells(group),source=items.find(x=>x.dataset.efhcKey===key),dest=items.find(x=>x.dataset.efhcKey===target);
 if(!source||!dest||source===dest)return;
 const a=items.indexOf(source),b=items.indexOf(dest);
 if(a<b)dest.after(source);else dest.before(source);
 storeOrder(group);apply(group);message('Posição atualizada e salva.');
}
function offset(group,key,by){
 const items=cells(group),index=items.findIndex(x=>x.dataset.efhcKey===key);
 if(index<0)return;const next=items[Math.min(items.length-1,Math.max(0,index+by))];
 if(next)move(group,key,next.dataset.efhcKey);
}
function bindDrag(handle,shell){
 let start=null,hover=null;
 const cleanup=()=>{shell.classList.remove('efhc-dragging');if(hover)hover.classList.remove('efhc-drop-hint');hover=null;start=null;};
 handle.addEventListener('pointerdown',e=>{
  if(!editing||e.button!==0)return;
  start={id:e.pointerId,x:e.clientX,y:e.clientY};
  handle.setPointerCapture?.(e.pointerId);
 });
 handle.addEventListener('pointermove',e=>{
  if(!start||e.pointerId!==start.id)return;
  if(Math.hypot(e.clientX-start.x,e.clientY-start.y)<7&&!shell.classList.contains('efhc-dragging'))return;
  shell.classList.add('efhc-dragging');
  const hit=document.elementFromPoint?.(e.clientX,e.clientY)?.closest?.('.efhc-cell');
  if(hover&&hover!==hit)hover.classList.remove('efhc-drop-hint');
  hover=hit?.dataset.efhcGroup===shell.dataset.efhcGroup&&hit!==shell?hit:null;
  if(hover)hover.classList.add('efhc-drop-hint');
 });
 handle.addEventListener('pointerup',e=>{
  if(!start||e.pointerId!==start.id)return;
  const dragged=shell.classList.contains('efhc-dragging');
  const group=shell.dataset.efhcGroup,key=shell.dataset.efhcKey,target=hover?.dataset.efhcKey;
  cleanup();if(dragged&&target)move(group,key,target);
 });
 handle.addEventListener('pointercancel',cleanup);
 handle.addEventListener('lostpointercapture',cleanup);
}
function controls(shell){
 const bar=document.createElement('div');bar.className='efhc-card-tools no-print';
 const handle=document.createElement('button');handle.type='button';handle.className='efhc-handle';handle.title='Segure e arraste o card';handle.setAttribute('aria-label','Arrastar card');handle.textContent='⠿ Mover';
 bindDrag(handle,shell);
 const up=document.createElement('button');up.type='button';up.dataset.efhcAction='up';up.setAttribute('aria-label','Mover para antes');up.textContent='↑';
 const down=document.createElement('button');down.type='button';down.dataset.efhcAction='down';down.setAttribute('aria-label','Mover para depois');down.textContent='↓';
 const size=document.createElement('select');size.className='efhc-size';size.setAttribute('aria-label','Largura do card');
 const widths=shell.dataset.efhcGroup!=='cards'?{p:'Pequeno',m:'Médio',g:'Grande'}:{p:'Pequeno',m:'Médio',g:'Grande',total:'Total'};
 for(const [key,label]of Object.entries(widths)){const o=document.createElement('option');o.value=key;o.textContent=label;size.appendChild(o);}
 size.addEventListener('change',()=>{const group=shell.dataset.efhcGroup,key=shell.dataset.efhcKey;
  state[group].sizes[key]=size.value;save();apply(group);message('Tamanho atualizado e salvo.');});
 up.addEventListener('click',()=>offset(shell.dataset.efhcGroup,shell.dataset.efhcKey,-1));
 down.addEventListener('click',()=>offset(shell.dataset.efhcGroup,shell.dataset.efhcKey,1));
 bar.append(handle,up,down,size);shell.insertBefore(bar,shell.firstChild);
}
function wrap(group){
 const conf=GROUPS[group],grid=$(conf.selector,root);if(!grid)return;
 const orig=$$(conf.items,grid);
 orig.forEach((item,i)=>{
  const shell=document.createElement('div');shell.className='efhc-cell';
  shell.dataset.efhcKey=conf.keys[i]||group+'-'+i;
  shell.dataset.efhcGroup=group;
  shell.appendChild(item);grid.appendChild(shell);controls(shell);
 });
 if(group==='cards')$$('.efh-stack',grid).forEach(el=>el.remove());
}
function toolbar(){
 const bar=document.createElement('div');bar.className='efhc-toolbar no-print';bar.id='efhc-toolbar';
 const hint=document.createElement('div');hint.className='efhc-intro';
 const name=document.createElement('strong');name.textContent='Organização do Início';
 const description=document.createElement('span');description.textContent='Edite a posição e a largura dos cards sem alterar seus registros.';
 hint.append(name,description);
 const buttons=document.createElement('div');buttons.className='efhc-actions';
 const edit=document.createElement('button');edit.id='efhc-edit';edit.type='button';edit.textContent='Editar';
 edit.setAttribute('aria-pressed','false');edit.addEventListener('click',()=>{editing=!editing;applyAll();message(editing?'Arraste pela alça Mover ou use as setas.':'Layout salvo.');});
 const auto=document.createElement('button');auto.id='efhc-auto';auto.type='button';auto.textContent='Auto-organizar';auto.addEventListener('click',()=>{
  for(const group of ['stats','strategy','cards']){state[group].sizes=defaultSizes(group);}
  save();applyAll();message('Cards distribuídos automaticamente, sem espaços vazios.');
 });
 const reset=document.createElement('button');reset.id='efhc-reset';reset.type='button';reset.textContent='Restaurar layout';reset.addEventListener('click',()=>{
  if(!window.confirm('Restaurar o layout padrão do Início? Nenhum registro será excluído.'))return;
  state=fresh();save();applyAll();message('Layout padrão restaurado.');
 });
 buttons.append(edit,auto,reset);bar.append(hint,buttons);
 const status=document.createElement('div');status.id='efhc-status';status.className='efhc-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const hero=$('.efh-hero',root);hero?.insertAdjacentElement('afterend',bar);bar.insertAdjacentElement('afterend',status);
}
function mount(){
 const next=$('#efh-dashboard');if(!next)return false;
 if(next===root&&next.dataset.efhcMounted==='1')return true;
 root=next;root.dataset.efhcMounted='1';
 toolbar();wrap('stats');wrap('strategy');wrap('cards');applyAll();return true;
}
window.EFHomeCardLayout=Object.freeze({mount,refresh:mount,autoOrganize:()=>{
  for(const group of ['stats','strategy','cards'])state[group].sizes=defaultSizes(group);
  save();applyAll();
 },getState:()=>JSON.parse(JSON.stringify(state))});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();