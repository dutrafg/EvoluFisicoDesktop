'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/assets/js/05-app-runtime.js','utf8');
const billing=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/assets/js/24-billing.js','utf8');
const migration=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/assets/js/31-indexeddb-snapshot.js','utf8');
const expectations=[
 ['legacy evaluations database',/const DB_NAME = 'EvoluFisicoDB'/],
 ['legacy evaluations store',/const STORE_NAME = 'avaliacoes'/],
 ['legacy evaluation persistence',/async function salvarAvaliacaoNoDB/],
 ['legacy evaluation deletion',/async function deletarAvaliacaoDoDB/],
 ['legacy evaluation loading',/async function carregarAvaliacoesDoDB/],
 ['legacy master password metadata',/EF_SECURITY_META_KEY = 'evolufisico_security_meta_v1'/],
 ['legacy password key derivation',/iterations: 250000/],
 ['legacy master password reset',/executarResetarRemoverSenha/],
 ['legacy encrypted envelopes',/__efEncrypted/],
 ['legacy IndexedDB atomic replacement',/_idbSubstituirTudo\(linhas\)/],
 ['legacy billing localStorage',/localStorage\.setItem\(DB_KEY,raw\)/],
 ['legacy billing encryption',/EF_Security\.encryptObject|security\.encryptObject/],
 ['new SQLite copy does not delete legacy',/originalsPreserved:true/],
 ['new SQLite copy rejects changed record',/Cópia existente diferente/]
];
for(const [label,pattern] of expectations){assert.match(label.startsWith('legacy billing')?billing:label.startsWith('new SQLite')?migration:app,pattern,label);console.log('PASS '+label)}
console.log('Legacy compatibility contracts verified. These are not functional migration tests.');
