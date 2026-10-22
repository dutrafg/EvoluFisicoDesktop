/* Regressão da correção 9.1-beta: Cobranças sempre fora de Configurações. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'../src/EvoluFisico.Desktop/wwwroot');
const read=f=>fs.readFileSync(path.join(base,f),'utf8');
const billing=read('assets/js/24-billing.js'),css=read('assets/css/25-ficha-viva.css'),nav=read('assets/js/26-simple-interface.js'),html=read('index.html'),sw=read('sw.js');
let count=0;const check=(name,fn)=>{fn();console.log('PASS',name);count++};
const anchor=billing.indexOf('// Módulo Cobranças sempre pertence à área principal');
const start=billing.lastIndexOf('    function mount() {',anchor),end=billing.indexOf('    // Interceptar switchTab',anchor);
check('Montagem corrigida isolada',()=>assert(start>=0&&anchor>start&&end>anchor));
const mountCode=billing.slice(start,end);
new vm.Script(mountCode,{filename:'billing-mount'});
function scenario({nestedPanel=false,nestedButton=false,missingButton=false}={}){
 const byId=new Map();
 function el(id,tag='div'){
  const e={id,tagName:tag,children:[],parentNode:null,parentElement:null,className:'',value:'',
   appendChild(c){if(c.parentElement)c.parentElement.removeChild(c);this.children.push(c);c.parentNode=c.parentElement=this;return c},
   removeChild(c){const i=this.children.indexOf(c);if(i>=0)this.children.splice(i,1);c.parentElement=c.parentNode=null},
   insertBefore(c,b){if(c.parentElement)c.parentElement.removeChild(c);const i=b?this.children.indexOf(b):-1;if(i<0)this.children.push(c);else this.children.splice(i,0,c);c.parentNode=c.parentElement=this;return c}
  };
  if(id)byId.set(id,e);return e;
 }
 const workspace=el('workspace'),settings=el('tab-settings'),diagnostics=el('tab-diagnostics'),panel=el('tab-cobranca');
 const navbar=el('navbar');
 workspace.appendChild(settings);workspace.appendChild(diagnostics);
 (nestedPanel?diagnostics:workspace).appendChild(panel);
 let button=null;
 if(!missingButton){button=el('tab-btn-cobranca','button');(nestedButton?diagnostics:navbar).appendChild(button)}
 let clicked='',recalc=0,render=0;
 const sandbox={
  document:{querySelector(sel){return sel==='.top-navbar > .nav-tabs'?navbar:sel==='.app-container'?workspace:null},
   getElementById(id){return byId.get(id)||null},createElement:tag=>el(null,tag)},
  loadBilling:()=>Promise.resolve([]),renderizarHistoricoCompleto:()=>{render++},popularSelectAlunos:()=>{},
  state:{data:'2026-10-20',valorBaseUnitario:25},recalcularEAtualizarUI:()=>{recalc++},
  switchTab:id=>{clicked=id},console
 };
 new Function(...Object.keys(sandbox),mountCode+'\nmount();')(...Object.values(sandbox));
 return{workspace,settings,diagnostics,panel,navbar,button:byId.get('tab-btn-cobranca')||navbar.children.find(x=>x.id==='tab-btn-cobranca'),clicked:()=>clicked,recalc:()=>recalc,render:()=>render};
}
check('Painel já correto permanece na área de trabalho',()=>{const a=scenario();assert.equal(a.panel.parentElement,a.workspace);assert(a.navbar.children.includes(a.button))});
check('Painel aninhado em Diagnóstico retorna ao workspace',()=>{const a=scenario({nestedPanel:true});assert.equal(a.panel.parentElement,a.workspace);assert(a.workspace.children.indexOf(a.panel)<a.workspace.children.indexOf(a.settings))});
check('Botão aninhado em Diagnóstico retorna ao menu principal',()=>{const a=scenario({nestedButton:true});assert.equal(a.button.parentElement,a.navbar)});
check('Botão ausente é criado diretamente na navegação',()=>{const a=scenario({missingButton:true});assert.equal(a.button.parentElement,a.navbar);a.button.onclick();assert.equal(a.clicked(),'tab-cobranca')});
check('Diagnóstico não define a posição de Cobranças',()=>assert(!mountCode.includes('diagBtn')&&!mountCode.includes('diagPanel.parentNode.insertBefore')));
check('Montagem mantém cálculo de cobranças',()=>assert(scenario().recalc()>0));
check('Botões de receber pendências preservados',()=>{assert(billing.includes('data-cob-action="receive"'));assert(billing.includes('receberCobrancaDoHistorico'))});
check('Gravação de cobranças permanece no SQLite nativo',()=>assert(billing.includes('billingNativeStore().writeJSON(EF_NATIVE_BILLING_KEY,packet)')));
check('Navegação faz segunda conferência de posição',()=>assert(nav.includes("billingPanel.parentElement!==workspace")&&nav.includes("workspace.insertBefore(billingPanel")));
check('Sete módulos no menu incluindo Formulários/Cobranças',()=>{assert(nav.includes("'tab-ef-forms'"));assert(nav.includes("'tab-cobranca'"));assert(nav.includes("'tab-settings'"))});
check('Navegação compacta usa 4 colunas e duas linhas',()=>{assert(css.includes('grid-template-columns: repeat(4, minmax(0, 1fr)) !important;'));assert(css.includes('grid-auto-rows: 54px;'));assert(css.includes('padding-bottom: calc(164px + env(safe-area-inset-bottom))'))});
check('Alertas não cobrem a barra inferior',()=>assert(css.includes('#ef55-toasts { bottom: calc(150px + env(safe-area-inset-bottom))')));
check('Versão Windows alinhada à versão do instalador',()=>{
 const source=fs.readFileSync('installer/EvoluFisico.iss','utf8');
 const version=source.match(/^#define MyAppVersion "([^"\r\n]+)"$/m)?.[1];
 assert.equal(version,'1.0.4','Versão estável deve ser 1.0.4');
 assert.ok(nav.includes("version:'1.0.4'"),'UI deve indicar a versão estável');
 assert.ok(html.includes('EvoluFísico v1.0.4 estável'),'HTML deve exibir versão estável');
});
check('Recursos da versão 9.1 e novo Início permanecem no cache offline',()=>{assert(sw.includes('./assets/js/32-forms-clean.js'));assert(sw.includes('./assets/js/06-dashboard.js'));assert(sw.includes('./assets/css/31-desktop-refinement.css'));assert.match(sw,/const CACHE_NAME = 'evolufisico-desktop-[^']+';/)});
console.log('PASS '+count+' verificações da correção 9.1-beta de Cobranças e layout Windows.');
