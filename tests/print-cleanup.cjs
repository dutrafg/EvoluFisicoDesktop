// Exercise the actual runtime afterprint handler without browser dependencies.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/js/05-app-runtime.js','utf8');
const start=source.indexOf("window.addEventListener('afterprint', () => {");
assert(start>=0,'Global print cleanup handler exists');
const end=source.indexOf('\n        });',start);
const handler=source.slice(start,end+'\n        });'.length);
for(const theme of ['', 'dark-mode']){
 const classes=new Set(['ef-simple-ui','custom-layout',theme,'print-mode-single','print-mode-comparison'].filter(Boolean));
 const body={classList:{remove(...names){names.forEach(n=>classes.delete(n));}},get className(){return [...classes].join(' ')},set className(value){classes.clear();value.split(/\s+/).filter(Boolean).forEach(n=>classes.add(n))}};
 let cleanup;vm.runInNewContext(handler,{window:{addEventListener(event,fn){assert.equal(event,'afterprint');cleanup=fn}},document:{body}});
 for(let i=0;i<3;i++){
  classes.add('print-mode-single');classes.add('print-mode-comparison');cleanup();
  assert(classes.has('ef-simple-ui'),'Preserve corporate layout after closing or cancelling print');
  assert(classes.has('custom-layout'),'Preserve unrelated page state');
  if(theme)assert(classes.has(theme),'Preserve dark theme');
  assert(!classes.has('print-mode-single')&&!classes.has('print-mode-comparison'),'Remove print state');
 }
}
console.log('PASS Print cleanup preserves layout and theme across repeated print completion/cancellation');
