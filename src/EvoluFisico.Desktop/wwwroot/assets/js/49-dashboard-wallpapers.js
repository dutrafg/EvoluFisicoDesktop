/* EvoluFisico2 | papéis de parede para todos os módulos | 20 graduações, offline */
(function () {
  'use strict';
  if (window.EFWallpapers) return;
  var KEY='efi_wallpaper_v2', DB='efi_wallpaper_photo_v2';
  var levels=['Mais claro','Claro','Médio','Escuro','Mais escuro'];
  var groups=[
    {id:'min',name:'Minimalista',light:['#f4f8ff','#e2eaf9','#92b2da','#244f88','#061428'],dark:['#405d81','#2b486a','#1b3759','#102343','#050e22'],accent:'#59aaff'},
    {id:'nat',name:'Natureza',light:['#eafaff','#c2eff3','#72b6c3','#2f617d','#081b33'],dark:['#3b7184','#276171','#20455f','#112c45','#07152a'],accent:'#56d5bc'},
    {id:'abs',name:'Abstrato',light:['#f2f5ff','#d8dcff','#787fe3','#302578','#0d0925'],dark:['#544e9b','#38317f','#282064','#1a123c','#080719'],accent:'#c875ff'},
    {id:'tex',name:'Texturas',light:['#f7f7f5','#e9dccb','#a5adb6','#37404d','#0c1018'],dark:['#67717f','#525968','#363d4c','#222731','#090d14'],accent:'#efa365'}
  ];
  var defs={id:null,dim:10,blur:0,position:'center'};
  var selected=read(),photo=null,was=null,dialog=null,category='min';
  var cache=new Map(),watching=false;
  function limit(v,min,max,fallback){v=Number(v);return Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;}
  function validId(id){return groups.some(function(g){return Array.from({length:5},function(_,i){return g.id+'-'+(i+1);}).includes(id);});}
  function normalize(v){return {id:validId(v&&v.id)||v&&['custom',null].includes(v.id)?v.id:null,dim:limit(v&&v.dim,0,60,10),blur:limit(v&&v.blur,0,12,0),position:['center','top','bottom'].includes(v&&v.position)?v.position:'center'};}
  function read(){try{return normalize(Object.assign({},defs,JSON.parse(localStorage.getItem(KEY)||'{}')))}catch(e){return Object.assign({},defs);}}
  function dark(){return document.documentElement.classList.contains('ef-dark-mode')||document.body.classList.contains('dark-mode');}
  function svg(group,index,isDark){
    var bg=(isDark?group.dark:group.light)[index],accent=group.accent;
    var base='<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1350" viewBox="0 0 2400 1350" preserveAspectRatio="xMidYMid slice"><defs>'+
    '<radialGradient id="glow"><stop stop-color="'+accent+'" stop-opacity="'+(isDark?'.30':'.42')+'"/><stop offset="1" stop-color="'+accent+'" stop-opacity="0"/></radialGradient>'+
    '<linearGradient id="sea" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+accent+'" stop-opacity="'+(isDark?'.34':'.40')+'"/><stop offset="1" stop-color="#fff" stop-opacity=".04"/></linearGradient>'+
    '<pattern id="lines" width="46" height="46" patternUnits="userSpaceOnUse"><path d="M0 46L46 0" stroke="'+accent+'" stroke-opacity=".12" stroke-width="2"/></pattern></defs>'+
    '<rect width="2400" height="1350" fill="'+bg+'"/><ellipse cx="1210" cy="500" rx="1450" ry="850" fill="url(#glow)"/>';
    var art='';
    if(group.id==='min'){
      art='<path d="M-200 830 C460 240 900 1120 1570 460 S2400 210 2600 260 L2600 1450H-200Z" fill="url(#sea)"/>'+
      '<path d="M-200 900 C550 350 950 1110 1620 510 S2300 280 2600 340" stroke="'+(isDark?'#a7d8ff':'#ffffff')+'" stroke-opacity=".56" stroke-width="8" fill="none"/>'+
      '<path d="M-200 1020 C540 600 1040 1290 1630 710 S2320 480 2600 510" stroke="'+accent+'" stroke-opacity=".43" stroke-width="4" fill="none"/>';
    } else if(group.id==='nat'){
      art='<circle cx="1680" cy="290" r="126" fill="'+(isDark?'#ddf3ff':'#fff6d3')+'" opacity="'+(isDark?'.65':'.82')+'"/>'+
      '<path d="M-100 880 L280 560L500 750L950 375L1320 755L1630 420L2060 750L2500 520V1450H-100Z" fill="'+(isDark?'#173d54':'#6d99af')+'" opacity=".70"/>'+
      '<path d="M-100 985 L390 730L720 900L1150 590L1590 900L2040 640L2500 860V1450H-100Z" fill="'+(isDark?'#092c3c':'#285f69')+'" opacity=".84"/>'+
      '<path d="M-100 1020 Q700 975 1220 1030T2500 1000V1450H-100Z" fill="url(#sea)"/>'+
      '<path d="M-100 1062Q950 1005 2500 1080" stroke="'+(isDark?'#a2cad9':'#ffffff')+'" stroke-opacity=".38" stroke-width="4" fill="none"/>';
      for(var t=0;t<20;t++){var x=t*129-30,y=850+(t%4)*37,h=90+(t%5)*24;art+='<path d="M'+x+' '+(y-h)+'l-36 '+(h*.58)+'h18l-37 '+(h*.43)+'h110l-37 -'+(h*.43)+'h18Z" fill="'+(isDark?'#06262d':'#195447')+'" opacity=".58"/>';}
    } else if(group.id==='abs'){
      art='<circle cx="540" cy="320" r="300" fill="url(#glow)"/>'+
      '<path d="M-200 860 C340 50 880 1120 1420 470 S2180 450 2600 130 L2600 1430H-200Z" fill="url(#sea)"/>'+
      '<path d="M-180 1120 C420 400 860 1310 1570 610 S2160 790 2600 300" stroke="'+(isDark?'#f5c0ff':'#ffffff')+'" stroke-opacity=".72" stroke-width="18" fill="none"/>'+
      '<path d="M-180 1190 C500 490 1010 1410 1630 700 S2300 830 2600 470" stroke="'+accent+'" stroke-opacity=".64" stroke-width="55" fill="none"/>';
    } else {
      art='<rect width="2400" height="1350" fill="url(#lines)"/>';
      for(var n=0;n<13;n++){var off=100+n*145;art+='<path d="M'+(off-460)+' -120L'+(off+520)+' 1500" stroke="'+accent+'" stroke-opacity="'+(n%4===0?'.38':'.12')+'" stroke-width="'+(n%4===0?5:2)+'"/>';}
      art+='<path d="M-100 1000Q650 750 1300 1040T2500 730" stroke="'+(isDark?'#ffffff':'#6b7680')+'" stroke-opacity=".18" stroke-width="44" fill="none"/>';
    }
    return base+art+'</svg>';
  }
  function wallpaperUrl(id,isDark){
    var key=id+'-'+(isDark?'dark':'light');
    if(cache.has(key))return cache.get(key);
    var bits=id.split('-'),g=groups.find(function(x){return x.id===bits[0];}),i=Number(bits[1])-1;
    if(!g||i<0||i>4)return '';
    var result="url('data:image/svg+xml,"+encodeURIComponent(svg(g,i,isDark))+"')";
    cache.set(key,result);return result;
  }
  function root(){return document.querySelector('#tab-painel #efi-dashboard');}
  function paint(){
    var target=root(),shell=document.querySelector('.app-container');
    if(was&&was!==target){was.classList.remove('efwp-enabled');was.style.removeProperty('--efwp-image');}
    was=target;
    var url=selected.id==='custom'&&photo?'url("'+photo+'")':validId(selected.id)?wallpaperUrl(selected.id,dark()):'none';
    if(target){
      target.classList.toggle('efwp-enabled',url!=='none');
      target.style.setProperty('--efwp-image',url);
      target.style.setProperty('--efwp-dim',String(selected.dim/100));
      target.style.setProperty('--efwp-blur',selected.blur+'px');
      target.style.setProperty('--efwp-position',selected.position);
      if(url==='none'){
        target.style.removeProperty('background-color');
        target.style.removeProperty('background-image');
      }else{
        target.style.setProperty('background-color','transparent','important');
        target.style.setProperty('background-image','none','important');
      }
    }
    if(shell){
      shell.classList.toggle('efwp-global-enabled',url!=='none');
      for(var pair of [['--efwp-image',url],['--efwp-dim',String(selected.dim/100)],
        ['--efwp-blur',selected.blur+'px'],['--efwp-position',selected.position]]){
        if(url!=='none')shell.style.setProperty(pair[0],pair[1]);
        else shell.style.removeProperty(pair[0]);
      }
    }
    // Uma única camada fixa preenche a viewport inteira, inclusive margens do app.
    // Não alterar altura, padding ou limites de rolagem de qualquer módulo.
    var layer=document.getElementById('efwp-viewport-layer');
    if(url!=='none'&&!layer&&document.body){
      layer=document.createElement('div');
      layer.id='efwp-viewport-layer';
      layer.setAttribute('aria-hidden','true');
      layer.innerHTML='<div class="efwp-viewport-image"></div><div class="efwp-viewport-tint"></div>';
      document.body.insertBefore(layer,document.body.firstChild);
    }
    document.body.classList.toggle('efwp-viewport-on',url!=='none');
    if(layer){
      layer.style.setProperty('--efwp-image',url);
      layer.style.setProperty('--efwp-dim',String(selected.dim/100));
      layer.style.setProperty('--efwp-blur',selected.blur+'px');
      layer.style.setProperty('--efwp-position',selected.position);
      layer.hidden=url==='none';
    }
  }
  function save(next){selected=normalize(Object.assign({},selected,next));try{localStorage.setItem(KEY,JSON.stringify(selected));}catch(e){}paint();if(dialog&&!dialog.hidden)drawGallery();return selected;}
  function escapeText(value){return String(value).replace(/[&<>"']/g,function(x){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x];});}
  function buildDialog(){
    if(dialog)return dialog;
    dialog=document.createElement('div');dialog.className='efwp-dialog';dialog.id='efwp-dialog';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','efwp-title');
    dialog.innerHTML='<div class="efwp-shade" data-efwp-close></div><div class="efwp-panel" tabindex="-1"><header><div><h2 id="efwp-title">Papéis de parede</h2><p>20 opções em graduação de luminosidade. Aplique seu papel de parede em todos os módulos, preservando os cartões e formulários.</p></div><button type="button" class="efwp-close" data-efwp-close aria-label="Fechar">×</button></header>'+
      '<div class="efwp-categories" role="group" aria-label="Categoria do papel de parede"></div><div class="efwp-gallery" aria-label="Cinco níveis de luminosidade"></div>'+
      '<div class="efwp-controls"><label>Escurecimento <output id="efwp-dim-out"></output><input aria-label="Escurecimento" id="efwp-dim" type="range" min="0" max="60" step="1"></label>'+
      '<label>Desfoque <output id="efwp-blur-out"></output><input aria-label="Desfoque" id="efwp-blur" type="range" min="0" max="12" step="1"></label>'+
      '<label>Enquadramento<select id="efwp-position"><option value="center">Centralizado</option><option value="top">Superior</option><option value="bottom">Inferior</option></select></label></div>'+
      '<footer><button type="button" id="efwp-default">Fundo original</button><label class="efwp-upload">Usar minha imagem<input type="file" id="efwp-upload" accept="image/png,image/jpeg,image/webp,image/avif" hidden></label><span id="efwp-status" role="status" aria-live="polite">Salvo neste dispositivo · funciona offline</span></footer>'+
      '<p class="efwp-hint">O mesmo fundo acompanha todos os módulos e adapta suas cores ao tema claro ou escuro. Relatórios e PDFs permanecem sem fundo.</p></div>';
    document.body.appendChild(dialog);
    dialog.addEventListener('click',function(event){
      if(event.target.closest('[data-efwp-close]')){close();return;}
      var categoryButton=event.target.closest('[data-efwp-cat]');if(categoryButton){category=categoryButton.dataset.efwpCat;drawGallery();return;}
      var choice=event.target.closest('[data-efwp-select]');if(choice){save({id:choice.dataset.efwpSelect});return;}
      if(event.target.id==='efwp-default'){save({id:null});return;}
    });
    dialog.addEventListener('input',function(e){
      var el=e.target;if(el.id==='efwp-dim')save({dim:el.value});
      if(el.id==='efwp-blur')save({blur:el.value});
    });
    dialog.addEventListener('change',function(e){
      if(e.target.id==='efwp-position')save({position:e.target.value});
      if(e.target.id==='efwp-upload'&&e.target.files&&e.target.files[0])upload(e.target.files[0]);
    });
    dialog.addEventListener('keydown',function(e){
      if(e.key!=='Tab')return;
      var available=Array.from(dialog.querySelectorAll('button:not([disabled]),input:not([type=file]),select,label.efwp-upload'));
      var first=available[0],last=available[available.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    });
    return dialog;
  }
  function drawGallery(){
    if(!dialog||dialog.hidden)return;
    var cats=dialog.querySelector('.efwp-categories'),gallery=dialog.querySelector('.efwp-gallery');
    cats.innerHTML=groups.map(function(g){return '<button type="button" data-efwp-cat="'+g.id+'" aria-pressed="'+(category===g.id)+'">'+g.name+'</button>';}).join('');
    var g=groups.find(function(x){return x.id===category;});
    gallery.innerHTML=levels.map(function(name,i){var id=g.id+'-'+(i+1);return '<button type="button" class="efwp-item'+(selected.id===id?' selected':'')+'" data-efwp-select="'+id+'" aria-pressed="'+(selected.id===id)+'"><span class="efwp-preview" style="background-image:'+wallpaperUrl(id,dark())+'"></span><strong>'+(i+1).toString().padStart(2,'0')+'</strong><span>'+escapeText(name)+'</span></button>';}).join('');
    dialog.querySelector('#efwp-dim').value=selected.dim;dialog.querySelector('#efwp-dim-out').textContent=selected.dim+'%';
    dialog.querySelector('#efwp-blur').value=selected.blur;dialog.querySelector('#efwp-blur-out').textContent=selected.blur+'px';
    dialog.querySelector('#efwp-position').value=selected.position;
  }
  var lastFocus=null;
  function open(){buildDialog();lastFocus=document.activeElement;dialog.hidden=false;document.body.classList.add('efwp-lock');drawGallery();dialog.querySelector('.efwp-close').focus();}
  function close(){if(!dialog)return;dialog.hidden=true;document.body.classList.remove('efwp-lock');if(lastFocus&&lastFocus.isConnected)lastFocus.focus();}
  function connect(){
    var target=root();if(target&&!target.querySelector('#efwp-open')){
      var host=target.querySelector('.welcome-actions')||target.querySelector('#efi-customization');
      if(host){var btn=document.createElement('button');btn.id='efwp-open';btn.className='ghost-btn';btn.type='button';btn.textContent='Papéis de parede';btn.addEventListener('click',open);host.appendChild(btn);}
    }
    if(!document.querySelector('#efwp-global-open')){
      var navigation=document.querySelector('.top-navbar .nav-actions');
      if(navigation){
        var entry=document.createElement('button');
        entry.id='efwp-global-open';
        entry.type='button';
        entry.className='btn btn-outline btn-sm btn-pro-pill efwp-global-launch';
        entry.title='Personalizar o fundo de todos os módulos';
        entry.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8" cy="9" r="2"/><path d="m4 17 6-5 4 3 3-3 4 4"/></svg><span>Papel de parede</span>';
        entry.addEventListener('click',open);
        navigation.insertBefore(entry,navigation.firstChild);
      }
    }
    if(!document.querySelector('#efwp-appearance-open')){
      var appearance=document.querySelector('#ef-setting-appearance');
      if(appearance){
        var appearanceButton=document.createElement('button');
        appearanceButton.id='efwp-appearance-open';
        appearanceButton.type='button';
        appearanceButton.className='btn btn-outline efwp-appearance-launch';
        appearanceButton.textContent='Escolher papel de parede para todos os módulos';
        appearanceButton.addEventListener('click',open);
        appearance.appendChild(appearanceButton);
      }
    }
    paint();
  }
  function dbOpen(){return new Promise(function(resolve,reject){if(!window.indexedDB)return reject(new Error('IndexedDB indisponível'));var req=indexedDB.open(DB,1);req.onupgradeneeded=function(){req.result.createObjectStore('wallpaper');};req.onsuccess=function(){resolve(req.result);};req.onerror=function(){reject(req.error);};});}
  function dbStore(blob){return dbOpen().then(function(db){return new Promise(function(resolve,reject){var tx=db.transaction('wallpaper','readwrite');tx.objectStore('wallpaper').put(blob,'custom');tx.oncomplete=function(){db.close();resolve();};tx.onerror=function(){db.close();reject(tx.error);};});});}
  function dbRead(){return dbOpen().then(function(db){return new Promise(function(resolve,reject){var req=db.transaction('wallpaper').objectStore('wallpaper').get('custom');req.onsuccess=function(){db.close();resolve(req.result);};req.onerror=function(){db.close();reject(req.error);};});});}
  function setPhoto(blob){if(photo)URL.revokeObjectURL(photo);photo=URL.createObjectURL(blob);paint();}
  async function upload(file){
    var status=dialog.querySelector('#efwp-status');
    try{
      if(!/^image\/(png|jpeg|webp|avif)$/.test(file.type)||file.size>15*1024*1024)throw Error('Use JPG, PNG, WebP ou AVIF de até 15 MB');
      if(typeof createImageBitmap!=='function')throw Error('Este navegador não oferece processamento de imagens');
      var bitmap=await createImageBitmap(file),max=Math.max(bitmap.width,bitmap.height);
      if(!max||max>30000){bitmap.close();throw Error('Dimensões inválidas');}
      var factor=Math.min(1,2560/max),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*factor));canvas.height=Math.max(1,Math.round(bitmap.height*factor));
      var ctx=canvas.getContext('2d');if(!ctx){bitmap.close();throw Error('Canvas indisponível');}ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
      var blob=await new Promise(function(resolve){canvas.toBlob(resolve,'image/webp',.86);});if(!blob)throw Error('Não foi possível compactar a imagem');
      await dbStore(blob);setPhoto(blob);save({id:'custom'});status.textContent='Imagem armazenada apenas neste dispositivo';
    }catch(e){status.textContent='Imagem não aplicada: '+e.message;}
    finally{dialog.querySelector('#efwp-upload').value='';}
  }
  function hydrate(){if(selected.id!=='custom')return;dbRead().then(function(blob){if(blob)setPhoto(blob);else save({id:null});}).catch(function(){save({id:null});});}
  function boot(){
    connect();hydrate();
    var scheduled=false;
    new MutationObserver(function(list){if(scheduled||!list.some(function(x){return x.addedNodes.length||x.removedNodes.length;}))return;scheduled=true;queueMicrotask(function(){scheduled=false;connect();});}).observe(document.body,{childList:true,subtree:true});
    new MutationObserver(function(){paint();if(dialog&&!dialog.hidden)drawGallery();}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    new MutationObserver(function(){paint();}).observe(document.body,{attributes:true,attributeFilter:['class']});
    window.addEventListener('keydown',function(e){if(e.key==='Escape'&&dialog&&!dialog.hidden)close();});
    window.addEventListener('pagehide',function(){if(photo)URL.revokeObjectURL(photo);},{once:true});
  }
  window.EFWallpapers=Object.freeze({groups:groups.map(function(g){return g.name;}),levels:levels.slice(),get:function(){return Object.assign({},selected);},set:save,open:open,reset:function(){return save({id:null});},svg:function(id,mode){var bits=id.split('-'),g=groups.find(function(x){return x.id===bits[0];});return g?svg(g,Number(bits[1])-1,mode==='dark'):null;}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();