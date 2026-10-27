'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '../src/EvoluFisico.Desktop/wwwroot');
const source = fs.readFileSync(path.join(root, 'assets/js/70-desktop-themes.js'), 'utf8');
const splashSource = fs.readFileSync(path.join(root, 'assets/js/23-splash.js'), 'utf8');
new Function(source);
new Function(splashSource);

// Chromium serializes <path/> as <path></path>, so raw innerHTML differs
// even when the SVG DOM is unchanged. Old code ran in a microtask loop.
let svgPresent = false, iconWrites = 0, navObserver, timers = [], microtasks = [];
const holder = {dataset:{},querySelector:selector=>selector==='svg'&&svgPresent?{}:null};
let iconMarkup = '';
Object.defineProperty(holder,'innerHTML',{
 get(){return iconMarkup.replace(/<path([^>]*)\/>/g,'<path$1></path>')},
 set(value){
   iconWrites++;svgPresent=Boolean(value);iconMarkup=value;
   if(navObserver)navObserver.callback([{addedNodes:[{}],removedNodes:[]}]);
 }
});
const nav = {contains:()=>true};
const btn = {querySelector:()=>holder};
const classState = new Set();
const splash={style:{display:'flex'},classList:{
 add:n=>classState.add(n),remove:n=>classState.delete(n),
 contains:n=>classState.has(n)}};
const splashStatus={textContent:'Inicializando módulos clínicos…'};
let onLoaded;
class MutationObserverMock {
 constructor(callback){this.callback=callback}
 observe(target){if(target===nav)navObserver=this}
}
const context={
 window:{addEventListener:(name,fn)=>{if(name==='DOMContentLoaded')onLoaded=fn}},
 document:{
   readyState:'complete',body:{dataset:{}},
   documentElement:{dataset:{},style:{setProperty(){}}},
   querySelector:s=>s==='.top-navbar .nav-tabs'?nav:null,
   querySelectorAll:()=>[],
   getElementById:id=>
     id==='tab-btn-painel'?btn:
     id==='ef-splash'?splash:id==='ef-splash-status'?splashStatus:null,
   addEventListener(){}
 },
 localStorage:{getItem:()=>null,setItem(){}},
 MutationObserver:MutationObserverMock,
 queueMicrotask:fn=>microtasks.push(fn),
 setTimeout:fn=>timers.push(fn)
};
vm.runInNewContext(splashSource,context,{timeout:1000});
vm.runInNewContext(source,context,{timeout:1000});
assert.equal(typeof onLoaded,'function');
onLoaded();
assert.ok(navObserver,'Missing navigation observer');
const baseline=iconWrites;
navObserver.callback([{addedNodes:[{}],removedNodes:[]}]);
let processed=0;
while(microtasks.length){
 if(++processed>15)throw Error('SVG MutationObserver loop starves splash timer');
 microtasks.shift()();
}
assert.equal(iconWrites,baseline,'Unchanged SVG must not be rewritten');
assert.equal(timers.length,1,'Splash should set auto-close timer');
for(const timer of timers.splice(0))timer();
assert.ok(classState.has('dismissed'),'Splash was not dismissed');
for(const timer of timers.splice(0))timer();
assert.equal(splash.style.display,'none','Splash remains visible');
assert.equal(splashStatus.textContent,'Pronto para uso');
console.log('PASS: no navigation mutation loop; splash closes automatically.');
