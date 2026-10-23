/* EF-IA | Composição corporal e antropometria: leitura estrita, sem imputação nem alterações na origem. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.EFIAAnthro=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){'use strict';
const defs=Object.freeze({
 perimeters:Object.freeze([['pescoco','Pescoço'],['ombros','Ombros'],['torax','Tórax'],['abdomen','Abdômen'],['cintura','Cintura'],['quadril','Quadril'],['braco_dir','Braço direito'],['braco_esq','Braço esquerdo'],['coxa_dir','Coxa direita'],['coxa_esq','Coxa esquerda'],['panturrilha','Panturrilha']]),
 folds:Object.freeze([['triceps','Tríceps'],['subescapular','Subescapular'],['suprailiaca','Supra-ilíaca'],['peitoral','Peitoral'],['axilar','Axilar média'],['abdominal','Abdominal'],['coxa','Coxa']])
});
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const number=(v,lo,hi)=>{if(v==null||typeof v==='boolean'||typeof v==='object'||(typeof v==='string'&&!v.trim()))return null;const n=typeof v==='number'?v:Number(String(v).trim().replace(',','.'));return Number.isFinite(n)&&n>=lo&&n<=hi?n:null};
const first=(o,keys,lo,hi)=>{for(const k of keys){const x=number(o[k],lo,hi);if(x!==null)return x}return null};
function capture(input){const r=obj(input),n=obj(r.antropometria||r.anthropometry),p=obj(r.perimetria||n.perimetria||r.perimeters),d=obj(r.dobras||n.dobras||r.skinfolds),b=obj(r.bioimpedancia||n.bioimpedancia||r.bia),dr=obj(r.dobras_resultado||n.dobras_resultado),met=obj(r.metabolicos||n.metabolicos),lab=obj(r.lab),m=obj(r.metrics);
 const h0=first({...lab,altura:lab.altura??r.altura??n.altura},['altura'],1.3,250);const altura=h0!==null?(h0<3?h0*100:h0):null;
 const peso=first({...m,peso:m.peso??r.peso},['peso'],20,350);
 const perimeters={},folds={};for(const [k] of defs.perimeters){perimeters[k]=first(p,k==='pescoco'?['pescoco','pescoço']:k==='torax'?['torax','tórax']:k==='abdomen'?['abdomen','abdômen']:[k],1,260)}
 for(const [k] of defs.folds){folds[k]=first(d,k==='triceps'?['triceps','tricipital']:k==='suprailiaca'?['suprailiaca','supra_iliaca']:k==='axilar'?['axilar','axilar_media']:[k],0.1,95)}
 const sumStored=first(dr,['soma','soma_dobras'],1,700);const sumCalculated=Object.values(folds).every(v=>v!==null)?Object.values(folds).reduce((a,b)=>a+b,0):null;
 const biaMuscle=first(b,['mme','massa_muscular_esqueletica'],3,250),tmb=first(b,['tmb','metabolismo_basal'],400,6000)??first(met,['tmb'],400,6000),visceral=first(b,['visceral','gordura_visceral'],0,100);
 const water=first(b,['agua_corporal_total','agua_total','agua_kg','agua_corporal','tbw'],1,250),waterPct=first(b,['agua_percentual','percentual_agua','pagua'],1,90),bone=first(b,['massa_ossea','massa_óssea','massa_mineral_ossea'],0.1,20);
 const tdee=first(met,['gasto_energetico_total','get','tdee'],400,12000)??first(r,['gasto_energetico_total','get','tdee'],400,12000);
 const fatPct=first({...m,gordura:m.gordura??r.gordura??b.pgordura??dr.percGordura},['gordura'],2,65);
 const reportedFatMass=first(b,['gordura_kg','massa_gorda'],0,300),fatMass=reportedFatMass??(peso!==null&&fatPct!==null?peso*fatPct/100:null);
 const musclePct=first(b,['pmusculo'],0,100),bodyAge=first(b,['idade_corporal'],1,120),rcq=first(b,['rcq'],0.1,3);
 return {musclePct,bodyAge,rcq,altura,peso,imc:altura!==null&&peso!==null?peso/((altura/100)**2):null,perimeters,folds,sumFolds:sumStored??sumCalculated,sumFoldsSource:sumStored!==null?'registrado':sumCalculated!==null?'soma calculada de 7 dobras':null,pollock: first(dr,['percGordura'],2,65),muscle:biaMuscle,tmb,visceral,water,waterPct,bone,tdee,fatPct,fatMass,fatMassSource:reportedFatMass!==null?'BIA registrada':fatMass!==null?'estimada a partir de peso e % gordura':null};
}
return Object.freeze({capture,number,perimeters:defs.perimeters,folds:defs.folds});
});