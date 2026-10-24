/* EvoluFísico Desktop 1.1 — migração conservadora da Organização para SQLite cifrado.
   Não apaga o legado WebView2; divergências exigem decisão manual. */
(function(){
'use strict';
const ID='ef-desktop-organization-backup-v110';
const KEYS=['ef2_organization_v1_data','ef90_tasks_v2','ef90_home_agenda'];
const keys=new Set(KEYS);
const native=()=>window.EFNativeStorage;
let status='iniciando', lastError='', writeQueue=Promise.resolve(), hydrating=false;
function readLocal(){const values={};for(const k of KEYS){const v=localStorage.getItem(k);if(v!=null){JSON.parse(v);values[k]=v;}}return values;}
function equal(a,b){return KEYS.every(k=>(a[k]??null)===(b[k]??null));}
function notify(){window.dispatchEvent(new CustomEvent('ef-desktop-organization-sync',{detail:{status,lastError}}));}
function snapshot(values){return {version:1,keys:values,updated:new Date().toISOString()};}
async function persist(values){
 const db=native();if(!db?.writeJSON||!db?.readJSON)throw Error('SQLite nativo não está acessível');
 const written=await db.writeJSON(ID,snapshot(values));
 if(written!=='saved')throw Error('SQLite não confirmou a escrita');
 const check=await db.readJSON(ID);
 if(!check?.keys||!equal(check.keys,values))throw Error('Verificação do SQLite falhou');
 return true;
}
async function initialize(){
 try{
  const db=native();
  if(!db?.readJSON||!db?.writeJSON){status='indisponivel';notify();return;}
  const saved=await db.readJSON(ID),local=readLocal(),nativeValues=saved?.keys||{};
  if(saved&&saved.version!==1)throw Error('Versão do arquivo de Organização incompatível');
  if(saved){
   const hasLocal=KEYS.some(k=>local[k]!=null),hasNative=KEYS.some(k=>nativeValues[k]!=null);
   if(!hasLocal&&hasNative){
    hydrating=true;
    try{for(const k of KEYS)if(nativeValues[k]!=null)localStorage.setItem(k,nativeValues[k]);}
    finally{hydrating=false;}
    status='restaurado';
    notify();window.dispatchEvent(new Event('ef-desktop-organization-restored'));
   }else if(!equal(local,nativeValues)){status='divergente';lastError='Os registros locais diferem do backup cifrado. Não foram sobrescritos. Exporte os dados e reconcilie antes de restaurar.';notify();return;}
   else{status='sincronizado';notify();}
  }else{await persist(local);status='migrado';notify();}
 }catch(e){status='erro';lastError=String(e?.message||e);notify();}
}
function schedule(){
 if(hydrating)return;
 writeQueue=writeQueue.then(async()=>{
  if(status==='divergente')return;
  try{await persist(readLocal());status='sincronizado';lastError='';notify();}
  catch(e){status='erro';lastError=String(e?.message||e);notify();}
 });
}
const rawSet=Storage.prototype.setItem,rawRemove=Storage.prototype.removeItem;
Storage.prototype.setItem=function(k,v){const result=rawSet.call(this,k,v);if(this===window.localStorage&&keys.has(String(k)))schedule();return result;};
Storage.prototype.removeItem=function(k){const result=rawRemove.call(this,k);if(this===window.localStorage&&keys.has(String(k)))schedule();return result;};
async function restoreEmptyOnly(){
 const local=readLocal();if(KEYS.some(k=>local[k]!=null))throw Error('Não é permitido substituir dados locais existentes.');
 const saved=await native().readJSON(ID);if(!saved?.keys)throw Error('Nenhum arquivo cifrado disponível');
 hydrating=true;try{for(const k of KEYS)if(saved.keys[k]!=null)localStorage.setItem(k,saved.keys[k]);}finally{hydrating=false;}
 status='restaurado';lastError='';notify();window.dispatchEvent(new Event('ef-desktop-organization-restored'));return true;
}
const ready=initialize();
window.EFDesktopData=Object.freeze({ready,flush:()=>writeQueue,status:()=>({status,error:lastError}),restoreEmptyOnly,recordId:ID});
})();