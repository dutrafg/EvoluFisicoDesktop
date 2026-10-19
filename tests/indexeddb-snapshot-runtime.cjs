const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto').webcrypto;
const source=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/assets/js/31-indexeddb-snapshot.js','utf8');
const stored=new Map();
const rows=[{key:1,value:{name:'Paciente fictício'}},{key:2,value:{measure:42}}];
function db(){
 return {
  version:1,close(){},
  transaction(name,mode){
   assert.equal(name,'patients');assert.equal(mode,'readonly');
   const tx={objectStore(){return {
    count(){const req={};queueMicrotask(()=>{req.result=rows.length;req.onsuccess()});return req},
    openCursor(){
     const req={};let index=0;
     function next(){
      queueMicrotask(()=>{
       req.result=index<rows.length?{
        key:rows[index].key,value:rows[index].value,
        continue(){index++;next()}
       }:null;
       req.onsuccess();
       if(req.result===null)queueMicrotask(()=>tx.oncomplete?.());
      });
     }
     next();return req;
    }
   }}};
   return tx;
  }
 };
}
const indexedDB={open(name){
 assert.equal(name,'legacy-patients');
 const req={};
 queueMicrotask(()=>{req.result=db();req.onsuccess()});
 return req;
}};
const native={
 read:async id=>stored.get(id)??null,
 importBatch:async batch=>{
  for(const [id,value] of Object.entries(batch)){
   assert.ok(!stored.has(id));stored.set(id,value);
  }
  return Object.keys(batch).length;
 }
};
const window={
 EFNativeStorage:native,
 EFDesktopIndexedDBInventory:{inventory:async()=>[{
  name:'legacy-patients',version:1,stores:[{name:'patients',count:rows.length}]
 }]}
};
vm.runInNewContext(source,{window,indexedDB,crypto,TextEncoder,Uint8Array,Blob,Map,Set,ArrayBuffer,WeakSet,JSON,Number,Object,Error,Promise,queueMicrotask});
(async()=>{
 const first=await window.EFDesktopIndexedDBSnapshot.snapshot();
 assert.equal(first.copied,2);
 assert.equal(stored.size,2);
 const second=await window.EFDesktopIndexedDBSnapshot.snapshot();
 assert.equal(second.copied,0);assert.equal(second.alreadyCopied,2);
 rows.reverse();
 const reordered=await window.EFDesktopIndexedDBSnapshot.snapshot();
 assert.equal(reordered.copied,0);assert.equal(reordered.alreadyCopied,2);
 rows[0].value.measure=43;
 await assert.rejects(window.EFDesktopIndexedDBSnapshot.snapshot(),/Cópia existente diferente/);
 assert.equal(stored.size,2);
 console.log('PASS: IndexedDB snapshot, idempotence, stable IDs and conflict rejection');
})().catch(e=>{console.error(e);process.exitCode=1});
