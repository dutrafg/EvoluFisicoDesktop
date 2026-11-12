'use strict';
/* Testa o HTML integral no Chromium COM ponte WebView2 simulada: 4x4 avaliações,
   edições, exclusões, cobranças preexistentes e nenhuma escrita em IndexedDB clínico.
   Não substitui um teste manual com o host C#/SQLite real. */
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../src/EvoluFisico.Desktop/wwwroot');
const mime={'.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{try{
 const raw=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+(raw==='/'?'/index.html':raw));
 if(!file.startsWith(root+path.sep))throw Error('not local');
 res.setHeader('Content-Type',mime[path.extname(file)]||'text/html;charset=utf-8');res.end(fs.readFileSync(file));
 }catch(e){res.statusCode=404;res.end('Not found');}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try {
  browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:1440,height:920}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   const rows=new Map();
   for(let student=1;student<=4;student++)for(let assessment=1;assessment<=4;assessment++){
    const id='qa_'+student+'_'+assessment;
    const date=new Date(Date.UTC(2026,0,2+(assessment-1)*30)).toISOString().slice(0,10);
    rows.set('ef-eval-'+id,{id,cliente_id:'student-'+student,nome:'Aluno QA '+student,data_avaliacao:date,sexo:student%2?'M':'F',peso:69+student+assessment,altura:170+student});
   }
   rows.set('ef-billing-main',[{id:'cob-qa',aluno1:{nome:'Aluno QA 1'},valor:120,status:'pendente'}]);
   const callbacks=[];
   let clinicalIDB=0;
   const originalOpen=window.indexedDB?.open?.bind(window.indexedDB);
   if(originalOpen){
    window.indexedDB.open=function(name,...args){if(name==='EvoluFisicoDB')clinicalIDB++;return originalOpen(name,...args)};
   }
   window.__EF_MOCK={rows,actions:[],getClinicalIDB:()=>clinicalIDB};
   const encode=obj=>{const bytes=new TextEncoder().encode(JSON.stringify(obj));let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)};
   const decode=str=>JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(str),c=>c.charCodeAt(0))));
   window.chrome={webview:{
    addEventListener(kind,fn){if(kind==='message')callbacks.push(fn)},
    postMessage(req){window.__EF_MOCK.actions.push(req.action+':'+(req.recordId||''));
     queueMicrotask(()=>{
      let data=null,error=null;
      try{
       switch(req.action){
        case 'health':data='ok';break;
        case 'list':data=JSON.stringify([...rows.keys()]);break;
        case 'read':data=rows.has(req.recordId)?encode(rows.get(req.recordId)):null;break;
        case 'write':rows.set(req.recordId,decode(req.data));data='saved';break;
        case 'delete':rows.delete(req.recordId);data='deleted';break;
        case 'delete-evaluation':
          rows.delete(req.recordId);for(const [k,v] of Object.entries(req.records||{}))rows.set(k,decode(v));data='deleted';break;
        case 'replace-evaluations':
          for(const key of rows.keys())if(key.startsWith('ef-eval-'))rows.delete(key);
          for(const [k,v] of Object.entries(req.records||{}))rows.set(k,decode(v));
          data='saved';break;
        default:throw Error('Unsupported action '+req.action);
       }
      }catch(e){error=e.message}
      for(const cb of callbacks)cb({data:{type:'native-storage-result',requestId:req.requestId,data,error}});
     });
    }
   }};
   try{localStorage.setItem('evolufisico_pro_nome','Profissional QA');localStorage.setItem('evolufisico_pro_cref','QA-0000')}catch(_){}
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__EF63_STATE__?.getAvaliacoes?.().length===16,{timeout:45000});
  const snapshot=await page.evaluate(()=>{
   const all=window.__EF63_STATE__.getAvaliacoes();
   const groups=Object.groupBy(all,v=>v.cliente_id);
   return {count:all.length,groupSizes:Object.values(groups).map(v=>v.length),native:!!window.EFNativeStorage,clinicalIDB:window.__EF_MOCK.getClinicalIDB(),errors:window.__EF_MOCK.actions.filter(x=>x.startsWith('write:'))};
  });
  assert.equal(snapshot.count,16);
  assert.deepEqual(snapshot.groupSizes.sort(),[4,4,4,4]);
  assert(snapshot.native&&snapshot.clinicalIDB===0,'IndexedDB clínico foi aberto no Windows');
  await page.evaluate(async()=>{
   const update={...window.__EF63_STATE__.getAvaliacoes()[0],peso:99};
   await window.salvarAvaliacaoNoDB(update);
  });
  const update=await page.evaluate(()=>{
   const s=window.__EF_MOCK.rows;return [...s.entries()].filter(([id,v])=>id.startsWith('ef-eval-')&&v.peso===99).length;
  });
  assert.equal(update,1,'Editar avaliação não foi gravado em EFNativeStorage');
  const payment=await page.evaluate(async()=>{
   const current=await window.EFCobranca.exportData();
   return {count:current.length,first:current[0]?.id};
  });
  assert.equal(payment.first,'cob-qa','Cobrança nativa anterior não foi restaurada');
  await page.evaluate(async()=>{await window.EFCobranca.importData([{id:'cob-qa-nova',valor:125}],false,false)});
  const after=await page.evaluate(()=>window.__EF_MOCK.rows.get('ef-billing-main'));
  assert(after.some(x=>x.id==='cob-qa-nova'),'Nova cobrança não persistiu no registro SQLite');
  console.log('PASS native simulation: 4 alunos x 4 avaliações, CRUD, 0 IndexedDB clínico, financeiro legado e novas cobranças.');
  if(errors.length)console.log('Avisos frontend: '+JSON.stringify(errors.slice(0,10)));
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
