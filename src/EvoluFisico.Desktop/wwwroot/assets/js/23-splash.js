/* 21-runtime.js */
/* ===== MÓDULO DE ABERTURA & TRANSIÇÕES ===== */
(function() {
    let splashFechada = false;

    function fecharAbertura() {
        const splash = document.getElementById('ef-splash');
        if (!splash || splashFechada) return;
        splashFechada = true;
        const status = document.getElementById('ef-splash-status');
        if (status) status.textContent = 'Pronto para uso';
        splash.classList.add('dismissed');
        setTimeout(() => {
            splash.style.display = 'none';
        }, 500);
    }

    function reabrirAbertura() {
        const splash = document.getElementById('ef-splash');
        if (!splash) return;
        splashFechada = false;
        splash.style.display = 'flex';
        splash.classList.remove('dismissed');
        const status = document.getElementById('ef-splash-status');
        if (status) status.textContent = 'Inicializando módulos clínicos…';
        setTimeout(() => {
            fecharAbertura();
        }, 1150);
    }

    window.fecharAbertura = fecharAbertura;
    window.reabrirAbertura = reabrirAbertura;

    // Auto-fechar após 1.1s para experiência fluida sem espera excessiva
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(fecharAbertura, 1100);
    });

    // Teclas Esc e Enter fecham a abertura instantaneamente
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
            const splash = document.getElementById('ef-splash');
            if (splash && !splash.classList.contains('dismissed')) {
                fecharAbertura();
            }
        }
    });
})();
