'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto').webcrypto;

const identityCode=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/assets/js/04-data-integrity.js','utf8');
const runtime=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/assets/js/05-app-runtime.js','utf8');
const profile=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/assets/js/68-unified-students.js','utf8');
const document={addEventListener(){}};
const window={avaliacoes:[],addEventListener(){}};
vm.runInNewContext(identityCode,{window,document,crypto});

const records=[
 {id:'legacy-1',nome:'Ana Silva',email:'familia@example.test'},
 {id:'legacy-2',nome:'Ana Silva',email:'familia@example.test'},
 {id:'known-1',nome:'Bruno Lima',email:'familia@example.test',cliente_id:'client-known'}
];
window.avaliacoes=records;
assert.equal(window.EFIdentity.key(records[0]),'assessment:legacy-1');
assert.equal(records[0].cliente_id,undefined,'reading legacy identity must not mutate records');
assert.equal(window.EFIdentity.resolve('Ana Silva'),'unresolved:Ana Silva','homonyms are not resolved by name');
const fresh=window.EFIdentity.ensure({id:'new-1',nome:'Bruno Lima',email:'familia@example.test'},records);
assert.notEqual(fresh,'client-known','shared contact must never silently link two students');
assert.equal(records[0].cliente_id,undefined,'key and resolve calls do not assign a legacy identity');
const explicit=window.EFIdentity.ensure({id:'new-2',cliente_id:'client-known'},records);
assert.equal(explicit,'client-known','explicit profile selection remains stable');
assert.equal(records[2].cliente_id,'client-known');

const marker=runtime.indexOf('window.efMigrateLegacyAssessmentIdentity = async function');
assert.ok(marker>=0,'explicit legacy migration is exposed to the profile');
const migration=runtime.slice(marker,runtime.indexOf('async function deletarAvaliacaoDoDB',marker));
assert.ok(migration.indexOf('await efNativeEvalStore().backup()')<migration.indexOf('await salvarAvaliacaoNoDB('),'backup is required before the identity write');
assert.ok(migration.includes("if (backupResult !== 'saved')"),'canceled backup blocks migration');
assert.ok(profile.includes('window.efMigrateLegacyAssessmentIdentity(profile.latest.id,target)'),'profile links only after professional confirmation');
assert.ok(profile.includes("if(!profile.persistentId){window.alert("),'new evaluation is gated until legacy identity is confirmed');
console.log('PASS non-mutating identity reads, homonym/contact separation, explicit linking and mandatory backup.');
