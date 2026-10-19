'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const js=fs.readFileSync('src/EvoluFisico.Desktop/wwwroot/assets/js/27-notifications.js','utf8');
assert.doesNotThrow(()=>new Function(js),'Notification module syntax');
for(const legacy of ['id="efn-vibration"','id="efn-test-vibration"','navigator.vibrate','testVibration:','prefs.vibration','supportsVibration','<b>Vibração</b>']){
 assert.ok(!js.includes(legacy),'Removed vibration feature must not reappear: '+legacy);
}
assert.match(js,/delete p\.vibration/,'Previously saved vibration preference is ignored');
assert.match(js,/id="efn-sound"/,'Sound setting remains');
assert.match(js,/id="efn-reminders"/,'Reminders remain');
assert.match(js,/id="efn-test-all"/,'Visual notification test remains');
console.log('PASS: Notification vibration removed at source without disabling reminders and sound');
