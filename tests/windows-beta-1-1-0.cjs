'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const base='src/EvoluFisico.Desktop/wwwroot/';
const read=p=>fs.readFileSync(base+p,'utf8');
(async()=>{
 const scripts=['67-home-card-layout.js','68-data-persistence.js','69-student-hub.js','70-ef220-desktop.js','71-assessment-wizard.js','72-desktop-navigation.js','73-mini-apps.js'];
 const html=read('index.html'),cache=read('sw.js');
 for(const p of scripts){const name='./assets/js/'+p;assert.ok(html.includes(name),'HTML bundle '+name);assert.ok(cache.includes(name),'offline '+name);new Function(read('assets/js/'+p));}
 assert.ok(html.includes('./assets/css/74-desktop-unified-beta.css'));assert.ok(cache.includes('74-desktop-unified-beta.css'));
 assert.ok(html.indexOf('71-assessment-wizard.js')<html.indexOf('05-app-runtime.js'),'wizard modifies form BEFORE original wizard initializes');
 const wizard=read('assets/js/71-assessment-wizard.js');
 for(const s of ['steps.length!==5','steps[0].insertAdjacentElement','pane.dataset.step','6 • 17%','window.irParaEtapa','initialize();'])assert.ok(wizard.includes(s),s);
 assert.ok(read('assets/js/67-home-card-layout.js').includes('function autoArrange()'),'auto organize is no longer a size-only reset');
 assert.ok(read('assets/js/67-home-card-layout.js').includes('elementsFromPoint'),'drag target resolves even with pointer capture');
 assert.ok(!read('assets/js/55-visual-effects.js').includes('<span class="efx-prebeta-tag">1.0.4 estável</span>'));
 assert.ok(!read('assets/js/44-unified-analysis.js').includes('Dados para testes: 2 alunos'));
 assert.ok(read('assets/js/52-home-dashboard.js').includes('window.EFDesktopMiniApps?.mount?.()'),'refresh hooks keep mini apps');
 assert.ok(read('assets/js/51-organization.js').includes('EFDesktopData?.ready'),'organization waits for hydration refresh');
 assert.ok(!read('assets/js/69-student-hub.js').includes('indexedDB.open'),'student records are not duplicated to IndexedDB');
 const window={EFIdentity:{key:r=>r.cliente_id}};
 vm.runInNewContext(read('assets/js/70-ef220-desktop.js'),{window},{timeout:2000});
 const goals={metric:'peso',target:72,clientId:'aluno-1'};
 const records=[{cliente_id:'aluno-1',peso:79,data_avaliacao:'2026-06-01'},
 {cliente_id:'aluno-1',peso:77,data_avaliacao:'2026-07-02'},
 {cliente_id:'aluno-1',peso:75,data_avaliacao:'2026-08-05'},
 {cliente_id:'aluno-2',peso:39,data_avaliacao:'2026-08-07'}];
 let result=window.EF220Desktop.analyze(goals,records);
 assert.equal(result.status,'descritivo');assert.equal(result.current,75);assert.equal(result.delta,-4);assert.equal(result.samples,3);
 assert.equal(window.EF220Desktop.analyze(goals,records.slice(0,2)).status,'insuficiente');
 assert.equal(window.EF220Desktop.analyze(goals,records.map(r=>({...r,cliente_id:'aluno-2'}))).status,'insuficiente');
 assert.equal(window.EF220Desktop.analyze({...goals,target:NaN},records).status,'insuficiente');
 class Storage{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(String(k),String(v))}removeItem(k){this.m.delete(k)}}
 const localStorage=new Storage();localStorage.setItem('ef2_organization_v1_data','{"notes":[],"goals":[]}');
 const nativeData=new Map(),native={readJSON:async id=>nativeData.get(id)||null,writeJSON:async(id,data)=>{nativeData.set(id,JSON.parse(JSON.stringify(data)));return 'saved';}};
 const events=[],w={localStorage,EFNativeStorage:native,dispatchEvent:e=>events.push(e.type)};
 const CustomEvent=class{constructor(type,opt){this.type=type;this.detail=opt?.detail}},Event=class{constructor(type){this.type=type}};
 vm.runInNewContext(read('assets/js/68-data-persistence.js'),{Storage,localStorage,window:w,CustomEvent,Event,console},{timeout:2000});
 await w.EFDesktopData.ready;
 assert.equal(w.EFDesktopData.status().status,'migrado');
 assert.equal(nativeData.get(w.EFDesktopData.recordId).keys['ef2_organization_v1_data'],'{"notes":[],"goals":[]}');
 localStorage.setItem('ef90_tasks_v2','[{"id":"task-1","name":"Novo","done":false}]');
 await w.EFDesktopData.flush();
 assert.equal(nativeData.get(w.EFDesktopData.recordId).keys['ef90_tasks_v2'],'[{"id":"task-1","name":"Novo","done":false}]');
 assert.ok(events.includes('ef-desktop-organization-sync'));
 console.log('PASS 1.1.0-beta: 7 modules, 5-stage integration gates, sqlite mirroring, EF220 strict identity, home auto-pack, offline resources');
})().catch(e=>{console.error(e);process.exitCode=1});