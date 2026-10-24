'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../src/EvoluFisico.Desktop');
const fixture=require(path.join(root,'wwwroot/assets/efia/efi-demo-students.json'));
const EFIALocal=require(path.join(root,'wwwroot/assets/efia/efia-local.js'));
const records=fixture.records;
assert.equal(fixture.version,1);
assert.equal(fixture.students,4);
assert.equal(fixture.assessmentsPerStudent,4);
assert.equal(fixture.intervalDays,30);
assert.equal(records.length,16);
const groups=new Map();
const ids=new Set();
for(const r of records){
 assert.ok(r.id.startsWith('efi-demo-')&&!ids.has(r.id),'unique synthetic ID');ids.add(r.id);
 assert.ok(r.nome.includes('DEMONSTRAÇÃO'),'clear fictional label');
 assert.ok(r.observacoes.includes('FICTÍCIOS'),'synthetic record warning');
 assert.ok(r.cliente_id.startsWith('efi-demo-client-'),'synthetic permanent identity');
 assert.ok(typeof r.peso==='number' && r.peso>=20 && r.peso<=350,'weight domain');
 assert.ok(typeof r.perimetria.cintura==='number','waist circumference');
 assert.ok(typeof r.dobras_resultado.percGordura==='number','fat estimate');
 const expectedLean=r.peso*(1-r.dobras_resultado.percGordura/100);
 assert.ok(Math.abs(expectedLean-r.dobras_resultado.massaMagra)<0.02,'mass arithmetic');
 if(!groups.has(r.cliente_id))groups.set(r.cliente_id,[]);
 groups.get(r.cliente_id).push(r);
}
assert.equal(groups.size,4);
for(const [identity,history] of groups){
 assert.equal(history.length,4,'four evaluations per '+identity);
 history.sort((a,b)=>a.data_avaliacao.localeCompare(b.data_avaliacao));
 for(let i=1;i<4;i++){
  const days=(Date.parse(history[i].data_avaliacao)-Date.parse(history[i-1].data_avaliacao))/86400000;
  assert.equal(days,30,'exact interval '+identity+' '+i);
 }
 const normalized=history.map(r=>({
  id:r.id,cliente_id:r.cliente_id,date:r.data_avaliacao,peso:r.peso,
  cintura:r.perimetria.cintura,gordura:r.dobras_resultado.percGordura,
  massaMagra:r.dobras_resultado.massaMagra,method:'pollock',
  protocol:r.efia_protocol,context:r.efia_context
 }));
 const output=EFIALocal.analyze(normalized);
 assert.equal(output.eligible,true,'EFIA eligibility for '+identity+': '+output.summary);
 assert.equal(output.engines.EF80.issues.length,0,'consistent body composition for '+identity);
 assert.ok(Number.isFinite(output.engines.EF79.results.peso.change),'verified weight delta for '+identity);
 assert.ok(Number.isFinite(output.engines.EF79.results.gordura.change),'verified fat delta for '+identity);
 console.log('PASS fixture',identity,history[0].nome,'EFIA changes:',output.engines.EF79.results.peso.change,output.engines.EF79.results.gordura.change);
}
const cs=fs.readFileSync(path.join(root,'EfiDemoSeed.cs'),'utf8');
const app=fs.readFileSync(path.join(root,'MainWindow.xaml.cs'),'utf8');
const props=fs.readFileSync(path.join(root,'EfiAppPaths.cs'),'utf8');
assert.ok(cs.includes('if (!EfiAppPaths.IsAlpha) return 0'),'cannot seed production Windows');
assert.ok(cs.includes('store.ImportBatch(batch)'),'atomic import through native encrypted store');
assert.ok(cs.includes('known.Contains(MarkerId)'),'only one initial seed');
assert.ok(cs.includes('!known.Contains(key)'),'preserve previously edited assessment');
assert.ok(props.includes('EvoluFisicoDesktopEFIAlpha'),'separate from stable Desktop data');
assert.ok(app.includes('EfiDemoSeed.Ensure()'),'seeding happens before frontend navigation');
const installer=fs.readFileSync(path.resolve(__dirname,'../installer/EvoluFisico-EFI-Alpha.iss'),'utf8');
assert.ok(installer.includes('1.0.14.0'),'alpha bumped beyond stable Desktop 1.0.12');
assert.ok(installer.includes('52CBAC3A-3D68-4A93-B0D2-0432BA821C35'),'alpha installer identity preserved');
const html=fs.readFileSync(path.join(root,'wwwroot/index.html'),'utf8');
for(const asset of ['67-home-card-layout.js','67-home-card-layout.css'])assert.ok(html.includes(asset),'latest stable Home update included');
console.log('PASS 16 fake assessments, four comparable 30-day series, EFIA calculations, protected Alpha seeding, Desktop 1.0.12 sync.');
