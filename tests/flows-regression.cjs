const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const runtime=read('assets/js/05-app-runtime.js');
const ui=read('assets/js/26-simple-interface.js');
const cases=[
['Avaliações: gravação no IndexedDB',/function salvarAvaliacaoNoDB\s*\(/.test(runtime)&&runtime.includes("db.transaction([STORE_NAME], 'readwrite')")],
['Avaliações: operação de escrita aguarda commit',runtime.includes('tx.oncomplete = resolve')],
['Avaliações: criptografia antes de persistir',runtime.includes('EF_Security.encryptObject(registro)')],
['Backup: exportação por envelope',runtime.includes('EF_BackupEngine.gerarEnvelopeBackup')],
['Backup: restauração por arquivo',runtime.includes('function importarBackupJSON(event)')&&runtime.includes('lerEProcessarArquivoBackup(file)')],
['Backup: leitura com tratamento de erro',runtime.includes('reader.onerror = function()')],
['PDF: impressão individual',runtime.includes('window.print();')],
['PDF: relatório comparativo valida duas avaliações',runtime.includes('Selecione duas avaliações diferentes para gerar o relatório comparativo.')],
['PDF: estilos de impressão existem',fs.existsSync('assets/css/27-print-aurora.css')],
['Interface: navegação entre avaliações e configurações',ui.includes('tab-historico')&&ui.includes('tab-settings')]
];
for(const [name,passed] of cases){assert.ok(passed,name);console.log('PASS',name)}
console.log('TOTAL',cases.length,'static flow guards; not browser end-to-end tests');
