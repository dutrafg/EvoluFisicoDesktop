'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const desktop=path.resolve(__dirname,'../src/EvoluFisico.Desktop');
const read=p=>fs.readFileSync(path.join(desktop,p),'utf8');
const fixture=require(path.join(desktop,'wwwroot/assets/efia/efi-demo-students.json'));
const files=[
 'wwwroot/assets/js/03-utils.js',
 'wwwroot/assets/js/04-data-integrity.js',
 'wwwroot/assets/js/14-insights.js',
 'wwwroot/assets/js/15-decision-engine.js',
 'wwwroot/assets/js/20-lab.js',
 'wwwroot/assets/js/40-unified-safety.js',
 'wwwroot/assets/js/41-lab-evidence.js',
 'wwwroot/assets/efia/efia-local.js',
 'wwwroot/assets/efia/efia-anthropometry.js',
 'wwwroot/assets/efia/efia-host.js'
];
const state={
 version:0,
 records:[],
 getAvaliacoes(){return this.records},
 touch(){this.version++}
};
const document={
 readyState:'loading',
 documentElement:{classList:{contains(){return false},add(){},toggle(){}}},
 addEventListener(){},
 getElementById(){return null},
 querySelector(){return null}
};
const context=vm.createContext({
 console:{warn(){},log(){}},
 document,
 localStorage:{getItem(){return null},setItem(){}},
 setTimeout(){return 0},
 structuredClone,
 __EF63_STATE__:state
});
context.window=context;
context.addEventListener=()=>{};
context.__EF63_STATE__=state;
for(const file of files)vm.runInContext(read(file),context,{filename:file});
const base=fixture.records.filter(r=>r.cliente_id==='efi-demo-client-01').map(r=>structuredClone(r));
assert.equal(base.length,4);
const cases=[
 'valid','duplicate-date','invalid-date','mixed-students','missing-identity',
 'missing-values','physiological-extreme','method-switch','protocol-switch','short-interval'
];
function scenario(kind,index){
 const client='qa-synthetic-'+kind+'-'+index;
 const rows=base.map((r,j)=>({
  ...structuredClone(r),
  id:client+'-assessment-'+j,
  cliente_id:client,
  data_avaliacao:new Date(Date.UTC(2026,0,1+30*j,12)).toISOString().slice(0,10),
  efia_protocol:{...(r.efia_protocol||{}),compositionRelation:'same-estimate',standardized:true},
  efia_context:{}
 }));
 const drift=((index%19)-9)*0.025;
 rows.forEach((r,j)=>{
  r.peso=Number((r.peso+drift*j).toFixed(2));
  r.perimetria={...r.perimetria,cintura:Number((r.perimetria.cintura-drift*j*0.2).toFixed(2))};
  const fat=Number(Math.max(5,Math.min(55,r.dobras_resultado.percGordura-drift*j*0.08)).toFixed(2));
  r.dobras_resultado={...r.dobras_resultado,percGordura:fat,massaMagra:Number((r.peso*(1-fat/100)).toFixed(2))};
  r.efia_protocol.equation='Pollock 7';
 });
 if(kind==='duplicate-date')rows[1].data_avaliacao=rows[0].data_avaliacao;
 if(kind==='invalid-date')rows[2].data_avaliacao='2026-02-30';
 if(kind==='mixed-students')rows[2].cliente_id=client+'-other';
 if(kind==='missing-identity')rows.forEach(r=>delete r.cliente_id);
 if(kind==='missing-values')rows[1].peso=null,rows[2].perimetria.cintura=null;
 if(kind==='physiological-extreme')rows[2].dobras_resultado.massaMagra=rows[2].peso+20;
 if(kind==='method-switch'){
  rows[2].dobras_resultado.percGordura=null;
  rows[2].bioimpedancia={...rows[2].bioimpedancia,pgordura:rows[2].bioimpedancia.pgordura||25};
  rows[2].efia_protocol={method:'bia',device:'BIA-synthetic',compositionRelation:'independent',standardized:true};
 }
 if(kind==='protocol-switch')rows[2].efia_protocol.equation='Pollock alternate protocol';
 if(kind==='short-interval')rows.forEach((r,j)=>r.data_avaliacao=new Date(Date.UTC(2026,0,[1,5,11,19][j],12)).toISOString().slice(0,10));
 return rows;
}
function checkFinite(root){
 const pending=[root],seen=new Set();
 while(pending.length){
  const value=pending.pop();
  if(typeof value==='number'){assert.ok(Number.isFinite(value),'non-finite result detected');continue}
  if(!value||typeof value!=='object'||seen.has(value))continue;
  seen.add(value);
  for(const child of Object.values(value))pending.push(child);
 }
}
let ran=0,exceptions=0,nonFinite=0,fullEngineRuns=0,blocked=0;
const outcomes=Object.fromEntries(cases.map(kind=>[kind,{eligible:0,blocked:0}]));
for(const kind of cases){
 for(let i=0;i<1000;i++){
  const rows=scenario(kind,i);
  state.records=rows;
  state.version++;
  let result;
  try{result=context.EFIAHost.analyze({host:context,profileKey:rows[0].cliente_id,selectedIds:rows.map(r=>r.id)})}
  catch(error){exceptions++;throw error}
  assert.ok(result&&typeof result.ok==='boolean','host must return a structured result');
  assert.ok(!result.error,'engine exception: '+result.error);
  try{checkFinite(result)}catch(error){nonFinite++;throw error}
  outcomes[kind][result.eligible?'eligible':'blocked']++;
  if(kind==='valid'){
   const expected=['EF68','EF70','EF77','EF78','EF79','EF80','EF81','EF82'];
   assert.ok(result.eligible,'valid synthetic series rejected: '+result.reason+' '+result.summary);
   for(const engine of expected)assert.ok(result.engines?.[engine],'missing executed engine '+engine);
   fullEngineRuns++;
  }else if(!result.eligible)blocked++;
  if(['duplicate-date','invalid-date','mixed-students','missing-identity','short-interval'].includes(kind))
   assert.equal(result.eligible,false,kind+' must be blocked');
  if(kind==='missing-values')
   assert.ok(result.warnings?.length||result.engines?.EF78?.issues?.length,'missing values must be disclosed');
  if(kind==='physiological-extreme')
   assert.equal(result.engines?.EF79?.results?.gordura?.change,null,'inconsistent body composition must suppress fat trend');
  if(['method-switch','protocol-switch'].includes(kind)){
   assert.equal(result.engines?.EF79?.results?.gordura?.change,null,kind+' must suppress fat trend');
   assert.equal(result.engines?.EF82?.metrics?.gordura?.status,'insuficiente',kind+' must mark longitudinal comparison insufficient');
  }
  ran++;
 }
}
assert.equal(ran,10000);
assert.equal(exceptions,0);
assert.equal(nonFinite,0);
assert.equal(fullEngineRuns,1000);
assert.equal(blocked>0,true,'invalid and non-comparable scenarios must exercise safety blocks');
console.log('PASS 10,000 integrated synthetic EFIA scenarios; 1,000 complete eight-engine executions; exceptions=0; non-finite=0; blocked cases='+blocked+'; per-case='+JSON.stringify(outcomes));
