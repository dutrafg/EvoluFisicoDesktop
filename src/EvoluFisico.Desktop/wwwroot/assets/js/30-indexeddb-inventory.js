/* Read-only IndexedDB inventory for Windows migration planning.
 * Never deletes, upgrades, or mutates legacy databases.
 */
(function(){
'use strict';
async function inventory(){
 if(!window.indexedDB || typeof indexedDB.databases!=='function')
  throw new Error('Este WebView2 não permite listar os bancos IndexedDB.');
 const databases=await indexedDB.databases();
 const result=[];
 for(const info of databases){
  if(!info.name)continue;
  const db=await new Promise((resolve,reject)=>{
   const req=indexedDB.open(info.name);
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(req.error||new Error('Não foi possível abrir o banco.'));
   req.onupgradeneeded=()=>{
    // Do not create or upgrade a database while only taking inventory.
    req.transaction.abort();
    reject(new Error('O banco mudou durante a inspeção: '+info.name));
   };
  });
  try{
   const stores=[];
   for(const name of db.objectStoreNames){
    const count=await new Promise((resolve,reject)=>{
     const tx=db.transaction(name,'readonly');
     const request=tx.objectStore(name).count();
     request.onsuccess=()=>resolve(request.result);
     request.onerror=()=>reject(request.error||new Error('Falha ao contar registros.'));
     tx.onabort=()=>reject(tx.error||new Error('Leitura cancelada.'));
    });
    stores.push({name,count});
   }
   result.push({name:info.name,version:db.version,stores});
  }finally{db.close()}
 }
 return result;
}
window.EFDesktopIndexedDBInventory=Object.freeze({inventory});
})();
