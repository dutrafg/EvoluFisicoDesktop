'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../src/EvoluFisico.Desktop/wwwroot');
const mime=p=>p.endsWith('.css')?'text/css':p.endsWith('.js')?'application/javascript':p.endsWith('.json')||p.endsWith('.webmanifest')?'application/json':p.endsWith('.svg')?'image/svg+xml':p.endsWith('.png')?'image/png':'text/html';
const server=http.createServer((req,res)=>{
 try{const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('content-type',mime(file));res.end(fs.readFileSync(file))}
 catch(_){res.writeHead(404);res.end('Not found')}
});
(async()=>{
 let browser;
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({executablePath:process.env.EF_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  for(const [label,viewport] of [['mobile',{width:390,height:850}],['desktop',{width:1280,height:900}]]){
   const ctx=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'});
   const p=await ctx.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
   await p.addInitScript(()=>localStorage.setItem('ef_general_splash_v1','0'));
   await p.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});
   await p.locator('#efprof-first-run').waitFor({state:'visible',timeout:30000});
   const name='Profissional QA '+label;
   await p.locator('#efprof-name').fill(name);
   await p.locator('#efprof-cref').fill('12345-G/PR');
   await p.locator('#efprof-workplace').fill('Estúdio QA');
   await p.locator('#efprof-form [type=submit]').click();
   await p.waitForFunction(()=>document.getElementById('efprof-first-run')?.hidden);
   assert.equal(await p.evaluate(()=>localStorage.getItem('evolufisico_pro_nome')),name,'Primeiro acesso persiste nome');
   await p.reload({waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>window.EFProfessionalProfile?.read?.().name===name);
   assert.equal(await p.locator('#efprof-first-run').isVisible(),false,'Primeiro acesso não reaparece');

   await p.waitForFunction(()=>window.EFStudents?.open&&window.EFUnifiedDirectory?.ready?.());
   const palette=()=>p.evaluate(()=>{
    const st=x=>getComputedStyle(document.querySelector(x));
    return {bodyAccent:getComputedStyle(document.body).getPropertyValue('--ef-accent').trim(),
      profileAccent:st('#tab-alunos').getPropertyValue('--ef-accent').trim(),
      dashboardTheme:st('#tab-painel').getPropertyValue('--ef-theme-main').trim(),
      sidebarTheme:st('.top-navbar').getPropertyValue('--ef-theme-main').trim(),
      profileText:st('#tab-alunos').color};
   });
   const before=await palette();
   await p.evaluate(()=>{const b=document.createElement('button');b.type='button';b.className='eft-theme-option';b.dataset.eftTheme='academia';document.body.append(b);b.click();b.remove()});
   const after=await palette();
   assert.notEqual(before.dashboardTheme,after.dashboardTheme,'Dashboard acompanha tema');
   assert.notEqual(before.sidebarTheme,after.sidebarTheme,'Painel lateral acompanha tema');
   assert.equal(before.profileAccent,after.profileAccent,'Perfil mantém sua paleta');
   assert.equal(before.bodyAccent,after.bodyAccent,'Tema não interfere em módulos globalmente');

   await p.evaluate(()=>window.EFStudents.open());
   await p.locator('#tab-alunos [data-efa-action="novo-cadastro"]').first().click();
   await p.locator('#efa-reg-nome').fill('Aluno QA '+label);
   await p.locator('#efa-reg-email').fill('qa-'+label+'@example.com');
   await p.locator('#efa-save-cadastro').click();
   await p.waitForFunction(()=>window.EFUnifiedDirectory?.list?.().length===1);
   assert.equal(await p.locator('#efa-register-panel').isVisible(),false,'Cadastro fecha depois de gravar');

   await p.reload({waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>window.EFUnifiedDirectory?.ready?.());
   assert.equal(await p.evaluate(()=>window.EFUnifiedDirectory.list()[0]?.nome),'Aluno QA '+label,'Aluno existe após reinício');
   assert.equal(await p.evaluate(()=>window.EFProfessionalProfile.read().name),name,'Profissional permanece salvo');
   await p.evaluate(()=>window.EFStudents.open());
   assert((await p.locator('#efa-student').innerText()).includes('Aluno QA '+label),'Aluno aparece na ficha');
   await p.locator('#efa-student [data-efa-action="editar-cadastro"]').click();
   await p.locator('#efa-reg-nome').fill('Aluno QA Editado '+label);
   await p.locator('#efa-save-cadastro').click();
   await p.waitForFunction(v=>window.EFUnifiedDirectory?.list()[0]?.nome===v,'Aluno QA Editado '+label);
   await p.reload({waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>window.EFUnifiedDirectory?.ready?.());
   assert.equal(await p.evaluate(()=>window.EFUnifiedDirectory.list()[0]?.nome),'Aluno QA Editado '+label,'Edição persiste');
   assert.deepEqual(errors,[],'Nenhuma exceção Javascript');
   console.log('PASS Perfil profissional, cadastro, edição, persistência e temas isolados: '+label);
   await ctx.close();
  }
 }finally{await browser?.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});