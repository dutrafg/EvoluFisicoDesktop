'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const base='src/EvoluFisico.Desktop/wwwroot/';
const read=p=>fs.readFileSync(base+p,'utf8');
const html=read('index.html');
const manifest=JSON.parse(read('manifest.webmanifest'));
const version=JSON.parse(read('version.json'));
const native=fs.readFileSync('src/EvoluFisico.Desktop/MainWindow.xaml.cs','utf8');
const sqlite=fs.readFileSync('src/EvoluFisico.Desktop/EncryptedSqliteStore.cs','utf8');
const iss=fs.readFileSync('installer/EvoluFisico.iss','utf8');
const build=fs.readFileSync('scripts/build-windows.ps1','utf8');
const proj=fs.readFileSync('src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj','utf8');
assert(html.length>3500000,'Full Web HTML source missing');
for(const module of ['EvoStore','Perfil Unificado','Análises Completas','Resultados em tempo real','ef-splash-version-pill','Objetivos e planejamento'])
 assert(html.includes(module),'Missing Web module: '+module);
assert.equal(manifest.version,'3.1.37');assert.equal(version.version,'3.1.37');
assert(native.includes('CurrentVersion = "3.1.37"'));
assert(native.includes('StartsWith("desktop-v3.")'));
assert(iss.includes('#define MyAppVersion "3.1.37"'));
assert(proj.includes('<Version>3.1.37</Version>'));
assert(build.includes('desktop-v$webVersion-$revision')&&build.includes('version = $webVersion'));
assert(html.includes('<script src="./assets/js/28-native-storage.js"></script>'));
for(const needle of ['EF_NATIVE_EVAL_PREFIX','window.EFNativeStorage.readJSON(key)','window.EFNativeStorage.writeJSON(EF_NATIVE_EVAL_PREFIX+registro.id,registroPersistido)','window.EFNativeStorage.deleteEvaluation(EF_NATIVE_EVAL_PREFIX+target.id,updates)','await storage.replaceEvaluations(encoded)','window.EFNativeStorage.health()'])
 assert(html.includes(needle),'Lost native data operation: '+needle);
assert(html.includes('if(window.EFNativeStorage)return; // Não duplicar dados clínicos'));
const start=html.indexOf('async function initDB()');
const finish=html.indexOf('async function carregarAvaliacoesDoDB()',start);
assert(start>0&&finish>start);
const code=html.slice(start,finish);
assert(code.includes('if (window.EFNativeStorage)')&&code.includes('return null;'));
const cx={window:{EFNativeStorage:{health:async()=> 'ok'}},db:{},carregarAvaliacoesDoDB:async()=>{cx.called=true},called:false};
const promise=vm.runInNewContext(code+'\ninitDB()',cx,{timeout:1000});
Promise.resolve(promise).then(()=>{
 assert(cx.called,'Native evaluation loading not invoked');
 assert.equal(cx.db,null);
 console.log('PASS full Web 3.1.37, exact version metadata, native SQLite routing, module markers, no clinical IndexedDB fallback');
}).catch(error=>{console.error(error);process.exitCode=1});
assert(sqlite.includes('ProtectedVault.Encrypt')&&sqlite.includes('BeginTransaction()'));
assert(read('assets/js/28-native-storage.js').includes('replaceEvaluations'));

assert(html.includes("const EF_NATIVE_BILLING_KEY = 'ef-billing-main';"));
assert(html.includes('window.EFNativeStorage.readJSON(EF_NATIVE_BILLING_KEY)'));
assert(html.includes('window.EFNativeStorage.writeJSON(EF_NATIVE_BILLING_KEY,packet)'));
