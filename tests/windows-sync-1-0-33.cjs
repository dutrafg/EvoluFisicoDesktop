'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root='src/EvoluFisico.Desktop/wwwroot/';
const read=p=>fs.readFileSync(p,'utf8');
const html=read(root+'index.html'),sw=read(root+'sw.js'),helper=read(root+'assets/js/65-pdf-filenames.js'),css=read(root+'assets/css/65-evaluations-action.css');
const nav=read(root+'assets/js/26-simple-interface.js'),app=read(root+'assets/js/05-app-runtime.js');
let count=0;function check(name,fn){fn();console.log('PASS',name);count++}
check('Naming helper exactly matches Evolufisico2',()=>{
 const env={window:{}};vm.runInNewContext(helper,env,{timeout:1000});const f=env.window.EF2PdfFileName;
 assert.equal(f('Geovane'),'EvolufisicoGeovane.pdf');
 assert.equal(f('João da Silva'),'EvolufisicoJoaoDaSilva.pdf');
 assert.equal(f('  ANA MARIA / SOUZA  '),'EvolufisicoAnaMariaSouza.pdf');
 assert.equal(f(''),'Evolufisico.pdf');assert.equal(f('!!!'),'Evolufisico.pdf');
 for(const n of ['../../private','Cláudia <script>','José\\Silva'])assert.match(f(n),/^Evolufisico[A-Za-z0-9]*\.pdf$/);
});
check('Scripts and styles load early and offline',()=>{
 assert.ok(html.includes('65-pdf-filenames.js'));assert.ok(html.indexOf('65-pdf-filenames.js')<html.indexOf('05-app-runtime.js'));
 for(const x of ['65-pdf-filenames.js','65-evaluations-action.css'])assert.ok(sw.includes(x)&&html.includes(x));
 assert.ok(sw.includes('evolufisico-desktop-1-0-8-pdf-names-new-evaluation'));
});
check('New evaluation action moved into Avaliações, absent from sidebar',()=>{
 for(const s of ["const form=$('tab-btn-form'),history=$('tab-historico')","toolbar.id='ef-history-new-evaluation'","history.prepend(toolbar)","toolbar.append(form)","if(form)form.hidden=active?.id!=='tab-historico'"])assert.ok(nav.includes(s),s);
 assert.ok(!nav.includes('actions.prepend(form)'));assert.ok(css.includes('#ef-history-new-evaluation #tab-btn-form[hidden]'));
});
check('Assessment and comparison preserve PDF names, preview cancellation',()=>{
 for(const x of ['document.title = window.EF2PdfBaseName(aval.nome);','document.title = window.EF2PdfBaseName(a2.nome || a1.nome);','setTimeout(cleanupIndPrint, 120000);','setTimeout(cleanupCmpPrint, 120000);',"cancel.addEventListener('click', fechar)"])assert.ok(app.includes(x),x);
});
check('Lab, anamnesis, analysis and finance all use same rule',()=>{
 assert.ok(read(root+'assets/js/20-lab.js').includes('document.title=window.EF2PdfBaseName('));
 assert.ok(read(root+'assets/js/32-forms-clean.js').includes('const file=window.EF2PdfFileName(c.name);'));
 assert.ok(read(root+'assets/js/42-analysis-reports.js').includes('window.EF2PdfBaseName(profile.name)'));
 const finance=read(root+'assets/js/50-billing-monthly.js');assert.ok(finance.includes('const alunoPdf=nomes.length===1?nomes[0]'));assert.ok(finance.includes('window.EF2PdfBaseName(alunoPdf)'));
});
check('Native version 1.0.8 and encrypted storage +20% effects preserved',()=>{
 const iss=read('installer/EvoluFisico.iss'),native=read('src/EvoluFisico.Desktop/MainWindow.xaml.cs');
 assert.match(iss,/#define MyAppVersion "1\.0\.8"/);assert.match(iss,/AppId=\{\{C89493D0-1C8B-4717-A6C8-42F45B3FBD0B\}/);
 assert.ok(native.includes('CurrentVersion = "1.0.8"'));assert.ok(nav.includes("version:'1.0.8'"));
 assert.ok(read(root+'assets/css/60-desktop-effects-120.css').includes('--efx-blur:19.2px'));
 assert.ok(read(root+'assets/js/24-billing.js').includes('EF_NATIVE_BILLING_KEY'));
});
console.log('TOTAL',count,'checks passed');