'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../src/EvoluFisico.Desktop/wwwroot');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'assets/js/05-app-runtime.js'), 'utf8');

const stages = [...html.matchAll(/<div class="step(?: active)?" data-name="([^"]+)" data-step="([^"]+)"/g)];
assert.equal(stages.length, 6, 'evaluation wizard exposes six stages');
assert.equal(stages[1][1], 'Objetivos', 'objectives remain in stage two');
assert.equal(stages[1][2], '2');
assert.equal(stages[2][2], '3');
assert.equal(stages[5][2], '6');
assert.match(html, /data-step-target="6" onclick="irParaEtapa\(5\)"/);
assert.match(html, /<div class="step-label">Objetivos<\/div>/);
assert.match(html, /id="objetivo_detalhes" name="objetivo_detalhes"/);

for (const value of ['redução de gordura', 'ganho de massa muscular', 'força', 'condicionamento', 'saúde e bem-estar']) {
  assert.ok(html.includes('name="objetivos" type="checkbox" value="' + value + '"'), 'missing objective option: ' + value);
}
assert.ok(runtime.includes("objetivos: formData.getAll('objetivos').map(v => String(v).trim()).filter(Boolean)"), 'multiple objectives persist with the assessment');
assert.ok(runtime.includes("objetivo_detalhes: (formData.get('objetivo_detalhes') || '').trim()"), 'objective notes persist with the assessment');
assert.ok(runtime.includes("document.querySelectorAll('input[name=\"objetivos\"]')"), 'editing an assessment restores its objective selections');
assert.ok(runtime.includes("document.getElementById('objetivo_detalhes').value = aval.objetivo_detalhes || ''"), 'editing an assessment restores objective notes');
assert.ok(runtime.includes('const formData = new FormData(form)'), 'wizard submits using native form data');
console.log('PASS six-stage evaluation order, objective choices, persistence and edit restoration.');
