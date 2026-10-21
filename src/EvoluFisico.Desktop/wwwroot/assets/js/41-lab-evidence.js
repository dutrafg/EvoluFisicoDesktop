/* Integração de evidências do Laboratório de Avaliação: somente registros persistidos; cache por revisão/aluno. */
(()=>{
 'use strict';
 const S=window.__EF63_STATE__;
 let cacheVersion=null;
 const cache=new Map();
 const n=(value,min,max)=>{
  if(value==null||String(value).trim()==='')return null;
  const v=Number(String(value).replace(',','.'));
  return Number.isFinite(v)&&v>=min&&v<=max?v:null;
 };
 const round=v=>Math.round(v*10)/10;
 function get(profile){
  const selectedIds=(profile?.timeline||[]).map(r=>String(r.id)).sort();
  const id=String(profile?.key??'')+'|'+selectedIds.join('|'),version=String(S?.version??0);
  if(cacheVersion!==version){cache.clear();cacheVersion=version}
  if(cache.has(id))return cache.get(id);
  // IDs de avaliações do perfil impedem vazamento por homônimos ou escolha de outros alunos no Lab.
  const ids=new Set((profile?.timeline||[]).map(x=>String(x.id)));
  const records=(S?.getAvaliacoes?.()||[]).filter(r=>ids.has(String(r.id)));
  const C=window.EF77?.calc||{};
  const readings=[];
  for(const r of records){
   const p=r.perimetria||{},b=r.bioimpedancia||{},d=r.dobras_resultado||{};
   const peso=n(r.peso,20,400),altura=n(r.altura,100,230),cintura=n(p.cintura??r.cintura,40,200),quadril=n(p.quadril??r.quadril,50,200),pescoco=n(p.pescoco,20,70);
   const pollock=n(d.percGordura,2,60),bia=n(b.pgordura,2,60);
   const sexo=r.sexo==='F'?'F':r.sexo==='M'?'M':null;
   const navy=sexo&&altura!=null&&pescoco!=null&&cintura!=null&&typeof C.navy==='function'?C.navy(sexo,altura,pescoco,cintura,quadril):null;
   const rfm=sexo&&altura!=null&&cintura!=null&&typeof C.rfm==='function'?C.rfm(sexo,altura,cintura):null;
   const whtr=altura!=null&&cintura!=null&&typeof C.whtr==='function'?C.whtr(altura,cintura):null;
   const ffmi=altura!=null&&peso!=null&&(bia!=null||pollock!=null)&&typeof C.ffmi==='function'?C.ffmi(altura,peso,bia??pollock):null;
   const delta=pollock!=null&&bia!=null?round(Math.abs(pollock-bia)):null;
   readings.push({id:String(r.id),data:r.data_avaliacao||'',pollock,bia,delta,navy:navy!=null&&Number.isFinite(navy)?round(navy):null,rfm:rfm!=null&&Number.isFinite(rfm)?round(rfm):null,whtr:whtr!=null&&Number.isFinite(whtr)?Math.round(whtr*100)/100:null,ffmi:ffmi?.ffmi!=null&&Number.isFinite(ffmi.ffmi)?round(ffmi.ffmi):null,validFields:[peso,altura,cintura,quadril,pescoco].filter(v=>v!=null).length});
  }
  const paired=readings.filter(r=>r.delta!=null).sort((a,b)=>String(a.data).localeCompare(String(b.data)));
  const latest=readings.slice().sort((a,b)=>String(b.data).localeCompare(String(a.data)))[0]||null;
  // A concordância de dois métodos sem padrão-ouro NÃO valida a acurácia.
  // Comparações repetidas não aumentam confiança; divergências geram ressalvas.
  let adjustment=0,reason='As estimativas derivadas do laboratório não contam como medições independentes.';
  const validPairs=paired.filter(r=>window.EFUnifiedSafety?.dateKey(r.data));
  const independentDates=new Set(validPairs.map(r=>r.data));
  const hasLongitudinalPair=independentDates.size>=2;
  if(hasLongitudinalPair){
    const latestPair=validPairs.at(-1),consistent=validPairs.every(r=>r.delta<=4);
    if(consistent&&latestPair.validFields>=4){adjustment=4;reason='Duas ou mais datas distintas com Pollock e BIA registrados e diferença de até 4 p.p.: pequeno acréscimo na SUFICIÊNCIA documental, não na precisão clínica.';}
  }
  if(paired.length){
    const recent=paired.at(-1);
    if(recent.delta>=8){adjustment=-15;reason='Divergência ≥8 p.p. entre Pollock e BIA: suficiência reduzida; conferir procedimentos, hidratação e consistência antes de comparar.';}
    else if(recent.delta>4){adjustment=Math.min(adjustment,0);reason='Diferença entre Pollock e BIA superior a 4 p.p.; não interpretar como concordância validada.';}
    else if(!adjustment)reason='Pollock e BIA apresentam valores próximos, mas faltam séries independentes comparáveis para ajustar a suficiência documental.';
  }
  const result={latest,paired:paired.length,readings,adjustment,independentDates:independentDates.size,reason,source:'Registros salvos do aluno; calculadoras do laboratório geram apenas estimativas derivadas.'};
  cache.set(id,result);return result;
 }
 function confidence(profile,decision){const lab=get(profile),base=decision?.confidence==null?null:Number(decision.confidence);return base!==null&&Number.isFinite(base)?{base,adjusted:Math.min(100,Math.max(0,Math.round(base+lab.adjustment))),...lab}:{base:null,adjusted:null,...lab}}
 window.EFUnifiedLab=Object.freeze({get,confidence});
})();
