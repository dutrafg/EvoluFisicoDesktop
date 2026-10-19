/* Registro e Gerenciamento do Service Worker & Cache Offline */
(function() {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.protocol === 'http:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    let updating=false;
    navigator.serviceWorker.addEventListener('controllerchange',function(){if(updating)location.reload()});
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then(function(reg) {
          console.log('[EvoluFísico PWA] Service Worker registrado com sucesso. Escopo:', reg.scope);
          
          reg.addEventListener('updatefound', function() {
            var newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', function() {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  const bar=document.createElement('div');bar.setAttribute('role','status');
                  bar.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;z-index:9999;padding:12px;background:#0f172a;color:#fff;border:1px solid #64748b;border-radius:8px';
                  bar.textContent='Nova versão pronta. Salve o formulário antes de atualizar. ';
                  const btn=document.createElement('button');btn.textContent='Atualizar agora';btn.type='button';
                  btn.onclick=()=>{updating=true;newWorker.postMessage({type:'SKIP_WAITING'})};bar.append(btn);document.body.append(bar);
                }
              });
            }
          });
        })
        .catch(function(err) {
          console.warn('[EvoluFísico PWA] Aviso ao registrar Service Worker:', err);
        });
    });
  }
})();
