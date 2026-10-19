/* 06-runtime.js */
(function(){'use strict';
var $=function(s){return document.querySelector(s)};
var norm=function(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()};
var num=function(v){var n=parseFloat(String(v).replace(',','.'));return isFinite(n)?n:null};
var lista=function(){try{return Array.isArray(avaliacoes)?avaliacoes:[]}catch(e){return[]}};
var pg=function(a){var r=a.dobras_resultado&&num(a.dobras_resultado.percGordura);return r!=null?r:num(a.bioimpedancia&&a.bioimpedancia.pgordura)};
var mm=function(a){return EFMeasures.lean(a)};
var pe=function(a){return num(a.peso)};
var dm=function(s){var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?m[3]+'/'+m[2]:''};
var df=function(s){var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?m[3]+'/'+m[2]+'/'+m[1]:'—'};
var msg=function(t,k){(window.efToast||alert)(t,k)};
function atual(){try{if(avaliacaoLaudoWebAtiva)return avaliacaoLaudoWebAtiva}catch(e){}
try{return lista().filter(function(a){return a.id===avaliacaoEmVisualizacaoId})[0]||null}catch(e){return null}}
function historico(a){var k=EFIdentity.key(a);return lista().filter(function(x){return EFIdentity.key(x)===k}).sort(function(x,y){return(x.data_avaliacao||'').localeCompare(y.data_avaliacao||'')})}
function chart(tit,pts,cor,un){if(pts.length<2)return'';
var W=300,H=120,px=26,py=26,vs=pts.map(function(p){return p.v}),mn=Math.min.apply(null,vs),mx=Math.max.apply(null,vs),r=(mx-mn)||1;
var X=function(i){return px+i*(W-2*px)/(pts.length-1)},Y=function(v){return H-py-(v-mn)/r*(H-2*py)};
var ln=pts.map(function(p,i){return(i?'L':'M')+X(i).toFixed(1)+' '+Y(p.v).toFixed(1)}).join(' ');
var ar=ln+' L'+X(pts.length-1).toFixed(1)+' '+(H-py)+' L'+X(0).toFixed(1)+' '+(H-py)+' Z';
var dots=pts.map(function(p,i){return'<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(p.v).toFixed(1)+'" r="3.5" fill="#fff" stroke="'+cor+'" stroke-width="2"/><text x="'+X(i).toFixed(1)+'" y="'+(Y(p.v)-8).toFixed(1)+'" text-anchor="middle" font-size="9.5" font-weight="700" fill="#1d1d1f">'+p.v.toFixed(1)+'</text><text x="'+X(i).toFixed(1)+'" y="'+(H-8)+'" text-anchor="middle" font-size="8.5" fill="#86868b">'+p.d+'</text>'}).join('');
var dl=pts[pts.length-1].v-pts[0].v;
return'<div style="background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:.8rem"><div style="display:flex;justify-content:space-between;font-size:.82rem;font-weight:800;margin-bottom:4px"><span>'+tit+'</span><span style="color:'+cor+'">'+(dl>0?'+':'')+dl.toFixed(1)+un+'</span></div><svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto"><path d="'+ar+'" fill="'+cor+'" opacity=".08"/><path d="'+ln+'" fill="none" stroke="'+cor+'" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>'+dots+'</svg></div>'}
function resumo(){var a=atual();if(!a)return'';var l=historico(a),f=l[0],g=pg(a),m=mm(a);
var t='*EvoluFísico* — Resultado de '+a.nome+'\n📅 Avaliação: '+df(a.data_avaliacao)+'\n⚖️ Peso: '+(pe(a)!=null?pe(a).toFixed(1):'-')+' kg\n🔥 % Gordura: '+(g!=null?g.toFixed(1)+'%':'-')+'\n💪 Massa magra: '+(m!=null?m.toFixed(1)+' kg':'-');
if(f&&f.id!==a.id){var sg=function(n1,n2,u){if(n1==null||n2==null||isNaN(n1)||isNaN(n2))return '—';var diff=n1-n2;return(diff>0?'+':'')+diff.toFixed(1)+u};
t+='\n\n📈 Desde '+df(f.data_avaliacao)+':\n• Gordura: '+sg(g,pg(f),'%')+'\n• Peso: '+sg(pe(a),pe(f),' kg')+'\n• Massa magra: '+sg(m,mm(f),' kg')}
if(a.data_proxima_avaliacao)t+='\n\n🔁 Próxima avaliação: '+df(a.data_proxima_avaliacao);return t}
window.ef56Copiar=function(){var t=resumo();if(!t)return;
(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){msg('Resumo copiado ✓')},function(){msg('Não foi possível copiar.','warn')})};
window.ef56Zap=function(){var a=atual();if(!a)return;var d=String(a.whatsapp||'').replace(/\D/g,'');
if(!d){msg('Aluno sem WhatsApp cadastrado.','warn');return}
window.open('https://api.whatsapp.com/send?phone='+(d.length<=11?'55':'')+d+'&text='+encodeURIComponent(resumo()),'_blank','noopener,noreferrer')};
function extra(box){if(box.querySelector('#ef56-extra'))return;var a=atual();if(!a)return;var l=historico(a);
var s=function(fn){return l.map(function(x){var v=fn(x);return v==null?null:{v:v,d:dm(x.data_avaliacao)}}).filter(Boolean)};
var h='<div id="ef56-extra" class="no-print" style="margin:1.5rem 0 .5rem">';
if(l.length>1)h+='<h3 style="font-size:1.05rem;font-weight:700;margin-bottom:.75rem">📈 Evolução do Aluno ('+l.length+' avaliações)</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px">'+chart('% Gordura',s(pg),'#dc2626','%')+chart('Peso (kg)',s(pe),'#2563eb',' kg')+chart('Massa Magra (kg)',s(mm),'#16a34a',' kg')+'</div>';
h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:1rem"><button type="button" class="btn btn-secondary btn-sm" onclick="ef56Copiar()">📋 Copiar resumo</button><button type="button" class="btn btn-primary btn-sm" onclick="ef56Zap()">💬 Enviar resumo por WhatsApp</button></div></div>';
box.insertAdjacentHTML('beforeend',h)}
var box=$('#patient-view-content');
if(box)new MutationObserver(function(){if(box.children.length&&!box.querySelector('#ef56-extra'))extra(box)}).observe(box,{childList:true});
})();
