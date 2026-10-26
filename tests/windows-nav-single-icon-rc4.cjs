'use strict';
// Regression: CSS legacy icon masks must never coexist with an added theme SVG.
// No WebView2/SQLite changes, no network, no external test dependencies.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../src/EvoluFisico.Desktop/wwwroot');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const script=read('assets/js/70-desktop-themes.js');
const styles=read('assets/css/79-desktop-themes.css');
const legacy=read('assets/css/25-ficha-viva.css');
const home=read('assets/css/52-home-dashboard.css');
new Function(script);
assert.match(legacy,/\.nav-tab-btn::before/,'Legacy icon layer must exist for regression relevance');
assert.match(home,/#tab-btn-painel::before/,'Dashboard has ID-specific legacy CSS');
assert.match(styles,/:is\(#tab-btn-painel,#tab-btn-organizacao,\.nav-tab-btn\)\[data-ef-theme-icon-visible="1"\]::before\{content:none!important;display:none!important/);
const routeIds=['tab-btn-painel','tab-btn-organizacao','tab-btn-history','tab-btn-compare','tab-btn-lab77','tab-btn-ef-forms','tab-btn-diagnostics','tab-btn-cobranca','tab-btn-settings'];
function makeHolder() {
 let markup='',writes=0;const holder={dataset:{},className:'ef-local-nav-icon',querySelector:q=>q==='svg'&&markup.includes('<svg')?{}:null};
 Object.defineProperty(holder,'innerHTML',{get:()=>markup,set:v=>{markup=v;writes++;}});
 holder.getWrites=()=>writes;
 return holder;
}
const buttons=Object.fromEntries(routeIds.map(id=>[id,{
 id,dataset:{},holder:null,
 querySelector:q=>q===':scope > .ef-local-nav-icon'?this.holder:null,
 prepend(element){this.holder=element;}
}]));
for(const button of Object.values(buttons))button.querySelector=function(q){return q===':scope > .ef-local-nav-icon'?this.holder:null};
const nav={contains:button=>Object.values(buttons).includes(button)};
const store=new Map(),doc={
 readyState:'loading',addEventListener(){},body:{dataset:{}},
 documentElement:{dataset:{},style:{setProperty(){}}},
 getElementById:id=>buttons[id]||null,
 querySelector:q=>q==='.top-navbar .nav-tabs'?nav:null,
 querySelectorAll:()=>[],
 createElement:tag=>{assert.equal(tag,'span');return makeHolder();}
};
const context={document:doc,window:{},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},MutationObserver:class{observe(){}},queueMicrotask:()=>{}};
vm.runInNewContext(script,context,{timeout:1000});
const api=context.window.EFDesktopThemes;
assert.equal(api.all.length,5);
for(const theme of ['saude','academia','educacao','musculacao','nutricao']){
 assert.equal(api.set(theme),true);
 for(const button of Object.values(buttons)){
  assert.equal(button.dataset.efThemeIconVisible,'1','Legacy mask not guarded for '+button.id);
  assert.ok(button.holder?.querySelector('svg'),'Themed SVG missing: '+button.id);
 }
 const originalWrites=Object.fromEntries(Object.values(buttons).map(b=>[b.id,b.holder.getWrites()]));
 assert.equal(api.set(theme),true);
 for(const button of Object.values(buttons))
  assert.equal(button.holder.getWrites(),originalWrites[button.id],'Unchanged theme rewrites SVG: '+button.id);
}
assert.match(buttons['tab-btn-organizacao'].holder.innerHTML,/M3 5h7l2 3h9/,'Organization icon missing');
assert.equal(api.get(),'nutricao');
console.log('PASS: five themes, 9 themed routes, one SVG each, guarded legacy pseudo icons, no redraw loops.');
