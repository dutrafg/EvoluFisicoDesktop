'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.resolve(__dirname,'../src/EvoluFisico.Desktop/wwwroot/assets/js/42-analysis-reports.js'),'utf8');
const window={__EF63_STATE__:{version:12}};
const context=vm.createContext({window,document:{}});
vm.runInContext(source,context,{filename:'42-analysis-reports.js'});
const api=window.EFUnifiedReport;
assert.equal(api.isDraftCurrent({dataVersion:'12|fingerprint'}),true);
assert.equal(api.isDraftCurrent({dataVersion:'11|fingerprint'}),false);
assert.equal(api.isDraftCurrent({dataVersion:'|fingerprint'}),false);
window.__EF63_STATE__.version++;
assert.equal(api.isDraftCurrent({dataVersion:'12|fingerprint'}),false);
assert.equal(api.isDraftCurrent({dataVersion:'13|fingerprint'}),true);
console.log('PASS stale analysis report drafts are detected after the assessment state version changes.');
