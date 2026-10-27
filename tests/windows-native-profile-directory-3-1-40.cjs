'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/index.html','utf8');
function section(a,b){const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,'Section missing: '+a);return html.slice(i,j)}
const records=new Map();
const storage={
 health:async()=> 'ok',
 list:async()=>[...records.keys()],
 readJSON:async id=>records.get(id)??null,
 writeJSON:async(id,row)=>{records.set(id,structuredClone(row));return 'saved'},
 importBatch:async batch=>{for(const [key,bytes] of Object.entries(batch)){assert(!records.has(key));records.set(key,JSON.parse(new TextDecoder().decode(bytes)))}return Object.keys(batch).length}
};
const ctx={window:{EFNativeStorage:storage,EF_Security:{decryptObject:async x=>x}},console,TextEncoder,TextDecoder,Date,JSON,Promise,Error,
 localStorage:{getItem:key=>key==='ef_perfil_cadastros_v1'?JSON.stringify([{id:'legacy-1',nome:'Aluno Migrado'}]):null},
 indexedDB:{databases:async()=>[]},DIRECTORY_DB:'EvoluFisico_Cadastro_Perfil',
 DIRECTORY_FALLBACK:'ef_perfil_cadastros_v1',directory:new Map(),directoryBackend:'',directoryProblem:'',
 locked:()=>false,plain:x=>String(x??''),notifyRegistry:()=>{},main:()=>{},
 EF_Security:{isConfigured:()=>false,enabled:false},directoryDb:null,
 meaningfulName:x=>typeof x==='string'&&x.trim().length>0,
 PROFILE_ID:'principal',PROFILE_STORE:'perfil',PROFILE_DB:'EvoluFisico_Profissional'
};
vm.createContext(ctx);
vm.runInContext(section('async function readProfileFallback(){','  const meaningfulName='),ctx);
vm.runInContext(section('async function loadDirectoryNative(){','async function loadDirectory(){'),ctx);
vm.runInContext(section('async function persistDirectory(item){','async function directoryExport(){'),ctx);
(async()=>{
 await vm.runInContext("writeProfileFallback({name:'Profissional RC11',cref:'0001'})",ctx);
 const profile=await vm.runInContext('readProfileFallback()',ctx);
 assert.equal(profile.name,'Profissional RC11');
 assert(records.has('ef-profile-professional'));
 await vm.runInContext('loadDirectoryNative()',ctx);
 assert.equal(ctx.directory.get('legacy-1').nome,'Aluno Migrado');
 assert(records.has('ef-profile-student-legacy-1'));
 await vm.runInContext("persistDirectory({id:'student-2',nome:'Aluno Novo'})",ctx);
 assert.equal(records.get('ef-profile-student-student-2').nome,'Aluno Novo');
 await vm.runInContext("persistDirectory({id:'student-2',nome:'Aluno Editado'})",ctx);
 assert.equal(records.get('ef-profile-student-student-2').nome,'Aluno Editado');
 const prior=ctx.directory.size;
 const saved=storage.writeJSON;storage.writeJSON=async()=>{throw Error('Falha simulada SQLite')};
 await assert.rejects(vm.runInContext("persistDirectory({id:'student-fail',nome:'Não salvar'})",ctx),/Falha simulada SQLite/);
 assert.equal(ctx.directory.size,prior,'Failed write must not mutate directory');
 storage.writeJSON=saved;
 console.log('PASS native profile + directory: protected SQLite API, migration, save/edit, read-back, write failure preserves data.');
})().catch(e=>{console.error(e);process.exitCode=1});
