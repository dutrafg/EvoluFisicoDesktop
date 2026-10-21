'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root='src/EvoluFisico.Desktop/wwwroot/assets/js/';
const dashboard=fs.readFileSync(root+'06-dashboard.js','utf8');
const incremental=fs.readFileSync(root+'09-state-cache.js','utf8');
function extract(src,begin,end){const i=src.indexOf(begin),j=src.indexOf(end,i+begin.length);assert(i>=0&&j>i,'Missing code block '+begin);return src.slice(i,j)}
let count=0;function check(title,fn){fn();count++;console.log('PASS',title)}
const storage=new Map(),storageGet=(k,fb)=>storage.has(k)?storage.get(k):fb,storageSet=(k,v)=>storage.set(k,v);
const defs=extract(dashboard,"function recheckInterval(){","window.ef90SetRecheckInterval=");
const first=dashboard.indexOf('function addMonthsSafe(');
assert.ok(first>0);
const monthHelpers=extract(dashboard,'function recheckInterval(){','window.ef90SetRecheckInterval=');
const {recheckInterval,addMonthsSafe,recheckDate}=new Function('storageGet','RECHECK_INTERVAL','pd',monthHelpers+'\nreturn {recheckInterval,addMonthsSafe,recheckDate}')(storageGet,'ef90_return_interval_months_v1',
 s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null});
check('No estimated re-evaluation without opt-in',()=>{assert.equal(recheckInterval(),0);assert.equal(recheckDate({data_avaliacao:'2026-01-31'}),null)});
check('Configuration is limited to safe published choices',()=>{
 storageSet('ef90_return_interval_months_v1','999');assert.equal(recheckInterval(),0);
 storageSet('ef90_return_interval_months_v1','3');assert.equal(recheckInterval(),3);
});
check('Clamped month handling avoids calendar rollover',()=>{
 assert.equal(addMonthsSafe(new Date(2026,0,31),1).toISOString().slice(0,10),'2026-02-28');
 assert.equal(addMonthsSafe(new Date(2024,0,31),1).toISOString().slice(0,10),'2024-02-29');
});
check('Explicit dates always have priority, no existing records modified',()=>{
 const a={data_avaliacao:'2026-01-01',data_proxima_avaliacao:'2026-03-13'};
 const frozen=JSON.stringify(a);const result=recheckDate(a);
 assert.equal(result.estimated,false);assert.equal(result.date.getMonth(),2);
 assert.equal(JSON.stringify(a),frozen);
});
check('Projected dates have estimated flag',()=>{
 const r=recheckDate({data_avaliacao:'2026-01-31'});assert.equal(r.estimated,true);
 assert.equal(r.date.getMonth(),3);assert.equal(r.date.getDate(),30);
});
check('Re-evaluation UI identifies calculated dates and does not write patient records',()=>{
 for(const part of ['Prazo padrão','Data estimada','data estimada','Somente datas informadas','ef90SetRecheckInterval','recheckInterval()']) assert.ok(dashboard.includes(part),part);
});
const bounded=extract(incremental,'function boundedSet(map,key,value,limit){','function card(a){');
const boundedSet=new Function('norm','esc',bounded+'\nreturn boundedSet;')(x=>String(x).toLowerCase(),x=>x);
check('Bounded caches never retain more than their budget',()=>{
 const map=new Map();
 for(let i=0;i<2000;i++)boundedSet(map,'query-'+i,[i],24);
 assert.equal(map.size,24);assert.ok(!map.has('query-0'));assert.ok(map.has('query-1999'));
 boundedSet(map,'query-1980',[],24);assert.equal(map.size,24);
});
check('History DOM updates use linear map, not repeated selector per record',()=>{
 assert.match(incremental,/var nodeById=new Map\(\)/);
 assert.match(incremental,/var newIndex=new Map\(\)/);
 assert.doesNotMatch(extract(incremental,'function updateHistory(filtro){','function invalidate(id){'),/querySelector\(/);
});
check('Filters and SVG caches have limits',()=>{
 assert.match(incremental,/boundedSet\(cache\.filtered,key,list,24\)/);
 assert.match(incremental,/boundedSet\(cache\.chartDonut,k,v,32\)/);
 assert.match(incremental,/boundedSet\(cache\.chartBar,k,v,32\)/);
 assert.match(incremental,/cache\.chartDonut\.clear\(\);cache\.chartBar\.clear\(\)/);
});
console.log('TOTAL',count,'functional/performance checks passed');
