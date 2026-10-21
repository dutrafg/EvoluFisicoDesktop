'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const root='src/EvoluFisico.Desktop/wwwroot/';
const js=fs.readFileSync(root+'assets/js/26-simple-interface.js','utf8');
const home=fs.readFileSync(root+'assets/js/06-dashboard.js','utf8');
const p=fs.readFileSync(root+'assets/js/34-pre-cadastro.js','utf8');
const palette=fs.readFileSync(root+'assets/css/30-sidebar-palette.css','utf8');
const layout=fs.readFileSync(root+'assets/css/31-desktop-refinement.css','utf8');
const base=fs.readFileSync(root+'assets/css/23-simple-interface.css','utf8');
const html=fs.readFileSync(root+'index.html','utf8');
let n=0;function check(name,fn){fn();console.log('PASS',name);n++}
check('All changed JavaScript modules parse',()=>[js,home,p].forEach(x=>assert.doesNotThrow(()=>new Function(x))));
check('Palette contains original five and five stronger shades',()=>{
 const start=js.indexOf('const COLORS='),end=js.indexOf(';',start);
 const COLORS=new Function(js.slice(start,end+1)+'return COLORS;')();
 assert.equal(Object.keys(COLORS).length,10);
 for(const k of ['verde','azul','roxo','laranja','rosa']) {
  assert.ok(COLORS[k]);assert.ok(COLORS[k+'-escuro']);
  assert.match(COLORS[k+'-escuro'][0],/^#[0-9a-f]{6}$/i);
 }
 assert.ok(js.includes('ef90_paleta'));
 assert.ok(js.includes("'--ef-selected-text'"));
 assert.match(base,/color:var\(--ef-selected-text,#0c241d\)!important/);
});
check('Light theme desktop sidebar uses dark surface and text contrast',()=>{
 assert.match(palette,/min-width: 1200px/);
 assert.match(palette,/var\(--ef-selected-dark[^\n]*75%, #13251d/);
 assert.match(palette,/--ef-ink: #f5faf7/);
 assert.match(palette,/--ef-muted: #d1e3d9/);
 assert.match(palette,/html\.ef-dark-mode/);
});
check('Automated and detailed analysis are movable outside collapsed details',()=>{
 assert.match(js,/card=document\.createElement\('section'\)/);
 assert.match(js,/card\.innerHTML='<details class="ef-simple-fold ef-home-compact"/);
 assert.match(js,/card\.tagName==='DETAILS'/);
 assert.match(js,/wrapper\.append\(card\)/);
 assert.match(js,/card\.dataset\.efHomeCard=homeCard/);
 assert.match(js,/window\.ef90RefreshHomeLayout\(\)/);
 assert.match(layout,/\.ef-home-analysis-card > \.ef-home-card-tools/);
 for(const id of ['insights','detalhes'])assert.ok(home.includes("'"+id+"'"));
});
check('New registration reuses first assessment step and persists separately',()=>{
 assert.match(home,/ef91NovoCadastro\(\)\">Novo cadastro/);
 assert.match(home,/id="ef91-prereg-list"/);
 assert.match(p,/\.step\[data-step="1"\]/);
 assert.match(p,/ef-pre-registration-v1/);
 assert.match(p,/EFNativeStorage/);
 assert.ok(!p.includes('localStorage.setItem'));
 assert.ok(p.includes("ef91FinishPreCadastro"));
 assert.ok(html.includes('34-pre-cadastro.js'));
 assert.ok(fs.readFileSync(root+'sw.js','utf8').includes('34-pre-cadastro.js'));
});
check('Version is consistent in UI, native exe, installer and build metadata',()=>{
 for(const file of [
  'installer/EvoluFisico.iss',
  'scripts/build-windows.ps1',
  'src/EvoluFisico.Desktop/MainWindow.xaml',
  'src/EvoluFisico.Desktop/MainWindow.xaml.cs',
  'src/EvoluFisico.Desktop/wwwroot/assets/js/26-simple-interface.js'
 ])assert.ok(fs.readFileSync(file,'utf8').includes('9.1.1.beta.4.1'),file);
 assert.ok(html.includes('v9.1.1.beta.4.1'));
});
(async()=>{
 const stored=new Map();
 const db={
  readJSON:async key=>stored.has(key)?JSON.parse(JSON.stringify(stored.get(key))):null,
  writeJSON:async(key,val)=>{stored.set(key,JSON.parse(JSON.stringify(val)));return 'saved'}
 };
 const fields=new Map();
 for(const [id,value] of Object.entries({
  nome:'Cliente Teste',email:'teste@example.com',whatsapp:'11912345678',
  sexo:'F',idade:'34',altura:'165',data_avaliacao:'2026-10-21',
  data_proxima_avaliacao:'',checkin_semana:'Semana 1',fase:'Manutenção'
 }))fields.set(id,{id,value,checkValidity:()=>true,reportValidity:()=>{},setCustomValidity:()=>{},focus:()=>{},dispatchEvent:()=>{}});
 const first={querySelectorAll:()=>[fields.get('nome'),fields.get('email'),fields.get('whatsapp')]};
 const document={
  readyState:'loading',
  addEventListener:()=>{},
  getElementById:id=>fields.get(id)||null,
  querySelector:q=>q.includes('.step[data-step="1"]')?first:null
 };
 let nav=[],resets=0,messages=[];
 const window={
  EFNativeStorage:db,
  efToast:t=>messages.push(t),
  confirm:()=>true,
  switchTab:id=>nav.push(id),
  irParaEtapa:i=>assert.equal(i,0),
  resetFormulario:()=>{resets++;fields.get('nome').value='';fields.get('email').value='';fields.get('whatsapp').value='';}
 };
 const FakeEvent=class {constructor(type){this.type=type}};
 new Function('window','document','Event','console',p)(window,document,FakeEvent,console);
 await window.EFPreCadastro.save();
 check('Save persists a preregistration in the encrypted native storage abstraction',()=>{
  assert.equal(stored.get('ef-pre-registration-v1').length,1);
  assert.equal(stored.get('ef-pre-registration-v1')[0].values.nome,'Cliente Teste');
  assert.ok(!stored.has('ef-eval-1'));
 });
 const id=stored.get('ef-pre-registration-v1')[0].id;
 await window.EFPreCadastro.resume(id);
 check('Resume opens original first step and fills saved identification values',()=>{
  assert.equal(fields.get('nome').value,'Cliente Teste');
  assert.equal(fields.get('email').value,'teste@example.com');
  assert.equal(window.EFPreCadastro.getActiveId(),id);
  assert.ok(nav.includes('tab-novo-checkin'));assert.equal(resets,1);
 });
 fields.get('nome').value='Cliente Atualizado';
 await window.EFPreCadastro.save();
 check('Updating an existing preregistration does not duplicate records',()=>{
  assert.equal(stored.get('ef-pre-registration-v1').length,1);
  assert.equal(stored.get('ef-pre-registration-v1')[0].values.nome,'Cliente Atualizado');
 });
 await window.ef91FinishPreCadastro({nome:'Cliente Atualizado',email:'teste@example.com'});
 check('A completed assessment removes only the matching preregistration',()=>{
  assert.equal(stored.get('ef-pre-registration-v1').length,0);
  assert.equal(window.EFPreCadastro.getActiveId(),null);
 });
 check('Form actions retain validation and separate final assessment saving',()=>{
  const runtime=fs.readFileSync(root+'assets/js/05-app-runtime.js','utf8');
  assert.match(runtime,/await salvarAvaliacaoNoDB\(registro\);\s*if\(typeof window\.ef91FinishPreCadastro/);
  assert.match(p,/field\.checkValidity\(\)/);
 });
 console.log('TOTAL',n,'release validation checks passed');
})().catch(error=>{console.error(error);process.exitCode=1});
