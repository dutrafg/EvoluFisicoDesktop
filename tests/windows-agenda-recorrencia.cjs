'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/assets/js/06-dashboard.js','utf8');
const a=src.indexOf('/* Recorrências são eventos independentes,');
const b=src.indexOf('window.ef90ExportAttendance=function(){',a);
assert.ok(a>=0&&b>a,'Helpers não encontrados');
function pd(s){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null}
function toISO(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function addDays(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n)}
function fd(d){return d?d.toLocaleDateString('pt-BR'):'—'}
function intervalo(a){const p=String(a.time||'09:00').split(':');const st=Number(p[0])*60+Number(p[1]);return {start:st,end:st+Number(a.duration||60)}}
function conflitante(list,date,time,duration,exclude){const n=intervalo({time,duration});return list.some(e=>e.id!==exclude&&e.date===date&&e.status!=='cancelado'&&n.start<intervalo(e).end&&intervalo(e).start<n.end)}
const functions=new Function('pd','toISO','addDays','fd','intervalo','conflitante',src.slice(a,b)+'\nreturn {planRecurringAppointments,attendanceSummary,csvCell,attendanceCsv};')(pd,toISO,addDays,fd,intervalo,conflitante);
let checks=0;function check(label,fn){fn();checks++;console.log('PASS',label)}
const template={date:'2026-10-21',time:'10:00',duration:60,student:'Cliente Teste',status:'agendado',type:'avaliacao'};
check('Recorrência semanal com IDs exclusivos',()=>{
 const series=functions.planRecurringAppointments([],template,12,null);
 assert.equal(series.length,12);assert.equal(new Set(series.map(x=>x.id)).size,12);
 assert.equal(series[1].date,'2026-10-28');assert.equal(series[11].date,'2027-01-06');
});
check('Conflito posterior impede toda a série',()=>{
 const existing=[{id:'busy',date:'2026-11-04',time:'10:30',duration:45,status:'confirmado'}],original=JSON.stringify(existing);
 assert.throws(()=>functions.planRecurringAppointments(existing,template,4,null),/Conflito de horário/);
 assert.equal(JSON.stringify(existing),original);
});
check('Cancelamentos liberam o horário',()=>{
 assert.equal(functions.planRecurringAppointments([{id:'c',date:template.date,time:'10:00',duration:60,status:'cancelado'}],template,1,null).length,1);
});
check('Reagendar preserva ID e avaliação anterior',()=>{
 const saved=[{id:'eval-x',date:template.date,time:'10:00',duration:60}];
 const next=functions.planRecurringAppointments(saved,{...template,date:'2026-10-28'},1,'eval-x');
 assert.equal(next[0].id,'eval-x');assert.equal(saved[0].date,template.date);
});
check('Rejeita duração atravessando a meia-noite',()=>{
 assert.throws(()=>functions.planRecurringAppointments([],{...template,time:'23:30',duration:60},1,null),/inválidos/);
});
check('Limita número de repetições',()=>{
 for(const count of [0,3,13,1000])assert.throws(()=>functions.planRecurringAppointments([],template,count,null),/recorrência válida/);
});
check('Taxa de presença contabiliza apenas concluídos e faltas',()=>{
 const rows=['concluido','concluido','faltou','cancelado','confirmado'].map(status=>({date:'2026-10-10',status}));
 assert.deepEqual(functions.attendanceSummary(rows,2026,9),{done:2,missed:1,cancelled:1,planned:5,reviewed:3,rate:67});
});
check('Sem atendimentos encerrados não inventa porcentagem',()=>{
 assert.equal(functions.attendanceSummary([{date:'2026-10-10',status:'agendado'}],2026,9).rate,null);
});
check('CSV evita execução de fórmulas em planilhas',()=>{
 const row={...template,date:'2026-10-20',student:'=HYPERLINK("https://invalid","x")',local:'@attack',note:'+SUM(1,2)'};
 const csv=functions.attendanceCsv([row],2026,9);
 assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes("'=HYPERLINK"));
 assert.ok(csv.includes("'@attack"));assert.ok(csv.includes("'+SUM(1,2)"));
 assert.equal(csv.split('\r\n').length,2);
});
check('CSV não inclui outro mês',()=>{
 const rows=[{...template,date:'2026-10-10',student:'Outubro'},{...template,date:'2026-09-10',student:'Setembro'}];
 const csv=functions.attendanceCsv(rows,2026,9);assert.ok(csv.includes('Outubro'));assert.ok(!csv.includes('Setembro'));
});
check('Os controles existem na agenda real',()=>{
 for(const key of ['ef90-repeat-weeks','ef90DuplicateAgenda','ef90ExportAttendance','ef90SaveAgenda(event)','presenca.rate'])assert.ok(src.includes(key),key);
});
console.log('TOTAL',checks,'testes aprovados');