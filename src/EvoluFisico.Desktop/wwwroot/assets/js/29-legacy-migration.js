/* Conservative Windows migration: snapshot browser localStorage to encrypted native SQLite.
 * Original data remains untouched. No automatic cutover is performed.
 */
(function(){
'use strict';
if(!window.EFNativeStorage)return;
const PREFIX='ef-legacy-localstorage-';
const encoder=new TextEncoder();
async function migrate(){
 const entries=[];
 for(let i=0;i<localStorage.length;i++){
  const key=localStorage.key(i);
  if(key===null)continue;
  const value=localStorage.getItem(key);
  if(value!==null)entries.push([key,value]);
 }
 entries.sort((a,b)=>a[0].localeCompare(b[0]));
 const batches=[];
 let current={},size=0;
 for(const [key,value] of entries){
  const payload=encoder.encode(JSON.stringify({key,value}));
  if(payload.length>8_000_000)throw new Error('Registro grande demais: '+key);
  if(Object.keys(current).length>=200 || size+payload.length>20_000_000){
   batches.push(current);current={};size=0;
  }
  // Stable unique key, not derived from sensitive content; avoid colliding with patient records.
  const id=PREFIX+String(batches.length).padStart(4,'0')+'-'+Object.keys(current).length.toString().padStart(4,'0');
  current[id]=payload;size+=payload.length;
 }
 if(Object.keys(current).length)batches.push(current);
 // A failed batch leaves the original localStorage intact, and already committed
 // batches remain encrypted for recovery. Re-running refuses to overwrite them.
 let transferred=0,alreadyCopied=0;
 for(const batch of batches){
  const pending={};
  for(const [id,expected] of Object.entries(batch)){
   const existing=await window.EFNativeStorage.read(id);
   if(existing===null)pending[id]=expected;
   else if(existing.length===expected.length && !existing.some((b,i)=>b!==expected[i]))
    alreadyCopied++;
   else throw new Error('Conflito com cópia existente: '+id+'. Nenhum dado original foi modificado.');
  }
  if(Object.keys(pending).length)await window.EFNativeStorage.importBatch(pending);
  for(const [id,expected] of Object.entries(batch)){
   const actual=await window.EFNativeStorage.read(id);
   if(!actual || actual.length!==expected.length || actual.some((b,i)=>b!==expected[i]))
    throw new Error('Falha na conferência da migração: '+id);
  }
  transferred+=Object.keys(pending).length;
 }
 return {transferred,alreadyCopied,batches:batches.length,legacyPreserved:true};
}
window.EFDesktopLegacyMigration=Object.freeze({migrate});
})();
