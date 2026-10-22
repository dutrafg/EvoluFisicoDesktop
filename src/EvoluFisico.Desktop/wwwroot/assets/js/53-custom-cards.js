
(function(){
 'use strict';
 const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
 const KEY='ef2_layout_inicio_organizacao_v1';
 const fresh=()=>({homeStats:{order:[],sizes:{}},homeCards:{order:[],sizes:{}},orgStats:{order:[],sizes:{}},notes:{order:[],sizes:{}},tasks:{order:[],sizes:{}},goals:{order:[],sizes:{}}});
 let stored=fresh(),editing={home:false,org:false},scheduled=false,decorating=false;
 try{const p=JSON.parse(localStorage.getItem(KEY)||'null');if(p&&typeof p==='object'){for(const k of Object.keys(stored)){if(p[k]&&typeof p[k]==='object'){stored[k].order=Array.isArray(p[k].order)?p[k].order.filter(x=>typeof x==='string').slice(0,300):[];stored[k].sizes=p[k].sizes&&typeof p[k].sizes==='object'?p[k].sizes:{}}}}}catch(e){}
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(stored))}catch(e){}}
 const cap=s=>String(s||'').replace(/(^|[.!?]\s+|\n\s*)(\s*)(\p{Ll})/gu,(m,a,b,c)=>a+b+c.toLocaleUpperCase('pt-BR'));
 const sentenceCase=(root)=>{if(!root)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){if(!node.nodeValue||!node.nodeValue.trim())continue;const parent=node.parentElement;if(!parent||parent.closest('.efx-widget-controls,[data-eforg-id] .eforg-main,.efh-a-content,input,textarea,select,code,pre'))continue;
   // Preserve all-caps status tags, data values and professional names.
   if(parent.closest('.efh-eyebrow,.eforg-testing,.efh-test,.efh-time,[data-efh-event]'))continue;
   const next=cap(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next;
  }
 };
 function makePanel(where){const root=$(where==='home'?'#efh-dashboard':'#tab-organizacao .eforg-wrap');if(!root)return;
  const id='efx-'+where+'-panelbar';if($('#'+id))return;
  const bar=document.createElement('div');bar.id=id;bar.className='efx-panelbar no-print';
  const note=document.createElement('span');note.className='efx-explain';note.textContent=where==='home'?'Personalize os indicadores e insights. As posições e larguras ficam salvas neste navegador.':'Personalize os cards de Agenda, Notas, Tarefas e Metas. Use as setas em celulares ou arraste no desktop.';
  const buttons=document.createElement('div');buttons.className='efx-buttons';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='efx-edit-button';toggle.textContent='Personalizar cards';toggle.setAttribute('aria-pressed',String(editing[where]));
  toggle.addEventListener('click',()=>{editing[where]=!editing[where];if(where==='org'){const editor=window.EFPrototypeEditor;if(editing.org)editor?.enable?.();else editor?.disable?.()}sync();});
  const reset=document.createElement('button');reset.type='button';reset.className='efx-reset-button';reset.textContent='Restaurar layout';reset.title='Repor posições e tamanhos padrões, sem excluir registros';
  reset.addEventListener('click',()=>{if(!confirm('Restaurar posição e tamanho padrão dos cards deste módulo? Os registros serão preservados.'))return;
    const groups=where==='home'?['homeStats','homeCards']:['orgStats','notes','tasks','goals'];for(const g of groups)stored[g]={order:[],sizes:{}};save();if(where==='org')window.EFPrototypeEditor?.resetAll?.();
    if(where==='home')window.EFHomeDashboard?.refresh?.();sync();});
  buttons.append(toggle,reset);bar.append(note,buttons);
  if(where==='home')$('#efh-dashboard .efh-hero')?.insertAdjacentElement('afterend',bar);
  else {const tabs=$('.eforg-tabs',root);tabs?.insertAdjacentElement('beforebegin',bar)}
 }
 const configs={
  homeStats:{selector:'#tab-painel .efh-stat-grid',items:'.efh-stat',key:(el,i)=>'kpi-'+i,defaultSize:'small',sizes:{small:3,medium:6,large:12}},
  homeCards:{selector:'#tab-painel .efh-grid',items:'.efh-card',key:(el,i)=>['avisos','acontecimentos','insights','semana','acoes'][i]||'widget-'+i,defaultSize:'medium',sizes:{small:4,medium:6,large:8,full:12}},
  orgStats:{selector:'#tab-organizacao .eforg-summary-grid',items:'.eforg-stat',key:(el,i)=>['pendentes','atrasadas','concluidas'][i]||'stat-'+i,defaultSize:'medium',sizes:{small:4,medium:6,large:12}},
  notes:{selector:'#eforg-notes-list',items:'.eforg-card[data-eforg-id]',key:el=>el.dataset.eforgId,defaultSize:'large',sizes:{small:4,medium:6,large:12}},
  tasks:{selector:'#eforg-tasks-list',items:'.eforg-card[data-eforg-id]',key:el=>el.dataset.eforgId,defaultSize:'large',sizes:{small:4,medium:6,large:12}},
  goals:{selector:'#eforg-goals-list',items:'.eforg-card[data-eforg-id]',key:el=>el.dataset.eforgId,defaultSize:'large',sizes:{small:4,medium:6,large:12}}
 };
 const whereOf=g=>g.startsWith('home')?'home':'org';
 function sortedKeys(g,nodes){const keys=nodes.map(n=>n.dataset.efxKey),saved=stored[g].order;return [...keys].sort((a,b)=>{let ia=saved.indexOf(a),ib=saved.indexOf(b);return (ia<0?10000+keys.indexOf(a):ia)-(ib<0?10000+keys.indexOf(b):ib)})}
 function updateWidgets(group){const conf=configs[group],grid=$(conf.selector);if(!grid)return;
  const originals=$$(conf.items,grid); if(!originals.length)return;
  const widgets=[];
  for(let i=0;i<originals.length;i++){
   const original=originals[i];let shell=original.closest('.efx-widget');
   if(!shell||shell.parentNode!==grid){shell=document.createElement('div');shell.className='efx-widget';original.parentNode.insertBefore(shell,original);shell.appendChild(original)}
   const key=original.dataset.efxStableKey||conf.key(original,i);original.dataset.efxStableKey=key;shell.dataset.efxKey=key;shell.dataset.efxGroup=group;widgets.push(shell);
  }
  if(group==='homeCards'){$$('.efh-stack',grid).forEach(st=>{st.remove()})}
  const byKey=new Map(widgets.map(x=>[x.dataset.efxKey,x]));
  sortedKeys(group,widgets).forEach(k=>grid.appendChild(byKey.get(k)));
  widgets.forEach(shell=>{let controls=$('.efx-widget-controls',shell);if(!controls){controls=document.createElement('div');controls.className='efx-widget-controls no-print';const grip=document.createElement('button');grip.className='efx-grip';grip.type='button';grip.draggable=true;grip.textContent='⠿ Mover';grip.title='Arraste para reposicionar no desktop';
   grip.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',JSON.stringify({group,key:shell.dataset.efxKey}));e.dataTransfer.effectAllowed='move';shell.classList.add('efx-dragging')});
   grip.addEventListener('dragend',()=>shell.classList.remove('efx-dragging'));
   const up=document.createElement('button');up.type='button';up.textContent='↑';up.title='Mover card para antes';up.setAttribute('aria-label','Mover card para antes');up.addEventListener('click',()=>move(group,shell.dataset.efxKey,-1));
   const down=document.createElement('button');down.type='button';down.textContent='↓';down.title='Mover card para depois';down.setAttribute('aria-label','Mover card para depois');down.addEventListener('click',()=>move(group,shell.dataset.efxKey,1));
   const sizeButton=document.createElement('button');sizeButton.type='button';sizeButton.className='efx-size-btn';sizeButton.setAttribute('aria-label','Alterar largura do card');sizeButton.addEventListener('click',()=>{const values=Object.keys(conf.sizes),at=values.indexOf(shell.dataset.efxSize||conf.defaultSize);stored[group].sizes[shell.dataset.efxKey]=values[(at+1)%values.length];save();applyState(group)});
   controls.append(grip,up,down,sizeButton);shell.insertBefore(controls,shell.firstChild);
   shell.addEventListener('dragover',e=>{if(!(editing[whereOf(group)]))return;e.preventDefault();e.dataTransfer.dropEffect='move';shell.classList.add('efx-drag-over')});
   shell.addEventListener('dragleave',()=>shell.classList.remove('efx-drag-over'));
   shell.addEventListener('drop',e=>{e.preventDefault();shell.classList.remove('efx-drag-over');let source;try{source=JSON.parse(e.dataTransfer.getData('text/plain'))}catch(_){return};if(!source||source.group!==group)return;const target=shell.dataset.efxKey;if(source.key===target)return;
      const order=$$(".efx-widget[data-efx-group='"+group+"']",grid).map(n=>n.dataset.efxKey);const from=order.indexOf(source.key),to=order.indexOf(target);if(from<0||to<0)return;order.splice(from,1);order.splice(to,0,source.key);stored[group].order=order;save();applyState(group)});
   shell.addEventListener('keydown',e=>{if(e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();move(group,shell.dataset.efxKey,e.key==='ArrowUp'?-1:1)}});
  }});
  applyState(group);
 }
 function move(group,key,delta){const grid=$(configs[group].selector);if(!grid)return;const order=$$(".efx-widget[data-efx-group='"+group+"']",grid).map(n=>n.dataset.efxKey);let i=order.indexOf(key);if(i<0)return;let j=Math.min(order.length-1,Math.max(0,i+delta));if(i===j)return;order.splice(i,1);order.splice(j,0,key);stored[group].order=order;save();applyState(group)}
 function applyState(group){const grid=$(configs[group].selector);if(!grid)return;const nodes=$$(".efx-widget[data-efx-group='"+group+"']",grid);const order=sortedKeys(group,nodes),map=new Map(nodes.map(n=>[n.dataset.efxKey,n]));order.forEach(k=>grid.appendChild(map.get(k)));
  const options=configs[group].sizes;
  nodes.forEach(shell=>{const key=shell.dataset.efxKey;const size=stored[group].sizes[key] in options?stored[group].sizes[key]:configs[group].defaultSize;shell.style.setProperty('--efx-span',options[size]);shell.dataset.efxSize=size;shell.classList.toggle('is-customizing',editing[whereOf(group)]);
   const sizeButton=$('.efx-size-btn',shell);if(sizeButton)sizeButton.textContent='Tamanho: '+({small:'Pequeno',medium:'Médio',large:'Grande',full:'Total'}[size]||'Médio');
   const idx=order.indexOf(key),btns=$$('.efx-widget-controls button',shell);if(btns[1])btns[1].disabled=idx<=0;if(btns[2])btns[2].disabled=idx>=order.length-1;
  })
 }
 function sync(){if(decorating)return;decorating=true;
  try{
   makePanel('home');makePanel('org');
   for(const group of Object.keys(configs))updateWidgets(group);
   for(const which of ['home','org']){const toggle=$('#efx-'+which+'-panelbar .efx-edit-button');if(toggle){toggle.setAttribute('aria-pressed',String(editing[which]));toggle.textContent=editing[which]?'✓ Concluir edição':'Personalizar cards'}}
   sentenceCase($('#efh-dashboard'));
   // Textual elements of Organização; user-authored note, task and goal fields remain unchanged.
   sentenceCase($('.eforg-wrap'));
  }finally{decorating=false}
 }
 function queue(){if(scheduled||decorating)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync()})}
 function setup(){
  const home=$('#tab-painel'),org=$('#tab-organizacao');if(!home||!org)return;
  sync();const observer=new MutationObserver(muts=>{if(decorating||muts.every(m=>m.target.closest?.('.efx-widget-controls')))return;queue()});observer.observe(home,{childList:true,subtree:true});observer.observe(org,{childList:true,subtree:true});
  const saved=window.salvarConfigProfissional;
  if(typeof saved==='function')window.salvarConfigProfissional=function(){const r=saved.apply(this,arguments);window.EFHomeDashboard?.refresh?.();queue();return r};
  window.EFLayoutPreview={setEditing:(where,v)=>{editing[where]=!!v;if(where==='org'){const ed=window.EFPrototypeEditor;v?ed?.enable?.():ed?.disable?.()}sync()},getState:()=>JSON.parse(JSON.stringify(stored)),refresh:queue,move,reset:(which)=>{const groups=which==='home'?['homeStats','homeCards']:['orgStats','notes','tasks','goals'];groups.forEach(k=>stored[k]={order:[],sizes:{}});save();window.EFHomeDashboard?.refresh?.();queue()}};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();

