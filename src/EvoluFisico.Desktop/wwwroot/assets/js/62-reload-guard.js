/* EvoluFísico Desktop 1.0.6 — evita recarga acidental sem interferir no salvar dos dados. */
(function(){
'use strict';
const KEY='ef_general_reload_guard_v1';
let enabled=true, control=null;
try{enabled=localStorage.getItem(KEY)!=='0'}catch(_){}
function isReloadKey(e){
 const key=String(e.key||'').toLowerCase();
 return key==='f5'||(key==='r'&&(e.ctrlKey||e.metaKey));
}
function handleKey(e){
 if(!enabled||!isReloadKey(e))return;
 e.preventDefault();
 e.stopImmediatePropagation?.();
 const status=document.getElementById('efw-reload-status');
 if(status)status.textContent='Recarregamento acidental bloqueado. Desative a proteção em Geral se quiser recarregar.';
}
function handleBeforeUnload(e){
 if(!enabled)return;
 e.preventDefault();
 e.returnValue='';
}
function set(value){
 enabled=!!value;
 try{localStorage.setItem(KEY,enabled?'1':'0')}catch(_){}
 if(control)control.checked=enabled;
 const status=document.getElementById('efw-reload-status');
 if(status)status.textContent=enabled?'Proteção ativada para atalhos de recarga e saída acidental.':'Proteção desativada; recarga liberada.';
}
function init(){
 const grid=document.querySelector('#tab-settings .efw-settings-panel[data-efw-panel="geral"] .ef-settings-grid')
   ||document.querySelector('#tab-settings .ef-settings-grid');
 if(!grid||document.getElementById('efw-reload-card'))return;
 const card=document.createElement('article');
 card.id='efw-reload-card';card.className='ef-settings-card efw-reload-card';
 card.innerHTML='<div class="efw-reload-card-heading"><strong>Proteção contra recarga acidental</strong><span>Configurações / Geral</span></div>'+
 '<label class="efw-reload-row" for="efw-reload-toggle"><span><b>Proteger contra recarregamento acidental</b><small>Evita F5, Shift+F5 e Ctrl/Cmd+R. Ao fechar ou recarregar pela interface, o sistema pode pedir confirmação.</small></span><input id="efw-reload-toggle" type="checkbox" aria-describedby="efw-reload-status"></label>'+
 '<p id="efw-reload-status" role="status" aria-live="polite"></p>';
 grid.appendChild(card);
 control=card.querySelector('#efw-reload-toggle');control.checked=enabled;
 control.addEventListener('change',()=>set(control.checked));
 set(enabled);
}
window.addEventListener('keydown',handleKey,true);
window.addEventListener('beforeunload',handleBeforeUnload);
window.EFReloadGuard={isEnabled:()=>enabled,set,isReloadKey,handleKey,handleBeforeUnload,init};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();