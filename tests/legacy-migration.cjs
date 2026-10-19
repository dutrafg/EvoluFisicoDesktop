const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/assets/js/29-legacy-migration.js','utf8');
const original=new Map([['patient-synthetic','{"name":"Paciente Fictício"}'],['settings','tema claro']]);
const encrypted=new Map();
const localStorage={
 get length(){return original.size},
 key:i=>[...original.keys()][i]??null,
 getItem:key=>original.get(key)??null,
 setItem:()=>{throw Error('Migration must not modify original storage')},
 removeItem:()=>{throw Error('Migration must not delete original storage')}
};
const storage={
 importBatch:async batch=>{
  for(const [id,data] of Object.entries(batch)){
   if(encrypted.has(id))throw Error('Duplicate identifier');
   encrypted.set(id,data);
  }
  return Object.keys(batch).length;
 },
 read:async id=>encrypted.get(id)??null
};
const window={EFNativeStorage:storage};
vm.runInNewContext(code,{window,localStorage,TextEncoder,Error,Object,String});
(async()=>{
 const result=await window.EFDesktopLegacyMigration.migrate();
 assert.equal(result.transferred,2);
 assert.equal(original.size,2);
 assert.equal(encrypted.size,2);
 const records=[...encrypted.values()].map(x=>JSON.parse(new TextDecoder().decode(x)));
 assert.ok(records.some(x=>x.key==='patient-synthetic'&&x.value.includes('Fictício')));
 await assert.rejects(window.EFDesktopLegacyMigration.migrate(),/Duplicate identifier/);
 assert.equal(original.size,2);
 console.log('PASS: verified encrypted snapshot preserves original browser records');
})().catch(e=>{console.error(e);process.exitCode=1});
