'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const root = 'src/EvoluFisico.Desktop/wwwroot/assets/js/';
const app = fs.readFileSync(root + '05-app-runtime.js','utf8');
const billing = fs.readFileSync(root + '24-billing.js','utf8');
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('PASS',name); }
const calc = app.match(/const perimetria = \{([\s\S]*?)\};\s*const valsPeri = ([^\n]+);\s*const somaPeri = ([^\n]+);/);
assert.ok(calc,'Cálculo da perimetria deve existir');
const saved = app.slice(calc.index + calc[0].length).match(/perimetria_soma:\s*([^,\n]+),/);
assert.ok(saved);
const compute = new Function('getNum', 'const perimetria = {'+calc[1]+'};\nconst valsPeri = '+calc[2]+';\nconst somaPeri = '+calc[3]+';\nreturn '+saved[1]+';');
const getNum = values => key => {
 const raw = values[key];
 if(raw == null || raw === '')return null;
 const n = parseFloat(String(raw).replace(',','.'));
 return Number.isFinite(n) ? n : null;
};
check('Perimetria com vírgula decimal não lança erro',()=>assert.equal(compute(getNum({cintura:'80,2',quadril:'99,3'})),179.5));
check('Avaliação sem perímetros permanece válida',()=>assert.equal(compute(getNum({})),null));
check('Avaliação com arredondamento preserva número',()=>assert.equal(compute(getNum({braco_dir:'34,67'})),34.7));
check('Avaliações permanecem no SQLite nativo',()=>{
 assert.match(app,/await efNativeEvalStore\(\)\.writeJSON\(EF_NATIVE_EVAL_PREFIX\+registro\.id,registroPersistido\)/);
 assert.match(app,/const registroConfirmado = avaliacoes\.find/);
 assert.ok(app.indexOf('await salvarAvaliacaoNoDB(registro);') < app.indexOf('pastaCriada = await gravarAvaliacaoEmSubpasta(registroConfirmado);'));
 assert.match(app,/idSeguro\(registro\.id \|\| gerarIdSeguro\(\)\)/);
 assert.match(app,/confirmada no SQLite criptografado/);
});
check('Receber visível apenas nos pendentes',()=>{
 assert.match(billing,/c\.status !== 'pago' \? \x60<button/);
 assert.match(billing,/data-cob-action="receive"/);
 assert.match(billing,/acao === 'receive'\) receberCobrancaDoHistorico\(id\)/);
 assert.match(billing,/billingNativeStore\(\)\.writeJSON\(EF_NATIVE_BILLING_KEY,packet\)/);
});
const start = billing.indexOf('    function receberCobrancaDoHistorico(id) {');
const end = billing.indexOf('    function excluirCobrancaDoHistorico(id) {',start);
assert.ok(start >= 0 && end > start,'Rotina receber não encontrada');
let records=[{id:'cob_test',aluno1:{nome:'Cliente Fictício'},valorTotal:60,status:'pendente'}];
let confirmAction = null, savedCount = 0, failWrite = false, rendered = 0;
function confirmar(msg,action){assert.match(msg,/60/);confirmAction=action;}
function carregarCobrancas(){return structuredClone(records);}
async function loadBilling(){return structuredClone(records);}
async function salvarCobrancasDb(rows){if(failWrite)return false;records=structuredClone(rows);savedCount++;return true;}
function renderizarHistoricoCompleto(){rendered++;}
function notificar(){}
function formatarMoeda(n){return 'R$ '+n.toFixed(2);}
const receive = new Function('carregarCobrancas','confirmar','loadBilling','salvarCobrancasDb','renderizarHistoricoCompleto','notificar','formatarMoeda',billing.slice(start,end)+'\nreturn receberCobrancaDoHistorico;')(carregarCobrancas,confirmar,loadBilling,salvarCobrancasDb,renderizarHistoricoCompleto,notificar,formatarMoeda);
(async()=>{
 receive('cob_test');
 check('Confirmação não quita antes do clique',()=>{assert.equal(records[0].status,'pendente');assert.equal(savedCount,0);});
 await confirmAction();
 check('Recebimento persiste data e marca pago',()=>{assert.equal(records[0].status,'pago');assert.ok(Date.parse(records[0].dataRecebimento)>0);assert.equal(savedCount,1);assert.equal(rendered,1);});
 receive('cob_test');
 check('Não registra recebimento duplicado',()=>assert.equal(savedCount,1));
 records[0].status='pendente';records[0].dataRecebimento=null;
 failWrite=true;receive('cob_test');await confirmAction();
 check('Falha de escrita mantém status pendente',()=>{assert.equal(records[0].status,'pendente');assert.equal(savedCount,1);});
 console.log('TOTAL',passed,'regressões Windows aprovadas (Node, não substitui execução do .exe)');
})().catch(err=>{console.error(err);process.exitCode=1});