/* Nome único de relatórios, compatível com Evolufisico2 1.0.33. */
(function(){
'use strict';
function baseName(nome){
 const name=String(nome==null?'':nome)
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-zA-Z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean)
  .map(p=>p.charAt(0).toUpperCase()+p.slice(1).toLowerCase())
  .join('').slice(0,90);
 return 'Evolufisico'+name;
}
window.EF2PdfBaseName=baseName;
window.EF2PdfFileName=nome=>baseName(nome)+'.pdf';
})();