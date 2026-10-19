const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('sw.js','utf8'),handlers={},deleted=[],network=[],stores=new Map();let failInstall=false,fetchFail=false;
const cacheFor=key=>{if(!stores.has(key))stores.set(key,new Map());const map=stores.get(key);return {addAll:async assets=>{if(failInstall)throw Error('download failed');for(const path of assets)map.set(new URL(path,'https://app.test/').href,new Response(path))},match:async r=>map.get(typeof r==='string'?new URL(r,'https://app.test/').href:r.url)}};
const scope={URL,Response,Set,Promise,self:{location:{origin:'https://app.test'},registration:{scope:'https://app.test/'},clients:{claim:async()=>{}},skipWaiting:()=>{scope.skipped=true},addEventListener:(k,f)=>handlers[k]=f},caches:{open:async k=>cacheFor(k),keys:async()=>[...stores.keys()],delete:async k=>{deleted.push(k);return stores.delete(k)}},fetch:async r=>{network.push(r);if(fetchFail)throw Error('offline');return new Response('network')}};
vm.runInNewContext(code,scope);
const version=/const CACHE_NAME = '([^']+)'/.exec(code)[1];let checks=0;
async function run(name,fn){await fn();checks++;console.log('PASS',name)}
(async()=>{
await run('Instalação falha se pré-cache estiver incompleto',async()=>{failInstall=true;let wait;handlers.install({waitUntil:p=>wait=p});await assert.rejects(wait,/download failed/);failInstall=false});
await run('Instalação armazena todos os recursos existentes',async()=>{let wait;handlers.install({waitUntil:p=>wait=p});await wait;for(const url of stores.get(version).keys()){let path=new URL(url).pathname;if(path!=='/')assert.ok(fs.existsSync('.'+path),path)}});
await run('Ativação preserva caches de outras aplicações',async()=>{stores.set('outra-app',new Map());stores.set('evolufisico-old',new Map());let wait;handlers.activate({waitUntil:p=>wait=p});await wait;assert.ok(deleted.includes('evolufisico-old'));assert.ok(stores.has('outra-app'));assert.ok(stores.has(version))});
await run('Navegação offline usa HTML da versão instalada',async()=>{fetchFail=true;let promise;handlers.fetch({request:{method:'GET',url:'https://app.test/',mode:'navigate'},respondWith:p=>promise=p});assert.equal((await promise).status,200);assert.equal(network.length,0)});
await run('Rotas cleanUrls funcionam offline',async()=>{for(const name of ['index','evolufisico']){let promise;handlers.fetch({request:{method:'GET',url:'https://app.test/'+name,mode:'navigate'},respondWith:p=>promise=p});assert.equal((await promise).status,200)}});
await run('JS offline servido do mesmo cache',async()=>{let promise;handlers.fetch({request:{method:'GET',url:'https://app.test/assets/js/05-app-runtime.js',mode:'cors'},respondWith:p=>promise=p});assert.equal((await promise).status,200)});
await run('Não intercepta dados externos ou URLs desconhecidas',async()=>{for(const url of ['https://external.test/','https://app.test/api/dados']){let intercepted=false;handlers.fetch({request:{method:'GET',url},respondWith:()=>intercepted=true});assert.equal(intercepted,false)}});
await run('Ativação imediata exige mensagem explícita',()=>{assert.equal(scope.skipped,undefined);handlers.message({data:{type:'SKIP_WAITING'}});assert.equal(scope.skipped,true)});
fs.writeFileSync('tests/sw-results.json',JSON.stringify({passed:checks,environment:'Service Worker em VM com CacheStorage simulado'},null,2));console.log('TOTAL',checks);
})().catch(e=>{console.error(e);process.exit(1)});
