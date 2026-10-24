'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root='src/EvoluFisico.Desktop/wwwroot/';
const read=p=>fs.readFileSync(root+p,'utf8');
const code=read('assets/js/67-home-card-layout.js');
assert.doesNotThrow(()=>new Function(code),'editor must parse');
const html=read('index.html'),sw=read('sw.js'),css=read('assets/css/67-home-card-layout.css');
for(const name of ['67-home-card-layout.js','67-home-card-layout.css']){
 assert.ok(html.includes('./assets/'+(name.endsWith('.js')?'js/':'css/')+name),'HTML loads '+name);
 assert.ok(sw.includes('./assets/'+(name.endsWith('.js')?'js/':'css/')+name),'offline loads '+name);
}
for(const selector of ['efh-stat-grid','efh-strategy-kpis','efh-grid','efhc-edit-mode','efhc-card-tools','efhc-handle']){
 assert.ok(code.includes(selector)||css.includes(selector),'editor handles '+selector);
}
for(const token of ['pointerdown','pointermove','pointerup','pointercancel','touch-action:none','Auto-organizar','Restaurar layout','Concluir edição','localStorage.setItem','efhc-drop-hint']){
 assert.ok(code.includes(token)||css.includes(token),'supports '+token);
}
assert.ok(code.includes('EFHomeCardLayout?.mount?.()')===false,'editor should not depend on itself');
assert.ok(read('assets/js/52-home-dashboard.js').includes('window.EFHomeCardLayout?.mount?.()'));
assert.ok(!read('assets/js/52-home-dashboard.js').includes('EvoluFísico2 1.0.4 estável'),'obsolete footer removed');
assert.ok(!html.includes('ef-splash-version-pill')&&!html.includes('brand-version'),'no redundant version pills');
assert.ok(html.includes('<title>EvoluFísico Desktop</title>'));
assert.ok(!html.includes('assets/js/53-custom-cards.js'),'old editor remains disabled');
assert.ok(css.includes('grid-template-columns:repeat(12,minmax(0,1fr))'),'dense 12-column grid');
assert.ok(css.includes('max-width:1040px')&&css.includes('max-width:580px'),'tablet and smartphone responsive');
assert.ok(css.includes('.efhc-handle{')&&css.includes('touch-action:none'),'touch capture limited to explicit handle');
assert.ok(!css.includes('touch-action:none;*'),'does not globally disable touch');
const store=new Map([
 ['ef2_layout_inicio_organizacao_v1',JSON.stringify({homeStats:{order:['kpi-2','kpi-1','unknown'],sizes:{'kpi-1':'m'}},homeCards:{order:['insights','avisos'],sizes:{insights:'g'}}})]
]);
const document={readyState:'loading',addEventListener(){}};
const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
const window={};
vm.runInNewContext(code,{console,document,window,localStorage:storage},{timeout:2000});
const initial=window.EFHomeCardLayout.getState();
assert.equal(initial.stats.order[0],'tarefas');
assert.equal(initial.stats.order[1],'prazos');
assert.equal(initial.stats.order.length,2,'invalid legacy ids dropped');
assert.equal(initial.cards.order[0],'insights');
assert.equal(initial.cards.sizes.insights,'g');
assert.ok(initial.strategy,'strategy KPI group included');
window.EFHomeCardLayout.autoOrganize();
const saved=JSON.parse(store.get('ef_desktop_inicio_layout_v2'));
assert.equal(saved.stats.sizes.eventos,'p');
assert.equal(saved.strategy.sizes.alunos,'p');
assert.equal(saved.cards.sizes.insights,'m');
assert.deepEqual(saved.cards.order,['insights','avisos'],'auto-organize retains custom ordering');
assert.ok(!code.includes('indexedDB.open'),'layout preferences do not create another database');
console.log('PASS Desktop Home editor: assets, old badge cleanup, pointer movement, all 3 card groups, responsive layout, legacy settings and auto-organize storage');
