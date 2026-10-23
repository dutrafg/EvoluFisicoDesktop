'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const root='src/EvoluFisico.Desktop/wwwroot/';
const read=p=>fs.readFileSync(p,'utf8');
const html=read(root+'index.html'),sw=read(root+'sw.js'),ui=read(root+'assets/js/26-simple-interface.js');
let passed=0;const check=(title,fn)=>{fn();passed++;console.log('PASS',title)};
const js={50:'billing-monthly',51:'organization',52:'home-dashboard',54:'professional-profile',55:'visual-effects',56:'global-search',57:'global-search-controls',58:'shortcuts',59:'mobile-navigation'};
const css={50:'billing-monthly',51:'organization',52:'home-dashboard',54:'professional-profile',55:'visual-effects',56:'global-search',57:'visual-polish',58:'decision-center',59:'mobile-navigation',60:'desktop-effects-120'};
check('All stable EvoluFisico2 1.0.8 modules are loaded and offline',()=>{
 for(const [n,name] of Object.entries(js)){const asset='./assets/js/'+n+'-'+name+'.js';assert.ok(html.includes(asset),'HTML '+asset);assert.ok(sw.includes(asset),'cache '+asset);assert.doesNotThrow(()=>new Function(read(root+'assets/js/'+n+'-'+name+'.js')),asset)}
 for(const [n,name] of Object.entries(css)){const asset='./assets/css/'+n+'-'+name+'.css';assert.ok(html.includes(asset),'HTML '+asset);assert.ok(sw.includes(asset),'cache '+asset)}
 assert.ok(sw.includes('evolufisico-desktop-1-0-8-pdf-names-new-evaluation'));
});
check('Desktop navigation includes Organisation, Home starts without redundant version text',()=>{
 assert.ok(ui.includes("'tab-organizacao':['tab-btn-organizacao','Organização']"));
 assert.ok(ui.includes("'tab-painel','tab-organizacao','tab-historico'"));
 assert.ok(ui.includes("active?.id==='tab-painel'?'':"));
 assert.ok(!ui.includes("version.textContent='1.0 estável'"));
});
check('Organisation and Home provide agenda, notes, tasks, goals and genuine shortcuts',()=>{
 const org=read(root+'assets/js/51-organization.js'),home=read(root+'assets/js/52-home-dashboard.js'),links=read(root+'assets/js/58-shortcuts.js');
 for(const part of ['EFOrganisation={go,calendarItems','tab-organizacao','data-eforg-tab="notes"','data-eforg-tab="tasks"','data-eforg-tab="goals"'])assert.ok(org.includes(part),part);
 assert.ok(home.includes('window.EFHomeDashboard={refresh:render,inspect:state'));
 assert.ok(links.includes('data-efh-go],[data-efh-module],[data-efh-action]'));
});
check('Search is accessible from header by button, Ctrl+K and slash',()=>{
 const search=read(root+'assets/js/56-global-search.js'),control=read(root+'assets/js/57-global-search-controls.js');
 for(const k of ['window.EFGlobalSearch={open,close,rebuild','e.ctrlKey||e.metaKey','efg-overlay','efg-input','Escape','tab-organizacao'])assert.ok(search.includes(k),k);
 assert.ok(control.includes('efg-header-search'));
 assert.ok(control.includes('ef-workspace-heading'));
});
check('Desktop professional setup and billing month panel are mounted',()=>{
 for(const s of ['id="efprof-form"','id="ef-fin-panel"','id="ef-fin-paid-table"','id="ef-fin-pending-table"','id="ef-fin-pdf-month"','id="ef-fin-pdf-total"'])assert.ok(html.includes(s),s);
 const finance=read(root+'assets/js/50-billing-monthly.js');
 assert.ok(finance.includes('window.EFCobranca.exportData()'));
 assert.ok(finance.includes('ef-fin-pdf-preview'));
 assert.ok(finance.includes("dialog.addEventListener('cancel'"));
 assert.ok(!finance.includes("window.open('','_blank')"));
});
check('Actual monthly billing totals split by payment and due dates without deleting records',()=>{
 const code=read(root+'assets/js/50-billing-monthly.js');
 const window={},document={readyState:'loading',addEventListener(){}};
 const context={window,document,Date,Number,String,JSON,Math,Intl,Set,Map,console};
 vm.runInNewContext(code,context,{timeout:2500});
 const u=window.EFBillingMonthly.utils;
 const items=[
  {id:1,status:'pago',valorTotal:150,recebidoEm:'2026-10-31',vencimento:'2026-09-05'},
  {id:2,status:'pago',valorTotal:80,recebidoEm:'2026-11-01',vencimento:'2026-10-22'},
  {id:3,status:'pendente',valorTotal:100,vencimento:'2026-10-29'},
  {id:4,status:'pendente',valorTotal:40,vencimento:'2026-11-02'}
 ];
 const oct=u.summary(items,'2026-10'),nov=u.summary(items,'2026-11');
 assert.equal(oct.paidTotal,150);assert.equal(oct.pendingTotal,100);
 assert.equal(nov.paidTotal,80);assert.equal(nov.pendingTotal,40);
 assert.equal(items.length,4,'monthly close cannot delete old entries');
 assert.equal(u.totals(items).paidTotal,230);
});
check('Desktop Advanced visual intensity is exactly 1.2x over the web baseline',()=>{
 const effects=read(root+'assets/css/60-desktop-effects-120.css');
 const extract=(v)=>Number(effects.match(new RegExp('--'+v+':(-?[0-9.]+)px'))?.[1]);
 assert.equal(extract('efx-blur')/16,1.2);
 assert.equal(extract('efx-shift')/-3,1.2);
 assert.ok(effects.includes('0 14.4px 33.6px'));
 assert.ok(effects.includes('translate3d(0,-4.8px,8.4px) rotateX(.576deg)'));
 assert.ok(effects.includes('prefers-reduced-motion:reduce'));
 assert.ok(effects.includes('data-efx-visual="essential"'));
 assert.ok(effects.includes('@media print'));
});
check('All modules still use native storage and stable 1.0.8 Windows version',()=>{
 const native=read('src/EvoluFisico.Desktop/MainWindow.xaml.cs'),bill=read(root+'assets/js/24-billing.js');
 const installer=read('installer/EvoluFisico.iss');
 assert.ok(bill.includes('EF_NATIVE_BILLING_KEY'));
 assert.ok(bill.includes('window.EFNativeStorage'));
 assert.ok(native.includes('CurrentVersion = "1.0.8"'));
 assert.ok(installer.includes('#define MyAppVersion "1.0.8"'));
 assert.match(installer,/AppId=\{\{C89493D0-1C8B-4717-A6C8-42F45B3FBD0B\}/);
});
console.log('TOTAL',passed,'EvoluFisico Desktop 1.0.8 checks passed');