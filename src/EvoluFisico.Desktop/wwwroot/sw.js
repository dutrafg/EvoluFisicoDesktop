/* EvoluFísico 8.9.1 — cache limitado aos recursos desta aplicação. */
const CACHE_PREFIX = 'evolufisico-';
const CACHE_NAME = 'evolufisico-desktop-1-0-12-pdf-names-new-evaluation-efia-2-0-1-20261023-dark-assessment-20261024';
const PRECACHE_ASSETS = /* PRECACHE_START */["./","./index.html","./evolufisico.html","./manifest.webmanifest","./favicon.svg","./icon-192.png","./icon-512.png","./assets/css/01.css","./assets/css/02.css","./assets/css/03.css","./assets/css/04.css","./assets/css/05.css","./assets/css/06.css","./assets/css/07.css","./assets/css/08.css","./assets/css/09.css","./assets/css/10.css","./assets/css/11.css","./assets/css/12.css","./assets/css/13.css","./assets/css/14.css","./assets/css/15.css","./assets/css/16.css","./assets/css/17.css","./assets/css/18.css","./assets/css/19.css","./assets/css/20.css","./assets/css/21.css","./assets/css/22.css","./assets/css/23-simple-interface.css","./assets/css/24-fonts.css","./assets/css/25-ficha-viva.css","./assets/css/26-modern.css","./assets/css/27-print-aurora.css","./assets/css/28-settings.css","./assets/css/29-notifications.css","./assets/css/31-desktop-refinement.css","./assets/js/01-storage.js","./assets/js/02-manifest.js","./assets/js/03-utils.js","./assets/js/04-data-integrity.js","./assets/js/05-app-runtime.js","./assets/js/06-dashboard.js","./assets/js/07-opinions.js","./assets/js/08-student-report.js","./assets/js/09-state-cache.js","./assets/js/10-history-worker.js","./assets/js/11-worker-pool.js","./assets/js/12-calculation.js","./assets/js/13-history-analytics.js","./assets/js/14-insights.js","./assets/js/15-decision-engine.js","./assets/js/16-evolution-profile.js","./assets/js/17-evolution-comparison.js","./assets/js/18-monitoring.js","./assets/js/19-accessibility.js","./assets/js/20-lab.js","./assets/js/21-reports.js","./assets/js/22-diagnostics.js","./assets/js/23-splash.js","./assets/js/24-billing.js","./assets/js/25-pwa.js","./assets/js/26-simple-interface.js","./assets/js/27-notifications.js","./assets/css/32-forms-clean.css","./assets/css/33-settings-alignment.css","./assets/css/34-diagnostics-expanded.css","./assets/css/35-dark-profile-fix.css","./assets/css/36-print-restore.css","./assets/css/37-settings-navigation.css","./assets/js/32-forms-clean.js","./assets/js/33-settings-navigation.js","./assets/js/34-pre-cadastro.js","./assets/css/40-unified-analysis.css","./assets/css/41-panel-refinements.css","./assets/css/42-analysis-safety.css","./assets/css/43-analysis-page.css","./assets/css/44-date-selection.css","./assets/css/45-analysis-minimum.css","./assets/js/40-unified-safety.js","./assets/js/41-lab-evidence.js","./assets/js/42-analysis-reports.js","./assets/js/43-analysis-page.js","./assets/js/44-unified-analysis.js","./assets/js/50-billing-monthly.js","./assets/js/51-organization.js","./assets/js/52-home-dashboard.js","./assets/js/53-custom-cards.js","./assets/js/54-professional-profile.js","./assets/js/55-visual-effects.js","./assets/js/56-global-search.js","./assets/js/57-global-search-controls.js","./assets/js/58-shortcuts.js","./assets/js/59-mobile-navigation.js","./assets/css/50-billing-monthly.css","./assets/css/51-organization.css","./assets/css/52-home-dashboard.css","./assets/css/53-custom-cards.css","./assets/css/54-professional-profile.css","./assets/css/55-visual-effects.css","./assets/css/56-global-search.css","./assets/css/57-visual-polish.css","./assets/css/58-decision-center.css","./assets/css/59-mobile-navigation.css","./assets/css/60-desktop-effects-120.css","./assets/css/61-accessible-icons.css","./assets/js/61-accessible-icons.js","./assets/css/62-reload-guard.css","./assets/js/62-reload-guard.js","./assets/css/63-responsive-qa.css","./assets/js/64-whats-new.js","./assets/css/64-whats-new.css","./assets/js/65-pdf-filenames.js", "./assets/efia/efia-local.js", "./assets/efia/efia-anthropometry.js", "./assets/efia/efia-host.js", "./assets/efia/efia-ui.js", "./assets/efia/efia.css", "./assets/css/66-web-2028-sync.css", "./assets/css/67-home-card-layout.css", "./assets/js/67-home-card-layout.js","./assets/css/65-evaluations-action.css","./assets/css/68-desktop-dark-assessment-contrast.css"]/* PRECACHE_END */;
self.addEventListener('install', event => {
  // Uma instalação incompleta falha e mantém o worker anterior ativo.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS)));
});
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request=event.request, url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!/^https?:$/.test(url.protocol))return;
  const allowed=new Set(PRECACHE_ASSETS.map(path=>new URL(path,self.registration.scope).pathname));
  const canonical=new URL(url);
  for(const name of ['index','evolufisico'])if(url.pathname===new URL('./'+name,self.registration.scope).pathname)canonical.pathname += '.html';
  if(!allowed.has(canonical.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    // Serve HTML and dependencies from the same installed release.
    const cached=await cache.match(request) || await cache.match(canonical.href);
    if(cached)return cached;
    if(request.mode==='navigate'){
      const fallback=await cache.match(new URL('./index.html',self.registration.scope).href);
      if(fallback)return fallback;
    }
    try{return await fetch(request)}catch(e){return new Response('Abra o aplicativo uma vez com conexão para disponibilizar os recursos offline.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}
  })());
});
