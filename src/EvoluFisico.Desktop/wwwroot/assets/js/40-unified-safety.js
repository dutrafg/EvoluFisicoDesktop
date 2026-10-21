
/* Camada de validação conservadora para análises: NUNCA escreve avaliações e não substitui julgamento profissional. */
(()=>{
 'use strict';
 const S=window.__EF63_STATE__;
 const LIMITS={peso:[20,350],gordura:[3,65],massaMagra:[10,250],cintura:[40,200]};
 const THRESHOLDS={peso:1,gordura:1,massaMagra:1,cintura:2};
 const cache=new Map();let cacheVersion=null;
 const value=(v,lim)=>{
  if(v===null||v===undefined||typeof v==='boolean'||String(v).trim()==='')return null;
  const n=typeof v==='string'?Number(v.replace(',','.')):Number(v);
  return Number.isFinite(n)&&n>=lim[0]&&n<=lim[1]?n:null;
 };
 const has=(v)=>v!==null&&v!==undefined&&v!=='';
 function dateKey(v){
  if(typeof v!=='string'||!/^(\d{4})-(\d\d)-(\d\d)$/.test(v))return null;
  const [y,m,d]=v.split('-').map(Number),dt=new Date(Date.UTC(y,m-1,d));
  return dt.getUTCFullYear()===y&&dt.getUTCMonth()+1===m&&dt.getUTCDate()===d?v:null;
 }
 function fatSource(r){
  if(has(r?.dobras_resultado?.percGordura))return 'Pollock';
  if(has(r?.bioimpedancia?.pgordura))return 'BIA';
  return null;
 }
 function rawMetric(r,k){
  const d=r?.dobras_resultado||{},b=r?.bioimpedancia||{},p=r?.perimetria||{};
  return ({peso:r?.peso,gordura:has(d.percGordura)?d.percGordura:b.pgordura,
   massaMagra:d.massaMagra,cintura:has(p.cintura)?p.cintura:r?.cintura})[k];
 }
 function audit(profile,decision,lab){
  const version=String(S?.version??0),key=String(profile?.key??'');
  if(cacheVersion!==version){cache.clear();cacheVersion=version}
  const ids=new Set((profile?.timeline||[]).map(x=>String(x.id)));
  const all=typeof S?.getAvaliacoes==='function'?S.getAvaliacoes():[];
  const records=all.filter(x=>ids.has(String(x.id))).map(x=>({record:x,date:dateKey(x.data_avaliacao),metrics:Object.fromEntries(Object.keys(LIMITS).map(k=>[k,value(rawMetric(x,k),LIMITS[k])])),method:fatSource(x)}));
  const fingerprint=JSON.stringify(records.map(x=>[x.record.id,x.record.data_avaliacao,x.record.peso,x.record.dobras_resultado,x.record.bioimpedancia,x.record.perimetria]));
  const cacheKey=key+'|'+fingerprint+'|'+String(decision?.confidence)+'|'+String(lab?.adjustment);
  if(cache.has(cacheKey))return cache.get(cacheKey);
  const warnings=[];
  const add=(code,text)=>{if(!warnings.some(x=>x.code===code))warnings.push({code,text})};
  const valid=records.filter(x=>x.date).sort((a,b)=>a.date.localeCompare(b.date));
  const uniqueDates=[...new Set(valid.map(x=>x.date))];
  const days=uniqueDates.length>1?(Date.parse(uniqueDates.at(-1))-Date.parse(uniqueDates[0]))/86400000:0;
  if(!records.length)add('no-records','Não foram localizados registros completos vinculados ao aluno.');
  if(valid.length!==records.length)add('invalid-date','Uma ou mais avaliações têm data ausente ou inválida; excluídas das conclusões temporais.');
  if(uniqueDates.length!==valid.length)add('same-day','Há avaliações na mesma data: contadas apenas uma vez para suficiência temporal.');
  for(const k of Object.keys(LIMITS)){
   if(records.some(x=>has(rawMetric(x.record,k))&&x.metrics[k]===null))add('invalid-'+k,'Existe valor de '+({peso:'peso',gordura:'gordura',massaMagra:'massa magra',cintura:'cintura'}[k])+' ausente, zerado ou fora de uma faixa plausível. Revise o registro antes de interpretar.');
  }
  if(uniqueDates.length<3)add('few-dates','É obrigatório selecionar no mínimo três avaliações em datas distintas para liberar índices de qualidade, trajetória e padrões.');
  if(days<21)add('short-span','Intervalo total inferior a 21 dias; tendência temporal ainda não é interpretável com segurança.');
  const latest=valid.at(-1)||null,previous=valid.length>1?valid.at(-2):null;
  const between=latest&&previous?(Date.parse(latest.date)-Date.parse(previous.date))/86400000:0;
  if(latest&&previous&&between<7)add('short-interval','As duas últimas avaliações estão separadas por menos de sete dias; mudanças podem refletir variação de medição.');
  const methods=[...new Set(valid.map(x=>x.method).filter(Boolean))];
  if(methods.length>1)add('methods','O percentual de gordura alternou entre métodos de medição; diferenças de método não são tratadas como evolução.');
  if(records.some(x=>Number(x.record.idade)>0&&Number(x.record.idade)<18&&x.record.dobras_resultado?.percGordura!=null))add('minor-pollock','Equações de composição corporal para adultos não são aplicáveis a menores sem protocolo específico validado.');
  if(lab?.latest?.delta!=null&&lab.latest.delta>=8)add('lab-divergence','Pollock e BIA divergem 8 pontos percentuais ou mais; conferir protocolo, hidratação e instrumentos.');
  // Garantia: números não equivalem a confiança clínica ou probabilidade de acerto.
  const enoughDates=uniqueDates.length>=3&&days>=21;
  const canCompare=!!latest&&!!previous&&between>=7;
  const canTrend=enoughDates&&between>=7&&!warnings.some(x=>x.code.startsWith('invalid-')||x.code==='invalid-date'||x.code==='same-day'||x.code==='minor-pollock');
  const baseline=decision?.confidence==null?null:Number(decision.confidence),rawConfidence=baseline!==null&&Number.isFinite(baseline)?Math.min(100,Math.max(0,baseline+(lab?.adjustment||0))):null;
  let confidence=null,quality='Dados insuficientes';
  if(uniqueDates.length>=3&&days>=21){
   const cap=canTrend?(uniqueDates.length>=5&&days>=90?85:65):40;
   confidence=rawConfidence===null?null:Math.max(0,Math.min(100,Math.min(Math.round(baseline),cap)+(lab?.adjustment||0)));
   quality=canTrend?(uniqueDates.length>=5&&days>=90?'Série mais consistente':'Série preliminar'):'Série muito limitada';
  }
  if(between<7&&latest&&previous&&confidence!==null)confidence=Math.min(confidence,40);
  if(methods.length>1&&confidence!==null)confidence=Math.min(confidence,45);
  if(warnings.some(x=>x.code==='minor-pollock')&&confidence!==null)confidence=Math.min(confidence,35);
  if(lab?.latest?.delta>=8&&confidence!==null)confidence=Math.min(confidence,40);
  const cleanDelta={};
  for(const k of Object.keys(LIMITS)){
   let val=null;
   if(canCompare&&latest.metrics[k]!=null&&previous.metrics[k]!=null&&!(k==='gordura'&&latest.method!==previous.method)){
    val=+(latest.metrics[k]-previous.metrics[k]).toFixed(2);
   }
   cleanDelta[k]=val;
  }
  const allowEvent=ev=>{
   if(!ev||typeof ev!=='object')return false;
   const type=ev.type||'',metric=ev.metric;
   if(['baseline','gap'].includes(type))return true;
   if(['consistency','plateau','oscillation','reversal'].includes(type))return canTrend&&uniqueDates.length>=4&&days>=60;
   if(['improvement','change','recomposition','composition'].includes(type)){
    if(!canCompare)return false;
    if(type==='recomposition'||type==='composition')return canTrend&&methods.length<=1;
    const delta=cleanDelta[metric];
    return delta!==null&&Math.abs(delta)>=THRESHOLDS[metric]&&(metric!=='gordura'||methods.length<=1);
   }
   return canTrend&&confidence!==null&&confidence>=40;
  };
  const rawEvents=[...(profile?.events||[]),...(decision?.correlations||[])];
  const events=[];const seen=new Set();
  for(const e of rawEvents){
   if(!allowEvent(e))continue;
   const eventKey=[e.type||'',e.metric||'',e.title||'',e.text||''].join('|');
   if(seen.has(eventKey))continue;seen.add(eventKey);events.push(e);
  }
  const actions=canTrend&&confidence!==null&&confidence>=40?
   (decision?.actions||[]).filter(x=>x.priority!=='positive'||confidence>=60).slice(0,4):[];
  if(!actions.length)actions.push({priority:'info',text:canCompare?'Repetir as medições com método e protocolo consistentes antes de interpretar padrões.':'Registrar avaliações adicionais em datas distintas e conferir a qualidade das medidas.'});
  const result={key,quality,confidence,rawConfidence,days,dates:uniqueDates.length,records:records.length,canCompare,canTrend,delta:cleanDelta,events,actions,warnings,
    fingerprint,comparability:methods.length>1?'Medições de gordura por métodos diferentes':'Método de gordura sem alternância detectada',
    disclaimer:'Indicadores exploratórios; percentuais não representam probabilidade clínica de acerto. Não constituem diagnóstico ou prescrição.'};
  cache.set(cacheKey,result);if(cache.size>30)cache.delete(cache.keys().next().value);
  return result;
 }
 window.EFUnifiedSafety=Object.freeze({audit,dateKey,value});
})();

