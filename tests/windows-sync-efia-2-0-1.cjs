'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const base='src/EvoluFisico.Desktop/wwwroot/',read=p=>fs.readFileSync(base+p,'utf8');
const html=read('index.html'),sw=read('sw.js'),analysis=read('assets/js/44-unified-analysis.js');
for(const n of ['efia-local.js','efia-anthropometry.js','efia-host.js','efia-ui.js']){
 const p='assets/efia/'+n;assert.ok(html.includes('./'+p),'HTML '+p);
 assert.ok(sw.includes('./'+p),'offline '+p);
 assert.doesNotThrow(()=>new Function(read(p)),'syntax '+p);
}
assert.ok(html.includes('assets/efia/efia.css')&&sw.includes('assets/efia/efia.css'));
assert.ok(analysis.includes('EFIAView.render(')&&analysis.includes('selectedIds:chosen'));
assert.ok(!html.includes('53-custom-cards.js')&&!html.includes('53-custom-cards.css'));
const host=read('assets/efia/efia-host.js');
assert.ok(host.includes('__EF63_STATE__.getAvaliacoes()')&&host.includes('EFIdentity.key('));
assert.ok(!host.includes('indexedDB.open('));
const ctx={module:{exports:{}},console};ctx.globalThis=ctx;
vm.runInNewContext(read('assets/efia/efia-local.js'),ctx,{timeout:1500});
const engine=ctx.module.exports,row=(id,date,peso)=>({id,cliente_id:'student',date,metrics:{peso},protocol:{standardized:true}});
const data=[row('1','2026-01-01',80),row('2','2026-02-01',79),row('3','2026-03-01',78)];
assert.equal(engine.analyze(data).eligible,true);
assert.equal(engine.analyze(data.slice(0,2)).eligible,false);
assert.equal(engine.analyze([data[0],data[0],data[2]]).eligible,false);
assert.equal(engine.numeric('80kg'),null);
const view=read('assets/efia/efia-ui.js');
assert.ok(view.includes("document.createElement('iframe')"));
assert.ok(!view.includes("window.open('','_blank'"));
console.log('PASS EFIA Desktop smoke: 5 offline assets, source selection, dates, input safety, no card editor, PDF iframe');
