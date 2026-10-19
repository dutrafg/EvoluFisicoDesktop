(function(){
'use strict';
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const records=()=>window.avaliacoes||[];
const contact=a=>a.email?'email:'+String(a.email).trim().toLowerCase():String(a.whatsapp||'').replace(/\D/g,'').length>=10?'phone:'+String(a.whatsapp).replace(/\D/g,''):null;
const fresh=()=> (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? 'client_' + crypto.randomUUID() : 'client_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
function ensure(a,list=records()){
 if(a.cliente_id)return a.cliente_id;
 const existing=list.find(x=>x!==a&&String(x.id)===String(a.id));
 if(existing&&existing.cliente_id)return a.cliente_id=existing.cliente_id;
 const c=contact(a),matches=c?list.filter(x=>x!==a&&contact(x)===c):[];
 const ids=[...new Set(matches.map(x=>x.cliente_id).filter(Boolean))];
 a.cliente_id=ids.length===1?ids[0]:fresh();
 return a.cliente_id;
}
function key(a){return a&&typeof a==='object'?ensure(a):resolve(a)}
function resolve(v){const str=String(v||'');const list=records();if(list.some(a=>a.cliente_id===str))return str;
 const ids=[...new Set(list.filter(a=>norm(a.nome)===norm(str)||String(a.id)===str).map(a=>ensure(a,list)))];
 return ids.length===1?ids[0]:'unresolved:'+str;
}
window.EFIdentity={ensure,key,resolve,same:(a,b)=>key(a)===key(b),contact};
window.EFMeasures={lean:a=>{const x=a&&a.dobras_resultado&&a.dobras_resultado.massaMagra;return x!==''&&x!=null&&Number.isFinite(Number(x))?Number(x):null},muscle:a=>{const x=a&&a.bioimpedancia&&a.bioimpedancia.mme;return x!==''&&x!=null&&Number.isFinite(Number(x))?Number(x):null}};
function clientPicker(){
 const input=document.querySelector('[name="nome"]');if(!input||document.getElementById('ef-client-identity'))return;
 const wrap=document.createElement('div');wrap.className='input-group';
 const label=document.createElement('label');label.htmlFor='ef-client-identity';label.textContent='Vincular avaliação a um cliente';
 const select=document.createElement('select');select.id='ef-client-identity';select.className='form-control';
 select.onchange=()=>select.dataset.changed='1';
 function fill(){const value=select.value||'auto';select.replaceChildren();for(const [v,t] of [['auto','Automático por contato ou avaliação em edição'],['new','Novo cliente (mesmo que tenha nome igual)']]){const o=new Option(t,v);select.add(o)}const seen=new Set();records().forEach(a=>{const k=key(a);if(seen.has(k))return;seen.add(k);select.add(new Option((a.nome||'Sem nome')+' · '+(a.email||a.whatsapp||k.slice(-12)),k))});select.value=value;}
 fill();wrap.append(label,select);(input.closest('.input-group')||input).before(wrap);
 input.form?.addEventListener('reset',()=>{select.dataset.changed='0';select.value='auto'});
 window.addEventListener('ef-records-changed',fill);
}
function banner(){if(!window.EF_TEMPORARY_STORAGE)return;const b=document.createElement('div');b.id='ef-storage-warning';b.setAttribute('role','alert');b.style.cssText='position:sticky;top:0;z-index:99999;padding:12px;background:#713f12;color:white;text-align:center';b.textContent='Armazenamento temporário: exporte um backup antes de fechar ou recarregar. Dados e senha guardados apenas em memória serão perdidos.';const btn=document.createElement('button');btn.type='button';btn.textContent='Exportar backup';btn.style.marginLeft='12px';btn.onclick=()=>window.exportarBackupJSON();b.append(btn);document.body.prepend(b)}
document.addEventListener('DOMContentLoaded',()=>{banner();clientPicker()});
})();
