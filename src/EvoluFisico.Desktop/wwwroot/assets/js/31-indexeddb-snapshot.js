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
function requireJSON(value,seen=new WeakSet()){
 if(value===null || typeof value==='string' || typeof value==='boolean')return;
 if(typeof value==='number' && Number.isFinite(value))return;
 if(typeof value!=='object' || seen.has(value) || value instanceof Date ||
    value instanceof ArrayBuffer || ArrayBuffer.isView(value) ||
    value instanceof Blob || value instanceof Map || value instanceof Set)
  throw new Error('Registro IndexedDB contém valor não compatível com JSON');
 seen.add(value);
 if(!Array.isArray(value) && Object.getPrototypeOf(value)!==Object.prototype)
  throw new Error('Registro IndexedDB contém objeto não suportado');
 for(const [key,item] of Object.entries(value))requireJSON(item,seen);
 seen.delete(value);
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
    requireJSON(key);requireJSON(value);
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
     let batchBytes=0;
     const batch={};
     const end=Math.min(offset+100,rows.length);
     for(let i=offset;i<end;i++){
      const record=encoder.encode(JSON.stringify({database:info.name,store:store.name,entry:JSON.parse(rows[i])}));
      if(record.byteLength>8_000_000)throw new Error('Registro excede o limite: '+store.name);
      batchBytes+=record.byteLength;
      if(batchBytes>24_000_000)throw new Error('Lote excede o limite seguro de 24 MB; reduza o tamanho do lote.');
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
    const afterCount=await new Promise((resolve,reject)=>{
     const tx=db.transaction(store.name,'readonly');
     const req=tx.objectStore(store.name).count();
     req.onsuccess=()=>resolve(req.result);
     req.onerror=()=>reject(req.error||new Error('Falha ao conferir quantidade final'));
    });
    if(afterCount!==rows.length)throw new Error('Banco alterado durante a cópia; execute novamente.');
   }
  }finally{db.close()}
 }
 return {copied,alreadyCopied,originalsPreserved:true};
}
window.EFDesktopIndexedDBSnapshot=Object.freeze({snapshot});
})();
