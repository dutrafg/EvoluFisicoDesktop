'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const root='src/EvoluFisico.Desktop/wwwroot/';
const read=p=>fs.readFileSync(p,'utf8');
const html=read(root+'index.html'),sw=read(root+'sw.js'),ui=read(root+'assets/js/26-simple-interface.js');
const scripts=['40-unified-safety.js','41-lab-evidence.js','42-analysis-reports.js','43-analysis-page.js','44-unified-analysis.js'];
const styles=['40-unified-analysis.css','41-panel-refinements.css','42-analysis-safety.css','43-analysis-page.css','44-date-selection.css','45-analysis-minimum.css'];
let ok=0;
function check(name,fn){fn();console.log('PASS '+name);ok++;}
check('Five source analysis modules load in correct dependency order',()=>{
 let last=-1;
 for(const p of scripts){
  const ref='./assets/js/'+p,at=html.indexOf(ref);
  assert.ok(at>last,p);last=at;
  assert.ok(sw.includes(ref),'precache '+p);
  assert.doesNotThrow(()=>new Function(read(root+'assets/js/'+p)),p);
 }
});
check('Six analysis styles available for offline printing and date-picker',()=>{
 for(const p of styles){const ref='./assets/css/'+p;assert.ok(html.includes(ref),p);assert.ok(sw.includes(ref),p);}
});
check('Analyses are a distinct workspace with a brain icon and contextual help',()=>{
 assert.ok(ui.includes("'tab-analises':['tab-btn-analises','Análises']"));
 assert.ok(ui.includes("'tab-btn-analises':'<svg"));
 const page=read(root+'assets/js/43-analysis-page.js');
 assert.ok(page.includes('function installHelp('));
 assert.ok(page.includes('O que significa cada indicador'));
 assert.ok(page.includes('tab-btn-ef-forms'));
 assert.ok(page.includes('window.EFSimpleUI?.arrangeNavigation?.()'));
});
check('Análises keeps only the brain SVG; pseudo-icon square is suppressed',()=>{
 const baseCss=read(root+'assets/css/25-ficha-viva.css');
 const override=read(root+'assets/css/23-simple-interface.css');
 const page=read(root+'assets/js/43-analysis-page.js');
 assert.match(baseCss,/\.nav-tab-btn::before\s*\{[\s\S]*?content:\s*''/);
 assert.ok(!baseCss.includes('#tab-btn-analises { --ef-ico:'),'No mask image is defined for Análises');
 assert.match(override,/#tab-btn-analises::before\s*\{display:none!important;content:none!important\}/);
 assert.ok(ui.includes("'tab-btn-analises':'<svg"),'The correct brain icon remains in JavaScript');
 assert.ok(ui.includes('class="ef-local-nav-icon"'),'Only the inline SVG should be rendered');
 assert.ok(page.includes("b.id=BTN"),'Análises navigation button remains functional');
});
check('Clinical confidence safeguards follow source 1.0 thresholds',()=>{
 const s=read(root+'assets/js/40-unified-safety.js'),a=read(root+'assets/js/44-unified-analysis.js');
 for(const rule of ['uniqueDates.length>=3&&days>=21','Math.min(confidence,40)','Math.min(confidence,45)','lab?.latest?.delta>=8'])assert.ok(s.includes(rule),rule);
 for(const rule of ['n>=3&&days>=21','new Set(dates).size!==dates.length','ids.some(id=>!map.has(id))'])assert.ok(a.includes(rule),rule);
});
check('Selective EF68/EF70 analysis uses only chosen existing records',()=>{
 assert.ok(read(root+'assets/js/14-insights.js').includes('analyzeRecords:function(key,records)'));
 assert.ok(read(root+'assets/js/15-decision-engine.js').includes('analyzeRecords:function(key,records)'));
 assert.ok(read(root+'assets/js/44-unified-analysis.js').includes('picked.has(String(r.id))'));
});
check('The report is editable and does not overwrite clinical history',()=>{
 const r=read(root+'assets/js/42-analysis-reports.js');
 assert.ok(r.includes('Rascunho nesta sessão'));
 assert.ok(r.includes('Imprimir / salvar PDF'));
 assert.ok(r.includes('window.EFUnifiedSafety?.audit'));
 assert.ok(!r.includes('localStorage.setItem('));
});
check('Stable 1.0 version matches native binary, Windows installer and updater',()=>{
 const native=read('src/EvoluFisico.Desktop/MainWindow.xaml.cs');
 const iss=read('installer/EvoluFisico.iss'),build=read('scripts/build-windows.ps1');
 assert.match(iss,/#define MyAppVersion "1\.0\.5"/);
 assert.match(iss,/AppId=\{\{C89493D0-1C8B-4717-A6C8-42F45B3FBD0B\}/);
 assert.ok(native.includes('CurrentVersion = "1.0.5"'));
 assert.ok(native.includes('StartsWith("desktop-v1.0-")'));
 assert.ok(build.includes('desktop-v1.0-'));
 assert.ok(html.includes('v1.0.5 estável'));
 assert.ok(ui.includes("version:'1.0.5'"));
});
check('Ten stable palettes migrate old dark choices without changing assessment data',()=>{
 const start=ui.indexOf('const COLORS='),end=ui.indexOf(';',start);
 const colors=new Function(ui.slice(start,end+1)+'return COLORS;')();
 const keys=['verde','azul','roxo','laranja','rosa','azul-marinho','petroleo','esmeralda','indigo','ameixa'];
 assert.deepEqual(Object.keys(colors),keys);
 assert.ok(ui.includes("LEGACY_COLORS"));
 assert.ok(ui.includes("'verde-escuro':'esmeralda'"));
 assert.ok(ui.includes('ef90_paleta'));
});
const input=[];
const ctx={window:{__EF63_STATE__:{version:1,getAvaliacoes:()=>input}},Date,Map,Set,JSON,Object,Number,String,Math,console};
vm.runInNewContext(read(root+'assets/js/40-unified-safety.js'),ctx,{timeout:1000});
const audit=ctx.window.EFUnifiedSafety.audit;
const rec=(id,date,weight=75,method='Pollock')=>({
 id:String(id),data_avaliacao:date,peso:weight,idade:32,
 dobras_resultado:method==='Pollock'?{percGordura:22,massaMagra:55}:{},
 bioimpedancia:method==='BIA'?{pgordura:22}:{},
 perimetria:{cintura:86}
});
function evaluate(rows,lab){input.splice(0,input.length,...rows);ctx.window.__EF63_STATE__.version++;
 return audit({key:'aluno-1',timeline:rows.map(r=>({id:r.id}))},{confidence:74,correlations:[]},lab||{adjustment:0});
}
check('Dynamic safety rejects 2 observations and short 3-observation series',()=>{
 let x=evaluate([rec(1,'2026-01-01'),rec(2,'2026-02-15')]);
 assert.equal(x.canTrend,false);assert.equal(x.confidence,null);
 x=evaluate([rec(1,'2026-01-01'),rec(2,'2026-01-07'),rec(3,'2026-01-14')]);
 assert.equal(x.canTrend,false);assert.equal(x.confidence,null);
});
check('Dynamic safety accepts 3 spaced records with bounded score',()=>{
 const x=evaluate([rec(1,'2026-01-01'),rec(2,'2026-01-25'),rec(3,'2026-02-20')]);
 assert.equal(x.canTrend,true);assert.ok(x.confidence>=0&&x.confidence<=65);
});
check('Dynamic safety caps inconsistent methods and lab disagreement',()=>{
 let x=evaluate([rec(1,'2026-01-01'),rec(2,'2026-01-25','75','BIA'),rec(3,'2026-02-20')]);
 assert.ok(x.confidence<=45);
 x=evaluate([rec(1,'2026-01-01'),rec(2,'2026-01-25'),rec(3,'2026-02-20')],{adjustment:0,latest:{delta:9}});
 assert.ok(x.confidence<=40);
});
check('Dynamic safety does not interpret invalid negative weight or duplicate dates as trends',()=>{
 let x=evaluate([rec(1,'2026-01-01'),rec(2,'2026-01-25',-10),rec(3,'2026-02-20')]);
 assert.equal(x.canTrend,false);
 x=evaluate([rec(1,'2026-01-01'),rec(2,'2026-01-25'),rec(3,'2026-01-25')]);
 assert.equal(x.canTrend,false);
});
check('1000 deterministic histories never generate non-finite or unbounded confidence',()=>{
 const dates=['2026-01-01','2026-01-31','2026-03-01','2026-04-01'];
 for(let i=0;i<1000;i++){
  const n=2+i%3;
  const rows=dates.slice(0,n).map((d,k)=>rec('p'+i+'-'+k,d,i%19===0&&k===1?-5:72+(i%11)));
  const score=evaluate(rows);
  if(n===2)assert.equal(score.confidence,null);
  else assert.ok(score.confidence==null||Number.isFinite(score.confidence)&&score.confidence>=0&&score.confidence<=100,'case '+i);
 }
});
console.log('TOTAL '+ok+' checks for Windows 1.0 analysis release');