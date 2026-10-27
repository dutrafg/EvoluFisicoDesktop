/* RC-1: integrity checks for the selective web 3.1.19 port. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const root='src/EvoluFisico.Desktop/wwwroot/';
const html=read(root+'index.html');
const sw=read(root+'sw.js');
const files=["./assets/css/74-dashboard-wallpapers.css","./assets/css/75-wallpapers-all-modules.css","./assets/css/77-sidebar-preferences.css","./assets/css/78-desktop-insights.css","./assets/js/49-dashboard-wallpapers.js","./assets/js/50-sidebar-preferences.js","./assets/js/68-desktop-insights.js"];
for(const name of files){
  assert.ok(fs.existsSync(path.join(ROOT,root,name.slice(2))),'Missing '+name);
  assert.equal(html.split('href="'+name+'"').length-1 + html.split('src="'+name+'"').length-1,1,'HTML link count '+name);
  assert.ok(sw.includes(JSON.stringify(name)),'Offline precache missing '+name);
  if(name.endsWith('.js'))new Function(read(root+name.slice(2)));
}
const wp=read(root+'assets/js/49-dashboard-wallpapers.js');
assert.ok(wp.includes("window.EFWallpapers=Object.freeze"));
assert.ok(wp.includes("var levels=['Mais claro','Claro','Médio','Escuro','Mais escuro']"));
for(const group of ["id:'min'","id:'nat'","id:'abs'","id:'tex'"])
  assert.ok(wp.includes(group),'Missing one of four wallpaper categories: '+group);
assert.ok(read(root+'assets/css/75-wallpapers-all-modules.css').includes('@media print'));
const sidebar=read(root+'assets/js/26-simple-interface.js');
assert.ok(sidebar.includes("saved=value===null?true:value==='1'"),'Default minimized sidebar missing');
assert.ok(read(root+'assets/js/50-sidebar-preferences.js').includes('#ef-setting-appearance'));
const insights=read(root+'assets/js/68-desktop-insights.js');
assert.ok(insights.includes('#ef-home-insights details'));
assert.ok(insights.includes('efi-insights-default'));
const native=read('src/EvoluFisico.Desktop/MainWindow.xaml.cs');
assert.ok(native.includes('new EncryptedSqliteStore()'),'Native SQLite bridge must remain active');
assert.ok(native.includes('SetVirtualHostNameToFolderMapping'),'Local offline WebView2 must remain active');
assert.ok(!html.includes('https://evolufisico2.vercel.app/'),'Do not replace local UI with remote site');
console.log('Windows 3.1.19 RC-1: seven assets, native bridge, sidebar, Insights and offline checks passed.');
