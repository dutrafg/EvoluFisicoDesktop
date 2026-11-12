'use strict';
/* Paridade Web 3.1.45 RC-14 sem regressao nativa. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base='src/EvoluFisico.Desktop/';
const read=p=>fs.readFileSync(base+p,'utf8');
const html=read('wwwroot/index.html');
const runtime=read('wwwroot/assets/js/05-app-runtime.js');
const css=read('wwwroot/assets/css/36-print-restore.css');
const win=read('MainWindow.xaml.cs');
const vault=read('EncryptedSqliteStore.cs');
const proj=read('EvoluFisico.Desktop.csproj');
const version=JSON.parse(read('wwwroot/version.json'));
const manifest=JSON.parse(read('wwwroot/manifest.webmanifest'));
assert.equal(version.version,'3.1.45');
assert.equal(version.source_web_commit,'2e80aa6220ebaaf9430e387e2f7cbde324f918de');
assert.equal(manifest.version,'3.1.45');
assert(html.length>3600000,'Frontend completo nao pode ser substituido por um shell');
for(const text of ['"version":"3.1.45"','id="ef-pdf-a4-hotfix"','Coxa Esquerda:</td>',
 'async function aguardarFotosDaImpressao(wrapper)',
 'await aguardarFotosDaImpressao(wrapper)',
 'if(review&&slots.size>1)','ef-history-link-review',
 'workerChanged||newerThan','EF_NATIVE_EVAL_PREFIX','window.EFNativeStorage',
 'loadDirectoryNative','EvoStore','Perfil Unificado','Análises Completas','SQLite protegido'])
 assert(html.includes(text),'HTML nao contem: '+text);
assert(runtime.includes('Coxa Esquerda:</td>'));
assert(runtime.includes('await aguardarFotosDaImpressao(wrapper)'));
assert(css.includes('object-fit: contain'),'CSS A4 precisa conter foto sem cortar');
assert(win.includes('CurrentVersion = "3.1.45"'));
assert(proj.includes('<AssemblyVersion>3.1.45.0</AssemblyVersion>'));
assert(vault.includes('ProtectedData')||vault.includes('Encrypt')||vault.includes('Protect'),
 'Nao remover a camada de armazenamento protegido');
for(const txt of ['<<<<<<<','>>>>>>>'])assert(!html.includes(txt),'Merge inconclusivo');
console.log('PASS: Web 3.1.45 + PDF, identidade e armazenamento SQLite nativo.');
