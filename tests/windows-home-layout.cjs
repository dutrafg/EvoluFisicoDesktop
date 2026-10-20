'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const root='src/EvoluFisico.Desktop/wwwroot/';
const source=fs.readFileSync(root+'assets/js/06-dashboard.js','utf8');
const css=fs.readFileSync(root+'assets/css/31-desktop-refinement.css','utf8');
const index=fs.readFileSync(root+'index.html','utf8');
const sw=fs.readFileSync(root+'sw.js','utf8');
let passed=0;
function check(label,fn){fn();passed++;console.log('PASS',label)}
check('4 dashboard cards have stable unique IDs',()=>{
 const ids=['agenda','tarefas','calendario','retornos'];
 ids.forEach(id=>assert.ok(source.includes('data-ef-home-card="'+id+'"'),id));
 assert.ok(source.includes('id="ef90-sortable"'));
 assert.ok(!source.includes("+'<div class=\"ef90-left-stack\">"));
 assert.ok(!source.includes("+'<div class=\"ef90-right-stack\">"));
});
check('Each card has accessible move controls and drag/drop',()=>{
 for(const snippet of ['aria-label','aria-pressed','ef-home-move-tag','ef-home-move-actions','dragstart','dragover','drop','dragend','ef-home-drop-target','Restaurar a ordem inicial']) assert.ok(source.includes(snippet),snippet);
 assert.match(source,/card\.draggable=homeOrganizing/);
});
check('Compact masonry columns and full width header without blur',()=>{
 assert.match(css,/max-width: none !important/);
 assert.match(css,/body\.ef-simple-ui #tab-painel #ef90-sortable/);
 assert.match(css,/column-count: 2 !important/);
 assert.match(css,/column-width: 410px !important/);
 assert.match(css,/column-fill: balance !important/);
 assert.match(css,/break-inside: avoid-column !important/);
 assert.match(css,/margin: 0 0 14px !important/);
 assert.doesNotMatch(css,/grid-auto-flow: row !important/);
 assert.match(css,/padding-top: 89px !important/);
 assert.match(css,/backdrop-filter: none !important/);
 assert.match(css,/margin-left: var\(--ef-sidebar\) !important/);
});
check('CSS is included in runtime and offline cache',()=>{
 assert.match(index,/assets\/css\/31-desktop-refinement\.css/);
 assert.match(sw,/assets\/css\/31-desktop-refinement\.css/);
});
const start=source.indexOf('var HOME_LAYOUT_KEY=');
const end=source.indexOf('function applyHomeCardLayout(){',start);
assert.ok(start>0&&end>start);
const snippet=source.slice(start,end);
const store=new Map(), notifications=[];let renders=0;
const storageGet=(k,fb)=>store.has(k)?store.get(k):fb;
const storageSet=(k,v)=>store.set(k,v);
const api=new Function('storageGet','storageSet','applyHomeCardLayout','toast',snippet+'\nreturn {readHomeOrder,homeMoveCard};')(
 storageGet,storageSet,()=>{renders++},msg=>notifications.push(msg));
check('Initial card order is compatible with current dashboard',()=>assert.deepEqual(api.readHomeOrder(),['agenda','tarefas','calendario','retornos']));
check('Switch position moves a card and persists without losing cards',()=>{
 assert.equal(api.homeMoveCard('retornos',0),true);
 assert.deepEqual(api.readHomeOrder(),['retornos','agenda','tarefas','calendario']);
 assert.equal(renders,1);
});
check('Reload reads the saved card layout',()=>{
 const reopened=new Function('storageGet','storageSet','applyHomeCardLayout','toast',snippet+'\nreturn readHomeOrder;')(
 storageGet,storageSet,()=>{},()=>{});
 assert.deepEqual(reopened(),['retornos','agenda','tarefas','calendario']);
});
check('Invalid or duplicated stored settings restore the safe default',()=>{
 for(const bad of ['["agenda","agenda","calendario","retornos"]','["agenda","wrong","tarefas","retornos"]','{"id":"agenda"}','null']){
  store.set('ef90_home_cards_order_v1',bad);
  assert.deepEqual(api.readHomeOrder(),['agenda','tarefas','calendario','retornos']);
 }
});
check('Unknown card or position is rejected',()=>{
 assert.equal(api.homeMoveCard('unknown',0),false);
 assert.equal(api.homeMoveCard('agenda',99),false);
});
console.log('TOTAL:',passed,'Windows dashboard regression checks passed');
check('Mobile uses one column and preserves drag/drop without fixed card heights',()=>{
 assert.match(css,/@media screen and \(max-width: 720px\)[\s\S]*column-count: 1 !important/);
 assert.match(css,/height: auto !important/);
 assert.match(css,/-webkit-column-break-inside: avoid !important/);
 assert.match(source,/function homeMoveCard\(id,position\)/);
});
