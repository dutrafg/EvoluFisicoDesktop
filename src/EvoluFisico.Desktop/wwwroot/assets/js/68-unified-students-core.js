/* Pure profile aggregation. Identity is based on cliente_id / EFIdentity, never on name. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.EFUnifiedStudentsCore=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const text=v=>v==null?'':String(v).trim();
const number=v=>{
 if(v===null||v===undefined||v===''||typeof v==='boolean')return null;
 const n=typeof v==='number'?v:Number(String(v).trim().replace(',','.'));
 return Number.isFinite(n)?n:null;
};
function identityOf(record,identity){
 if(!record||typeof record!=='object')return null;
 const id=text(record.cliente_id);
 if(id)return id;
 if(identity&&typeof identity.key==='function'){
  try{const key=text(identity.key(record));if(key&&!key.startsWith('unresolved:'))return key;}catch(_){}
 }
 const assessmentId=text(record.id);
 return assessmentId?'assessment:'+assessmentId:null;
}
function nonEmpty(value){
 if(typeof value==='string')return value.trim()!=='';
 if(typeof value==='number')return Number.isFinite(value);
 if(Array.isArray(value))return value.length>0;
 if(value&&typeof value==='object')return Object.keys(value).length>0;
 return value===true;
}
function firstValue(rows,keys){
 for(const row of rows)for(const key of keys){const value=row[key];if(nonEmpty(value))return value;}
 return null;
}
function build(records,identity){
 const groups=new Map();
 (Array.isArray(records)?records:[]).forEach((record,index)=>{
  if(!record||typeof record!=='object')return;
  const explicitId=!!text(record.cliente_id);
  const key=identityOf(record,identity);if(!key)return;
  if(!groups.has(key))groups.set(key,{key,records:[]});
  groups.get(key).records.push({...record,__profileIndex:index,__profileHadPersistentId:explicitId});
 });
 return Array.from(groups.values()).map(group=>{
  const history=group.records.sort((a,b)=>{
   const byDate=text(a.data_avaliacao||a.data).localeCompare(text(b.data_avaliacao||b.data));
   return byDate||text(a.timestamp).localeCompare(text(b.timestamp))||text(a.id).localeCompare(text(b.id));
  });
  const newest=history.slice().reverse();
  const latest=newest[0]||{};
  const named=firstValue(newest,['nome'])||'Aluno sem nome';
  const dob=latest.dobras_resultado&&typeof latest.dobras_resultado==='object'?latest.dobras_resultado:{};
  const bio=latest.bioimpedancia&&typeof latest.bioimpedancia==='object'?latest.bioimpedancia:{};
  const peri=latest.perimetria&&typeof latest.perimetria==='object'?latest.perimetria:{};
  const forms=history.reduce((count,row)=>count+(['anamnese','formulario','formularios','questionario','respostas_formulario'].some(k=>nonEmpty(row[k]))?1:0),0);
  const goals=firstValue(newest,['objetivos','objetivo','objetivos_avaliacao','meta','metas']);
  return {
   key:group.key,
   persistentId:history.every(r=>r.__profileHadPersistentId===true&&text(r.cliente_id)===group.key)?group.key:null,
   name:named,
   email:firstValue(newest,['email']),
   phone:firstValue(newest,['whatsapp','telefone','celular']),
   sex:firstValue(newest,['sexo']),
   age:number(firstValue(newest,['idade'])),
   height:number(firstValue(newest,['altura'])),
   goals,
   latest,
   latestDate:text(latest.data_avaliacao||latest.data),
   weight:number(latest.peso),
   bodyFat:number(dob.percGordura??bio.pgordura),
   leanMass:number(dob.massaMagra),
   waist:number(peri.cintura),
   formsCount:forms,
   history
  };
 }).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base'})||a.key.localeCompare(b.key));
}
return Object.freeze({build,identityOf,number,nonEmpty});
});
