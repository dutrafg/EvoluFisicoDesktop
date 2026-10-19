/* 02-runtime.js */
// @ts-check
/**
 * @file EFU.ts (Compiled / Inlined)
 * @description Módulo de utilitários e tema para runtime browser.
 * @package EvoluFísico v8.9.1 Teste (Clinical Suite)
 */

/* ===== Módulo Global de Tema Escuro / Claro ===== */
function atualizarBotoesTema(isDark) {
    const navIcon = document.getElementById('nav-theme-icon');
    const navText = document.getElementById('nav-theme-text');
    const navBtn = document.getElementById('btn-theme-toggle');
    if (navIcon) navIcon.textContent = isDark ? '☀️' : '🌙';
    if (navText) navText.textContent = isDark ? 'Claro' : 'Escuro';
    if (navBtn) {
        navBtn.title = isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro';
        navBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }
}

function aplicarTemaGlobal(on) {
    document.documentElement.classList.toggle('ef-dark-mode', !!on);
    try {
        localStorage.setItem('evolufisico_dark_mode', on ? '1' : '0');
    } catch(e) {}
    atualizarBotoesTema(!!on);
}

function alternarModoEscuroGlobal() {
    const isDark = document.documentElement.classList.contains('ef-dark-mode');
    const novoEstado = !isDark;
    aplicarTemaGlobal(novoEstado);
    if (window.efToast) efToast(novoEstado ? '🌙 Modo escuro ativado' : '☀️ Modo claro ativado');
}

window.alternarModoEscuroGlobal = alternarModoEscuroGlobal;
window.aplicarTemaGlobal = aplicarTemaGlobal;
window.atualizarBotoesTema = atualizarBotoesTema;

(function() {
    try {
        const darkSalvo = localStorage.getItem('evolufisico_dark_mode') === '1';
        if (darkSalvo) {
            document.documentElement.classList.add('ef-dark-mode');
        }
    } catch(e) {}
})();

window.addEventListener('DOMContentLoaded', () => {
    const isDark = document.documentElement.classList.contains('ef-dark-mode');
    atualizarBotoesTema(isDark);
});

window.EFU=(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function num(v){var x=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(x)?x:null}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
  return Object.freeze({version:'8.9',esc:esc,num:num,norm:norm});
})();
