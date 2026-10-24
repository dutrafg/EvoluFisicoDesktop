/* EF220 Desktop: objetivo individual + trajetória descritiva determinística.
   Não substitui avaliação clínica; não estima causalidade, prognóstico ou diagnóstico. */
(function(){
'use strict';
const finite=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
const iso=v=>{const s=String(v||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))?s:null};
const metric=(r,k)=>{
 if(k==='peso')return finite(r.peso);
 if(k==='cintura')return finite(r.perimetria?.cintura??r.cintura);
 if(k==='gordura')return finite(r.dobras_resultado?.percGordura);
 return null;
};
function analyze(goal,history){
 const result={status:'insuficiente',message:'Histórico insuficiente para avaliar a trajetória da meta.',samples:0,spanDays:0,delta:null,current:null,target:null};
 if(!goal||!['peso','gordura','cintura'].includes(goal.metric)||!Array.isArray(history))return result;
 const target=finite(goal.target);if(target===null||target<=0||(goal.metric==='gordura'&&target>75))return {...result,message:'Informe uma meta numérica válida.'};
 const id=String(goal.clientId||'');if(!id)return result;
 const rows=history.filter(r=>r&&String(window.EFIdentity?.key?.(r)||r.cliente_id||'')===id)
  .map(r=>({date:iso(r.data_avaliacao||r.data||r.date),value:metric(r,goal.metric),method:goal.metric==='gordura'?'dobras-Pollock':'medida-direta'}))
  .filter(r=>r.date&&r.value!==null&&r.value>0&&(goal.metric!=='gordura'||r.value<=75)).sort((a,b)=>a.date.localeCompare(b.date));
 const byDate=new Map(rows.map(r=>[r.date,r]));const unique=[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
 if(unique.length<3)return {...result,samples:unique.length,message:'São necessárias três avaliações em datas distintas.'};
 const period=Math.round((Date.parse(unique.at(-1).date)-Date.parse(unique[0].date))/86400000);
 if(period<21)return {...result,samples:unique.length,spanDays:period,message:'São necessários pelo menos 21 dias entre a primeira e a última avaliação.'};
 const first=unique[0].value,current=unique.at(-1).value;
 const delta=+(current-first).toFixed(2),remaining=+(target-current).toFixed(2);
 return {status:'descritivo',message:'Comparação descritiva de medições; não constitui previsão nem prescrição.',samples:unique.length,spanDays:period,delta,current,target,remaining,baseline:first,metric:goal.metric,date:unique.at(-1).date};
}
window.EF220Desktop=Object.freeze({analyze,metric,finite});
})();