/* EvoluFisico Desktop | temas RC-2: 5 identidades offline, sem alterar registros clínicos. */
(function(){
 'use strict';
 const KEY='ef_desktop_theme_3_1_19';
 const THEMES=Object.freeze([
  {id:'saude',name:'Saúde',primary:'#168476',secondary:'#57b5aa',tone:'#e8f7f3',symbol:'heart',icons:['heart','clip','pulse','bars','flask','heart','wallet','gear']},
  {id:'academia',name:'Academia',primary:'#5655b6',secondary:'#918ce4',tone:'#f0edff',symbol:'dumbbell',icons:['dumbbell','users','chart','target','dumbbell','activity','receipt','sliders']},
  {id:'educacao',name:'Educação Física',primary:'#2677b9',secondary:'#83b6e6',tone:'#edf6ff',symbol:'medal',icons:['medal','clip','activity','compass','book','chart','cal','gear']},
  {id:'musculacao',name:'Musculação',primary:'#ae623c',secondary:'#dd9872',tone:'#fff2e9',symbol:'weight',icons:['weight','users','chart','dumbbell','target','pulse','wallet','sliders']},
  {id:'nutricao',name:'Nutrição',primary:'#638542',secondary:'#a4be7e',tone:'#f1f8e7',symbol:'apple',icons:['apple','clip','chart','scale','book','flask','receipt','gear']}
 ]);
 const PATHS=Object.freeze({
  heart:'<path d="M20.8 8c0 4.6-8.8 11-8.8 11S3.2 12.6 3.2 8a4.5 4.5 0 0 1 8.8-1.2A4.5 4.5 0 0 1 20.8 8Z"/><path d="M5.5 11h3l1.6-2.8 3.1 5 1.5-2.2h3.9"/>',
  clip:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 11h7M8.5 15h6"/>',
  pulse:'<path d="M2 12h4l2.5-5 4.2 10 2.5-5H22"/>',
  bars:'<path d="M4 20V5M4 20h17M8 17v-4m4 4V8m4 9v-6m4 6V5"/>',
  flask:'<path d="M9 3h6M10 3v7l-6 9c-.8 1.4.2 3 2 3h12c1.8 0 2.8-1.6 2-3l-6-9V3M7 17h10"/>',
  wallet:'<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 10V5a2 2 0 0 1 2-2h12M14 15h7"/>',
  gear:'<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  dumbbell:'<path d="M3 9v6m3-9v12m12-12v12m3-9v6M6 12h12"/>',
  users:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5"/>',
  chart:'<path d="M3 20h18M5 16l5-5 4 2 5-8M16 5h3v3"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  activity:'<path d="M4 19V6h16M7 15l4-4 3 2 5-6"/>',
  receipt:'<path d="M5 3h14v19l-3-2-4 2-4-2-3 2zM8 8h8M8 12h8M8 16h5"/>',
  sliders:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
  medal:'<circle cx="12" cy="14" r="5"/><path d="M8 2l4 7 4-7M12 12v4m-2-2h4"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6z"/>',
  book:'<path d="M3 5c4-2 7-2 9 0v15c-2-2-5-2-9 0zM21 5c-4-2-7-2-9 0v15c2-2 5-2 9 0z"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4m8-4v4M8 14h3M8 17h3"/>',
  weight:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  apple:'<path d="M12 7c-5-3-9 1-9 6s4 9 9 9 9-4 9-9-4-9-9-6Z"/><path d="M12 7c0-3 1.5-4 4-4-.2 3-1.6 4-4 4Z"/>',
  scale:'<path d="M12 3v18M5 7h14M6 21h12M5 7l-3 7a3 3 0 0 0 6 0zm14 0-3 7a3 3 0 0 0 6 0z"/>'
 });
 const ROUTES=['tab-btn-painel','tab-btn-history','tab-btn-compare','tab-btn-lab77','tab-btn-ef-forms','tab-btn-diagnostics','tab-btn-cobranca','tab-btn-settings'];
 const svg=kind=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(PATHS[kind]||PATHS.pulse)+'</svg>';
 let current=null;
 function read(){
  try{const value=localStorage.getItem(KEY);return THEMES.some(t=>t.id===value)?value:'saude';}
  catch(_){return 'saude';}
 }
 function apply(id,persist){
  const theme=THEMES.find(t=>t.id===id);
  if(!theme)return false;
  if(persist){try{localStorage.setItem(KEY,theme.id);}catch(_){}}
  current=theme.id;
  const html=document.documentElement;
  html.dataset.efDesignTheme=theme.id;
  if(document.body)document.body.dataset.efDesignTheme=theme.id;
  const colors={'--ef-selected-color':theme.primary,'--ef-selected-dark':theme.primary,'--ef-selected-darkmode-accent':theme.secondary,'--ef-theme-tint':theme.tone};
  for(const [property,value] of Object.entries(colors))html.style.setProperty(property,value,'important');
  const nav=document.querySelector('.top-navbar .nav-tabs');
  if(nav){
   ROUTES.forEach((key,index)=>{
    const button=document.getElementById(key);
    if(!button||!nav.contains(button))return;
    // A navegação mantém todos os nós de texto e indicadores originais.
    let holder=button.querySelector(':scope > .ef-local-nav-icon');
    if(!holder){holder=document.createElement('span');holder.className='ef-local-nav-icon';button.prepend(holder);}
    // O navegador serializa <path/> como <path></path>: comparar innerHTML
    // causava um ciclo infinito no MutationObserver e bloqueava o splash.
    const desiredIcon=theme.icons[index];
    if(holder.dataset.efThemeIcon!==desiredIcon || !holder.querySelector('svg')){
      holder.dataset.efThemeIcon=desiredIcon;
      holder.innerHTML=svg(desiredIcon);
    }
   });
  }
  document.querySelectorAll('[data-ef-desktop-theme]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.efDesktopTheme===theme.id)));
  return true;
 }
 function mount(){
  const parent=document.querySelector('#ef-setting-appearance');
  if(!parent)return;
  let area=document.getElementById('ef-desktop-themes');
  if(!area){
   area=document.createElement('section');area.id='ef-desktop-themes';area.className='ef-desktop-themes';
   const title=document.createElement('strong');title.textContent='Temas e papéis de parede';
   const subtitle=document.createElement('p');subtitle.textContent='Cinco identidades para saúde e atividade física, com ícones próprios. As cores se ajustam ao modo claro/escuro.';
   const gallery=document.createElement('div');gallery.className='ef-desktop-themes-grid';gallery.setAttribute('role','group');gallery.setAttribute('aria-label','Tema visual');
   THEMES.forEach(theme=>{
    const button=document.createElement('button');button.type='button';button.className='ef-desktop-theme-option';
    button.dataset.efDesktopTheme=theme.id;
    button.style.setProperty('--ef-theme-preview',theme.primary);
    button.style.setProperty('--ef-theme-preview-soft',theme.tone);
    const graphic=document.createElement('span');graphic.className='ef-desktop-theme-preview';graphic.innerHTML=svg(theme.symbol);
    const label=document.createElement('span');label.textContent=theme.name;
    button.append(graphic,label);gallery.append(button);
   });
   const hint=document.createElement('small');hint.textContent='Papel de parede, contraste e transparência são configurados abaixo.';
   area.append(title,subtitle,gallery,hint);
   gallery.addEventListener('click',event=>{
    const button=event.target.closest('[data-ef-desktop-theme]');
    if(button)apply(button.dataset.efDesktopTheme,true);
   });
   parent.prepend(area);
  }
  const wallpaper=document.getElementById('efwp-appearance-open');
  if(wallpaper&&wallpaper.parentElement!==area)area.append(wallpaper);
  apply(current||read(),false);
 }
 function boot(){
  if(!document.body)return;
  mount();apply(read(),false);
  const nav=document.querySelector('.top-navbar .nav-tabs');
  if(nav){
   let pending=false;
   new MutationObserver(changes=>{
    if(pending||!changes.some(change=>change.addedNodes.length||change.removedNodes.length))return;
    pending=true;
    queueMicrotask(()=>{pending=false;apply(current||read(),false);});
   }).observe(nav,{childList:true,subtree:true});
  }
  const settings=document.querySelector('#ef-setting-appearance');
  if(settings){
   new MutationObserver(()=>mount()).observe(settings,{childList:true});
  }
 }
 window.EFDesktopThemes=Object.freeze({all:THEMES.map(t=>({id:t.id,name:t.name})),get:()=>current||read(),set:id=>apply(id,true)});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();