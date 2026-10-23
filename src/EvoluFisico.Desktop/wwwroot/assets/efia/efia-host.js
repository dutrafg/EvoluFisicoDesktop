/* RC2.4 host integration. Uses current EF68/70/77; no copied legacy runtime or storage. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.EFIAHost=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){'use strict';
const keys=['peso','cintura','gordura','massaMagra'];
function normalize(r,h){
 const E=h.EFIALocal,A=h.EFIAAnthro,a=A.capture(r),d=r.dobras_resultado||{},b=r.bioimpedancia||{};
 const pollock=A.number(d.percGordura,3,65),bia=A.number(b.pgordura,3,65);
 const lean=A.number(d.massaMagra,10,250);
 const p={...(r.efia_protocol||{})};
 // A derived Pollock lean mass is bound to that same equation. Never substitute skeletal muscle.
 if(pollock!==null&&lean!==null&&!p.compositionRelation)p.compositionRelation='same-estimate';
 if(pollock!==null&&!p.equation)p.equation=String(d.protocolo||d.protocol||'Pollock 7');
 return {id:String(r.id),cliente_id:String(r.cliente_id),date:r.data_avaliacao,peso:a.peso,cintura:a.perimeters.cintura,gordura:pollock??bia,massaMagra:lean,method:pollock!==null?'pollock':bia!==null?'bia':null,protocol:p,context:{...(r.efia_context||{}),adherenceTraining:typeof r.aderencia_treino==='string'?r.aderencia_treino.slice(0,100):null,adherenceDiet:typeof r.aderencia_dieta==='string'?r.aderencia_dieta.slice(0,100):null}};
}
function analyze(args){try{return run(args)}catch(e){return {ok:false,eligible:false,reason:'Falha na leitura ou nos motores. Confira o histórico antes de interpretar.',error:String(e.message)}}}
function run({host:h,profileKey,selectedIds}){
 const fail=reason=>({ok:false,eligible:false,reason});
 if(!h?.__EF63_STATE__?.getAvaliacoes||!h.EF68?.analyzeRecords||!h.EF70?.analyzeRecords||!h.EFUnifiedLab?.confidence||!h.EFUnifiedSafety?.audit||!h.EFIALocal?.analyze)return fail('Motores ou armazenamento indisponíveis.');
 const ids=Array.isArray(selectedIds)?selectedIds.map(String):[],key=String(profileKey||'');
 if(!key||ids.length<3||ids.length>4||new Set(ids).size!==ids.length)return fail('Selecione três ou quatro avaliações diferentes do mesmo aluno.');
 const all=h.__EF63_STATE__.getAvaliacoes(),wanted=new Set(ids),raw=all.filter(r=>r&&wanted.has(String(r.id)));
 if(raw.length!==ids.length||raw.some(r=>!r.cliente_id||String(r.cliente_id)!==key||h.EFIdentity.key(structuredClone(r))!==key||['aluno_id','client_id'].some(k=>r[k]!=null&&String(r[k])!==key)))return fail('Identificação ambígua, duplicada ou avaliações de alunos diferentes.');
 const snapshot=structuredClone(raw).sort((a,b)=>String(a.data_avaliacao).localeCompare(String(b.data_avaliacao))),normalized=snapshot.map(r=>normalize(r,h)),local=h.EFIALocal.analyze(normalized);
 if(!local.eligible)return {ok:true,...local,reason:local.summary,original:null,recordsRaw:snapshot};
 // Strict numeric parsing happens before original engines receive private copies.
 const cleaned=snapshot.map((r,i)=>{const n=normalized[i],v=local.records.find(x=>x.id===n.id);return {...r,peso:v.metrics.peso,perimetria:{...r.perimetria,cintura:v.metrics.cintura},dobras_resultado:{...r.dobras_resultado,percGordura:n.method==='pollock'?v.metrics.gordura:null,massaMagra:v.metrics.massaMagra},bioimpedancia:{...r.bioimpedancia,pgordura:n.method==='bia'?v.metrics.gordura:h.EFIAAnthro.number(r.bioimpedancia?.pgordura,3,65)}}});
 const history=h.EF68.analyzeRecords(key,structuredClone(cleaned)),decision=h.EF70.analyzeRecords(key,structuredClone(cleaned));
 const lab=h.EFUnifiedLab.confidence(structuredClone(history),structuredClone(decision)),safety=h.EFUnifiedSafety.audit(structuredClone(history),structuredClone(decision),structuredClone(lab));
 if(!history||!decision||!lab||typeof safety?.canTrend!=='boolean')return fail('Auditoria integrada incompleta.');
 const eligible=local.eligible&&safety.canTrend===true;
 const coherent=!local.engines.EF80.issues.length;
 const comparable=keys.every(k=>h.EFIALocal.comparable(local.records,k));
 const findings=eligible&&coherent&&comparable?(safety.events||[]):[],actions=eligible&&coherent&&comparable?(safety.actions||[]):[];
 if(!coherent||!comparable){for(const k of ['gordura','massaMagra']){local.engines.EF79.results[k].change=null;local.engines.EF79.results[k].detectable=null;local.engines.EF82.metrics[k]={status:'insuficiente',reason:'Comparabilidade ou coerência não confirmada.'}}local.engines.EF80.relations=[]}
 const engines={...local.engines,EF68:{engine:'EF68',executed:true,findings},EF70:{engine:'EF70',executed:true,actions},EF77:{engine:'EF77',executed:true,lab}};
 if(!eligible){engines.EF80.relations=[];for(const v of Object.values(engines.EF79.results)){v.change=null;v.detectable=null}for(const k of keys)engines.EF82.metrics[k]={status:'insuficiente',reason:'Auditoria integrada bloqueada.'}}
 return {...local,ok:true,eligible,engines,recordsRaw:snapshot,original:{history,decision,lab,safety},warnings:[...new Set([...local.warnings,...local.engines.EF78.issues,...local.engines.EF80.issues,...(safety.warnings||[]).map(w=>w.text)])],reason:eligible?'': 'A auditoria integrada bloqueou conclusões. Confira as datas, os intervalos e os valores registrados.',summary:eligible?local.summary:'Análise bloqueada pela auditoria integrada.'};
}
return Object.freeze({normalize,analyze});
});
