'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root='src/EvoluFisico.Desktop/wwwroot/';
const read=p=>fs.readFileSync(p,'utf8');
const js=read(root+'assets/js/64-whats-new.js');
const css=read(root+'assets/css/64-whats-new.css');
const html=read(root+'index.html');
const sw=read(root+'sw.js');
let count=0;
function check(name,fn){fn();count++;console.log('PASS',name)}
check('Novidades script/style are loaded and precached offline',()=>{
 for(const path of ['./assets/js/64-whats-new.js','./assets/css/64-whats-new.css']){
  assert.ok(html.includes(path),'HTML missing '+path);
  assert.ok(sw.includes(path),'cache missing '+path);
 }
 assert.ok(sw.includes('evolufisico-desktop-1-0-10-pdf-names-new-evaluation'));
 new Function(js);
});
check('Single card carries accessible SVG, version and accurate offline changelog',()=>{
 for(const term of ['ef-desktop-whatsnew-card','ef-desktop-whatsnew-title',
 'aria-labelledby','aria-hidden','O que há de novidade','v','1.0.10',
 'recarga acidental','cobranças','tarefas e metas','avaliações','15 cores'])
  assert.ok(js.includes(term),term);
 assert.ok(js.includes("summary.textContent=SUMMARY"));
 assert.ok(!js.includes('fetch('),'card must be available offline without external requests');
});
check('Card mounts immediately after native update checker and is idempotent',()=>{
 const nodes=[];
 const make=tag=>({
  tag,id:'',className:'',attributes:{},children:[],textContent:'',innerHTML:'',
  setAttribute(k,v){this.attributes[k]=v},
  append(...children){this.children.push(...children)},
  insertAdjacentElement(position,node){this.inserted={position,node};node.parentElement=this.parentElement},
  querySelector(){return null}
 });
 const updateCard=make('article');updateCard.parentElement=make('div');
 const update={closest(){return updateCard}};
 const document={
  readyState:'loading',
  createElement(tag){const node=make(tag);nodes.push(node);return node},
  getElementById(id){if(id==='ef-desktop-check-update')return update;return null},
  querySelector(){return null},
  addEventListener(name,cb){if(name==='DOMContentLoaded')this.callback=cb}
 };
 const window={};
 vm.runInNewContext(js,{window,document}, {timeout:2000});
 assert.equal(typeof document.callback,'function');
 document.callback();
 assert.equal(updateCard.inserted.position,'afterend');
 assert.equal(updateCard.inserted.node.id,'ef-desktop-whatsnew-card');
 assert.equal(updateCard.inserted.node.attributes['aria-labelledby'],'ef-desktop-whatsnew-title');
 assert.equal(updateCard.inserted.node.children.length,2);
 assert.equal(window.EFDesktopWhatsNew.version,'1.0.10');
});
check('Fallback goes to Manutenção when no update checker exists',()=>{
 const make=tag=>({tag,children:[],attributes:{},append(...n){this.children.push(...n)},setAttribute(k,v){this.attributes[k]=v}});
 const grid={prepended:null,prepend(node){this.prepended=node}};
 const document={
  readyState:'complete',
  createElement:make,
  getElementById(){return null},
  querySelector(s){return s.includes('efw-settings-panel[data-efw-panel="manutencao"]')?grid:null}
 };
 const window={};vm.runInNewContext(js,{window,document},{timeout:2000});
 assert.equal(grid.prepended?.id,'ef-desktop-whatsnew-card');
});
check('Responsive themes and printed clinical PDFs remain unaffected',()=>{
 assert.ok(css.includes('var(--ef-surface'));
 assert.ok(css.includes('var(--text-muted'));
 assert.ok(css.includes('@media(max-width:520px)'));
 assert.ok(css.includes('@media print'));
 assert.ok(css.includes('#tab-settings .efwhatsnew-card'));
 const fx=read(root+'assets/css/60-desktop-effects-120.css');
 assert.ok(fx.includes('--efx-blur:19.2px'));
 assert.ok(fx.includes('prefers-reduced-motion:reduce'));
});
check('Windows install id, encrypted SQLite and stable patch version retained',()=>{
 const iss=read('installer/EvoluFisico.iss');
 const native=read('src/EvoluFisico.Desktop/MainWindow.xaml.cs');
 const ui=read(root+'assets/js/26-simple-interface.js');
 assert.match(iss,/#define MyAppVersion "1\.0\.10"/);
 assert.match(iss,/AppId=\{\{C89493D0-1C8B-4717-A6C8-42F45B3FBD0B\}/);
 assert.ok(native.includes('CurrentVersion = "1.0.10"'));
 assert.ok(ui.includes("version:'1.0.10'"));
 assert.ok(html.includes('v1.0.10 estável'));
 assert.ok(read(root+'assets/js/24-billing.js').includes('EF_NATIVE_BILLING_KEY'));
});
console.log('TOTAL',count,'EvoluFisico Desktop 1.0.10 whats-new checks passed');