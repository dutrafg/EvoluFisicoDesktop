'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const root='src/EvoluFisico.Desktop/wwwroot/';
let records=[],version=0;
const nil=()=>{},doc={getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:nil,documentElement:{classList:{add:nil,toggle:nil}},body:{classList:{contains:()=>false}}};
const h={document:doc,console,structuredClone,crypto:crypto.webcrypto,addEventListener:nil,setTimeout:()=>0,clearTimeout:nil,localStorage:{getItem:()=>null},__EF63_STATE__:{getAvaliacoes:()=>records,get version(){return version},touch:nil}};h.window=h;h.globalThis=h;h.avaliacoes=records;
const context=vm.createContext(h);
for(const p of ['assets/js/03-utils.js','assets/js/04-data-integrity.js','assets/js/14-insights.js','assets/js/15-decision-engine.js','assets/js/20-lab.js','assets/js/40-unified-safety.js','assets/js/41-lab-evidence.js','assets/efia/efia-local.js','assets/efia/efia-anthropometry.js','assets/efia/efia-host.js'])vm.runInContext(fs.readFileSync(root+p,'utf8'),context,{filename:p});
let seed=0xEF242026;const initialSeed=seed,random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const scenarios=['regular','irregular','missing','invalid-date','duplicate-date','extreme','method','device','divergent-methods','incoherent','insufficient','plateau','oscillation','reversal','mixed-identities','duplicate-id','impossible-mass','invalid-number','short-span','three-records'];
let checks=0,allEight=0,eligible=0,blocked=0;const failures=[],counts={},inputHash=crypto.createHash('sha256'),outputHash=crypto.createHash('sha256');
const check=(ok,text,i)=>{checks++;if(!ok&&failures.length<50)failures.push({i,text})};
const compareKeys=['peso','cintura','gordura','massaMagra'];
function run(rs){records=rs;h.avaliacoes=rs;version++;h.EF68.invalidate();h.EF70.invalidate();return h.EFIAHost.analyze({host:h,profileKey:'campaign-a',selectedIds:rs.map(r=>String(r.id))})}
for(let i=0;i<30000;i++){
 const scenario=scenarios[i%scenarios.length];counts[scenario]=(counts[scenario]||0)+1;
 const start=55+random()*80,fat=12+random()*25,waist=72+random()*35,step=random()*1.5;
 let rs=Array.from({length:4},(_,j)=>{const p=start-j*step,f=fat-j*.25;return {id:'c'+i+'-'+j,cliente_id:'campaign-a',nome:'Histórico sintético',idade:30,sexo:'M',altura:175,data_avaliacao:new Date(Date.UTC(2026,j,1)).toISOString().slice(0,10),peso:p,perimetria:{cintura:waist-j*.5,quadril:100,pescoco:36},dobras_resultado:{percGordura:f,massaMagra:p*(1-f/100)},bioimpedancia:{pgordura:f+.5},efia_protocol:{equation:'Pollock 7',version:'1',device:'Adipômetro A',standardized:true,compositionRelation:'same-estimate'}}});
 switch(scenario){
 case'irregular':rs[1].data_avaliacao='2026-01-09';rs[2].data_avaliacao='2026-02-17';break;
 case'missing':rs[1].perimetria.cintura=null;delete rs[0].dobras_resultado;rs[0].bioimpedancia={};break;
 case'invalid-date':rs[1].data_avaliacao='2026-02-30';break;
 case'duplicate-date':rs[2].data_avaliacao=rs[1].data_avaliacao;break;
 case'extreme':rs[3].peso=1e308;break;
 case'method':rs[2].dobras_resultado={};break;
 case'device':rs[2].efia_protocol.device='Adipômetro B';break;
 case'divergent-methods':rs.forEach(r=>r.bioimpedancia.pgordura=55);break;
 case'incoherent':rs[3].dobras_resultado.massaMagra=rs[3].peso*.3;break;
 case'insufficient':rs=rs.slice(0,2);break;
 case'plateau':rs.forEach(r=>{r.peso=start;r.perimetria.cintura=waist;r.dobras_resultado={percGordura:fat,massaMagra:start*(1-fat/100)}});break;
 case'oscillation':rs.forEach((r,j)=>{r.peso=start+(j%2?2:-2);r.dobras_resultado.massaMagra=r.peso*(1-r.dobras_resultado.percGordura/100)});break;
 case'reversal':rs[3].peso=start+2;rs[3].dobras_resultado.massaMagra=rs[3].peso*(1-rs[3].dobras_resultado.percGordura/100);break;
 case'mixed-identities':rs[2].cliente_id='campaign-b';break;
 case'duplicate-id':rs[2].id=rs[1].id;break;
 case'impossible-mass':rs[3].dobras_resultado.massaMagra=rs[3].peso+20;break;
 case'invalid-number':rs[2].peso='80kg';break;
 case'short-span':rs.forEach((r,j)=>r.data_avaliacao='2026-01-0'+(j+1));break;
 case'three-records':rs=rs.slice(0,3);break;
 }
 const before=JSON.stringify(rs);inputHash.update(before+'\n');const x=run(rs);
 check(JSON.stringify(rs)===before,'source mutation',i);
 check(!x.error,'unexpected engine exception '+x.error,i);
 const math=x.engines?JSON.stringify({eligible:x.eligible,engines:x.engines,records:x.records,warnings:x.warnings}):JSON.stringify(x);
 check(!math.includes('NaN')&&!math.includes('Infinity'),'nonfinite output',i);
 const y=run(rs);check(JSON.stringify({eligible:y.eligible,engines:y.engines})===JSON.stringify({eligible:x.eligible,engines:x.engines}),'deterministic output',i);outputHash.update(math+'\n');
 if(x.eligible)eligible++;else blocked++;
 const eight=['EF68','EF70','EF77','EF78','EF79','EF80','EF81','EF82'].every(k=>!!x.engines?.[k]);if(eight)allEight++;
 if(['invalid-date','duplicate-date','insufficient','mixed-identities','duplicate-id','short-span','extreme','invalid-number'].includes(scenario))check(!x.eligible,'expected blocked '+scenario,i);
 if(['regular','irregular','plateau','oscillation','reversal','three-records'].includes(scenario))check(x.eligible&&eight,'all eight real engines '+scenario,i);
 if(['method','device','incoherent','impossible-mass'].includes(scenario)&&x.engines?.EF79){for(const k of ['gordura','massaMagra'])check(x.engines.EF79.results[k].change===null,'unsafe composition delta '+scenario+' '+k,i);check(!x.engines.EF68?.findings.length&&!x.engines.EF70?.actions.length,'unsafe compound conclusions',i)}
 if(scenario==='regular'&&x.eligible){for(const k of compareKeys){const n=h.EFIALocal.numeric(k==='peso'?rs[3].peso:k==='cintura'?rs[3].perimetria.cintura:k==='gordura'?rs[3].dobras_resultado.percGordura:rs[3].dobras_resultado.massaMagra),b=h.EFIALocal.numeric(k==='peso'?rs[0].peso:k==='cintura'?rs[0].perimetria.cintura:k==='gordura'?rs[0].dobras_resultado.percGordura:rs[0].dobras_resultado.massaMagra);check(x.engines.EF79.results[k].change===Number((n-b).toFixed(2)),'delta oracle '+k,i)}check(x.engines.EF80.massBalance.every(v=>v.status==='consistent'),'mass conservation',i)}
}
const report={seed:initialSeed,seedHex:'0x'+initialSeed.toString(16),histories:30000,evaluations:'3 or 4, plus insufficient boundary cases',pipelineRuns:60000,checks,eligible,blocked,allEight,counts,inputSHA256:inputHash.digest('hex'),outputSHA256:outputHash.digest('hex'),failures,environment:'Node VM; actual current application engine sources; no legacy runtime replica. Not a browser/IndexedDB test.'};console.log(JSON.stringify(report,null,2));if(failures.length)process.exitCode=1;
