'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root='src/EvoluFisico.Desktop/wwwroot/';
const read=p=>fs.readFileSync(p,'utf8');
const source=read(root+'assets/js/61-accessible-icons.js');
const css=read(root+'assets/css/61-accessible-icons.css');
const html=read(root+'index.html');
const sw=read(root+'sw.js');
const sidebar=read(root+'assets/css/23-simple-interface.css');
const strong=read(root+'assets/css/60-desktop-effects-120.css');
let n=0;
function check(title,fn){fn();n++;console.log('PASS',title)}
check('Icons loaded after existing Desktop modules and available offline',()=>{
 const tag='<script src="./assets/js/61-accessible-icons.js" defer></script>';
 assert.ok(html.includes(tag));
 assert.ok(html.indexOf(tag)>html.indexOf('59-mobile-navigation.js'));
 assert.ok(html.includes('61-accessible-icons.css'));
 assert.ok(sw.includes('./assets/js/61-accessible-icons.js'));
 assert.ok(sw.includes('./assets/css/61-accessible-icons.css'));
 assert.ok(sw.includes('evolufisico-desktop-1-1-0-pdf-names-new-evaluation'));
 assert.doesNotThrow(()=>new Function(source));
});
check('SVG glyphs carry accessible descriptions, protected paths and source palette',()=>{
 assert.ok(source.includes("s.setAttribute('role','img')"));
 assert.ok(source.includes("s.setAttribute('aria-label',LABEL[n]||'Ícone')"));
 for(const key of ['lock','unlock','clip','warn','print','brain','cal','users','search','gear','save','folder'])assert.ok(source.includes('"'+key+'":'),key);
 assert.match(css,/\.efi svg\{display:block/);
 assert.ok(source.includes('NodeFilter.SHOW_TEXT'));
 assert.ok(source.includes('MutationObserver'));
});
check('No changes to navigation icons, editable fields or private assessment data',()=>{
 const pos=source.indexOf("var SKIP=");
 const skip=source.slice(pos,source.indexOf(';',pos));
 for(const key of ['.top-navbar','.nav-tabs','textarea','input','[contenteditable="true"]','[data-ef-user-content]','[data-sensitive]','.ef-student-identity','.efi'])assert.ok(skip.includes(key),key);
 assert.ok(sidebar.includes('#tab-btn-analises::before{display:none!important;content:none!important}'));
});
check('1.1.0 keeps 20 percent stronger effects and essential/reduced-motion gates',()=>{
 assert.ok(strong.includes('--efx-blur:19.2px'));
 assert.ok(strong.includes('translate3d(0,-4.8px,8.4px) rotateX(.576deg)'));
 assert.ok(strong.includes('data-efx-visual="essential"'));
 assert.ok(strong.includes('prefers-reduced-motion:reduce'));
});
check('SVG replacement works for UI text and ignores navigation and sensitive names',()=>{
 const added=[];
 const buttons=[];
 const nodes=[];
 const createTextNode=value=>({nodeType:3,nodeValue:value,isConnected:true,parentNode:null,parentElement:null});
 const el=(tag)=>({
  nodeType:1,tagName:tag,isConnected:true,className:'',innerHTML:'',attributes:{},
  setAttribute(key,value){this.attributes[key]=value},
  appendChild(child){(this.children||(this.children=[])).push(child)}
 });
 const main=createTextNode('Salvar 💾 e imprimir 🖨️');
 const nav=createTextNode('Nova avaliação 📝');
 const student=createTextNode('José ✅');
 const ordinary=el('section');ordinary.closest=()=>null;
 const navParent=el('nav');navParent.closest=selector=>selector.includes('.top-navbar')?navParent:null;
 const sensitive=el('strong');sensitive.closest=selector=>selector.includes('.ef-student-identity')?sensitive:null;
 function wrap(node,parent){node.parentElement=parent;node.parentNode={replaceChild(fragment){node.output=fragment.children||[];added.push(node)}};}
 wrap(main,ordinary);wrap(nav,navParent);wrap(student,sensitive);
 nodes.push(main,nav,student);
 const document={
  readyState:'loading',body:ordinary,
  addEventListener(name,fn){buttons.push(fn)},
  createElement:el,createTextNode,
  createDocumentFragment(){return {children:[],appendChild(child){this.children.push(child)}}},
  createTreeWalker(){let i=0;return {nextNode(){return nodes[i++]||null}}}
 };
 const sandbox={document,NodeFilter:{SHOW_TEXT:4},
   MutationObserver:class {observe(){}},
   setTimeout(fn){fn();return 1},clearTimeout(){},console};
 vm.runInNewContext(source,sandbox,{timeout:3000});
 assert.equal(buttons.length,1);
 buttons[0]();
 assert.equal(added.length,1);
 const children=main.output;
 const icons=children.filter(x=>x.className==='efi');
 assert.equal(icons.length,2);
 assert.equal(icons[0].attributes['aria-label'],'Salvar');
 assert.equal(icons[1].attributes['aria-label'],'Imprimir');
 assert.match(icons[0].innerHTML,/<svg viewBox="0 0 24 24"/);
 assert.equal(nav.output,undefined);
 assert.equal(student.output,undefined);
});
check('Version 1.1.0 and Windows upgrade identity match',()=>{
 const installer=read('installer/EvoluFisico.iss');
 const native=read('src/EvoluFisico.Desktop/MainWindow.xaml.cs');
 const nav=read(root+'assets/js/26-simple-interface.js');
 assert.match(installer,/#define MyAppVersion "1\.1\.0"/);
 assert.match(installer,/AppId=\{\{C89493D0-1C8B-4717-A6C8-42F45B3FBD0B\}/);
 assert.ok(native.includes('CurrentVersion = "1.1.0"'));
 assert.ok(html.includes('<title>EvoluFísico Desktop 1.1.0 Pré-Beta</title>')&&!html.includes('brand-version'));
 assert.ok(nav.includes("version:'1.1.0'"));
 assert.ok(read(root+'assets/js/24-billing.js').includes('EF_NATIVE_BILLING_KEY'));
});
console.log('TOTAL',n,'desktop SVG icon integration checks passed');
