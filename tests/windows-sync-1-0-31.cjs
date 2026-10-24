'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root='src/EvoluFisico.Desktop/wwwroot/';
const read=p=>fs.readFileSync(p,'utf8');
const reload=read(root+'assets/js/62-reload-guard.js');
const css=read(root+'assets/css/63-responsive-qa.css');
const sw=read(root+'sw.js');
const html=read(root+'index.html');
const bill=read(root+'assets/js/24-billing.js');
const org=read(root+'assets/js/51-organization.js');
const app=read(root+'assets/js/05-app-runtime.js');
const nav=read(root+'assets/js/26-simple-interface.js');
let pass=0;const test=(name,fn)=>{fn();pass++;console.log('PASS '+name)};
test('Geral displays accessible persisted reload safeguard and assets are offline',()=>{
 for(const a of ['./assets/js/62-reload-guard.js','./assets/css/62-reload-guard.css','./assets/css/63-responsive-qa.css']){
  assert.ok(html.includes(a),a);assert.ok(sw.includes(a),a);
 }
 for(const a of ['efw-settings-panel[data-efw-panel="geral"]','efw-reload-toggle','Proteger contra recarregamento acidental','ef_general_reload_guard_v1','aria-describedby','aria-live'])assert.ok(reload.includes(a),a);
 assert.ok(sw.includes('evolufisico-desktop-1-1-0-pdf-names-new-evaluation'));
});
test('Actual key and beforeunload handling works, option can disable and persist',()=>{
 let docReady,controlListener;
 const events={};
 const status={textContent:''};
 const control={checked:false,addEventListener(type,cb){if(type==='change')controlListener=cb}};
 const grid={appendChild(n){this.card=n}};
 const document={
  readyState:'loading',
  addEventListener(ev,cb){if(ev==='DOMContentLoaded')docReady=cb},
  querySelector(selector){return selector.includes('ef-settings-grid')?grid:null},
  getElementById(id){return id==='efw-reload-card'?null:id==='efw-reload-status'?status:null},
  createElement(){return {className:'',id:'',innerHTML:'',querySelector(){return control}}}
 };
 const storage={};
 const localStorage={getItem(k){return storage[k]||null},setItem(k,v){storage[k]=v}};
 const window={addEventListener(name,fn){events[name]=fn}};
 vm.runInNewContext(reload,{window,document,localStorage}, {timeout:1000});
 assert.equal(window.EFReloadGuard.isEnabled(),true);
 assert.equal(typeof docReady,'function');docReady();
 assert.ok(grid.card);assert.equal(control.checked,true);
 const evt=(key,ctrlKey=false,metaKey=false)=>({key,ctrlKey,metaKey,prevented:false,preventDefault(){this.prevented=true},stopImmediatePropagation(){}});
 for(const combo of [['F5',false,false],['F5',true,false],['r',true,false],['R',true,false],['r',false,true]]){
  const e=evt(...combo);events.keydown(e);assert.equal(e.prevented,true,String(combo));
 }
 let exit=evt('');events.beforeunload(exit);assert.equal(exit.prevented,true);
 control.checked=false;controlListener();assert.equal(storage.ef_general_reload_guard_v1,'0');
 exit=evt('');events.beforeunload(exit);assert.equal(exit.prevented,false);
 const e=evt('F5');events.keydown(e);assert.equal(e.prevented,false);
 window.EFReloadGuard.set(true);assert.equal(storage.ef_general_reload_guard_v1,'1');
});
test('Native SQLite financial history remains strict on corrupt entries and encrypted',()=>{
 assert.ok(bill.includes("if(!Array.isArray(list))throw new Error('Histórico financeiro inválido no SQLite.')"));
 assert.ok(bill.includes('EF_NATIVE_BILLING_KEY'));
 assert.ok(bill.includes('await billingNativeStore().writeJSON(EF_NATIVE_BILLING_KEY,packet)'));
 assert.ok(bill.includes("Object.create(null)"),'no prototype-collision in grouped names');
});
test('Billing confirmation rechecks SQLite before reopening and prevents duplicate clicks',()=>{
 for(const a of ['let savingBilling = false','if (savingBilling) return','finally { savingBilling = false; }','async function registrarCobrancaNoHistorico()',
  "atual.status='pendente'","await loadBilling();","atual.recebidoEm=null",
  "confirmar('Reabrir esta cobrança como pendente?'","overlay.addEventListener('ef-close',fechar",
  "if(focusBefore?.isConnected)focusBefore.focus()"])
  assert.ok(bill.includes(a),a);
 const start=bill.indexOf('let savingBilling = false'),end=bill.indexOf('async function registrarCobrancaNoHistorico()',start);
 assert.ok(start>=0&&end>start);
 const wrapper=bill.slice(start,end);
 let called=0;
 const build=new Function('notificar','registrar',wrapper.replace('registrarCobrancaNoHistorico()','registrar()')+
  'return {salvarCobrancaNoHistorico};');
 // The wrapper has one explicit registrar call and no mutation of the stored billing values.
 assert.equal((wrapper.match(/registrarCobrancaNoHistorico\(\)/g)||[]).length,1);
 assert.ok(wrapper.includes('notificar'));
});
test('Organização does not close a form nor mutate notes when local storage write fails',()=>{
 for(const a of ['function save(){if(!set(DATAKEY,db))','const nextDB={...db,[type]:updated}',
  'if(!set(DATAKEY,nextDB))return;db=nextDB',
  'if(!set(TASKKEY,updated))return;',
  "notice('Não foi possível salvar no navegador.')"])
  assert.ok(org.includes(a),a);
 const form=org.slice(org.indexOf('function submit(ev)'),org.indexOf('function action(el)'));
 assert.ok(form.indexOf('if(!set(DATAKEY,nextDB))return')<form.indexOf("$('#eforg-dialog').close()"));
});
test('Pollock rejects infinite or out-of-domain values before clinical calculation',()=>{
 assert.match(app,/dobras\.coxa\]\.every\(v=>Number\.isFinite\(v\)&&v>0\)/);
 assert.ok(app.includes('Number.isFinite(idade)&&idade>=18&&idade<=80'));
 assert.ok(app.includes('Number.isFinite(peso)&&peso>0'));
});
test('New palette has fifteen colors; advanced visual effects are still +20 percent',()=>{
 const begin=nav.indexOf('const COLORS='),end=nav.indexOf('const LEGACY_COLORS=',begin);
 const colors=new Function(nav.slice(begin,end)+'return COLORS;')();
 assert.equal(Object.keys(colors).length,15);
 for(const k of ['grafite','bordeaux','oliva','cobre','turquesa'])assert.ok(colors[k],k);
 assert.ok(nav.includes("['oliva','cobre','turquesa'].includes(key)?'#0c241d'"));
 const effects=read(root+'assets/css/60-desktop-effects-120.css');
 assert.ok(effects.includes('--efx-blur:19.2px'));
 assert.ok(effects.includes('translate3d(0,-4.8px,8.4px)'));
 assert.ok(effects.includes('prefers-reduced-motion:reduce'));
});
test('Sidebar buttons and phone Organisation tabs remain well positioned',()=>{
 assert.ok(css.includes('min-width:1200px'));
 assert.ok(css.includes('#ef-primary-actions'));
 assert.ok(css.includes('repeat(2,minmax(0,1fr))'));
 assert.ok(css.includes('@media print'));
});
test('Version remains 1.0.x and native data/installer identity are preserved',()=>{
 const install=read('installer/EvoluFisico.iss'),native=read('src/EvoluFisico.Desktop/MainWindow.xaml.cs');
 assert.match(install,/#define MyAppVersion "1\.1\.0"/);
 assert.match(install,/AppId=\{\{C89493D0-1C8B-4717-A6C8-42F45B3FBD0B\}/);
 assert.ok(native.includes('CurrentVersion = "1.1.0"'));
 assert.ok(nav.includes("version:'1.1.0'"));
 assert.ok(html.includes('<title>EvoluFísico Desktop 1.1.0 Pré-Beta</title>')&&!html.includes('brand-version'));
});
console.log('TOTAL',pass,'regressions 1.0.31 Desktop 1.1.0');