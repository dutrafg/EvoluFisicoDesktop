/* Desktop 1.1 — Dock Padrão/Moderna e opções Compacto/Estendido/Desktop. */
(function(){
'use strict';
const KEY='ef-desktop-navigation-v110';
const defaults={layout:'desktop',dock:'padrao'};
let prefs=defaults;try{const p=JSON.parse(localStorage.getItem(KEY)||'null');if(p)prefs={...defaults,...p};}catch(_){}
const layouts=['compacto','estendido','desktop'],docks=['padrao','moderna'];
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let scheduled=false;
function selectedTab(){return $('.tab-panel.active')?.id||'tab-painel';}
function tabs(){return $$('.top-navbar .nav-tab-btn').filter(b=>b.id&&!b.hidden&&b.offsetParent!==null||b.id==='tab-btn-alunos');}
function ensureDock(){
 let dock=$('#ef-desktop-dock');
 if(!dock){dock=document.createElement('nav');dock.id='ef-desktop-dock';dock.className='no-print';dock.setAttribute('aria-label','Navegação rápida');document.body.append(dock);}
 const buttons=tabs();const present=new Set($$('[data-ef-dock-target]',dock).map(b=>b.dataset.efDockTarget));
 for(const b of buttons){if(present.has(b.id))continue;const btn=document.createElement('button');btn.type='button';btn.dataset.efDockTarget=b.id;btn.title=b.textContent.trim().slice(0,100);btn.textContent=b.textContent.trim().slice(0,40)||'Módulo';btn.addEventListener('click',()=>document.getElementById(b.id)?.click());dock.append(btn);}
 const allowed=new Set(buttons.map(b=>b.id));
 $$('[data-ef-dock-target]',dock).forEach(b=>{if(!allowed.has(b.dataset.efDockTarget))b.remove();});
 $$('[data-ef-dock-target]',dock).forEach(b=>{const n=document.getElementById(b.dataset.efDockTarget);
  b.classList.toggle('active',n?.classList.contains('active')||((b.dataset.efDockTarget==='tab-btn-painel')&&selectedTab()==='tab-painel'));});
}
function apply(){
 prefs.layout=layouts.includes(prefs.layout)?prefs.layout:'desktop';
 prefs.dock=docks.includes(prefs.dock)?prefs.dock:'padrao';
 document.body.dataset.efDesktopLayout=prefs.layout;
 document.body.dataset.efDesktopDock=prefs.dock;
 ensureDock();
 for(const field of $$('[data-ef-nav-preference]')){const k=field.dataset.efNavPreference;field.value=prefs[k]||'';}
}
function set(k,v){
 if(k==='layout'&&!layouts.includes(v))return false;
 if(k==='dock'&&!docks.includes(v))return false;
 prefs[k]=v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(e){console.warn('Preferências de navegação não salvas',e);}
 apply();return true;
}
function controls(){
 const setting=$('#tab-settings');if(!setting||$('#ef-desktop-navigation-settings'))return;
 const section=document.createElement('section');section.id='ef-desktop-navigation-settings';section.className='ef-nav-settings ef-settings-card';
 section.innerHTML='<h3>Layout e Dock do Windows</h3><p>Escolha a navegação sem perder o menu lateral original.</p>'+
 '<label>Layout<select data-ef-nav-preference="layout"><option value="compacto">Compacto — menu recolhido</option><option value="estendido">Estendido — Dock de navegação</option><option value="desktop">Desktop — lateral tradicional</option></select></label>'+
 '<label>Dock<select data-ef-nav-preference="dock"><option value="padrao">Padrão</option><option value="moderna">Moderna</option></select></label>';
 const target=$('#efx-appearance-controls')?.parentElement||setting.querySelector('.ef-settings-grid')||setting;
 target.append(section);
 section.addEventListener('change',e=>{if(e.target.matches('[data-ef-nav-preference]'))set(e.target.dataset.efNavPreference,e.target.value)});
}
function tick(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply()});}
function init(){
 controls();apply();
 const nav=$('.top-navbar .nav-tabs');if(nav){const observer=new MutationObserver(tick);observer.observe(nav,{childList:true,subtree:false});}
 document.addEventListener('click',e=>{if(e.target.closest('.nav-tab-btn,[data-ef-dock-target]'))requestAnimationFrame(tick)});
 window.addEventListener('resize',tick);
}
window.EFDesktopNavigation=Object.freeze({set,getState:()=>({...prefs}),refresh:tick});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();