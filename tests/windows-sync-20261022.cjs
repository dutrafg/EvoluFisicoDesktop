'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='src/EvoluFisico.Desktop/wwwroot/';
const read=p=>fs.readFileSync(p,'utf8');
const js=read(root+'assets/js/05-app-runtime.js'),sw=read(root+'sw.js');
let count=0;
function test(name,fn){fn();console.log('PASS '+name);count++}
test('A-Z folders by client identity with latest evaluation first',()=>{
 for(const s of ['EFIdentity.key(registro)','todos.sort((x,y) => cmpAval(y,x))',
 'new Intl.Collator','collator.compare(x.nome,y.nome)','pasta.dataset.efClientId',
 'const abertos = new Set','abertos.has(grupo.chave)','ef-history-folder'])
 assert.ok(js.includes(s),s);
});
test('Responsive list/grid selection persists',()=>{
 for(const s of ['repeat(4,minmax(0,1fr))','repeat(3,minmax(0,1fr))',
 'repeat(2,minmax(0,1fr))','ef-history-view-grid','ef-history-view-list',
 'ef-history-view-v1','data-ef-history-view="list"','data-ef-history-view="grid"',
 'aria-pressed','localStorage.setItem(EF_HISTORY_VIEW_STORAGE, modo)'])
 assert.ok(js.includes(s),s);
});
test('Grouping search handles homonyms and maintains action buttons',()=>{
 const part=js.slice(js.indexOf('function renderizarHistorico('),js.indexOf('function filtrarAvaliacoes()'));
 for(const s of ['grupos.get(chave).push(registro)','normalizarBusca','maisRecente',
 'grupo.filtrados.forEach(a =>','data-ef-nova-avaliacao','novaAvaliacaoParaAluno(',
 'editarAvaliacao(','excluirAvaliacao(','imprimirAvaliacaoIndividualPDF('])
 assert.ok(part.includes(s),s);
});
test('All history engines defer to grouped renderer',()=>{
 for(const path of ['09-state-cache.js','10-history-worker.js','11-worker-pool.js']){
 const src=read(root+'assets/js/'+path);
 assert.ok(src.includes('window.EFHistoryGroups.render('),path);
 }
});
test('Esc or back cancels PDF; printing requires an affirmative click',()=>{
 const start=js.indexOf('function abrirPreviaPDFDesktop('),end=js.indexOf('function imprimirAvaliacaoIndividualPDF(',start);
 assert.ok(start>0&&end>start);
 const part=js.slice(start,end);
 for(const s of ["cancel.addEventListener('click', fechar)","dialog.addEventListener('cancel'",
 "event.preventDefault(); fechar()","save.addEventListener('click', () => { fechar(); imprimir(); })"])
 assert.ok(part.includes(s),s);
 assert.ok(!part.includes('window.print();'),'No implicit printing during preview');
 const printed=js.slice(js.indexOf('abrirPreviaPDFDesktop(wrapper, aval, () => {'));
 assert.ok(printed.includes('window.print();'));
});
test('Exercise dynamic PDF cancellation before invoking Windows spooler',()=>{
 const start=js.indexOf('function abrirPreviaPDFDesktop('),end=js.indexOf('function imprimirAvaliacaoIndividualPDF(',start);
 const snippet=js.slice(start,end);
 const nodes=[];
 const create=(tag)=>{
 const n={tag,children:[],handlers:{},dataset:{},open:false,
 append(...kids){this.children.push(...kids)},appendChild(child){this.children.push(child)},
 setAttribute(){},addEventListener(k,f){this.handlers[k]=f},
 focus(){},remove(){this.removed=true},close(){this.open=false},showModal(){this.open=true}};
 nodes.push(n);return n;
 };
 const doc={head:{appendChild(){}},body:{appendChild(){}},getElementById(){return null},createElement:create};
 const Dialog=function(){};Dialog.prototype.showModal=function(){};
 const make=new Function('document','HTMLDialogElement','window',snippet+'return abrirPreviaPDFDesktop;');
 const open=make(doc,Dialog,{confirm(){throw Error('Unexpected browser confirm')}});
 const wrap={querySelector(){return true},innerHTML:'<div class="print-page">report</div>'};
 let prints=0;
 open(wrap,{nome:'Aluno teste'},()=>prints++);
 let cancel=nodes.find(n=>n.dataset.pdfAction==='cancel');
 assert.ok(cancel);cancel.handlers.click();assert.equal(prints,0);
 const before=nodes.length;open(wrap,{nome:'Aluno teste'},()=>prints++);
 const diag=nodes.slice(before).find(n=>n.tag==='dialog');assert.ok(diag);
 const e={preventDefault(){this.prevented=true}};
 diag.handlers.cancel(e);assert.equal(e.prevented,true);assert.equal(prints,0);
 const before2=nodes.length;open(wrap,{nome:'Aluno teste'},()=>prints++);
 const print=nodes.slice(before2).find(n=>n.tag==='button'&&n.textContent==='Salvar como PDF / Imprimir');
 assert.ok(print);print.handlers.click();assert.equal(prints,1);
});
test('Cache refreshed, native data and stable installer maintained',()=>{
 assert.match(sw,/const CACHE_NAME = 'evolufisico-desktop-1-0-[^']+'/);
 assert.match(read('installer/EvoluFisico.iss'),/#define MyAppVersion "1\.0\.7"/);
 assert.ok(js.includes('EFNativeStorage'));
});
console.log('TOTAL '+count+' checks passed');