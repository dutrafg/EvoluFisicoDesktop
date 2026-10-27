'use strict';
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../src/EvoluFisico.Desktop/wwwroot');
const types={'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
 try{
  const raw=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(raw==='/'?'/index.html':raw));
  if(!file.startsWith(root+path.sep))throw Error('Forbidden');
  res.setHeader('Content-Type',types[path.extname(file)]||'text/html;charset=utf-8');
  res.end(fs.readFileSync(file));
 }catch(_){res.statusCode=404;res.end('Not found');}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{try{localStorage.setItem('evolufisico_pro_nome','Profissional QA');localStorage.setItem('evolufisico_pro_cref','QA0000');}catch(_){}});
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>typeof window.switchTab==='function'&&document.getElementById('tab-painel')&&document.getElementById('tab-alunos'),{timeout:35000});
  assert.equal(await page.locator('#tab-painel').count(),1);
  assert.equal(await page.locator('#tab-alunos').count(),1);
  assert.match(await page.locator('#tab-alunos h1').first().textContent(),/Perfil Unificado/);
  await page.evaluate(()=>window.switchTab('tab-painel'));
  assert(await page.locator('#tab-painel').evaluate(e=>e.classList.contains('active')),'Dashboard não abriu');
  await page.evaluate(()=>window.switchTab('tab-alunos'));
  assert(await page.locator('#tab-alunos').evaluate(e=>e.classList.contains('active')),'Perfil Unificado não abriu');
  await page.evaluate(()=>window.switchTab('tab-painel'));
  await page.waitForSelector('#efw-open-picker',{state:'attached',timeout:15000});
  await page.evaluate(()=>document.getElementById('efw-open-picker').click());
  await page.waitForSelector('#efw-catalog-grid button[data-efw-add]',{state:'attached',timeout:15000});
  const total=await page.locator('#efw-catalog-grid button[data-efw-add]').count();
  assert(total>=50,'EvoStore deve disponibilizar pelo menos 50 miniapps: '+total);
  await page.evaluate(()=>document.querySelector('#efw-catalog-grid button[data-efw-add]').click());
  await page.waitForFunction(()=>document.querySelectorAll('#efw-card-grid .efw-card').length>0,{timeout:15000});
  const content=await page.locator('#efw-card-grid').innerText();
  assert(!content.includes('Este mini app não conseguiu carregar'),'Miniapp instalado mas não iniciou');
  console.log('PASS Chromium: Dashboard, Perfil Unificado e EvoStore com '+total+' miniapps; primeiro miniapp instalado e renderizado');
  if(errors.length)console.log('Erros reportados por scripts do frontend: '+JSON.stringify(errors.slice(0,8)));
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
