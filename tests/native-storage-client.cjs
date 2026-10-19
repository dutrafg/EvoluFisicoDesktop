const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/assets/js/28-native-storage.js','utf8');
let listener,posted;
const sandbox={
 window:{chrome:{webview:{
  addEventListener:(event,callback)=>{assert.equal(event,'message');listener=callback;},
  postMessage:message=>{posted=message;}
 }}},
 setTimeout,clearTimeout,Uint8Array,TextEncoder,TextDecoder,atob,btoa,Date,Promise,Error,TypeError
};
vm.runInNewContext(code,sandbox);
(async()=>{
 const api=sandbox.window.EFNativeStorage;
 assert.ok(api);
 const health=api.health();
 assert.equal(posted.action,'health');
 assert.equal(posted.type,'native-storage');
 listener({data:{type:'native-storage-result',requestId:posted.requestId,data:'ok'}});
 assert.equal(await health,'ok');
 const bytes=Uint8Array.from([0,127,128,255]);
 const write=api.write('fake-record',bytes);
 assert.equal(posted.action,'write');
 assert.equal(posted.data,'AH+A/w==');
 listener({data:{type:'native-storage-result',requestId:posted.requestId,data:'saved'}});
 assert.equal(await write,'saved');
 const read=api.read('fake-record');
 listener({data:{type:'native-storage-result',requestId:posted.requestId,data:'AH+A/w==' }});
 assert.deepEqual(Array.from(await read),Array.from(bytes));
 const jsonWrite=api.writeJSON('fake-json',{name:'Paciente fictício',count:2});
 assert.equal(posted.action,'write');
 assert.deepEqual(JSON.parse(Buffer.from(posted.data,'base64').toString('utf8')),{name:'Paciente fictício',count:2});
 listener({data:{type:'native-storage-result',requestId:posted.requestId,data:'saved'}});
 await jsonWrite;
 const jsonRead=api.readJSON('fake-json');
 listener({data:{type:'native-storage-result',requestId:posted.requestId,data:Buffer.from(JSON.stringify({name:'Paciente fictício',count:2}),'utf8').toString('base64')}});
 assert.equal((await jsonRead).name,'Paciente fictício');
 const batch=api.importBatch({'migrated-a':Uint8Array.from([1,2]),'migrated-b':Uint8Array.from([3])});
 assert.equal(posted.action,'import-batch');
 assert.equal(posted.records['migrated-a'],'AQI=');
 listener({data:{type:'native-storage-result',requestId:posted.requestId,data:'2'}});
 assert.equal(await batch,2);
 await assert.rejects(api.importBatch({'bad':'plaintext'}),/Registro inválido/);
 const fail=api.delete('fake-record');
 listener({data:{type:'native-storage-result',requestId:posted.requestId,error:'Falha simulada'}});
 await assert.rejects(fail,/Falha simulada/);
 console.log('PASS native storage client request, binary roundtrip, error handling');
})().catch(e=>{console.error(e);process.exitCode=1});
