'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../src/EvoluFisico.Desktop/wwwroot');
const core=require(path.join(root,'assets/js/68-unified-students-core.js'));
const shared=[
 {id:'eval-a1',cliente_id:'student-001',nome:'Ana Silva',email:'ana@example.test',sexo:'F',idade:30,altura:165,peso:70,data_avaliacao:'2026-01-01',objetivos:['condicionamento'],dobras_resultado:{percGordura:30,massaMagra:49},perimetria:{cintura:82}},
 {id:'eval-a2',cliente_id:'student-001',nome:'Ana Silva',email:'ana@example.test',sexo:'F',idade:31,altura:165,peso:68,data_avaliacao:'2026-02-01',objetivos:['condicionamento','força'],dobras_resultado:{percGordura:28,massaMagra:49},perimetria:{cintura:79},anamnese:{status:'presente'}},
 {id:'eval-b1',cliente_id:'student-002',nome:'Ana Silva',email:'ana2@example.test',sexo:'F',idade:27,altura:170,peso:75,data_avaliacao:'2026-01-15',dobras_resultado:{percGordura:32,massaMagra:51},perimetria:{cintura:88}},
 {id:'eval-c1',cliente_id:'student-003',nome:'Bruno Lima',peso:90,data_avaliacao:'2026-01-12'}
];
const profiles=core.build(shared);
assert.equal(profiles.length,3,'same-name students remain separate by persistent identity');
const ana=profiles.find(p=>p.key==='student-001');
assert.equal(ana.history.length,2,'records with the same persistent ID are grouped');
assert.equal(ana.latest.id,'eval-a2','latest assessment is selected');
assert.equal(ana.weight,68);
assert.equal(ana.bodyFat,28);
assert.equal(ana.waist,79);
assert.equal(ana.formsCount,1);
assert.deepEqual(ana.goals,['condicionamento','força']);
assert.equal(ana.persistentId,'student-001');
assert.deepEqual(ana.history.map(x=>x.id),['eval-a1','eval-a2'],'history is chronological');
assert.equal(profiles.find(p=>p.key==='student-002').history.length,1,'homonyms never merge');
const legacy=core.build([{id:'old-1',nome:'Sem ID',data_avaliacao:'2026-01-01'},{id:'old-2',nome:'Sem ID',data_avaliacao:'2026-02-01'}]);
assert.equal(legacy.length,2,'missing IDs never merge by name');
assert.equal(core.identityOf({id:'x',nome:'Same'}),'assessment:x');
const unpersisted=core.build([{id:'legacy-x',nome:'Mesmo nome'}]);
assert.equal(unpersisted[0].persistentId,null,'legacy assessment is not claimed as persisted SQLite ID');
assert.equal(core.number(''),null);
assert.equal(core.number('12,5'),12.5);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const ui=fs.readFileSync(path.join(root,'assets/js/68-unified-students.js'),'utf8');
const theme=fs.readFileSync(path.join(root,'assets/css/68-theme-contrast.css'),'utf8');
assert.ok(html.includes('68-unified-students-core.js')&&html.includes('68-unified-students.js'));
assert.ok(html.includes('68-theme-contrast.css')&&html.includes('69-unified-students.css'));
for(const asset of ['assets/js/68-unified-students-core.js','assets/js/68-unified-students.js','assets/css/68-theme-contrast.css','assets/css/69-unified-students.css'])assert.ok(worker.includes('./'+asset),'offline cache missing '+asset);
assert.ok(ui.includes('window.novaAvaliacaoParaAluno(profile.latest.id)'),'new evaluation uses the safe cadastral-only flow');
assert.ok(ui.includes('profiles=core.build(source());'),'profile reads the existing assessment list without mutating it');
assert.ok(ui.includes('openAnalysis(profile)'));
assert.ok(theme.includes('#tab-novo-checkin #success-screen #success-title'));
assert.ok(theme.includes('#tab-novo-checkin #success-screen #success-db-info'));
assert.ok(theme.includes('.success-message{background:var(--surface-color,#fff)!important}'));
assert.ok(ui.includes('if(label!==undefined)n.textContent=label;'),'dynamic profile labels are written as text, not HTML');
assert.equal((ui.match(/innerHTML/g)||[]).length,1,'only the static, non-user template uses innerHTML');
console.log('PASS unified profile identity, homonym separation, chronological history, latest metrics, form presence, contextual assessment, offline assets, theme regression.');
