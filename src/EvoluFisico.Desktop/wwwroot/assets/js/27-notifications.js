/* EvoluFísico 9.0-beta — Notificações locais de agenda, som sintetizado e vibração. */
(function(){'use strict';
  const KEY='ef90_notification_preferences_v1';
  const SENT_KEY='ef90_notification_events_sent_v1';
  const AGENDA_KEY='ef90_home_agenda';
  const DEFAULTS={ reminders:true, sound:false, vibration:false, minutes:15, volume:55 };
  const $=id=>document.getElementById(id);
  const supportsVibration=typeof navigator!=='undefined' && typeof navigator.vibrate==='function';
  let prefs=readPrefs();
  let audioContext=null;
  let initialized=false;
  let timer=null;
  let lastStatus='';

  function safeParse(key,fallback){try{const val=localStorage.getItem(key);return val?JSON.parse(val):fallback}catch(_){return fallback}}
  function readPrefs(){const saved=safeParse(KEY,{});const p=Object.assign({},DEFAULTS,saved && typeof saved==='object'&&!Array.isArray(saved)?saved:{});
    p.minutes=[0,5,10,15,30,60].includes(Number(p.minutes))?Number(p.minutes):15;
    p.volume=Math.max(0,Math.min(100,Number(p.volume)||0));
    p.reminders=!!p.reminders;p.sound=!!p.sound;p.vibration=!!p.vibration;
    return p;
  }
  function savePrefs(){try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(_){}}
  function status(message){lastStatus=message;const el=$('efn-status');if(el)el.textContent=message}
  function notifyOnScreen(message,type){
    try{if(typeof window.efToast==='function'){window.efToast(message,type||'');return}}catch(_){ }
    const live=$('efn-live-region');if(live){live.textContent=message;live.hidden=false;setTimeout(()=>{if(live.textContent===message)live.hidden=true},6000)}
  }
  async function playSound(){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC){status('Este navegador não oferece reprodução de áudio programático.');return false}
    try{
      if(!audioContext || audioContext.state==='closed')audioContext=new AC();
      if(audioContext.state==='suspended')await audioContext.resume();
      if(audioContext.state!=='running')throw new Error('Áudio bloqueado');
      const now=audioContext.currentTime + .02;
      const level=(prefs.volume/100)*0.13;
      if(level<=0){status('O volume está em zero. Ajuste o volume para ouvir o teste.');return false}
      // Dois toques suaves de sino, sem arquivos externos ou downloads.
      [{at:0,freq:784,duration:.20},{at:.24,freq:1046.50,duration:.36}].forEach(n=>{
        const osc=audioContext.createOscillator();const gain=audioContext.createGain();
        osc.type='sine';osc.frequency.setValueAtTime(n.freq,now+n.at);
        gain.gain.setValueAtTime(.0001,now+n.at);
        gain.gain.exponentialRampToValueAtTime(level,now+n.at+.015);
        gain.gain.exponentialRampToValueAtTime(.0001,now+n.at+n.duration);
        osc.connect(gain);gain.connect(audioContext.destination);
        osc.start(now+n.at);osc.stop(now+n.at+n.duration+.015);
      });
      return true;
    }catch(_){status('O navegador bloqueou o áudio automático. Toque em “Ouvir som” para habilitá-lo.');return false}
  }
  function vibrate(){
    if(!supportsVibration){status('Este navegador ou dispositivo não oferece suporte à vibração.');return false}
    try{const ok=navigator.vibrate([120,75,180]);if(!ok){status('O dispositivo recusou a vibração. Confira o modo silencioso e as permissões.');return false}return true}
    catch(_){status('Não foi possível ativar a vibração neste dispositivo.');return false}
  }
  function alertSignal(){
    if(prefs.sound)playSound();
    if(prefs.vibration)vibrate();
  }
  function readAgenda(){const data=safeParse(AGENDA_KEY,[]);return Array.isArray(data)?data:[]}
  function dateFromAppointment(e){
    if(!e || !/^\d{4}-\d\d-\d\d$/.test(String(e.date||'')))return null;
    const hh=String(e.time||'').match(/^(\d\d):(\d\d)$/);
    if(!hh)return null;
    const parts=e.date.split('-').map(Number);
    const d=new Date(parts[0],parts[1]-1,parts[2],Number(hh[1]),Number(hh[2]),0,0);
    if(d.getFullYear()!==parts[0]||d.getMonth()!==parts[1]-1||d.getDate()!==parts[2])return null;
    return d;
  }
  function reminderText(e,start,now){
    const when=start.getTime()-now;
    const left=Math.ceil(when/60000);
    const base=(e.type==='reavaliacao'?'Reavaliação':e.type==='avaliacao'?'Avaliação':e.type==='retorno'?'Retorno':'Atendimento');
    const who=(String(e.student||'').trim()||'Sem nome');
    const location=String(e.location||e.local||e.place||'').trim();
    return base+' de '+who+(when<=0?' começa agora':(' começa em '+left+' min'))+'. '+(location?'Local: '+location+'.':'');
  }
  function checkAppointments(){
    if(!prefs.reminders || document.hidden)return;
    const now=Date.now(),lead=prefs.minutes*60000;
    const sent=safeParse(SENT_KEY,{});
    const seen=sent && typeof sent==='object'&&!Array.isArray(sent)?sent:{};
    const agenda=readAgenda();let changed=false;
    Object.keys(seen).forEach(k=>{if(now-Number(seen[k])>7*86400000 || Number(seen[k])>now+600000){delete seen[k];changed=true}});
    agenda.forEach(e=>{
      if(!e || ['cancelado','concluido','faltou','não compareceu'].includes(String(e.status||'').toLowerCase()))return;
      const date=dateFromAppointment(e);if(!date)return;
      const ms=date.getTime()-now;
      if(ms>lead || ms < -60000)return;
      const uid=String(e.id||e.student||'compromisso')+'|'+e.date+'|'+e.time+'|'+prefs.minutes;
      if(seen[uid])return;
      seen[uid]=now;changed=true;
      notifyOnScreen(reminderText(e,date,now));alertSignal();
    });
    if(changed){try{localStorage.setItem(SENT_KEY,JSON.stringify(seen))}catch(_){}}
  }
  function updateUI(){
    const ids=[['efn-reminders','reminders'],['efn-sound','sound'],['efn-vibration','vibration']];
    ids.forEach(pair=>{const el=$(pair[0]);if(el)el.checked=!!prefs[pair[1]]});
    const lead=$('efn-minutes');if(lead)lead.value=String(prefs.minutes);
    const volume=$('efn-volume');if(volume)volume.value=String(prefs.volume);
    const v=$('efn-volume-output');if(v)v.textContent=prefs.volume+'%';
    const vib=$('efn-vibration');if(vib){vib.disabled=!supportsVibration;vib.title=supportsVibration?'Vibrar em dispositivos compatíveis':'Vibração não disponível neste navegador'}
    const vhelp=$('efn-vibration-help');if(vhelp)vhelp.textContent=supportsVibration?'Vibração disponível neste navegador; a resposta depende do aparelho e das configurações de sistema.':'Vibração indisponível neste navegador. No iPhone/iPad, navegadores geralmente não permitem vibrar por páginas web.';
    if(lastStatus)status(lastStatus);
  }
  function buildCard(){
    const parent=document.querySelector('#tab-settings .ef-settings-grid');
    if(!parent)return false;
    if($('efn-card'))return true;
    const card=document.createElement('article');card.className='ef-settings-card efn-card';card.id='efn-card';
    card.innerHTML=`<div class="ef-settings-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg></div>
      <h3>Notificações</h3><p>Personalize os lembretes dos atendimentos enquanto o aplicativo estiver aberto.</p>
      <div class="efn-options">
        <label class="efn-setting"><span><b>Lembretes da agenda</b><small>Mostrar avisos próximos ao horário marcado.</small></span><input id="efn-reminders" type="checkbox"/></label>
        <label class="efn-setting"><span><b>Som de notificação</b><small>Sinal sonoro suave produzido pelo próprio aplicativo.</small></span><input id="efn-sound" type="checkbox"/></label>
        <label class="efn-setting"><span><b>Vibração</b><small id="efn-vibration-help">Verificando suporte do dispositivo...</small></span><input id="efn-vibration" type="checkbox"/></label>
        <label class="efn-field"><span>Antecedência do aviso</span><select id="efn-minutes"><option value="0">Na hora</option><option value="5">5 minutos antes</option><option value="10">10 minutos antes</option><option value="15">15 minutos antes</option><option value="30">30 minutos antes</option><option value="60">1 hora antes</option></select></label>
        <label class="efn-field"><span>Volume do som <output id="efn-volume-output" for="efn-volume">55%</output></span><input type="range" min="0" max="100" step="5" id="efn-volume"/></label>
      </div>
      <div class="efn-actions"><button type="button" class="efn-test" id="efn-test-sound">Ouvir som</button><button type="button" class="efn-test" id="efn-test-vibration">Testar vibração</button><button type="button" class="efn-test efn-test-primary" id="efn-test-all">Testar aviso</button></div>
      <p class="efn-status" role="status" aria-live="polite" id="efn-status">Preferências armazenadas neste navegador.</p>
      <small class="efn-limitation">Som e vibração dependem da permissão do navegador e da interação do usuário. Avisos funcionam com o aplicativo aberto; não são notificações em segundo plano.</small>
      <div id="efn-live-region" role="status" aria-live="polite" hidden></div>`;
    const next=$('ef-setting-professional')?.closest('.ef-settings-card');
    if(next)parent.insertBefore(card,next);else parent.append(card);
    return true;
  }
  function bind(){
    const map={ 'efn-reminders':'reminders','efn-sound':'sound','efn-vibration':'vibration' };
    Object.entries(map).forEach(([id,key])=>$(id).addEventListener('change',e=>{prefs[key]=!!e.target.checked;savePrefs();status('Preferência salva.');if(key==='reminders'&&prefs.reminders)checkAppointments()}));
    $('efn-minutes').addEventListener('change',e=>{prefs.minutes=Number(e.target.value);savePrefs();status('Antecedência salva.');checkAppointments()});
    $('efn-volume').addEventListener('input',e=>{prefs.volume=Number(e.target.value);savePrefs();$('efn-volume-output').textContent=prefs.volume+'%'});
    $('efn-test-sound').addEventListener('click',async()=>{const ok=await playSound();if(ok)status('Som reproduzido. Se não ouviu, confira o volume do aparelho.')});
    $('efn-test-vibration').addEventListener('click',()=>{if(vibrate())status('Sinal de vibração enviado ao dispositivo.')});
    $('efn-test-all').addEventListener('click',async()=>{notifyOnScreen('Teste de notificação: som e vibração do EvoluFísico.');const audio=await playSound();const vib=vibrate();status(audio||vib?'Teste executado. Confira o som e a vibração no dispositivo.':'Não foi possível reproduzir o som nem a vibração neste navegador.')});
    // Uma interação deliberada libera o áudio em alguns navegadores, mesmo sem ouvir um teste.
    document.addEventListener('pointerdown',()=>{if(!prefs.sound)return;const AC=window.AudioContext||window.webkitAudioContext;if(AC&&!audioContext){try{audioContext=new AC()}catch(_){}}if(audioContext?.state==='suspended')audioContext.resume().catch(()=>{})},{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkAppointments()});
    ['ef90SaveAgenda','ef90SetStatus','ef90RemoveAgenda'].forEach(name=>{
      const prior=window[name];if(typeof prior==='function'&&!prior.__efnWrapped){
        const wrapper=function(){const value=prior.apply(this,arguments);setTimeout(checkAppointments,0);return value};
        wrapper.__efnWrapped=true;window[name]=wrapper;
      }
    });
  }
  function init(){if(initialized)return true;if(!buildCard())return false;initialized=true;bind();updateUI();checkAppointments();timer=setInterval(checkAppointments,30000);return true}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!init()){setTimeout(init,600);setTimeout(init,2000)}},{once:true});
  else if(!init()){setTimeout(init,600);setTimeout(init,2000)}
  window.EFNotifications={getSettings:()=>Object.assign({},prefs),testSound:playSound,testVibration:vibrate,check:checkAppointments};
})();
