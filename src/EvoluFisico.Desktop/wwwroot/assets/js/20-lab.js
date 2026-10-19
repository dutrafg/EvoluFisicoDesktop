/* 18-runtime.js */
(function(){
'use strict';
if(window.EF77&&window.EF77.mounted)return;
var VER='8.7';
var $=function(s,r){return (r||document).querySelector(s)};
function num(v){var n=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(n)?n:0}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function f1(x){return x==null||!isFinite(x)?'—':x.toFixed(1)}
function f2(x){return x==null||!isFinite(x)?'—':x.toFixed(2)}
function recs(){try{var S=window.__EF63_STATE__;var r=S&&S.getAvaliacoes&&S.getAvaliacoes();return Array.isArray(r)?r:[]}catch(e){return[]}}
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
var log10=Math.log10||function(x){return Math.log(x)/Math.LN10};

/* ---------- Limites plausíveis (valores fora são ignorados e sinalizados) ---------- */
var LIM={idade:[5,110,'Idade'],altura:[100,230,'Altura'],peso:[20,400,'Peso'],pescoco:[20,70,'Pescoço'],cintura:[40,200,'Cintura'],quadril:[50,200,'Quadril'],pollock:[2,60,'% Gord. Pollock'],bia:[2,60,'% Gord. BIA'],fcrep:[30,120,'FC repouso'],alvo:[3,50,'Meta % gordura']};

/* ---------- Cálculos puros ---------- */
var C={
  navy:function(sexo,h,pesc,cint,quad){
    if(!(h>0&&pesc>0&&cint>0))return null;var r;
    if(sexo==='F'){if(!(quad>0)||cint+quad-pesc<=0)return null;r=495/(1.29579-0.35004*log10(cint+quad-pesc)+0.221*log10(h))-450}
    else{if(cint-pesc<=0)return null;r=495/(1.0324-0.19077*log10(cint-pesc)+0.15456*log10(h))-450}
    return isFinite(r)?Math.max(2,Math.min(60,r)):null},
  rfm:function(sexo,h,cint){if(!(h>0&&cint>0))return null;return Math.max(2,Math.min(60,(sexo==='F'?76:64)-20*(h/cint)))},
  whtr:function(h,cint){return h>0&&cint>0?cint/h:null},
  bri:function(h,cint){if(!(h>0&&cint>0))return null;var a=(cint/100)/(2*Math.PI),b=0.5*(h/100);if(a>=b)return null;return 364.2-365.5*Math.sqrt(1-(a*a)/(b*b))},
  absi:function(h,peso,cint){if(!(h>0&&peso>0&&cint>0))return null;var hm=h/100,bmi=peso/(hm*hm);return(cint/100)/(Math.pow(bmi,2/3)*Math.sqrt(hm))},
  ffmi:function(h,peso,pg){if(!(h>0&&peso>0&&pg>0&&pg<100))return null;var hm=h/100,ffm=peso*(1-pg/100),v=ffm/(hm*hm);return{ffm:ffm,ffmi:v,norm:v+6.1*(1.8-hm)}},
  mifflin:function(sexo,peso,h,idade){if(!(peso>0&&h>0&&idade>0))return null;return 10*peso+6.25*h-5*idade+(sexo==='F'?-161:5)},
  harris:function(sexo,peso,h,idade){if(!(peso>0&&h>0&&idade>0))return null;return sexo==='F'?(447.593+9.247*peso+3.098*h-4.330*idade):(88.362+13.397*peso+4.799*h-5.677*idade)},
  harris1919:function(sexo,peso,h,idade){if(!(peso>0&&h>0&&idade>0))return null;return sexo==='F'?(655.0955+9.5634*peso+1.8496*h-4.6756*idade):(66.4730+13.7516*peso+5.0033*h-6.7550*idade)},
  act:function(sexo,peso,h,idade){if(!(peso>0&&h>0&&idade>0))return null;var v=sexo==='F'?(-2.097+0.1069*h+0.2466*peso):(2.447-0.09156*idade+0.1074*h+0.3362*peso);return isFinite(v)&&v>0?v:null},
  rcq:function(cint,quad){return(cint>0&&quad>0)?(cint/quad):null},
  katch:function(ffm){return ffm>0?370+21.6*ffm:null},
  fcmax:function(idade){return idade>0?208-0.7*idade:null},
  meta:function(peso,pg,alvo){if(!(peso>0&&pg>0&&alvo>0&&alvo<pg))return null;var mm=peso*(1-pg/100),pa=mm/(1-alvo/100);return{pesoAlvo:pa,delta:peso-pa,gorduraPerder:peso*pg/100-pa*alvo/100}}
};

/* ---------- Leitura de fontes ---------- */
function fromForm(){
  var g=function(id){var e=document.getElementById(id);return e?e.value:''};
  var sexo=g('sexo')==='F'?'F':'M',idade=num(g('idade')),h=num(g('altura')),peso=num(g('peso'))||num(g('bia_peso'));
  var d={};['triceps','subescapular','peitoral','axilar','suprailiaca','abdominal','coxa'].forEach(function(k){d[k]=num(g('dobra_'+k))});
  var pol=null;try{var r=window.calcularPollock7&&window.calcularPollock7(sexo,idade,peso,d);if(r)pol=num(r.percGordura)}catch(e){}
  return{sexo:sexo,idade:idade,altura:h,peso:peso,pescoco:num(g('peri_pescoco')),cintura:num(g('cintura')),quadril:num(g('quadril')),pollock:pol,bia:num(g('bia_pgordura'))||null,nome:(g('nome')||'').trim()}}
function fromRec(a){
  var p=a.perimetria||{},pol=null,sexo=a.sexo==='F'?'F':'M';
  if(a.dobras_resultado&&a.dobras_resultado.percGordura!=null)pol=num(a.dobras_resultado.percGordura);
  else{try{var r=window.calcularPollock7&&window.calcularPollock7(sexo,num(a.idade),num(a.peso),a.dobras||{});if(r)pol=num(r.percGordura)}catch(e){}}
  var b=a.bioimpedancia||{};
  return{sexo:sexo,idade:num(a.idade),altura:num(a.altura),peso:num(a.peso),pescoco:num(p.pescoco),cintura:num(p.cintura||a.cintura),quadril:num(p.quadril||a.quadril),pollock:pol||null,bia:num(b.pgordura)||null,nome:String(a.nome||'').trim(),data:a.data_avaliacao||''}}

/* ---------- Estado da UI ---------- */
var NUMF=['idade','altura','peso','pescoco','cintura','quadril','pollock','bia','fcrep','alvo'];
var FIELDS=['sexo'].concat(NUMF,['fator','obj','formula']);
var dirty=false,last=null;
function el(k){return document.getElementById('ef77-'+k)}
function setForm(o){
  ['sexo','idade','altura','peso','pescoco','cintura','quadril','pollock','bia'].forEach(function(k){
    var e=el(k);if(!e)return;var v=o[k];
    e.value=(v==null||v===0)?'':((k==='pollock'||k==='bia')&&typeof v==='number'?v.toFixed(1):v)});
  dirty=false;compute()}
function srcRecord(){var v=el('src')&&el('src').value;if(!v||v==='form')return null;return recs().filter(function(x){return String(x.id)===v})[0]||null}
function buildSrc(){
  var s=el('src');if(!s)return;var keep=s.value;
  var list=recs().slice().sort(function(a,b){return String(b.data_avaliacao||'').localeCompare(String(a.data_avaliacao||''))});
  s.innerHTML='<option value="form">Formulário atual (Nova Avaliação)</option>'+list.map(function(a){return'<option value="'+esc(a.id)+'">'+esc(a.nome||'Sem nome')+' · '+esc(a.data_avaliacao||'')+'</option>'}).join('');
  var ok=false;for(var i=0;i<s.options.length;i++)if(s.options[i].value===keep)ok=true;
  if(!ok&&keep&&keep!=='form')dirty=false;
  s.value=ok?keep:'form'}
function loadSrc(){var a=srcRecord();setForm(a?fromRec(a):fromForm());updateButtons()}
function updateButtons(){var b=el('csv1');if(b)b.disabled=!srcRecord()}

/* ---------- Gráficos ---------- */
function bar(label,val,max,col){var w=Math.max(0,Math.min(100,val/max*100));return'<div class="ef77-row"><span>'+esc(label)+'</span><b>'+f1(val)+'%</b></div><div class="ef77-bar"><i style="width:'+w+'%;background:'+col+'"></i></div>'}
function donut(pg){var r=42,c=2*Math.PI*r,g=Math.max(0,Math.min(100,pg))/100*c;
  return'<svg width="110" height="110" viewBox="0 0 110 110" role="img" aria-label="Gordura '+pg.toFixed(1)+'%, massa magra '+(100-pg).toFixed(1)+'%"><circle cx="55" cy="55" r="'+r+'" fill="none" stroke="#34c759" stroke-width="14"/><circle cx="55" cy="55" r="'+r+'" fill="none" stroke="#ff9500" stroke-width="14" stroke-dasharray="'+g.toFixed(2)+' '+(c-g).toFixed(2)+'" transform="rotate(-90 55 55)"/><text x="55" y="60" text-anchor="middle" font-size="16" font-weight="800" fill="#111">'+pg.toFixed(1)+'%</text></svg>'}

/* ---------- Leitura validada do formulário do Lab ---------- */
function readInputs(){
  var o={sexo:el('sexo').value==='F'?'F':'M',fator:num(el('fator').value)||1.55,obj:el('obj').value||'manter',formula:el('formula')?el('formula').value:'harris'},bad=[];
  NUMF.forEach(function(k){var e=el(k),v=num(e.value),L=LIM[k],inv=v>0&&(v<L[0]||v>L[1]);e.classList.toggle('bad',inv);e.setAttribute('aria-invalid',inv?'true':'false');if(inv){bad.push(L[2]+' ('+L[0]+'–'+L[1]+')');v=0}o[k]=v>0?v:0});
  o.bad=bad;return o}

/* ---------- Cálculo e renderização ---------- */
function compute(){
  var out=$('#ef77-out');if(!out)return;
  try{
    var f=readInputs(),sexo=f.sexo,idade=f.idade,h=f.altura,peso=f.peso;
    var pol=f.pollock||null,bia=f.bia||null,nav=C.navy(sexo,h,f.pescoco,f.cintura,f.quadril),rfm=C.rfm(sexo,h,f.cintura);
    var R={sexo:sexo,idade:idade,peso:peso,altura:h,pollock:pol,navy:nav,rfm:rfm,bia:bia};
    /* avisos */
    var notes=[];
    if(f.bad.length)notes.push('<div class="ef77-note err" role="alert"><b>Valores fora do intervalo plausível foram ignorados:</b> '+esc(f.bad.join('; '))+'.</div>');
    var miss=[];
    if(nav==null){var m1=[];if(!(h>0))m1.push('altura');if(!(f.pescoco>0))m1.push('pescoço');if(!(f.cintura>0))m1.push('cintura');if(sexo==='F'&&!(f.quadril>0))m1.push('quadril');if(m1.length)miss.push('US Navy (falta '+m1.join(', ')+')');else miss.push('US Navy (medidas incoerentes)')}
    if(rfm==null)miss.push('RFM (falta '+[!(h>0)?'altura':'',!(f.cintura>0)?'cintura':''].filter(Boolean).join(', ')+')');
    if(!pol&&!bia)miss.push('Pollock/BIA (informe o %)');
    if(miss.length&&(peso>0||h>0||f.cintura>0))notes.push('<div class="ef77-note" role="status"><b>Métodos indisponíveis:</b> '+esc(miss.join(' · '))+'.</div>');
    /* 1. Comparador */
    var m=[];if(pol)m.push(['Pollock 7 dobras',pol,'#007aff']);if(nav!=null)m.push(['US Navy (perímetros)',nav,'#5856d6']);if(rfm!=null)m.push(['RFM (cintura/altura)',rfm,'#af52de']);if(bia)m.push(['Bioimpedância',bia,'#32ade6']);
    var vals=m.map(function(x){return x[1]}),ref=null,c1;
    if(vals.length){
      ref=vals.reduce(function(a,b){return a+b},0)/vals.length;var amp=Math.max.apply(null,vals)-Math.min.apply(null,vals);
      c1=m.map(function(x){return bar(x[0],x[1],50,x[2])}).join('')+'<div class="ef77-row"><span>Média dos métodos</span><b>'+f1(ref)+'%</b></div>'+(vals.length>1?'<div class="ef77-row"><span>Amplitude entre métodos</span><b>'+f1(amp)+' p.p. <span class="ef77-pill '+(amp<=4?'ok':amp<=8?'warn':'bad')+'">'+(amp<=4?'consistente':amp<=8?'moderada':'alta')+'</span></b></div>':'')+
        '<div class="ef77-donut">'+donut(ref)+'<div style="font-size:.8rem;line-height:1.7"><span style="color:#ff9500">●</span> Gordura '+f1(ref)+'%<br><span style="color:#34c759">●</span> Massa magra '+f1(100-ref)+'%'+(peso>0?'<br><span style="color:#6b7280">'+f1(peso*ref/100)+' kg gordura · '+f1(peso*(1-ref/100))+' kg magra</span>':'')+'</div></div>';
      R.ref=ref;R.amp=amp;
      var ff0=C.ffmi(h,peso,ref);
      if(rfm!=null&&vals.length>1&&ff0&&ff0.norm>=22&&rfm-ref>5)c1+='<p class="sub"><b>Atenção:</b> o RFM tende a superestimar a gordura em pessoas muito musculosas; priorize dobras ou BIA.</p>';
      c1+='<p class="sub">Métodos diferem por natureza (protocolo, equação, hidratação). Use a média como referência e acompanhe sempre o mesmo método ao longo do tempo.</p>'
    }else c1='<div class="ef77-empty">Informe altura, pescoço e cintura (Navy/RFM) ou o % de dobras/BIA para comparar métodos.</div>';
    /* 2. Índices & Composição Corporal (Inspirado no Prisma 2) */
    var wh=C.whtr(h,f.cintura),bri=C.bri(h,f.cintura),absi=C.absi(h,peso,f.cintura),ff=ref!=null?C.ffmi(h,peso,ref):null,c2='';
    var rcq=C.rcq(f.cintura,f.quadril),act=C.act(sexo,peso,h,idade);
    R.whtr=wh;R.bri=bri;R.absi=absi;R.ffmi=ff;R.rcq=rcq;R.act=act;
    if(wh!=null){var cl=wh<0.5?['ok','baixo risco']:wh<0.6?['warn','risco aumentado']:['bad','risco alto'];c2+='<div class="ef77-row"><span>Cintura/Estatura (RCE)</span><b>'+f2(wh)+' <span class="ef77-pill '+cl[0]+'">'+cl[1]+'</span></b></div>'}
    if(rcq!=null){
      var rCl=sexo==='F'?(rcq<0.80?['ok','baixo risco']:rcq<=0.84?['warn','risco moderado']:['bad','risco alto']):(rcq<0.90?['ok','baixo risco']:rcq<=0.99?['warn','risco moderado']:['bad','risco alto']);
      c2+='<div class="ef77-row"><span>Cintura/Quadril (RCQ)</span><b>'+f2(rcq)+' <span class="ef77-pill '+rCl[0]+'">'+rCl[1]+'</span></b></div>';
    }
    if(act!=null){
      var pctAct=(act/peso)*100,aCl=sexo==='F'?(pctAct>=45&&pctAct<=60?['ok','normal']:pctAct<45?['warn','baixa hidratação']:['warn','elevada']):(pctAct>=50&&pctAct<=65?['ok','normal']:pctAct<50?['warn','baixa hidratação']:['warn','elevada']);
      c2+='<div class="ef77-row"><span>Água Corporal Est. (ACT Watson)</span><b>'+f1(act)+' L ('+f1(pctAct)+'%) <span class="ef77-pill '+aCl[0]+'">'+aCl[1]+'</span></b></div>';
    }
    if(bri!=null)c2+='<div class="ef77-row"><span>Índice de Arredondamento (BRI)</span><b>'+f1(bri)+'</b></div>';
    if(absi!=null)c2+='<div class="ef77-row"><span>ABSI (forma corporal)</span><b>'+absi.toFixed(4)+'</b></div>';
    if(ff){var n=ff.norm,cls=sexo==='M'?(n<18?'abaixo da média':n<20?'médio':n<22?'acima da média':n<23?'excelente':n<26?'superior':'avaliar'):null;
      c2+='<div class="ef77-row"><span>FFMI</span><b>'+f1(ff.ffmi)+'</b></div><div class="ef77-row"><span>FFMI normalizado</span><b>'+f1(n)+(cls?' <span class="ef77-pill">'+cls+'</span>':'')+'</b></div>'}
    c2=c2||'<div class="ef77-empty">Informe altura e cintura (e peso) para calcular os índices.</div>';
    c2+='<p class="sub">Índices antropométricos e hidratação inspirados no Prisma 2. Triagem funcional, não diagnóstico médico.</p>';
    /* 3. Energia — Comparador de TMB (Harris-Benedict, Mifflin e Katch) */
    var mif=C.mifflin(sexo,peso,h,idade),hb=C.harris(sexo,peso,h,idade),hb19=C.harris1919(sexo,peso,h,idade),kat=ff?C.katch(ff.ffm):null,c3='';
    R.mifflin=mif;R.harris=hb;R.harris1919=hb19;R.katch=kat;
    if(hb!=null||mif!=null){
      var arrTmbs=[];
      if(hb!=null)arrTmbs.push(hb);
      if(mif!=null)arrTmbs.push(mif);
      if(kat!=null)arrTmbs.push(kat);
      var mediaTmb=arrTmbs.length>0?(arrTmbs.reduce(function(a,b){return a+b},0)/arrTmbs.length):(hb||mif);
      R.mediaTmb=mediaTmb;

      var base=hb||mif,formulaNome='Harris-Benedict (1984)';
      if(f.formula==='mifflin'){base=mif||hb;formulaNome='Mifflin-St Jeor (1990)'}
      else if(f.formula==='katch'){base=kat||hb||mif;formulaNome=kat?'Katch-McArdle (Massa Magra)':'Harris-Benedict (Katch requer % gordura)'}
      else if(f.formula==='harris1919'){base=hb19||hb;formulaNome='Harris-Benedict (Original 1919)'}
      else if(f.formula==='media'){base=mediaTmb;formulaNome='Média das Fórmulas ('+arrTmbs.length+' equações)'}
      else{base=hb||mif;formulaNome='Harris-Benedict (Revisada 1984)'}

      var get=base*f.fator,adj={manter:0,def:-0.2,sup:0.1}[f.obj]||0,alvoK=get*(1+adj);
      R.baseTmb=base;R.formulaNome=formulaNome;R.get=get;R.kcal=alvoK;

      var difKcal=Math.round(hb-(mif||hb));
      var difStr=difKcal===0?'':(' <small style="color:#64748b;">(dif: '+(difKcal>0?'+':'')+difKcal+' kcal vs Mifflin)</small>');

      c3='<div class="ef77-row"><span>TMB Harris-Benedict (1984)</span><b>'+Math.round(hb)+' kcal'+difStr+'</b></div>'+
         '<div class="ef77-row"><span>TMB Mifflin-St Jeor (1990)</span><b>'+Math.round(mif)+' kcal</b></div>'+
         (kat?'<div class="ef77-row"><span>TMB Katch-McArdle (FFM)</span><b>'+Math.round(kat)+' kcal</b></div>':'')+
         '<div class="ef77-row" style="background:rgba(0,122,255,0.07); padding:0.35rem 0.6rem; border-radius:8px; margin:0.4rem 0;"><span>TMB Adotada ('+formulaNome+')</span><b style="color:#007aff;">'+Math.round(base)+' kcal</b></div>'+
         '<div class="ef77-row"><span>Gasto total GET (×'+f.fator+')</span><b>'+Math.round(get)+' kcal</b></div>'+
         '<div class="ef77-row"><span>Meta calórica ('+({manter:'manutenção',def:'déficit −20%',sup:'superávit +10%'}[f.obj]||'manutenção')+')</span><b style="color:#10b981;">'+Math.round(alvoK)+' kcal</b></div>'+
         '<p class="sub">Estimativas metabólicas baseadas em equações validadas (Harris-Benedict, Mifflin e Katch-McArdle). O Gasto Energético Total serve de parâmetro para planejamento de treino físico; prescrição de dieta é privativa de nutricionista.</p>';}
    else c3='<div class="ef77-empty">Informe sexo, idade, altura e peso.</div>';
    /* 4. Meta */
    var mt=ref!=null?C.meta(peso,ref,f.alvo):null,c4='';R.meta=mt;R.alvo=f.alvo;
    if(mt)c4='<div class="ef77-row"><span>Peso-alvo (mantendo massa magra)</span><b>'+f1(mt.pesoAlvo)+' kg</b></div><div class="ef77-row"><span>Variação de peso</span><b>−'+f1(mt.delta)+' kg</b></div><div class="ef77-row"><span>Gordura a reduzir</span><b>'+f1(mt.gorduraPerder)+' kg</b></div><p class="sub">Simulação: pressupõe massa magra constante, o que é otimista em déficits longos.</p>';
    else c4='<div class="ef77-empty">Informe uma meta de % de gordura menor que a atual ('+(ref!=null?f1(ref)+'%':'—')+').</div>';
    /* 5. FC */
    var fm=C.fcmax(idade),rep=f.fcrep,c5='';R.fcmax=fm;
    if(fm){var P=[[50,60,'#34c759','Recuperação'],[60,70,'#a3d900','Aeróbio base'],[70,80,'#ffcc00','Aeróbio'],[80,90,'#ff9500','Limiar'],[90,100,'#ff3b30','Máximo']];
      c5='<div class="ef77-row"><span>FC máx. estimada (Tanaka)</span><b>'+Math.round(fm)+' bpm</b></div>'+P.map(function(z){var lo=rep>0?rep+(fm-rep)*z[0]/100:fm*z[0]/100,hi=rep>0?rep+(fm-rep)*z[1]/100:fm*z[1]/100;return'<div class="ef77-zone"><span class="d" style="background:'+z[2]+'"></span><span>'+z[3]+' <small style="color:#9ca3af">'+z[0]+'–'+z[1]+'%</small></span><b>'+Math.round(lo)+'–'+Math.round(hi)+'</b></div>'}).join('')+'<p class="sub">'+(rep>0?'Método de Karvonen (reserva de FC).':'Informe a FC de repouso para usar Karvonen; mostrando % da FC máx.')+'</p>'}
    else c5='<div class="ef77-empty">Informe a idade.</div>';
    last=R;
    out.innerHTML=(notes.length?'<div class="full" style="display:grid;gap:.5rem">'+notes.join('')+'</div>':'')+'<div class="ef77-card"><h3>⚖️ Comparador de métodos</h3>'+c1+'</div><div class="ef77-card"><h3>📏 Índices de risco & FFMI</h3>'+c2+'</div><div class="ef77-card"><h3>🔥 Energia & Gasto Calórico</h3>'+c3+'</div><div class="ef77-card"><h3>🎯 Simulador de meta</h3>'+c4+'</div><div class="ef77-card"><h3>❤️ Zonas de frequência cardíaca</h3>'+c5+'</div>';
  }catch(err){
    console.warn('EF77: erro ao calcular',err);
    out.innerHTML='<div class="ef77-note err full" role="alert">Não foi possível calcular com os dados atuais. Revise os campos.</div>'}
}

/* ---------- Resumo copiável ---------- */
function summaryText(){
  var R=last;if(!R)return'';var a=srcRecord(),nome=a?(a.nome||''):(fromForm().nome||''),L=[];
  L.push('EvoluFísico · Resumo do Lab'+(nome?' — '+nome:'')+(a&&a.data_avaliacao?' ('+a.data_avaliacao+')':''));
  var met=[];if(R.pollock)met.push('Pollock '+f1(R.pollock)+'%');if(R.navy!=null)met.push('Navy '+f1(R.navy)+'%');if(R.rfm!=null)met.push('RFM '+f1(R.rfm)+'%');if(R.bia)met.push('BIA '+f1(R.bia)+'%');
  if(met.length)L.push('Gordura: '+met.join(' | ')+(R.ref!=null?' → média '+f1(R.ref)+'%':''));
  if(R.whtr!=null)L.push('Cintura/Estatura: '+f2(R.whtr));
  if(R.ffmi)L.push('FFMI: '+f1(R.ffmi.ffmi)+' (normalizado '+f1(R.ffmi.norm)+')');
  if(R.harris!=null)L.push('TMB (Harris-Benedict): '+Math.round(R.harris)+' kcal · TMB (Mifflin): '+Math.round(R.mifflin)+' kcal · Base: '+Math.round(R.baseTmb||R.harris)+' kcal ('+(R.formulaNome||'Harris-Benedict')+')'+(R.kcal?' · Meta calórica: '+Math.round(R.kcal)+' kcal':''));
  if(R.meta)L.push('Meta '+f1(R.alvo)+'% gordura → '+f1(R.meta.pesoAlvo)+' kg (−'+f1(R.meta.delta)+' kg)');
  L.push('Estimativas — não substituem avaliação profissional.');
  return L.join('\n')}
function copySummary(){
  var t=summaryText(),msg=window.efToast||function(){};
  if(!t){msg('Nada para copiar ainda.','warn');return}
  var fb=function(){try{var ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();var ok=document.execCommand('copy');ta.remove();msg(ok?'Resumo copiado.':'Não foi possível copiar.',ok?'ok':'warn')}catch(e){msg('Não foi possível copiar.','warn')}};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(function(){msg('Resumo copiado.','ok')},fb);else fb()}

/* ---------- CSV (separador ; e vírgula decimal: abre direto no Excel pt-BR) ---------- */
function csvCell(v){
  var s=String(v==null?'':v);
  if(/^-?\d+(\.\d+)?$/.test(s))return s.replace('.',',');
  if(/^[=+\-@\t\r]/.test(s))s="'"+s;
  return /[;"\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function exportCSV(onlyStudent){
  var msg=window.efToast||window.alert,list=recs();
  if(onlyStudent){var a=srcRecord();if(a){list=list.filter(function(x){return EFIdentity.same(a,x)})}}
  if(!list.length){msg('Nenhuma avaliação para exportar.','warn');return}
  list=list.slice().sort(function(a,b){return String(a.nome||'').localeCompare(String(b.nome||''))||String(a.data_avaliacao||'').localeCompare(String(b.data_avaliacao||''))});
  var head=['Nome','Data','Fase','Sexo','Idade','Altura_cm','Peso_kg','Gordura_Pollock_%','Massa_Gorda_kg','Massa_Magra_kg','Pescoco_cm','Cintura_cm','Quadril_cm','Gordura_BIA_%','Gordura_Navy_%','Gordura_RFM_%','Cintura_Estatura'];
  var rows=list.map(function(a){
    var p=a.perimetria||{},r=a.dobras_resultado||{},b=a.bioimpedancia||{},x=fromRec(a),nv=C.navy(x.sexo,x.altura,x.pescoco,x.cintura,x.quadril),rf=C.rfm(x.sexo,x.altura,x.cintura),wh=C.whtr(x.altura,x.cintura);
    return[a.nome,a.data_avaliacao,a.fase,a.sexo,a.idade,a.altura,a.peso,r.percGordura,r.massaGorda,r.massaMagra,p.pescoco,p.cintura||a.cintura,p.quadril||a.quadril,b.pgordura,nv!=null?nv.toFixed(1):'',rf!=null?rf.toFixed(1):'',wh!=null?wh.toFixed(3):''].map(csvCell).join(';')});
  var blob=new Blob(['\ufeff'+head.join(';')+'\r\n'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'});
  var u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='EvoluFisico_avaliacoes_'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},1500);
  (window.efToast||function(){})('CSV exportado ('+list.length+' avaliação'+(list.length>1?'ões':'')+').','ok')}


/* ---------- Aluno: mesma regra para CSV e PDF ---------- */
function sameStudent(a){return recs().filter(x=>EFIdentity.same(a,x))}

/* ---------- PDF do aluno (impressão do navegador → "Salvar como PDF") ---------- */
function br(v,d){if(v==null||String(v).trim()==='')return'—';var n=typeof v==='number'?v:Number(String(v).trim().replace(',','.'));return isFinite(n)?n.toFixed(d).replace('.',','):'—'}
function brDate(s){var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||''));return m?m[3]+'/'+m[2]+'/'+m[1]:String(s||'—')}
function pdfSec(t,body,cls,acc){return'<section class="lb-card '+(cls||'')+'" style="--acc:'+(acc||'#2563eb')+'"><h3 class="lb-h"><i></i>'+t+'</h3>'+body+'</section>'}
function pdfBox(t,rows,empty,cls,acc,extra){return pdfSec(t,(rows.length?'<table class="lb-kv"><tbody>'+rows.join('')+'</tbody></table>':'<div class="lb-empty">'+esc(empty||'Dados insuficientes para este bloco.')+'</div>')+(rows.length&&extra?extra:''),cls,acc)}
function pdfRow(l,v){return'<tr><td>'+esc(l)+'</td><td class="v">'+v+'</td></tr>'}
function pdfMeter(l,val,max,txt,color){var w=Math.max(3,Math.min(100,val/max*100));return'<div class="lb-meter"><span class="ml">'+esc(l)+'</span><span class="mt"><i style="width:'+w.toFixed(1)+'%;background:'+color+'"></i></span><span class="mv">'+txt+'</span></div>'}
function pdfChip(label,txt,tone){return'<span class="lb-chip '+(tone||'')+'"><small>'+esc(label)+'</small>'+esc(txt)+'</span>'}
function pdfHTML(a,list,R,F){
  var nome=String(a.nome||'Sem nome'),pro=store('evolufisico_pro_nome')||'',cref=store('evolufisico_pro_cref')||'',cli=store('evolufisico_pro_clinica')||'';
  var hist=list.map(function(x){var r=x.dobras_resultado||{},y=fromRec(x),sel=String(x.id)===String(a.id);
    return'<tr'+(sel?' class="sel"':'')+'><td class="l">'+esc(brDate(x.data_avaliacao))+'</td><td class="l">'+esc(x.fase||'—')+'</td><td>'+br(y.peso,1)+'</td><td>'+br(r.percGordura,1)+'</td><td>'+br(r.massaGorda,1)+'</td><td>'+br(r.massaMagra,1)+'</td><td>'+br(y.cintura,1)+'</td><td>'+(C.whtr(y.altura,y.cintura)!=null?br(C.whtr(y.altura,y.cintura),2):'—')+'</td></tr>'}).join('');
  var evo='';
  if(list.length>1){var f0=list[0],f1_=list[list.length-1],p0=num(f0.peso),p1=num(f1_.peso),g0=num((f0.dobras_resultado||{}).percGordura),g1=num((f1_.dobras_resultado||{}).percGordura),t=[];
    if(p0>0&&p1>0)t.push(pdfChip('Peso',(p1-p0>0?'+':'')+br(p1-p0,1)+' kg','blue'));
    if(g0>0&&g1>0)t.push(pdfChip('% Gordura (Pollock)',(g1-g0>0?'+':'')+br(g1-g0,1)+' p.p.',g1-g0<0?'good':g1-g0>0?'bad':''));
    if(t.length)evo='<div class="lb-evo"><span class="lb-evo-t">Evolução · '+esc(brDate(f0.data_avaliacao))+' → '+esc(brDate(f1_.data_avaliacao))+'</span>'+t.join('')+'</div>'}
  /* métodos de % de gordura */
  var mm=[],mv=[R.pollock,R.navy,R.rfm,R.bia].map(Number).filter(isFinite),mx=Math.max(30,Math.ceil((Math.max.apply(null,mv.concat([0]))*1.25)/5)*5);
  if(R.pollock)mm.push(pdfMeter('Pollock 7 dobras',Number(R.pollock),mx,br(R.pollock,1)+'%','#2563eb'));
  if(R.navy!=null)mm.push(pdfMeter('US Navy (perímetros)',Number(R.navy),mx,br(R.navy,1)+'%','#0ea5e9'));
  if(R.rfm!=null)mm.push(pdfMeter('RFM (cintura/altura)',Number(R.rfm),mx,br(R.rfm,1)+'%','#8b5cf6'));
  if(R.bia)mm.push(pdfMeter('Bioimpedância',Number(R.bia),mx,br(R.bia,1)+'%','#10b981'));
  var m=[];
  if(R.ref!=null){m.push(pdfRow('Média dos métodos','<span class="hl">'+br(R.ref,1)+'%</span>'));if(R.amp!=null&&isFinite(R.amp)&&mm.length>1)m.push(pdfRow('Amplitude entre métodos',br(R.amp,1)+' p.p.'));
    if(R.peso>0)m.push(pdfRow('Gordura / massa magra (kg)',br(R.peso*R.ref/100,1)+' / '+br(R.peso*(1-R.ref/100),1)))}
  var ix=[];
  if(R.whtr!=null){var wt=R.whtr<0.5?['baixo risco','good']:R.whtr<0.6?['risco aumentado','warn']:['risco alto','bad'];ix.push(pdfRow('Cintura/Estatura',br(R.whtr,2)+' <span class="lb-tag '+wt[1]+'">'+wt[0]+'</span>'))}
  if(R.bri!=null)ix.push(pdfRow('BRI',br(R.bri,1)));
  if(R.absi!=null)ix.push(pdfRow('ABSI',R.absi.toFixed(4).replace('.',',')));
  if(R.ffmi){ix.push(pdfRow('FFMI',br(R.ffmi.ffmi,1)));ix.push(pdfRow('FFMI normalizado',br(R.ffmi.norm,1)))}
  var en=[];
  if(R.harris!=null||R.mifflin!=null){
    if(R.harris!=null)en.push(pdfRow('TMB Harris-Benedict (1984)',Math.round(R.harris)+' kcal'));
    if(R.mifflin!=null)en.push(pdfRow('TMB Mifflin-St Jeor (1990)',Math.round(R.mifflin)+' kcal'));
    if(R.katch!=null)en.push(pdfRow('TMB Katch-McArdle (FFM)',Math.round(R.katch)+' kcal'));
    if(R.baseTmb!=null)en.push(pdfRow('TMB Base ('+(R.formulaNome||'Harris-Benedict')+')','<span class="hl">'+Math.round(R.baseTmb)+' kcal</span>'));
    if(R.get!=null)en.push(pdfRow('Gasto total GET (×'+String(F.fator).replace('.',',')+')',Math.round(R.get)+' kcal'));
    if(R.kcal!=null)en.push(pdfRow('Meta calórica ('+({manter:'manutenção',def:'déficit −20%',sup:'superávit +10%'}[F.obj]||'manutenção')+')','<span class="hl">'+Math.round(R.kcal)+' kcal</span>'));}
  var mt=[];
  if(R.meta){mt.push(pdfRow('Meta de gordura',br(R.alvo,1)+'%'));mt.push(pdfRow('Peso-alvo (massa magra constante)','<span class="hl">'+br(R.meta.pesoAlvo,1)+' kg</span>'));mt.push(pdfRow('Variação de peso',(-R.meta.delta>0?'+':'−')+br(Math.abs(R.meta.delta),1)+' kg'));mt.push(pdfRow('Gordura a reduzir',br(R.meta.gorduraPerder,1)+' kg'))}
  var fc='';
  if(R.fcmax){var fm=R.fcmax,rep=(F.fcrep>0&&F.fcrep<fm)?F.fcrep:0,zc=['#94a3b8','#38bdf8','#10b981','#f59e0b','#ef4444'],zi=0,zr='';
    zr+='<div class="lb-fcmax"><small>FC máxima estimada (Tanaka)</small><b>'+Math.round(fm)+' bpm</b></div>';
    [[50,60,'Recuperação'],[60,70,'Aeróbio base'],[70,80,'Aeróbio'],[80,90,'Limiar'],[90,100,'Máximo']].forEach(function(z){
      var lo=rep?rep+(fm-rep)*z[0]/100:fm*z[0]/100,hi=rep?rep+(fm-rep)*z[1]/100:fm*z[1]/100,col=zc[zi++];
      zr+='<div class="lb-zone"><span class="zn"><i style="background:'+col+'"></i>'+esc(z[2])+' <small>'+z[0]+'–'+z[1]+'%</small></span><span class="zb"><i style="left:'+(lo/fm*100).toFixed(1)+'%;width:'+((hi-lo)/fm*100).toFixed(1)+'%;background:'+col+'"></i></span><span class="zv">'+Math.round(lo)+'–'+Math.round(hi)+' bpm</span></div>'});
    fc='<div class="lb-zones">'+zr+'</div><div class="lb-fnote">'+(rep?'Método de Karvonen (FC de repouso '+Math.round(rep)+' bpm).':'Percentuais da FC máxima (FC de repouso não informada).')+'</div>'}
  var perfil=[R.sexo==='F'?'Feminino':'Masculino',R.idade>0?R.idade+' anos':'',R.altura>0?br(R.altura,0)+' cm':'',R.peso>0?br(R.peso,1)+' kg':''].filter(Boolean);
  var metCard=pdfSec('Comparador de métodos de % de gordura',(mm.length?mm.join(''):'<div class="lb-empty">Dados insuficientes para este bloco.</div>')+(m.length?'<table class="lb-kv"><tbody>'+m.join('')+'</tbody></table>':''),'','#2563eb');
  return'<div class="lb-doc">'+
    '<div class="lb-head"><div><div class="lb-kick">Laboratório de Avaliação</div><div class="lb-title">EvoluFísico · Relatório do Laboratório</div><div class="lb-sub">Emitido em '+new Date().toLocaleDateString('pt-BR')+'</div></div>'+
    '<div class="lb-pro">'+(pro?'<b>'+esc(pro)+'</b>':'')+(cref?'<span>'+esc(cref)+'</span>':'')+(cli?'<span>'+esc(cli)+'</span>':'')+'</div></div>'+
    '<div class="lb-student"><div><small>Aluno</small><h2>'+esc(nome)+'</h2></div><div class="lb-chips">'+perfil.map(function(p){return'<span class="lb-chip">'+esc(p)+'</span>'}).join('')+'<span class="lb-chip blue"><small>Referência</small>'+esc(brDate(a.data_avaliacao))+'</span></div></div>'+
    '<section class="lb-card lb-hist" style="--acc:#0ea5e9"><h3 class="lb-h"><i></i>Histórico do aluno <em>('+list.length+' avaliaç'+(list.length>1?'ões':'ão')+')</em></h3>'+
    '<table class="lb-table"><thead><tr><th class="l">Data</th><th class="l">Fase</th><th>Peso (kg)</th><th>% Gord.</th><th>M. gorda (kg)</th><th>M. magra (kg)</th><th>Cintura (cm)</th><th>Cint./Est.</th></tr></thead><tbody>'+hist+'</tbody></table>'+evo+'</section>'+
    '<div class="lb-note">Cálculos abaixo conforme os valores exibidos no Laboratório (podem ter sido ajustados manualmente).</div>'+
    '<div class="lb-grid">'+metCard+
    pdfBox('Índices de risco & FFMI',ix,'','','#f59e0b')+
    pdfBox('Energia & Gasto Calórico',en,'','','#ef4444')+
    pdfBox('Simulador de meta',mt,'Nenhuma meta de % de gordura informada (ou a meta não é menor que o valor atual).','','#10b981')+
    '</div>'+
    (fc?pdfSec('Zonas de frequência cardíaca',fc,'lb-wide','#ef4444'):pdfSec('Zonas de frequência cardíaca','<div class="lb-empty">Dados insuficientes para este bloco.</div>','lb-wide','#ef4444'))+
    '<div class="lb-foot">Estimativas populacionais e de triagem, não diagnóstico. Não substituem avaliação profissional; prescrição nutricional é atribuição de nutricionista. EvoluFísico v'+VER+'.</div></div>'}

function exportPDF1(){
  var msg=window.efToast||window.alert;
  compute();
  if(!last){
    msg('Preencha os dados do Lab para gerar o PDF.','warn');
    return;
  }
  var a=srcRecord();
  if(!a){
    var frm=fromForm();
    var inp=readInputs();
    var nomeAluno=(frm.nome||'').trim();
    if(!nomeAluno){
      var s=el('src');
      if(s&&s.selectedIndex>=0&&s.options[s.selectedIndex].value!=='form'){
        nomeAluno=s.options[s.selectedIndex].text.replace(/ ·.*$/,'').trim();
      }
    }
    if(!nomeAluno){
      var nomeInput=document.getElementById('nome');
      if(nomeInput&&nomeInput.value.trim())nomeAluno=nomeInput.value.trim();
    }
    if(!nomeAluno){
      nomeAluno='Aluno(a) / Avaliação Lab';
    }
    var dataAv=(document.getElementById('data_avaliacao')&&document.getElementById('data_avaliacao').value)||new Date().toISOString().slice(0,10);
    var faseAv=(document.getElementById('fase')&&document.getElementById('fase').value)||'Laboratório de Avaliação';
    a={
      id:'lab_sim_'+Date.now(),
      nome:nomeAluno,
      data_avaliacao:dataAv,
      fase:faseAv,
      sexo:inp.sexo,
      idade:inp.idade,
      altura:inp.altura,
      peso:inp.peso,
      dobras_resultado:inp.pollock?{percGordura:inp.pollock,massaGorda:inp.peso*inp.pollock/100,massaMagra:inp.peso*(1-inp.pollock/100)}:{},
      bioimpedancia:inp.bia?{pgordura:inp.bia}:{},
      perimetria:{pescoco:inp.pescoco,cintura:inp.cintura,quadril:inp.quadril}
    };
  }

  var box=document.getElementById('ef77-print');
  if(!box){
    box=document.createElement('div');
    box.id='ef77-print';
    box.setAttribute('aria-hidden','true');
    document.body.appendChild(box);
  }

  var list=sameStudent(a).slice().sort(function(x,y){return String(x.data_avaliacao||'').localeCompare(String(y.data_avaliacao||''))});
  if(!list.length)list=[a];

  var F={
    fator:el('fator')?el('fator').value:'1.55',
    obj:el('obj')?el('obj').value:'manter',
    fcrep:el('fcrep')?num(el('fcrep').value):0
  };

  box.innerHTML=pdfHTML(a,list,last,F);

  var oldTitle=document.title;
  var safeNome=(a.nome||'Aluno').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚãõÃÕâêîôûÂÊÎÔÛçÇ\s_-]/g,'').trim();
  document.title='EvoluFisico_Lab_'+safeNome.replace(/\s+/g,'_')+'_'+(a.data_avaliacao||new Date().toISOString().slice(0,10));

  var cleaned=false;
  var done=function(){
    if(cleaned)return;
    cleaned=true;
    document.body.classList.remove('ef77-printing');
    document.title=oldTitle;
    box.innerHTML='';
    if(typeof window.removeEventListener==='function')window.removeEventListener('afterprint',done);
  };

  document.body.classList.add('ef77-printing');
  window.addEventListener('afterprint',done,{once:true});
  setTimeout(done,60000);

  setTimeout(function(){
    try{
      window.print();
    }catch(e){
      done();
      msg('Não foi possível abrir a impressão do navegador: '+(e&&e.message||e),'warn');
    }
  },100);
}

/* ---------- Tema escuro ---------- */

/* ---------- Autoteste (valores de referência calculados à mão) ---------- */
function selfTest(){
  var T=[['navy M',C.navy('M',183,41,88,104),15.6,.1],['rfm M',C.rfm('M',183,88),22.4,.1],['rfm F',C.rfm('F',165,75),32.0,.1],['mifflin M',C.mifflin('M',97.4,183,33),1957.75,.01],['mifflin F',C.mifflin('F',60,165,30),1320.25,.01],['katch',C.katch(82.3),2147.68,.01],['tanaka',C.fcmax(33),184.9,.01],['whtr',C.whtr(183,88),0.4809,.001],['meta',C.meta(97.4,15.5,12).pesoAlvo,93.526,.01],['ffmi norm',C.ffmi(183,97.4,15.5).norm,24.4,.1]],bad=[];
  T.forEach(function(t){if(!(t[1]!=null&&Math.abs(t[1]-t[2])<=t[3]))bad.push(t[0]+': '+t[1]+' ≠ '+t[2])});
  if(C.navy('M',180,50,40,0)!==null)bad.push('navy deve rejeitar pescoço>cintura');
  if(C.rfm('M',0,80)!==null||C.bri(180,0)!==null)bad.push('entradas vazias devem retornar null');
  return{ok:!bad.length,total:T.length+2,failed:bad}}

/* ---------- Montagem ---------- */
function mount(){
  try{
    var nav=$('.nav-tabs'),after=$('#tab-comparison');
    if(!nav||!after){console.warn('EF77: ponto de montagem não encontrado');return}
    if($('#tab-lab77')){updateButtons();compute();return}
    if(!$('#tab-btn-lab77'))nav.insertAdjacentHTML('beforeend','<button class="nav-tab-btn" id="tab-btn-lab77" onclick="switchTab(\'tab-lab77\')"><span>🧪</span> <span>Lab</span></button>');
    var opt=function(a){return a.map(function(x){return'<option value="'+x[0]+'">'+x[1]+'</option>'}).join('')};
    var inp=function(k,l,st){return'<div><label for="ef77-'+k+'">'+l+'</label><input id="ef77-'+k+'" type="number" inputmode="decimal" step="'+(st||'any')+'" min="0"></div>'};
    after.insertAdjacentHTML('afterend','<section id="tab-lab77" class="tab-panel"><div class="ef77-wrap"><div class="ef77-head"><div><h2>Laboratório de Avaliação</h2><p>Calculadoras complementares. Não alteram nem salvam dados das avaliações.</p></div><div class="ef77-tools"><button class="ef77-btn" id="ef77-copy" type="button">📋 Copiar resumo</button><button class="ef77-btn" id="ef77-pdf1" type="button" title="PDF do aluno da fonte selecionada: histórico + cálculos do Lab">📄 PDF do aluno</button><button class="ef77-btn" id="ef77-csv1" type="button" title="Exporta só o aluno da fonte selecionada">⬇️ CSV do aluno</button><button class="ef77-btn pri" id="ef77-csv" type="button">⬇️ CSV (todas)</button></div></div>'+
    '<div class="ef77-card" style="margin-bottom:1rem"><div class="ef77-form"><div class="wide"><label for="ef77-src">Fonte dos dados</label><select id="ef77-src"></select></div>'+
    '<div><label for="ef77-sexo">Sexo</label><select id="ef77-sexo">'+opt([['M','Masculino'],['F','Feminino']])+'</select></div>'+inp('idade','Idade')+inp('altura','Altura (cm)')+inp('peso','Peso (kg)')+inp('pescoco','Pescoço (cm)')+inp('cintura','Cintura (cm)')+inp('quadril','Quadril (cm)')+inp('pollock','% Gord. Pollock')+inp('bia','% Gord. BIA')+inp('fcrep','FC repouso (bpm)','1')+
    '<div><label for="ef77-fator">Nível de atividade</label><select id="ef77-fator">'+opt([['1.2','Sedentário (1,2)'],['1.375','Leve (1,375)'],['1.55','Moderado (1,55)'],['1.725','Intenso (1,725)'],['1.9','Muito intenso (1,9)']])+'</select></div><div><label for="ef77-obj">Objetivo</label><select id="ef77-obj">'+opt([['manter','Manutenção'],['def','Déficit (−20%)'],['sup','Superávit (+10%)']])+'</select></div><div><label for="ef77-formula">Fórmula TMB</label><select id="ef77-formula">'+opt([['harris','Harris-Benedict (1984)'],['mifflin','Mifflin-St Jeor (1990)'],['katch','Katch-McArdle (Massa Magra)'],['harris1919','Harris-Benedict (1919)'],['media','Média das Equações']])+'</select></div>'+inp('alvo','Meta % gordura')+'</div></div>'+
    '<div class="ef77-grid" id="ef77-out" aria-live="polite"></div></div></section>');
    /* preferências salvas */
    var pr={};try{pr=JSON.parse(store('ef77_prefs')||'{}')||{}}catch(e){pr={}}
    el('fator').value=['1.2','1.375','1.55','1.725','1.9'].indexOf(String(pr.fator))>=0?String(pr.fator):'1.55';
    el('obj').value=['manter','def','sup'].indexOf(pr.obj)>=0?pr.obj:'manter';
    if(el('formula'))el('formula').value=['harris','mifflin','katch','harris1919','media'].indexOf(pr.formula)>=0?pr.formula:'harris';
    var savePrefs=function(){store('ef77_prefs',JSON.stringify({fator:el('fator').value,obj:el('obj').value,formula:el('formula')?el('formula').value:'harris'}))};
    FIELDS.forEach(function(k){var e=el(k);if(!e)return;
      e.addEventListener('input',function(){if(NUMF.indexOf(k)>=0||k==='sexo')dirty=true;compute()});
      e.addEventListener('change',function(){if(k==='sexo')dirty=true;if(k==='fator'||k==='obj'||k==='formula')savePrefs();compute()})});
    el('src').addEventListener('change',loadSrc);
    el('copy').addEventListener('click',copySummary);
    el('csv').addEventListener('click',function(){exportCSV(false)});
    el('csv1').addEventListener('click',function(){exportCSV(true)});
    if(el('pdf1')) el('pdf1').addEventListener('click',exportPDF1);
    var _sw=window.switchTab;
    window.switchTab=function(id){
      var r=_sw.apply(this,arguments);
      if(id==='tab-lab77'){try{document.querySelectorAll('.nav-tab-btn').forEach(function(b){b.classList.remove('active')});var b=$('#tab-btn-lab77');if(b)b.classList.add('active');buildSrc();if(!dirty)loadSrc();else{compute();updateButtons()}}catch(e){console.warn('EF77',e)}}
      return r};
    updateButtons();compute();
  }catch(err){console.warn('EF77: falha ao montar o Lab',err)}
}
window.EF77={version:VER,mounted:true,calc:C,selfTest:selfTest,sameStudent:sameStudent,exportPDF1:exportPDF1,mount:mount};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
