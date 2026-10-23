/* EvoluFisico EF-IA Local 0.5.0-rc.2 | deterministic, offline, read-only engines EF78-EF82. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.EFIALocal=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const VERSION='0.5.0-rc.2',DAY=86400000;
const RULES=Object.freeze(Object.fromEntries(Object.entries({peso:{min:20,max:350,unit:'kg'},cintura:{min:40,max:200,unit:'cm'},gordura:{min:2,max:65,unit:'p.p.'},massaMagra:{min:10,max:250,unit:'kg'}}).map(([k,v])=>[k,Object.freeze(v)])));
const numeric=v=>{if(v===null||v===undefined||(typeof v==='string'&&!v.trim())||typeof v==='boolean'||typeof v==='object')return null;const n=typeof v==='number'?v:Number(String(v).trim().replace(',','.'));return Number.isFinite(n)?n:null};
const round=(n,p=2)=>Number.isFinite(n)?Number(n.toFixed(p)):null;
const median=v=>{if(!v.length)return null;const a=[...v].sort((x,y)=>x-y);return(a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2};
const safeDate=v=>{if(typeof v!=='string'||!/^(\d{4})-(\d\d)-(\d\d)$/.test(v))return null;const t=Date.parse(v+'T12:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===v?v:null};
const sourceMethod=r=>{const s=String(r.method??r.metodo??r.fatMethod??'').trim().toLowerCase();return {'bioimpedancia':'bia','bioimpedância':'bia','pollock':'pollock','dobras':'dobras-nao-especificadas','dobras cutaneas':'dobras-nao-especificadas'}[s]||s||null};
function normalize(input){
 const warnings=[],rows=[],seen=new Set(),ids=new Set();
 const list=Array.isArray(input)?input:[];
 if(list.length>500)return {rows:[],warnings:['limite-de-registros'],blocking:true};
 // Prevent accidental cross-student analysis. Missing student IDs do not imply distinct students.
 const subjects=new Set(list.filter(r=>r&&typeof r==='object').map(r=>r.cliente_id??r.aluno_id??r.client_id).filter(v=>v!==null&&v!==undefined&&String(v).trim()!=='').map(String));
 const identityRows=list.filter(r=>r&&typeof r==='object'&&!Array.isArray(r));
 const aliases=r=>['cliente_id','aluno_id','client_id'].map(k=>r[k]).filter(v=>v!=null&&String(v).trim()!=='').map(v=>String(v).trim());
 const identified=identityRows.filter(r=>aliases(r).length).length;
 const names=new Set(identityRows.map(r=>r.nome??r.name).filter(v=>typeof v==='string'&&v.trim()).map(v=>v.trim()));
 if(identityRows.some(r=>new Set(aliases(r)).size>1)||(identified&&identified!==identityRows.length)||(!identified&&names.size>1))return {rows:[],warnings:['identidade-ambigua'],studentMix:true,blocking:true};
 if(subjects.size>1)return {rows:[],warnings:['alunos-diferentes-no-historico'],studentMix:true};
 for(const raw of list){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)){warnings.push('registro-invalido');continue}
  const date=safeDate(raw.date??raw.data_avaliacao);
  if(!date){warnings.push('data-invalida');continue}
  if(seen.has(date)){warnings.push('data-duplicada');continue}seen.add(date);
  const id=String(raw.id??date);if(ids.has(id))warnings.push('id-duplicado');ids.add(id);
  const source=raw.metrics&&typeof raw.metrics==='object'?raw.metrics:raw,m={};
  for(const [key,rule] of Object.entries(RULES)){
   const val=numeric(source[key]);m[key]=val!==null&&val>=rule.min&&val<=rule.max?val:null;
   if(val!==null&&m[key]===null)warnings.push('fora-da-faixa:'+key);
  }
  const protocol=raw.protocol&&typeof raw.protocol==='object'&&!Array.isArray(raw.protocol)?{...raw.protocol}:{};
  // A relação entre peso, % gordura e massa livre de gordura precisa ter origem explícita.
  // 'same-estimate' confirma que pertencem à mesma estimativa; 'independent' impede
  // uma falsa conclusão de inconsistência entre métodos distintos.
  if(!['same-estimate','independent'].includes(protocol.compositionRelation))delete protocol.compositionRelation;
  const context=raw.context&&typeof raw.context==='object'&&!Array.isArray(raw.context)?{...raw.context}:{};
  if(m.peso!==null&&m.massaMagra!==null&&m.massaMagra>m.peso)warnings.push('massa-maior-que-peso:'+date);
  const lab={};for(const k of ['altura','idade','quadril','pescoco','pollock','bia'])lab[k]=numeric(raw.lab?.[k]);lab.sexo=['M','F'].includes(raw.lab?.sexo)?raw.lab.sexo:null;
  rows.push({id,date,lab,day:Date.parse(date+'T12:00:00Z')/DAY,method:sourceMethod(raw),metrics:m,protocol,context});
 }
 rows.sort((a,b)=>a.day-b.day||a.id.localeCompare(b.id));
 return {rows,warnings:[...new Set(warnings)],studentMix:false,blocking:warnings.some(w=>['data-duplicada','id-duplicado','data-invalida','registro-invalido'].includes(w))};
}
function eligibleRows(rows){return rows.length>=3&&rows.at(-1).day-rows[0].day>=21&&Object.keys(RULES).some(k=>rows.filter(r=>r.metrics[k]!==null).length>=3)}
function comparable(rows,key){
 if(!['gordura','massaMagra'].includes(key))return true;
 const vals=rows.filter(r=>r.metrics[key]!==null);
 return vals.length>0&&vals.every(r=>r.method!=='bia'||!!String(r.protocol.device||'').trim())&&vals.every(r=>['bia','pollock'].includes(r.method))&&new Set(vals.map(r=>[r.method,r.protocol.device||'',r.protocol.equation||'',r.protocol.version||''].join('|'))).size===1;
}
function ef78(rows){
 const issues=[],methods=[...new Set(rows.filter(r=>r.metrics.gordura!==null).map(r=>r.method).filter(Boolean))],devices=[...new Set(rows.map(r=>String(r.protocol.device||'').trim()).filter(Boolean))];
 if(methods.length>1)issues.push('Foram utilizados métodos diferentes para estimar gordura corporal.');
 if(rows.some(r=>r.metrics.gordura!==null&&!r.method))issues.push('Há estimativa de gordura sem método identificado.');
 if(rows.some(r=>r.metrics.massaMagra!==null)&&!comparable(rows,'massaMagra'))issues.push('Massa livre de gordura sem método comparável em todas as medições disponíveis.');
 if(methods.length===1&&rows.some(r=>r.metrics.gordura!==null)&&!comparable(rows,'gordura'))issues.push('Confira equação, versão e equipamento usados para estimar gordura.');
 if(devices.length>1)issues.push('Equipamentos diferentes foram registrados; verificar comparabilidade.');
 if(rows.some(r=>r.protocol.standardized!==true))issues.push('A padronização das coletas não foi confirmada em todas as datas.');
 const missing=Object.keys(RULES).filter(k=>rows.some(r=>r.metrics[k]===null));
 if(missing.length)issues.push('Dados faltantes ou inválidos em: '+missing.join(', ')+'.');
 const f=rows.filter(r=>r.metrics.gordura!==null);
 return {engine:'EF78',eligible:eligibleRows(rows),issues,methods,devices,missing,comparableFat:f.length>=2&&f.length===rows.length&&comparable(rows,'gordura')};
}
function ef79(rows,options={}){
 const results={},conf=options.sem&&typeof options.sem==='object'?options.sem:{};
 const provenance=options.semSource&&typeof options.semSource==='object'?options.semSource:{};
 for(const key of Object.keys(RULES)){
  const vals=rows.filter(r=>r.metrics[key]!==null);
  const homogeneous=comparable(rows,key);
  // Never bridge the first/last observations by silently substituting a different baseline.
  const edgeValid=rows.length>=2&&rows[0].metrics[key]!==null&&rows.at(-1).metrics[key]!==null;
  const rawChange=eligibleRows(rows)&&vals.length>=3&&homogeneous&&edgeValid?rows.at(-1).metrics[key]-rows[0].metrics[key]:null;
  const change=rawChange===null?null:round(rawChange);
  const sem=numeric(conf[key]);const verified=typeof provenance[key]==='string'&&provenance[key].trim().length>3;
  const candidate=verified&&sem!==null&&sem>0?round(1.96*Math.sqrt(2)*sem):null;const mdc=candidate>0?candidate:null;
  results[key]={change,mdc95:mdc,detectable:rawChange===null||mdc===null?null:Math.abs(rawChange)>1.96*Math.sqrt(2)*sem,unit:RULES[key].unit,methodComparable:!!homogeneous,semSource:mdc!==null?provenance[key]:null,semValidation:mdc!==null?'Fonte informada; conferência técnica externa necessária':null};
 }
 return {engine:'EF79',results,notice:'A mudança mínima detectável requer SEM e fonte informados para o método. O software não certifica a fonte; cabe validação ao profissional.'};
}
function ef80(rows){
 const issues=[],relations=[],massBalance=[];
 for(const r of rows){
  const p=r.metrics.peso,l=r.metrics.massaMagra,f=r.metrics.gordura;
  if(p!==null&&l!==null&&l>p)issues.push('Massa livre de gordura supera o peso total em '+r.date+'.');
  // Este é um TESTE DE COERÊNCIA ARITMÉTICA, não um teste de acurácia clínica.
  // Não impomos conservação de massa entre medidas declaradas independentes.
  if(p===null||f===null||l===null||l>p)continue;
  const relation=r.protocol.compositionRelation||null;
  if(relation==='independent'){massBalance.push({date:r.date,status:'different-sources'});continue}
  const confirmed=relation==='same-estimate';
  // Em BIA com dispositivo identificado, os três campos podem vir do mesmo exame,
  // mas sem declaração explícita apenas solicitamos conferência da procedência.
  if(!confirmed&&!(r.method==='bia'&&String(r.protocol.device||'').trim()))continue;
  const expected=p*(1-f/100),difference=Math.abs(l-expected);
  // Margem conservadora de triagem para arredondamento e transcrição; não representa
  // SEM, MDC ou tolerância clínica validada. É deliberadamente maior quando a fonte
  // comum NÃO foi confirmada.
  const tolerance=confirmed?Math.max(0.5,0.01*p):Math.max(1,0.015*p);
  const inconsistent=difference>tolerance+1e-9;
  const status=!inconsistent?'consistent':confirmed?'incompatible':'review-source';
  massBalance.push({date:r.date,status,expectedKg:round(expected),recordedKg:round(l),differenceKg:round(difference),screeningToleranceKg:round(tolerance),provenance:confirmed?'declarada-mesma-estimativa':'nao-confirmada'});
  if(inconsistent){
   const prefix=confirmed?'Dados da mesma estimativa apresentam divergência de composição corporal em ':'Possível divergência entre peso, gordura e massa livre de gordura em ';
   issues.push(prefix+r.date+' (diferença de '+round(difference)+' kg). '+(confirmed?'Revisar a aferição antes de interpretar gordura ou massa livre de gordura.':'Confira se as três medidas vieram da mesma aferição; não há confirmação de erro.'));
  }
 }
 if(!issues.length&&eligibleRows(rows)){
  const a=rows[0],b=rows.at(-1),wa=a.metrics.cintura,wb=b.metrics.cintura,fa=a.metrics.gordura,fb=b.metrics.gordura;
  const fatComparable=rows.every(r=>r.metrics.gordura!==null)&&comparable(rows,'gordura');
  if(wa!==null&&wb!==null&&fa!==null&&fb!==null&&fatComparable){
   const dw=wb-wa,df=fb-fa;
   if(dw<0&&df<0)relations.push('Reduções concomitantes de cintura e gordura corporal estimada; conferir erro de medida e protocolo.');
   else if(Math.sign(dw)*Math.sign(df)===-1)relations.push('Cintura e estimativa de gordura tiveram direções diferentes; revisar métodos e contexto.');
  }
 }
 return {engine:'EF80',issues:[...new Set(issues)],massBalance,relations,independence:'Peso, percentual de gordura e massa livre de gordura derivada não são três evidências independentes.'};
}
function ef81(rows){
 const facts=[];
 for(const r of rows){const c=r.context||{};
  for(const [key,label] of [['adherenceTraining','Adesão ao treino informada'],['adherenceDiet','Adesão alimentar informada']])if(typeof c[key]==='string'&&c[key].trim())facts.push({date:r.date,kind:key,text:label+': '+c[key].slice(0,100)});
  for(const [key,label] of [['trainingStarted','Início de treino registrado'],['trainingStopped','Interrupção de treino registrada'],['dietStarted','Início de plano alimentar registrado'],['dietStopped','Interrupção de plano alimentar registrada']])if(c[key]===true)facts.push({date:r.date,kind:key,text:label});
 }
 return {engine:'EF81',facts,notice:'Contexto informado não determina causalidade. Treino ou dieta nunca iniciados não recebem penalização de aderência.'};
}
function ols(points){if(points.length<2)return null;const n=points.length,x=points.reduce((s,p)=>s+p.x,0)/n,y=points.reduce((s,p)=>s+p.y,0)/n,den=points.reduce((s,p)=>s+(p.x-x)**2,0);return den?points.reduce((s,p)=>s+(p.x-x)*(p.y-y),0)/den:null}
function ef82(rows){
 const metrics={};
 for(const key of Object.keys(RULES)){
  const valid=rows.filter(r=>r.metrics[key]!==null);
  const homogeneous=comparable(rows,key);
  if(!eligibleRows(rows)||valid.length<3||valid.at(-1).day-valid[0].day<21||!homogeneous){metrics[key]={status:'insuficiente',reason:!homogeneous?'métodos incompatíveis':'série curta ou incompleta'};continue}
  const p=valid.map(r=>({x:r.day-valid[0].day,y:r.metrics[key]}));
  const slopes=[];for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++)if(p[j].x>p[i].x)slopes.push((p[j].y-p[i].y)/(p[j].x-p[i].x));
  const robust=median(slopes),linear=ols(p),agreement=robust===null||linear===null?null:Math.abs(robust)<1e-9&&Math.abs(linear)<1e-9?true:Math.sign(robust)===Math.sign(linear);
  const n=valid.length,stable=n>=5?agreement:null;
  // Candidate outliers are statistical alerts, never automatic value corrections.
  const residuals=p.map(pt=>pt.y-(p[0].y+robust*(pt.x-p[0].x)));
  const intercept=median(residuals);
  const residualsCentered=residuals.map(v=>v-intercept),mad=median(residualsCentered.map(Math.abs));
  const scale=Math.max(1.4826*(mad||0),{peso:0.3,cintura:0.6,gordura:0.5,massaMagra:0.5}[key]);
  const outlierDates=n>=5&&valid.at(-1).day-valid[0].day>=60?valid.filter((r,i)=>Math.abs(residualsCentered[i])>3.5*scale).map(r=>r.date):[];
  metrics[key]={status:n<5?'preliminar':agreement?'concordante':'divergente',n,theilSen30:round(robust*30),linear30:round(linear*30),directionAgreement:stable,outlierDates,reason:n<5?'Poucos pontos para comparar robustez da tendência.':agreement?'Tendências com mesma direção.':'Métodos indicam direções diferentes; revisar pontos atípicos.'};
 }
 return {engine:'EF82',metrics};
}
function analyze(input,options={}){
 const normalized=normalize(input),rows=normalized.rows,days=rows.length>1?rows.at(-1).day-rows[0].day:0,eligible=!normalized.blocking&&eligibleRows(rows);
 const usable=normalized.blocking?[]:rows.map(r=>({...r,metrics:{...r.metrics,massaMagra:r.metrics.peso!==null&&r.metrics.massaMagra>r.metrics.peso?null:r.metrics.massaMagra}}));
 const engines={EF78:ef78(usable),EF79:ef79(usable,options||{}),EF80:ef80(rows),EF81:ef81(usable),EF82:ef82(usable)};
 if(!eligible)engines.EF80.relations=[];
 // Contradição confirmada na MESMA estimativa: sem saber qual campo está errado,
 // não disponibilizar comparações automáticas de % gordura nem de massa livre.
 if(engines.EF80.massBalance.some(v=>v.status==='incompatible')){
  for(const key of ['gordura','massaMagra']){
   engines.EF79.results[key].change=null;
   engines.EF79.results[key].detectable=null;
   engines.EF82.metrics[key]={status:'insuficiente',reason:'Coerência de composição corporal não confirmada na mesma estimativa.'};
  }
  engines.EF80.relations=[];
 }
 return {version:VERSION,eligible,blocking:!!normalized.blocking,studentMix:normalized.studentMix,dates:rows.length,spanDays:days,warnings:normalized.warnings,engines,summary:eligible?'Análise exploratória disponível; revisar a qualidade e os limites de cada indicador.':'São necessárias três avaliações em datas distintas ao longo de no mínimo 21 dias.',records:rows.map(r=>({...r,metrics:{...r.metrics,massaMagra:r.metrics.peso!==null&&r.metrics.massaMagra>r.metrics.peso?null:r.metrics.massaMagra}}))};
}
return Object.freeze({VERSION,RULES,analyze,normalize,ef78,ef79,ef80,ef81,ef82,comparable,numeric,safeDate});
});
