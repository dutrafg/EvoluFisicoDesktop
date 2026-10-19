/* 11-runtime.js */
(function(){
'use strict';
var VERSION='6.7';
var S=window.__EF63_STATE__||{};
var cache=new Map(), index=null, indexVersion=-1;
function source(){return S.getAvaliacoes?S.getAvaliacoes():[]}
function n(v){return EFU.num(v)}
function dateVal(a){var t=Date.parse(a&&a.data_avaliacao||a&&a.timestamp||'');return isNaN(t)?0:t}
function keyName(v){return EFIdentity.key(v)}
function build(){if(index&&indexVersion===S.version)return index;var rs=source(),byId=new Map(),byName=new Map();rs.forEach(function(a){byId.set(String(a.id),a);var k=EFIdentity.key(a);if(!byName.has(k))byName.set(k,[]);byName.get(k).push(a)});index={byId:byId,byName:byName,records:rs.slice()};indexVersion=S.version;return index}
function val(a){var d=a.dobras_resultado||{},b=a.bioimpedancia||{},p=a.perimetria||{};return {cliente_id:a.cliente_id||String(a.id),id:String(a.id),nome:String(a.nome||''),date:dateVal(a),data:a.data_avaliacao||'',peso:n(a.peso),gordura:n(d.percGordura!=null?d.percGordura:b.pgordura),massaMagra:n(d.massaMagra),massaGorda:n(d.massaGorda!=null?d.massaGorda:b.gordura_kg),cintura:n(p.cintura),quadril:n(p.quadril)} }
function timeline(name){var k=keyName(name),arr=(build().byName.get(k)||[]).map(val).sort(function(a,b){return a.date-b.date});for(var i=0;i<arr.length;i++){var prev=arr[i-1];arr[i].delta=prev?{peso:diff(arr[i].peso,prev.peso),gordura:diff(arr[i].gordura,prev.gordura),massaMagra:diff(arr[i].massaMagra,prev.massaMagra),cintura:diff(arr[i].cintura,prev.cintura)}:null}return arr}
function diff(a,b){return a!=null&&b!=null?+(a-b).toFixed(2):null}
function trend(arr,field){var x=arr.filter(function(a){return a[field]!=null});if(x.length<2)return {n:x.length,direction:'insuficiente',delta:null};var d=x[x.length-1][field]-x[0][field];return {n:x.length,direction:d>0.01?'alta':d<-0.01?'queda':'estável',delta:+d.toFixed(2)} }
function analyze(name){var t=timeline(name);return {name:name,count:t.length,timeline:t,trends:{peso:trend(t,'peso'),gordura:trend(t,'gordura'),massaMagra:trend(t,'massaMagra'),cintura:trend(t,'cintura')}}}
function summary(){var rs=build().records, names=new Set(rs.map(function(a){return EFIdentity.key(a)})), totals={peso:0,gordura:0,massaMagra:0,cintura:0};var counts={peso:0,gordura:0,massaMagra:0,cintura:0};rs.forEach(function(a){var v=val(a);['peso','gordura','massaMagra','cintura'].forEach(function(k){if(v[k]!=null){totals[k]+=v[k];counts[k]++}})});var avg={};Object.keys(totals).forEach(function(k){avg[k]=counts[k]?+(totals[k]/counts[k]).toFixed(2):null});return {records:rs.length,students:names.size,averages:avg,counts:counts}}
function invalidate(){cache.clear();index=null;indexVersion=-1}
var oldTouch=S.touch;S.touch=function(){if(typeof oldTouch==='function')oldTouch.apply(S,arguments);invalidate()};
window.EF67={version:VERSION,stats:function(){return{engine:VERSION,version:S.version,records:build().records.length,students:build().byName.size,cacheEntries:cache.size}},summary:function(){var k='summary|'+S.version;if(!cache.has(k))cache.set(k,summary());return cache.get(k)},student:function(name){var k='student|'+keyName(name)+'|'+S.version;if(!cache.has(k))cache.set(k,analyze(name));return cache.get(k)},timeline:function(name){return this.student(name).timeline},trends:function(name){return this.student(name).trends},invalidate:invalidate};
window.addEventListener('DOMContentLoaded',function(){setTimeout(function(){build();summary()},0)});
})();
