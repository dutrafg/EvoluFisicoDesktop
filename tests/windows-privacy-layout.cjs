'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = 'src/EvoluFisico.Desktop/';
const runtime = fs.readFileSync(base+'wwwroot/assets/js/05-app-runtime.js','utf8');
const bridge = fs.readFileSync(base+'wwwroot/assets/js/28-native-storage.js','utf8');
const host = fs.readFileSync(base+'MainWindow.xaml.cs','utf8');
const store = fs.readFileSync(base+'EncryptedSqliteStore.cs','utf8');
const vault = fs.readFileSync(base+'ProtectedVault.cs','utf8');
const html = fs.readFileSync(base+'wwwroot/index.html','utf8');
const css = fs.readFileSync(base+'wwwroot/assets/css/31-desktop-refinement.css','utf8');
const sw = fs.readFileSync(base+'wwwroot/sw.js','utf8');
const ui = fs.readFileSync(base+'wwwroot/assets/js/26-simple-interface.js','utf8');
const tests = [
['SQLite protects all writes with AES-GCM and DPAPI',()=>{assert.match(store,/ProtectedVault\.Encrypt\(plaintext, masterPassword\)/);assert.match(vault,/new AesGcm\(key, TagSize\)/);assert.match(vault,/ProtectedData\.Protect\(key, null, DataProtectionScope\.CurrentUser\)/)}],
['Native bridge restricts file encryption to authenticated host',()=>{assert.match(host,/source\.Host\.Equals\("evolufisico\.local"/);assert.match(host,/case "protect-data":/);assert.match(host,/case "unprotect-data":/);assert.match(host,/ProtectedVault\.Decrypt\(payload\)/)}],
['Browser bridge protects and decrypts selected-folder bytes',()=>{assert.match(bridge,/protectBytes:async bytes=>/);assert.match(bridge,/unprotectText:async payload=>/);assert.match(bridge,/call\('protect-data'/);assert.match(bridge,/call\('unprotect-data'/)}],
['Patient records and photos use encrypted EFX without web vault',()=>{assert.match(runtime,/const arquivoProtegido = Boolean\(\(EF_Security\.enabled && EF_Security\.key\) \|\| window\.EFNativeStorage\)/);assert.match(runtime,/payload:await window\.EFNativeStorage\.protectText\(JSON\.stringify\(registro,null,2\)\)/);assert.match(runtime,/payload:await window\.EFNativeStorage\.protectBytes\(new Uint8Array\(await blob\.arrayBuffer\(\)\)\)/);assert.match(runtime,/rawText = await window\.EFNativeStorage\.unprotectText\(envelope\.payload\)/)}],
['Opaque physical folder names omit client name',()=>assert.match(runtime,/window\.EFNativeStorage \? \x60avaliacao_\$\{registro\.data_avaliacao\}/)],
['Draft saved in native encrypted store',()=>{assert.match(runtime,/EFNativeStorage\.writeJSON\('ef-form-draft',rascunho\)/);assert.match(runtime,/EFNativeStorage\.readJSON\('ef-form-draft'\)/);assert.match(runtime,/EFNativeStorage\.delete\('ef-form-draft'\)/)}],
['Snapshots protected automatically and legacy copies verified before removal',()=>{assert.match(runtime,/EFNativeStorage\.writeJSON\('ef-safety-snapshot-main', snapshot\)/);assert.match(runtime,/async function protegerLegadosLocaisDesktop\(\)/);assert.match(runtime,/JSON\.stringify\(persisted\.data\) === JSON\.stringify\(data\)/)}],
['Assessment restoration replaces encrypted SQLite records rather than plaintext localStorage',()=>{assert.match(runtime,/EFNativeStorage\.replaceEvaluations\(records\)/);assert.match(bridge,/replaceEvaluations:async records=>/);assert.match(host,/store\.ReplaceEvaluations\(records\)/);assert.match(store,/internal void ReplaceEvaluations\(/)}],
['Stylesheet loads last and is cached',()=>{assert.match(html,/30-sidebar-palette\.css.*?31-desktop-refinement\.css/s);assert.match(sw,/31-desktop-refinement\.css/)}],
['Responsive spacing and comfortable light color theme',()=>{assert.match(css, /--ef-page: #e3e9e4/);assert.match(css, /max-width: 1460px/);assert.match(css, /max-width: 760px/);assert.match(css,/min-height: 35px/)}],
];
for(const [label,fn] of tests){fn();console.log('PASS',label);}
console.log('TOTAL',tests.length,'Windows privacy/layout static regression checks passed.');