'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const root='src/EvoluFisico.Desktop/';
const js=fs.readFileSync(root+'wwwroot/assets/js/26-simple-interface.js','utf8');
const css=fs.readFileSync(root+'wwwroot/assets/css/30-sidebar-palette.css','utf8');
const base=fs.readFileSync(root+'wwwroot/assets/css/23-simple-interface.css','utf8');
const sw=fs.readFileSync(root+'wwwroot/sw.js','utf8');
const manifest=JSON.parse(fs.readFileSync(root+'wwwroot/manifest.webmanifest','utf8'));
const xaml=fs.readFileSync(root+'MainWindow.xaml','utf8');
const native=fs.readFileSync(root+'MainWindow.xaml.cs','utf8');
const inno=fs.readFileSync('installer/EvoluFisico.iss','utf8');
const ps=fs.readFileSync('scripts/build-windows.ps1','utf8');
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS',name)}
const start=js.indexOf('const COLORS='),end=js.indexOf('function installColors()',start);
assert.ok(start!==-1&&end>start,'Palette declarations should be extractable');
const props={},rootDataset={},bodyDataset={};
const buttons=[];
const doc={
 documentElement:{style:{setProperty:(k,v)=>{props[k]=v}},dataset:rootDataset},
 body:{dataset:bodyDataset},
 querySelectorAll:()=>buttons
};
const api=new Function('document',js.slice(start,end)+'return {COLORS,applyColor};')(doc);
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const luminance=h=>rgb(h).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const v=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (v[0]+.05)/(v[1]+.05)};
check('Exactly five soft colors and five additional darker options',()=>{
 assert.equal(Object.keys(api.COLORS).length,10);
 for(const c of ['verde','azul','roxo','laranja','rosa']){
  assert.ok(api.COLORS[c]&&api.COLORS[c+'-escuro'],c);
  assert.ok(luminance(api.COLORS[c+'-escuro'][0])<luminance(api.COLORS[c][0]),c);
 }
});
check('Each intense background passes WCAG AA text contrast',()=>{
 for(const c of Object.keys(api.COLORS).filter(k=>k.endsWith('-escuro'))){
  assert.equal(api.COLORS[c][2],'#ffffff',c);
  assert.ok(ratio(api.COLORS[c][0],api.COLORS[c][2])>=4.5,c+' ratio '+ratio(api.COLORS[c][0],api.COLORS[c][2]));
 }
});
check('The old five saved colors keep their original values',()=>{
 const old={verde:['#75d7a9','#086849'],azul:['#73aef9','#235cbd'],roxo:['#ad95ff','#6244ba'],laranja:['#f9b276','#a85517'],rosa:['#f3a5c5','#a53c71']};
 for(const [k,v] of Object.entries(old))assert.deepEqual(api.COLORS[k].slice(0,2),v,k);
});
check('Switching palette updates all relevant CSS tokens and selection state',()=>{
 for(const key of Object.keys(api.COLORS)){
  const control={dataset:{efColor:key},attributes:{},classList:{toggle(n,on){this[n]=on}},setAttribute(n,v){this.attributes[n]=v}};
  buttons.splice(0,buttons.length,control);
  api.applyColor(key);
  assert.equal(bodyDataset.efPalette,key);
  assert.equal(rootDataset.efPalette,key);
  assert.equal(props['--ef-selected-color'],api.COLORS[key][0]);
  assert.equal(props['--ef-selected-dark'],api.COLORS[key][1]);
  assert.equal(props['--ef-selected-on-color'],api.COLORS[key][2]);
  assert.equal(props['--ef-selected-darkmode-color'],api.COLORS[key][3]);
  assert.equal(control.attributes['aria-pressed'],'true');
 }
 api.applyColor('invalid');assert.equal(bodyDataset.efPalette,'verde');
});
check('Ten color buttons retain persistent setting and correct labels',()=>{
 assert.match(js,/Object\.keys\(COLORS\)\.map/);
 assert.match(js,/localStorage\.setItem\('ef90_paleta'/);
 assert.match(js,/localStorage\.getItem\('ef90_paleta'/);
 assert.ok(js.includes('5 cores suaves e 5 tons intensos'));
});
check('Light desktop sidebar has darker tint and legible navigation',()=>{
 assert.match(css,/@media screen and \(min-width: 1200px\)/);
 assert.match(css,/html:not\(\.ef-dark-mode\) body\.ef-simple-ui:not\(\.dark-mode\)/);
 assert.match(css,/var\(--ef-selected-dark,#086849\) 28%/);
 assert.ok(css.includes('nav-tab-btn.active')&&css.includes('#263f36'));
});
check('Dark mode has independent styling and light accessible accent',()=>{
 assert.ok(css.includes('html.ef-dark-mode body.ef-simple-ui'));
 assert.ok(base.includes('--ef-selected-darkmode-color'));
 assert.ok(base.includes('--ef-selected-on-color'));
 assert.ok(css.includes('@media print'));
});
check('Version 9.1.0-beta.4.1 is consistent in desktop UI and installer',()=>{
 for(const [name,content] of [['UI',js],['title',xaml],['native',native],['installer',inno],['build',ps],['manifest',manifest.name]]){
  assert.ok(content.includes('9.1.0-beta.4.1'),name);
 }
 assert.match(inno,/AppId=\{\{C89493D0-1C8B-4717-A6C8-42F45B3FBD0B\}/);
});
check('Offline service worker cache changes after palette update',()=>{
 assert.ok(sw.includes('evolufisico-desktop-9.1.0-beta.4.1-palette-20261021'));
 assert.ok(sw.includes('30-sidebar-palette.css'));
});
check('JavaScript remains syntactically valid',()=>assert.doesNotThrow(()=>new Function(js)));
console.log('TOTAL',passed,'new desktop palette checks passed');
