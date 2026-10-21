'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const root='src/EvoluFisico.Desktop/wwwroot/';
const read=path=>fs.readFileSync(path,'utf8');
const ui=read(root+'index.html'),op=read(root+'assets/js/07-opinions.js'),runtime=read(root+'assets/js/05-app-runtime.js'),incremental=read(root+'assets/js/09-state-cache.js'),sw=read(root+'sw.js');
let passed=0;function check(name,fn){fn();passed++;console.log('PASS',name)}
check('Both not-applicable options exist, without deleting original choices',()=>{
 for(const text of ['value="Nunca treinou"','value="Nunca fez dieta"','value="Não treinei"','value="Fora do plano"'])assert.ok(ui.includes(text),text);
});
const first=op.indexOf('var T='),end=op.indexOf('function lista()',first);
assert.ok(first>=0&&end>first,'scoreDe source range');
const score=new Function('num',op.slice(first,end)+'return {scoreDe,rotulo,COR};')(v=>{const n=parseFloat(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null});
check('Both plan types not started yield no numeric score',()=>{
 assert.equal(score.scoreDe({treino:'Nunca treinou',dieta:'Nunca fez dieta',energia:3}),null);
 assert.equal(score.rotulo(null),'Não avaliável');
 assert.ok(score.COR['Não avaliável']);
});
check('An unstarted plan is excluded without a negative score penalty',()=>{
 const full=score.scoreDe({treino:'100% no plano',dieta:'100% no plano',energia:3,sono:3,estresse:3});
 const noDiet=score.scoreDe({treino:'100% no plano',dieta:'Nunca fez dieta',energia:3,sono:3,estresse:3});
 const noTraining=score.scoreDe({treino:'Nunca treinou',dieta:'100% no plano',energia:3,sono:3,estresse:3});
 assert.equal(noDiet,full);assert.equal(noTraining,full);
 for(const n of [full,noDiet,noTraining])assert.ok(Number.isInteger(n)&&n>=0&&n<=100);
});
check('Calculated status and PDF never produce NaN/0 as missing adherence',()=>{
 for(const fragment of ["sc==null?'não avaliável'","status:sc==null?'Não avaliável'","if(sc!=null)h+=","x.s!=null&&x.s<70"])assert.ok(op.includes(fragment),fragment);
 assert.ok(op.includes("a.aderencia_treino!=='Nunca treinou'"));
 assert.ok(op.includes("a.aderencia_dieta!=='Nunca fez dieta'"));
});
check('Both classic and incremental history display the action once per card',()=>{
 assert.match(runtime,/data-ef-nova-avaliacao="1" onclick="novaAvaliacaoParaAluno/);
 assert.match(incremental,/data-ef-nova-avaliacao="1" onclick="novaAvaliacaoParaAluno/);
 assert.equal((runtime.match(/data-ef-nova-avaliacao="1"/g)||[]).length,1);
 assert.equal((incremental.match(/data-ef-nova-avaliacao=/g)||[]).length,1);
});
check('New evaluation reuses identification only, not photos or measurements',()=>{
 const start=runtime.indexOf('window.novaAvaliacaoParaAluno = function(id) {'),last=runtime.indexOf('            const cancelarEdicao =',start);
 assert.ok(start>=0&&last>start);
 const snippet=runtime.slice(start,last);
 assert.ok(snippet.includes('window.resetFormulario()'));
 assert.ok(snippet.includes('ef-client-identity'));
 assert.ok(snippet.includes("seletor.dataset.changed = '1'"));
 assert.ok(snippet.includes("idAtual.value = ''"));
 const inputs={};for(const key of ['nome','email','whatsapp','sexo','idade','altura','avaliador_clinica','avaliador_nome','avaliador_registro','avaliacao_id','data_avaliacao','peso','cintura','parecer_profissional','form-title-text','form-subtitle-text','tab-form-label'])inputs[key]={value:'',textContent:''};
 const picker={options:[{value:'auto'}],dataset:{},value:'auto',add(opt){this.options.push(opt)}};
 const document={getElementById:id=>id==='ef-client-identity'?picker:inputs[id]||null};
 const record={id:'aval-old-1',cliente_id:'client-true-1',nome:'Aluno Original',email:'aluno@example.com',whatsapp:'11999999999',sexo:'M',idade:34,altura:170,peso:90,perimetria:{cintura:95},parecer_profissional:'Texto antigo',data_avaliacao:'2026-01-01'};
 let called=0,resets=0;
 const window={resetFormulario(){resets++;for(const el of Object.values(inputs))el.value='';inputs['data_avaliacao'].value='2026-10-21';},EF6:{renderResumo(){called++}}};
 const handler=new Function('document','window','encontrarAvaliacaoPorId','EFIdentity','avaliacoes','Option',snippet+'return window.novaAvaliacaoParaAluno;')(document,window,id=>String(id)===record.id?record:null,{ensure(){throw Error('Existing ID should be reused')}},[record],function Option(name,value){this.text=name;this.value=value});
 assert.equal(handler(record.id),true);assert.equal(resets,1);assert.equal(called,1);
 assert.equal(inputs.nome.value,record.nome);assert.equal(inputs.email.value,record.email);
 assert.equal(inputs.altura.value,String(record.altura));assert.equal(inputs.idade.value,String(record.idade));
 assert.equal(inputs.avaliacao_id.value,'');assert.equal(inputs.data_avaliacao.value,'2026-10-21');
 assert.equal(inputs.peso.value,'');assert.equal(inputs.cintura.value,'');assert.equal(inputs.parecer_profissional.value,'');
 assert.equal(picker.value,'client-true-1');assert.equal(picker.dataset.changed,'1');
 assert.equal(record.peso,90);assert.equal(record.data_avaliacao,'2026-01-01');
});
check('Perimetry sum is already numeric, null-safe and never serialized with toFixed on null',()=>{
 assert.ok(runtime.includes("Number(valsPeri.reduce((a, b) => a + b, 0).toFixed(1)) : null;"));
 assert.match(runtime,/perimetria_soma: somaPeri,/);
 assert.doesNotMatch(runtime,/perimetria_soma:\s*somaPeri\.toFixed/);
 const fn=values=>{const valsPeri=values.filter(v=>typeof v==='number'&&v>0);const somaPeri=valsPeri.length>0?Number(valsPeri.reduce((a,b)=>a+b,0).toFixed(1)):null;return somaPeri};
 assert.equal(fn([]),null);assert.equal(fn([50.2,70.1]),120.3);assert.equal(typeof fn([50]),'number');
});
check('Version, backup and encrypted native storage remain untouched',()=>{
 assert.match(read('installer/EvoluFisico.iss'),/#define MyAppVersion "1\.0\.0"/);
 assert.match(read('installer/EvoluFisico.iss'),/AppId=\{\{C89493D0-1C8B-4717-A6C8-42F45B3FBD0B\}/);
 assert.ok(runtime.includes('EFNativeStorage'));
 assert.ok(sw.includes('evolufisico-desktop-1-0-sync-aderencia-nova-avaliacao'));
});
console.log('TOTAL',passed,'desktop synchronization regression tests passed');