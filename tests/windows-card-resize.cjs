'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const root='src/EvoluFisico.Desktop/wwwroot/';
const source=fs.readFileSync(root+'assets/js/06-dashboard.js','utf8');
const css=fs.readFileSync(root+'assets/css/31-desktop-refinement.css','utf8');
const html=fs.readFileSync(root+'index.html','utf8');
const sw=fs.readFileSync(root+'sw.js','utf8');
function section(a,b){const start=source.indexOf(a),end=source.indexOf(b,start+a.length);assert.ok(start>=0&&end>start,a);return source.slice(start,end)}
const helperCode=section('var HOME_LAYOUT_KEY=','function layoutHomeColumns(){');
const layoutCode=section('function layoutHomeColumns(){','function scheduleHomeLayout(){');
const store=new Map(),storageGet=(key,defaultValue)=>store.has(key)?store.get(key):defaultValue;
const storageSet=(key,value)=>store.set(key,value);
let applied=0,feedback=0;
const host={};
const helpers=new Function('storageGet','storageSet','$','window','applyHomeCardLayout','toast',
helperCode+'\nreturn {readHomeOrder,readHomeSizes,getHomeSize,changeHomeSize,visibleHomeOrder,chooseHomeLanes,HOME_CARDS};')(
 storageGet,storageSet,()=>null,host,()=>{applied++},()=>{feedback++}
);
let passed=0;
function check(title,fn){fn();passed++;console.log('PASS:',title);}
const ids=helpers.HOME_CARDS;
check('Saves one width and height preference per card',()=>{
 assert.equal(helpers.changeHomeSize('agenda','wide'),true);
 assert.equal(helpers.changeHomeSize('agenda','larger'),true);
 assert.equal(helpers.getHomeSize('agenda').width,'full');
 assert.equal(helpers.getHomeSize('agenda').height,80);
 assert.equal(helpers.changeHomeSize('calendario','larger'),true);
 assert.equal(helpers.getHomeSize('calendario').width,'half');
 assert.equal(helpers.getHomeSize('calendario').height,80);
});
check('Separate card preferences never modify the saved order',()=>{
 assert.equal(store.has('ef90_home_cards_order_v1'),false);
 assert.equal(applied,3);
});
check('Height remains within safe bounds',()=>{
 for(let i=0;i<20;i++)helpers.changeHomeSize('agenda','larger');
 assert.equal(helpers.getHomeSize('agenda').height,240);
 assert.equal(helpers.changeHomeSize('agenda','larger'),false);
 for(let i=0;i<20;i++)helpers.changeHomeSize('agenda','smaller');
 assert.equal(helpers.getHomeSize('agenda').height,0);
 assert.equal(helpers.changeHomeSize('agenda','smaller'),false);
});
check('Width restores to single column and reset removes redundant data',()=>{
 assert.equal(helpers.changeHomeSize('agenda','wide'),true);
 assert.equal(helpers.changeHomeSize('agenda','larger'),true);
 assert.equal(helpers.changeHomeSize('agenda','reset'),true);
 assert.deepEqual(helpers.getHomeSize('agenda'),{width:'half',height:0});
 assert.equal(helpers.readHomeSizes().agenda,undefined);
});
check('Corrupt or unknown preferences are discarded without breaking layout',()=>{
 const examples=['null','[]','{invalid json','{"other":{"width":"full","height":2000},"agenda":{"width":"nope","height":999}}'];
 for(const value of examples){
  store.set('ef90_home_card_sizes_v1',value);
  assert.deepEqual(helpers.getHomeSize('agenda'),{width:'half',height:0});
 }
});
check('Moving invalid cards or using unrecognized size commands does nothing',()=>{
 assert.equal(helpers.changeHomeSize('nonexistent','wide'),false);
 assert.equal(helpers.changeHomeSize('agenda','delete'),false);
});
check('Saved preferences survive initialization',()=>{
 store.set('ef90_home_card_sizes_v1',JSON.stringify({agenda:{width:'full',height:160}}));
 const again=new Function('storageGet','storageSet','$','window','applyHomeCardLayout','toast',
 helperCode+'\nreturn getHomeSize("agenda");')(storageGet,storageSet,()=>null,{},()=>{},()=>{});
 assert.deepEqual(again,{width:'full',height:160});
});
class Node {
 constructor(type){this.type=type;this.children=[];this.parent=null;this.isConnected=true;this.dataset={};this.attrs={};this.className='';this.clientWidth=0;this.scrollHeight=200;this.offsetHeight=200;this.classList={toggle:(k,v)=>{this.attrs['class:'+k]=v}};}
 removeChild(child){const index=this.children.indexOf(child);if(index>=0)this.children.splice(index,1);child.parent=null;}
 appendChild(child){
  if(child.type==='fragment'){for(const node of [...child.children])this.appendChild(node);return child;}
  if(child.parent)child.parent.removeChild(child);
  this.children.push(child);child.parent=this;return child;
 }
 replaceChildren(fragment){this.children.forEach(node=>{node.parent=null});this.children=[];this.appendChild(fragment);}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return k==='data-ef-home-card'?this.dataset.efHomeCard:this.attrs[k];}
 getBoundingClientRect(){return {height:this.scrollHeight,width:this.clientWidth};}
 querySelectorAll(q){
  if(q!== '[data-ef-home-card]')throw Error('Unexpected selector '+q);
  const nodes=[];
  const crawl=node=>{if(node.dataset.efHomeCard)nodes.push(node);node.children.forEach(crawl)};
  this.children.forEach(crawl);
  return nodes;
 }
 querySelector(q){
  const match=q.match(/^\[data-ef-home-card="([^"]+)"\]$/);
  if(!match)throw Error('Unexpected query '+q);
  return this.querySelectorAll('[data-ef-home-card]').find(n=>n.dataset.efHomeCard===match[1])||null;
 }
}
const grid=new Node('grid');grid.clientWidth=1200;
const cards=ids.slice(0,4).map(id=>{const node=new Node('card');node.dataset.efHomeCard=id;node.scrollHeight=id==='calendario'?770:220;node.offsetHeight=node.scrollHeight;grid.appendChild(node);return node});
const document={createElement:type=>new Node(type),createDocumentFragment:()=>new Node('fragment')};
const layout=new Function('$','document','visibleHomeOrder','readHomeSizes','getHomeSize','chooseHomeLanes',
 'var homeLastGrid=null,homeLastSignature=\"\";\n'+layoutCode+'\nreturn layoutHomeColumns;'
)(selector=>selector==='#ef90-sortable'?grid:null,document,helpers.visibleHomeOrder,helpers.readHomeSizes,helpers.getHomeSize,helpers.chooseHomeLanes);
check('A wide card occupies whole page and others remain in compact independent stacks',()=>{
 layout();
 assert.ok(grid.children.some(node=>node.dataset.efHomeCard==='agenda'),'Expected full-width agenda');
 assert.equal(grid.children.find(node=>node.dataset.efHomeCard==='agenda').dataset.efCardRenderedWidth,'full');
 assert.ok(grid.children.some(node=>node.className==='ef-home-pair'));
 assert.equal(grid.querySelectorAll('[data-ef-home-card]').length,4);
});
check('No DOM nodes, input values or listeners are replaced while resizing',()=>{
 assert.deepEqual(grid.querySelectorAll('[data-ef-home-card]').sort((a,b)=>a.dataset.efHomeCard.localeCompare(b.dataset.efHomeCard)),
 cards.slice().sort((a,b)=>a.dataset.efHomeCard.localeCompare(b.dataset.efHomeCard)));
});
check('Responsive single column retains all cards and has no phantom card',()=>{
 grid.clientWidth=700;layout();
 assert.equal(grid.children.length,1);
 assert.equal(grid.children[0].className,'ef-home-pair');
 assert.equal(grid.querySelectorAll('[data-ef-home-card]').length,4);
});
check('Styling never clips card contents when height decreases',()=>{
 assert.match(css,/overflow: visible !important/);
 assert.match(css,/padding-bottom: calc\(18px \+ var\(--ef-card-extra,0px\)\)/);
 assert.match(css,/\.ef-home-pair/);
 assert.match(css, /ef-home-size-actions/);
});
check('Dedicated drag handle replaces draggable card while retaining accessible controls',()=>{
 assert.match(source,/card\.draggable=false/);
 assert.match(source,/drag\.draggable=true/);
 assert.match(source,/closest\('\.ef-home-drag-handle'\)/);
 assert.match(source,/aria-label/);
});
check('Stylesheet is shipped in app and preloaded for offline desktop',()=>{
 assert.ok(html.includes('31-desktop-refinement.css'));
 assert.ok(sw.includes('./assets/css/31-desktop-refinement.css'));
});
console.log('TOTAL:',passed,'tests passed');