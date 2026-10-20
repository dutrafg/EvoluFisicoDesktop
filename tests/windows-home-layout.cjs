'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const root='src/EvoluFisico.Desktop/wwwroot/';
const source=fs.readFileSync(root+'assets/js/06-dashboard.js','utf8');
const simple=fs.readFileSync(root+'assets/js/26-simple-interface.js','utf8');
const css=fs.readFileSync(root+'assets/css/31-desktop-refinement.css','utf8');
const index=fs.readFileSync(root+'index.html','utf8');
const sw=fs.readFileSync(root+'sw.js','utf8');
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS:',name)}
check('Home cards retain stable IDs and functions',()=>{
 for(const id of ['agenda','calendario','tarefas','retornos']) assert.ok(source.includes('data-ef-home-card="'+id+'"'),id);
 assert.ok(source.includes('id="ef90-sortable"'));
 assert.match(source,/ef90SaveAgenda\(event\)/);
 assert.match(source,/ef90NewTask\(\)/);
 assert.match(source,/ef90PickDay/);
});
check('Analyses are cards inside the same dashboard',()=>{
 assert.match(simple,/card\.dataset\.efHomeCard=homeCard/);
 assert.match(simple,/card\.classList\.add\('ef55-card','ef90-card'\)/);
 assert.match(simple,/window\.ef90RefreshHomeLayout\(\)/);
 assert.match(source,/retainedHomeAnalysis/);
 assert.match(source,/retainedHomeAnalysis\.forEach\(function\(card\)/);
});
check('Automatic packing uses two actual flex lanes, not row-aligned cards',()=>{
 assert.match(css,/grid-template-columns: repeat\(2,minmax\(0,1fr\)\) !important/);
 assert.match(css,/\.ef-home-lane/);
 assert.match(css,/flex-direction: column !important/);
 assert.match(source,/function chooseHomeLanes\(entries,columns\)/);
 assert.match(source,/function layoutHomeColumns\(\)/);
 assert.match(source,/lane\.insertBefore\(card/);
 assert.doesNotMatch(css,/column-fill: balance/);
});
check('Uses full main width and eliminates upper blur',()=>{
 assert.match(css,/max-width: none !important/);
 assert.match(css,/padding-top: 89px !important/);
 assert.match(css,/backdrop-filter: none !important/);
 assert.match(css,/margin-left: var\(--ef-sidebar\) !important/);
});
check('Responsive automatic sizing reacts to card heights and window width',()=>{
 assert.match(source,/width>=920 && ordered\.length>1\?2:1/);
 assert.match(source,/new ResizeObserver\(scheduleHomeLayout\)/);
 assert.match(source,/homeResizeObserver\.observe\(card\)/);
 assert.match(source,/window\.addEventListener\('resize',scheduleHomeLayout\)/);
 assert.match(css,/@media screen and \(max-width: 920px\)/);
});
check('Each card can be moved and layout restored by mouse or keyboard',()=>{
 for(const fragment of ['ef-home-move-tag','ef-home-move-actions','aria-label','aria-pressed','dragstart','dragover','dragend','Restaurar a ordem inicial','Posição ']) assert.ok(source.includes(fragment),fragment);
 assert.match(source,/card\.draggable=homeOrganizing/);
});
check('Offline cache includes CSS and both JS modules',()=>{
 assert.match(index,/31-desktop-refinement\.css/);
 for(const asset of ['06-dashboard.js','26-simple-interface.js','31-desktop-refinement.css']) assert.ok(sw.includes('./assets/'+(asset.endsWith('.css')?'css/':'js/')+asset),asset);
});
const start=source.indexOf("var HOME_LAYOUT_KEY=");
const end=source.indexOf("function layoutHomeColumns(){",start);
assert.ok(start>=0&&end>start,'Balance helpers not found');
const snippet=source.slice(start,end);
const store=new Map();
const storageGet=(k,fb)=>store.has(k)?store.get(k):fb;
const storageSet=(k,v)=>store.set(k,v);
let moves=0;
const api=new Function('storageGet','storageSet','$','applyHomeCardLayout','toast',
 snippet+"\nreturn {readHomeOrder,homeMoveCard,chooseHomeLanes};"
)(storageGet,storageSet,()=>null,()=>{moves++},()=>{});
const expected=['agenda','calendario','tarefas','retornos','insights','detalhes'];
check('Default layout includes all 6 available widgets',()=>assert.deepEqual(api.readHomeOrder(),expected));
check('Existing user layout with 4 cards is migrated without being reset',()=>{
 store.set('ef90_home_cards_order_v1',JSON.stringify(['retornos','agenda','tarefas','calendario']));
 assert.deepEqual(api.readHomeOrder(),['retornos','agenda','tarefas','calendario','insights','detalhes']);
});
check('Manual reordering persists through reload',()=>{
 assert.equal(api.homeMoveCard('detalhes',0),true);
 assert.equal(api.readHomeOrder()[0],'detalhes');
 assert.ok(moves>0);
 const reopened=new Function('storageGet','storageSet','$','applyHomeCardLayout','toast',
 snippet+"\nreturn readHomeOrder;"
 )(storageGet,storageSet,()=>null,()=>{},()=>{});
 assert.deepEqual(reopened(),api.readHomeOrder());
});
check('Corrupt saved layouts never discard a widget',()=>{
 for(const corrupted of ['["agenda","agenda","wrong"]','{}','null','123']){
  store.set('ef90_home_cards_order_v1',corrupted);
  const layout=api.readHomeOrder();
  assert.equal(layout.length,6);assert.equal(new Set(layout).size,6);
 }
});
check('Cannot move nonexistent widgets outside valid positions',()=>{
 assert.equal(api.homeMoveCard('fake',0),false);
 assert.equal(api.homeMoveCard('agenda',99),false);
});
check('Shortest-height packing avoids large empty gaps (synthetic real sizes)',()=>{
 const heights=[
  {id:'agenda',height:380},{id:'calendario',height:880},
  {id:'tarefas',height:230},{id:'retornos',height:190},
  {id:'insights',height:150},{id:'detalhes',height:180}
 ];
 const two=api.chooseHomeLanes(heights,2);
 const sums=two.map(lane=>lane.reduce((sum,id)=>sum+heights.find(h=>h.id===id).height,0));
 assert.deepEqual(two.flat().sort(),heights.map(x=>x.id).sort());
 assert.ok(Math.abs(sums[0]-sums[1])<=100,'imbalance was '+sums.join('/'));
});
check('Single column keeps every card without empty placeholders',()=>{
 const heights=[{id:'agenda',height:380},{id:'calendario',height:880},{id:'tarefas',height:230}];
 assert.deepEqual(api.chooseHomeLanes(heights,1),[['agenda','calendario','tarefas'],[]]);
});
console.log('TOTAL:',passed,'Windows home layout regressions passed');
