'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root='src/EvoluFisico.Desktop/wwwroot/';
const load=p=>fs.readFileSync(root+p,'utf8');
const h=load('index.html'),src=load('assets/js/82-desktop-live-results.js');
const css=load('assets/css/82-desktop-web-3-1-37.css'),sw=load('sw.js');
const rt=load('assets/js/05-app-runtime.js'),flow=fs.readFileSync('.github/workflows/windows-build.yml','utf8');
new Function(src);
assert(h.includes('id="ef-live-summary-toggle" type="button" aria-controls="live-kpi-summary" aria-expanded="true"'));
assert(h.includes('id="ef-new-checkin-after-save" onclick="resetFormulario()"'));
assert(h.includes('Windows RC-9 · Base Web 3.1.37'));
for(const p of ['assets/js/82-desktop-live-results.js','assets/css/82-desktop-web-3-1-37.css']){
 assert(h.includes('./'+p));assert(sw.includes('"./'+p+'"'));
}
assert(css.includes(':focus-visible')&&css.includes('@media(max-width:1100px)')&&css.includes('#ef-live-summary.is-collapsed #live-kpi-summary'));
const reset=rt.slice(rt.indexOf('const resetFormulario = window.resetFormulario = function()'),rt.indexOf('// Evolufisico2 1.0: criar novo atendimento'));
for(const fragment of ["form.reset();","document.getElementById('avaliacao_id').value = '';","formActions.classList.remove('hidden')","successScreen.classList.add('hidden')","currentStepIndex = 0;","switchTab('tab-novo-checkin');"])
 assert(reset.includes(fragment),'Lost reset behavior: '+fragment);
const attrs={};let onClick,stored='0',collapsed=false;
const elements={
 'ef-live-summary':{dataset:{},classList:{toggle(name,v){assert.equal(name,'is-collapsed');collapsed=v},contains(name){return name==='is-collapsed'&&collapsed}}},
 'ef-live-summary-toggle':{setAttribute(k,v){attrs[k]=v},addEventListener(k,cb){assert.equal(k,'click');onClick=cb}},
 'live-kpi-summary':{hidden:false},
 'ef-live-summary-action':{textContent:''}
};
const doc={readyState:'complete',getElementById:id=>elements[id]||null};
vm.runInNewContext(src,{window:{document:doc,localStorage:{getItem(){return stored},setItem(k,v){assert.equal(k,'ef_desktop_live_results_collapsed');stored=v}}}},{timeout:1500});
assert.equal(attrs['aria-expanded'],'true');onClick();assert.equal(attrs['aria-expanded'],'false');
assert.equal(elements['live-kpi-summary'].hidden,true);assert.equal(stored,'1');
onClick();assert.equal(attrs['aria-expanded'],'true');assert.equal(stored,'0');
assert(flow.includes("vars.ENABLE_STABLE_RELEASE == 'true'"));
assert(flow.includes('--prerelease --latest=false'));
assert(load('sw.js').includes('web-3-1-37-rc9'));
const native=fs.readFileSync('src/EvoluFisico.Desktop/MainWindow.xaml.cs','utf8');
const sql=fs.readFileSync('src/EvoluFisico.Desktop/EncryptedSqliteStore.cs','utf8');
assert(native.includes('new EncryptedSqliteStore()')&&native.includes('store.BackupTo('));
assert(sql.includes('ProtectedVault.Encrypt')&&sql.includes('BeginTransaction()'));
console.log('RC-9 PASS: toggle, a11y, persistence, new check-in flow, offline, native SQLite and release safety');
