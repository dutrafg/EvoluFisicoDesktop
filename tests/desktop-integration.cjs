const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const cs=read('src/EvoluFisico.Desktop/MainWindow.xaml.cs');
const ui=read('src/EvoluFisico.Desktop/wwwroot/assets/js/26-simple-interface.js');
const project=read('src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj');
const checks=[['Native update bridge',cs.includes('WebMessageReceived')&&cs.includes('check-updates')],['External navigation',cs.includes('NavigationStarting')],['Settings update button',ui.includes('ef-desktop-check-update')],['Branded executable',project.includes('ApplicationIcon')]];
for(const [name,ok] of checks){assert.ok(ok,name);console.log('PASS',name)}
