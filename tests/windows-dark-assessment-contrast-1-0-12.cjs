'use strict';
// Regressão estática de contraste no fluxo de avaliações do Desktop/WebView2.
// Roda com Node.js (sem navegador ou acesso a dados clínicos).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = 'src/EvoluFisico.Desktop/wwwroot/';
const read = file => fs.readFileSync(base + file, 'utf8');

const cssPath = 'assets/css/68-desktop-dark-assessment-contrast.css';
const css = read(cssPath);
const html = read('index.html');
const sw = read('sw.js');
const wizard = read('assets/js/07-opinions.js');

// CSS deve ser carregado por último para prevalecer sobre estilos antigos/inline.
const imported = [...html.matchAll(/assets\/css\/([\w-]+\.css)/g)].map(x => x[1]);
assert.equal(imported.at(-1), '68-desktop-dark-assessment-contrast.css',
  'a correção deve ser a última folha de estilos');
assert.ok(sw.includes('./' + cssPath), 'correção presente no precache offline');
assert.ok(sw.includes('dark-assessment-20261024'), 'cache precisa ser invalidado');
assert.ok(css.includes('@media screen'), 'correção exclusiva da UI em tela');
assert.ok(!css.includes('@media print'), 'não alterar estilos/PDF');

// Cada seletor de declaração deve manter a âncora de tema escuro e o módulo.
for (const raw of css.split('{').slice(1)) {
  const match = raw.split('}').pop().trim();
  if (!match || match.startsWith('/*') || match === '@media screen') continue;
  if (match.startsWith(':is(') || match.includes('html.ef-dark-mode')) {
    assert.ok(match.includes('#tab-novo-checkin'), 'estilo fora do fluxo da avaliação: ' + match);
    assert.ok(match.includes('dark-mode'), 'estilo não restrito ao tema escuro: ' + match);
  }
}
for (const selector of [
  '#edit-mode-alert', '#preview-soma-perimetria', '#preview-gordura-dobras',
  '.ef6-sec', '.ef6-resumo', '.ef6-kv', '.ef6-d.ok', '.ef6-d.bad',
  '.ef6-chip', '.ef6-chip.frase', '.photo-upload-card',
  '#success-screen', '#success-title', '#success-db-info',
  '#draft-alert'
]) assert.ok(css.includes(selector), 'seletor ausente: ' + selector);

for (const source of ['background:#f0fdf4','background:#f8fafc','background:#fefce8'])
  assert.ok(html.includes(source), 'estilo inline original mudou: ' + source);
for (const marker of ['ef6-resumo','ef6-kv','ef6-badge'])
  assert.ok(wizard.includes(marker), 'parecer deixou de produzir ' + marker);

// Critério de contraste mínimo WCAG AA para texto normal nos pares fixos novos.
function luminance(hex) {
  const values = hex.match(/[0-9a-f]{2}/gi).map(s => parseInt(s, 16) / 255);
  const rgb = values.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function ratio(a,b) {
  const vals=[luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (vals[0]+0.05)/(vals[1]+0.05);
}
for (const [fg,bg,label] of [
  ['#edf7f1','#172720','texto principal'],
  ['#b3c4bb','#172720','texto secundário'],
  ['#ffebbd','#382c1d','aviso de edição'],
  ['#fff5df','#594126','botão cancelar'],
  ['#7fe5aa','#172720','soma da perimetria'],
  ['#93c5fd','#172720','valor de dobras'],
  ['#ffdf91','#392e1c','frases rápidas'],
  ['#ffdea0','#30291a','parecer profissional']
]) assert.ok(ratio(fg,bg)>=4.5,
  label+' deve atingir WCAG AA: '+ratio(fg,bg).toFixed(2)+':1');

console.log('OK: CSS escuro isolado, sem alterar PDF, cache offline e contraste >= 4.5:1.');
