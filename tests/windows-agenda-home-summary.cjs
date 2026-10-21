'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const root='src/EvoluFisico.Desktop/wwwroot/';
const js=fs.readFileSync(root+'assets/js/06-dashboard.js','utf8');
const css=fs.readFileSync(root+'assets/css/31-desktop-refinement.css','utf8');
const forms=fs.readFileSync(root+'assets/css/32-forms-clean.css','utf8');
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS',name)}
check('Dashboard JavaScript parses',()=>assert.doesNotThrow(()=>new Function(js)));
const start=js.indexOf('function agendaStats('),end=js.indexOf('function recheckInterval()',start);
assert.ok(start>=0&&end>start,'agendaStats should remain independently testable');
const pd=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null};
const toISO=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const startOfWeek=d=>addDays(d,-(d.getDay()+6)%7);
const agendaStats=new Function('startOfWeek','addDays','toISO','pd',js.slice(start,end)+'\nreturn agendaStats;')(startOfWeek,addDays,toISO,pd);
const base=new Date(2026,9,21);
const rows=[
 {date:'2026-10-21',status:'agendado'},
 {date:'2026-10-21',status:'cancelado'},
 {date:'2026-10-20',status:'concluido'},
 {date:'2026-10-19',status:'confirmado'},
 {date:'2026-10-25',status:'agendado'},
 {date:'2026-10-26',status:'agendado'},
 {date:'2026-10-18',status:'agendado'}
];
check('Summary uses Monday-Sunday and excludes cancelled appointments',()=>{
 assert.deepEqual(agendaStats(rows,base),{today:1,week:4,pending:3});
});
check('Summary handles an empty agenda',()=>assert.deepEqual(agendaStats([],base),{today:0,week:0,pending:0}));
check('End-of-year week uses date arithmetic, not ISO strings',()=>{
 assert.deepEqual(agendaStats([{date:'2027-01-01',status:'agendado'}],new Date(2026,11,31)),{today:0,week:1,pending:0});
});
check('Overdue returns are counted across all students, not just next 14 days',()=>{
 assert.ok(js.includes("var atr=retornos.filter(function(r){return r.status==='atrasado'}).length;"));
 assert.ok(js.includes('buildReturnEvents(al,base)'));
});
check('Agenda has three prominent badges and separate attendance rate',()=>{
 const tag=js.slice(js.indexOf("'<div class=\"ef90-simple-stats efw-agenda-summary\""));
 assert.equal((tag.split('efw-agenda-stat').length-1)>=3,true);
 assert.ok(tag.includes('compromisso(s) hoje')&&tag.includes('na semana')&&tag.includes('retorno(s) atrasado(s)'));
 assert.ok(js.includes('efw-agenda-presenca')&&js.includes('presenca.rate'));
});
check('Agenda input, edit and save hooks are unchanged',()=>{
 for(const token of ['ef90SaveAgenda(event)','ef90CancelEdit()','ef90-save-button','ef90-repeat-weeks','ef90-location'])assert.ok(js.includes(token),token);
});
check('Save/cancel actions no longer take three grid columns',()=>{
 assert.match(css,/\.ef90-form > #ef90-save-button,[\s\S]*?grid-column:auto;/);
 assert.ok(css.includes('max-width:170px')&&css.includes('min-height:42px'));
 assert.ok(js.includes('ef90-cancel-edit'));
});
check('Agenda badges adapt to tablet and smartphone breakpoints',()=>{
 assert.match(css,/@media screen and \(max-width:740px\)/);
 assert.match(css,/@media screen and \(max-width:480px\)/);
 assert.ok(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
});
check('Forms content takes full desktop width',()=>{
 assert.ok(forms.includes('#tab-ef-forms .ef2f-shell{width:100%;max-width:none;margin:0;'));
 assert.ok(!forms.includes('max-width:1210px'));
 assert.ok(forms.includes('grid-template-columns:1fr'));
});
console.log('TOTAL',passed,'desktop home/form regression checks passed');
