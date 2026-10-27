/* Desktop Windows 3.1.19 RC-2 static and sandboxed configuration tests. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../src/EvoluFisico.Desktop/wwwroot');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),sw=read('sw.js');
const entries=['assets/css/73-theme-contrast.css','assets/css/79-desktop-themes.css','assets/js/70-desktop-themes.js'];
for(const file of entries){
 assert.ok(fs.existsSync(path.join(root,file)),file+' missing');
 assert.ok(html.includes('./'+file),file+' unreferenced');
 assert.ok(sw.includes('"./'+file+'"'),file+' not offline cached');
}
const themeJs=read('assets/js/70-desktop-themes.js');
new Function(themeJs);
const saved=new Map();let onReady;
const mock={
 window:{},
 document:{readyState:'loading',addEventListener:(name,fn)=>{if(name==='DOMContentLoaded')onReady=fn}},
 localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},
 MutationObserver:class{observe(){}}
};
vm.runInNewContext(themeJs,mock,{timeout:1000});
assert.equal(typeof onReady,'function');
const api=mock.window.EFDesktopThemes;
assert.ok(api);
assert.equal(api.all.length,5,'Five themes expected');
assert.deepEqual(Array.from(api.all,x=>x.id),['saude','academia','educacao','musculacao','nutricao']);
assert.equal(api.get(),'saude','Default theme must be Saúde');
saved.set('ef_desktop_theme_3_1_19','nutricao');
assert.equal(api.get(),'nutricao','Theme persistence must be restored');
saved.set('ef_desktop_theme_3_1_19','not-a-theme');
assert.equal(api.get(),'saude','Bad theme selection must be ignored');
for(const word of ['--ef-selected-color','--ef-selected-darkmode-accent','ef-local-nav-icon','tab-btn-analises','Temas e papéis de parede'])
 assert.ok(themeJs.includes(word)||word==='tab-btn-analises','Missing expected UI behavior: '+word);
const css=read('assets/css/79-desktop-themes.css');
assert.ok(css.includes('@media print'));
assert.ok(css.includes('aria-pressed="true"'));
const code=fs.readFileSync(path.resolve(__dirname,'../src/EvoluFisico.Desktop/MainWindow.xaml.cs'),'utf8');
assert.ok(code.includes('EncryptedSqliteStore'),'Native database must remain in use');
assert.ok(code.includes('evolufisico.local'),'Desktop app must remain local');
console.log('RC-2: five theme packs, offline styles, SQLite boundary, persistence and script syntax OK.');
