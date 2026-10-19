const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const cs=read('src/EvoluFisico.Desktop/MainWindow.xaml.cs');
const ui=read('src/EvoluFisico.Desktop/wwwroot/assets/js/26-simple-interface.js');
const project=read('src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj');
const sqlite=read('src/EvoluFisico.Desktop/EncryptedSqliteStore.cs');
const vault=read('src/EvoluFisico.Desktop/ProtectedVault.cs');
const checks=[['Native update bridge',cs.includes('WebMessageReceived')&&cs.includes('check-updates')],['External navigation',cs.includes('NavigationStarting')],['Settings update button',ui.includes('ef-desktop-check-update')],['Branded executable',project.includes('ApplicationIcon')],['Automatic startup check',ui.includes("postMessage('check-updates-auto')")&&cs.includes('check-updates-auto')],['Dismissible update notification',ui.includes('ef-desktop-update-banner')&&ui.includes('Agora não')&&ui.includes('Baixar nova versão')],['Dismissed release is remembered',ui.includes('ef-desktop-dismissed-update')&&ui.includes('localStorage.setItem(releaseKey,m.downloadUrl)')&&ui.includes('!dismissed')],['Updater blocks older releases',cs.includes('InstalledBuildTime()')&&cs.includes('publishedAt.Value <= installedAt.Value')],['Displayed version matches beta',ui.includes("version.textContent='9.0.0-beta.2'")],['SQLite transactional encrypted storage',sqlite.includes('ProtectedVault.Encrypt')&&sqlite.includes('BeginTransaction()')&&sqlite.includes('PRAGMA integrity_check')],['Authenticated encryption',vault.includes('AesGcm')&&vault.includes('ProtectedData.Protect')]];
for(const [name,ok] of checks){assert.ok(ok,name);console.log('PASS',name)}
