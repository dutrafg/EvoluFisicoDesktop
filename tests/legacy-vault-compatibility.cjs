'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/assets/js/05-app-runtime.js','utf8');
const billing=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/assets/js/24-billing.js','utf8');
const expectations=[
 ['SQLite evaluation namespace',/EF_NATIVE_EVAL_PREFIX = 'ef-eval-'/],
 ['SQLite evaluation storage required',/function efNativeEvalStore\(\)/],
 ['legacy evaluation persistence',/async function salvarAvaliacaoNoDB/],
 ['legacy evaluation deletion',/async function deletarAvaliacaoDoDB/],
 ['legacy evaluation loading',/async function carregarAvaliacoesDoDB/],
 ['legacy master password metadata',/EF_SECURITY_META_KEY = 'evolufisico_security_meta_v1'/],
 ['legacy password key derivation',/iterations: 250000/],
 ['legacy master password reset',/executarResetarRemoverSenha/],
 ['legacy encrypted envelopes',/__efEncrypted/],
 ['SQLite evaluation read',/storage\.readJSON\(id\)/],
 ['SQLite evaluation write',/efNativeEvalStore\(\)\.writeJSON\(/],
 ['SQLite evaluation delete',/efNativeEvalStore\(\)\.delete\(/],
 ['SQLite billing read',/billingNativeStore\(\)\.readJSON\(EF_NATIVE_BILLING_KEY\)/],
 ['SQLite billing write',/billingNativeStore\(\)\.writeJSON\(EF_NATIVE_BILLING_KEY,packet\)/],
 ['legacy billing encryption',/EF_Security\.encryptObject|security\.encryptObject/],
 ['SQLite billing primary key',/EF_NATIVE_BILLING_KEY='ef-billing-main'/],
 ['SQLite evaluation primary key',/EF_NATIVE_EVAL_PREFIX\+registro\.id/]
];
for(const [label,pattern] of expectations){assert.match(label.includes('billing')?billing:app,pattern,label);console.log('PASS '+label)}
console.log('SQLite evaluation and existing billing/security contracts verified. These are static checks.');
