'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../src/EvoluFisico.Desktop/wwwroot');
const server = http.createServer((req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) throw Error('invalid path');
    res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' :
      file.endsWith('.css') ? 'text/css' : file.endsWith('.json') ? 'application/json' : 'text/html');
    res.end(fs.readFileSync(file));
  } catch (_) {
    res.writeHead(404);
    res.end('Not found');
  }
});

(async () => {
  let browser;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    browser = await chromium.launch({
      executablePath: process.env.EF_CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    for (const width of [360, 390, 430]) {
      const context = await browser.newContext({
        viewport: { width, height: 852 }, reducedMotion: 'reduce', serviceWorkers: 'block'
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      page.on('dialog', dialog => dialog.accept());
      await page.addInitScript(() => {
        localStorage.setItem('evolufisico_pro_nome', 'QA Navegação');
        localStorage.setItem('ef_general_splash_v1', '0');
      });
      await page.goto('http://127.0.0.1:' + server.address().port, { waitUntil: 'domcontentloaded' });
      await page.locator('#efm-float-nav .efm-trigger').click();
      const item = page.locator('#efm-float-nav .efm-item[data-efm-route="tab-analises"]');
      await item.waitFor({ state: 'visible' });
      const result = await item.evaluate(button => {
        const svg = button.querySelector('svg');
        const shape = svg.getBBox();
        const outer = svg.getBoundingClientRect();
        const card = button.getBoundingClientRect();
        return {
          viewBox: svg.getAttribute('viewBox'),
          transformed: !!svg.querySelector('[transform]'),
          shape: { x: shape.x, y: shape.y, right: shape.x + shape.width, bottom: shape.y + shape.height },
          svgInsideButton: outer.y >= card.y && outer.bottom <= card.bottom,
          iconCount: button.querySelectorAll('svg').length
        };
      });
      assert.equal(result.viewBox, '0 0 24 24');
      assert.equal(result.transformed, false);
      assert.equal(result.iconCount, 1);
      assert(result.shape.x >= 0 && result.shape.y >= 0 && result.shape.right <= 24 && result.shape.bottom <= 24,
        'Análises: o desenho deve ficar dentro de 24x24');
      assert(result.svgInsideButton, 'O ícone deve ficar dentro do botão');
      await item.click();
      assert.equal(await item.isVisible(), false, 'A navegação deve fechar o menu');
      assert.deepEqual(errors, [], 'Sem erros JavaScript');
      await context.close();
      console.log('PASS menu flutuante: Análises Completas, ' + width + 'px');
    }
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
  server.close();
});
