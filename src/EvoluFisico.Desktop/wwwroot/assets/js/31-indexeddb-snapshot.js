/* Explicit, non-destructive IndexedDB -> encrypted SQLite snapshot.
 * No cutover: modules continue using the original database until verified separately.
 * Only JSON-compatible records are supported; unsupported records stop the operation.
 */
(function(){
'use strict';
if(!window.EFNativeStorage || !window.EFDesktopIndexedDBInventory)return;
const encoder=new TextEncoder();
async function stableId(database,store,key){
 const digest=await crypto.subtle.digest('SHA-256',encoder.encode(JSON.stringify([database,store,key])));
 return 'ef-idb-v2-'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
function readStore(db,name){
 return new Promise((resolve,reject)=>{
  const items=[];
  const tx=db.transaction(name,'readonly');
  const req=tx.objectStore(name).openCursor();
  req.onsuccess=()=>{
   const cursor=req.result;
   if(!cursor)return;
   try{
    const key=cursor.key,value=cursor.value;
    const serialized=JSON.stringify({key,value});
    if(serialized===undefined)throw new Error('Registro não serializável');
    const decoded=JSON.parse(serialized);
    if(JSON.stringify(decoded)!==serialized)throw new Error('Registro inválido');
    items.push(serialized);
    cursor.continue();
   }catch(error){reject(error);try{tx.abort()}catch(_){}}
  };
  req.onerror=()=>reject(req.error||new Error('Falha ao ler registros'));
  tx.onerror=()=>reject(tx.error||new Error('Falha na transação'));
  tx.oncomplete=()=>resolve(items);
 });
}
function openExisting(name){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(name);
  req.onupgradeneeded=()=>{req.transaction.abort();reject(new Error('Banco ausente ou alterado: '+name))};
  req.onerror=()=>reject(req.error||new Error('Falha ao abrir IndexedDB'));
  req.onsuccess=()=>resolve(req.result);
 });
}
function equal(a,b){return a&&a.length===b.length&&!a.some((v,i)=>v!==b[i])}
async function snapshot(){
 const inventory=await window.EFDesktopIndexedDBInventory.inventory();
 let copied=0,alreadyCopied=0;
 for(const info of inventory){
  const db=await openExisting(info.name);
  try{
   if(db.version!==info.version)throw new Error('Versão do banco alterada durante a cópia');
   for(const store of info.stores){
    const rows=await readStore(db,store.name);
    if(rows.length!==store.count)throw new Error('Quantidade de registros mudou durante a cópia');
    for(let offset=0;offset<rows.length;offset+=100){
     const batch={};
     const end=Math.min(offset+100,rows.length);
     for(let i=offset;i<end;i++){
      const record=encoder.encode(JSON.stringify({database:info.name,store:store.name,entry:JSON.parse(rows[i])}));
      if(record.byteLength>8_000_000)throw new Error('Registro excede o limite: '+store.name);
      // IDs are deterministic and bounded; collisions are rejected by verification.
      const id=await stableId(info.name,store.name,JSON.parse(rows[i]).key);
      const existing=await window.EFNativeStorage.read(id);
      if(existing===null)batch[id]=record;
      else if(equal(existing,record))alreadyCopied++;
      else throw new Error('Cópia existente diferente: '+id);
     }
     if(Object.keys(batch).length){
      await window.EFNativeStorage.importBatch(batch);
      for(const [id,expected] of Object.entries(batch)){
       if(!equal(await window.EFNativeStorage.read(id),expected))throw new Error('Falha na conferência: '+id);
      }
      copied+=Object.keys(batch).length;
     }
    }
   }
  }finally{db.close()}
 }
 return {copied,alreadyCopied,originalsPreserved:true};
}
window.EFDesktopIndexedDBSnapshot=Object.freeze({snapshot});
})();
