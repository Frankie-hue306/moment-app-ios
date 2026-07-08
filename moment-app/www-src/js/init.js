/**
 * 此刻 Moment - 初始化与入口
 * 从 public/index.html 拆分而来
 */
// ======================== INIT ========================
var seenWelcome=localStorage.getItem('mv_welcome');

// Wait for i18n to be loaded before showing UI
function bootApp(){
  if(AUTH.token&&AUTH.userId){setTimeout(function(){updateAllUI();updateSideMenuUser();processPendingQueue()},500)}
  else if(!seenWelcome){setTimeout(function(){document.getElementById('onboarding').style.display='block';refreshOnboardingI18n();initOnboardSwipe()},500)}
  else{setTimeout(showLogin,800)}
}

// Boot when i18n is ready (or after a short timeout)
if(I18N.isLoaded()){
  bootApp();
} else {
  I18N.onChange(function(){ bootApp(); });
  // Fallback: boot anyway after 2s
  setTimeout(function(){ if(!I18N.isLoaded()) bootApp(); }, 2000);
}

// Offline queue: auto-upload pending moments when connectivity returns
window.addEventListener('online',function(){
  if(typeof processPendingQueue==='function'){setTimeout(processPendingQueue,1000)}
});

// Immersive film pool auto-refreshes every 30s via loadFilmPool timer

// Status bar spacing now handled via env(safe-area-inset-top) in CSS
// Init UI
setTimeout(function(){
  updateHomeUI();updateSideMenuUser();
  // Init quick settings states
  // Sync daily pick from server if logged in
  if(isLoggedIn()){
    api('/api/user/preferences').then(function(r){
      if(!r.error){
        var dp=r.daily_pick_enabled!==false;
        document.getElementById('dailyPickState').textContent=dp?t('settings.on'):t('settings.off');
        document.getElementById('dailyPickState').style.color=dp?'var(--accent)':'var(--muted)';
      }
    }).catch(function(){});
  }else{
    var dp=localStorage.getItem('daily_pick_enabled')!=='0';
    document.getElementById('dailyPickState').textContent=dp?t('settings.on'):t('settings.off');
    document.getElementById('dailyPickState').style.color=dp?'var(--accent)':'var(--muted)';
  }
  var photoPublic=localStorage.getItem('photo_public')!=='0';
  document.getElementById('photoPublicState').textContent=photoPublic?t('settings.on'):t('settings.off');
  document.getElementById('photoPublicState').style.color=photoPublic?'var(--accent)':'var(--muted)';
  var dm=getDarkMode();
  document.getElementById('darkModeState').textContent=dm==='auto'?t('settings.darkModeAuto'):(dm==='light'?t('settings.darkModeLight'):t('settings.darkModeDark'));
  var iq=localStorage.getItem('img_quality')||'compressed';
  document.getElementById('imgQualityState').textContent=iq==='compressed'?t('settings.imageQualityCompressed'):t('settings.imageQualityOriginal');
  var sw=localStorage.getItem('starry_world')!=='0';
  document.getElementById('starryWorldState').textContent=sw?t('settings.on'):t('settings.off');
  document.getElementById('starryWorldState').style.color=sw?'var(--accent)':'var(--muted)';
  var ifx=localStorage.getItem('immersive_fx')!=='0';
  document.getElementById('immersiveFXState').textContent=ifx?t('settings.on'):t('settings.off');
  document.getElementById('immersiveFXState').style.color=ifx?'var(--accent)':'var(--muted)';
  // Init language state
  var el=document.getElementById('langState');if(el)el.textContent=getLangDisplayName(getLang());
  var nfy=localStorage.getItem('mv_notify');
  document.getElementById('notifyState').textContent=nfy==='1'?t('settings.on'):t('settings.off');
  document.getElementById('notifyState').style.color=nfy==='1'?'var(--accent)':'var(--muted)';
  applyDarkMode(dm);
},100);
// Haptic click feedback
var _clickAudio=null;
function hapticClick(){
  try{
    if(navigator.vibrate)navigator.vibrate(8);
    if(!_clickAudio){var ctx=new(window.AudioContext||window.webkitAudioContext)();_clickAudio=function(){var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=120;g.gain.setValueAtTime(.03,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.05);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.05)}}
    _clickAudio();
  }catch(e){}
}
// Add haptic to all interactive elements
setTimeout(function(){
  document.querySelectorAll('button, .menu-row, .nav-item, .btn, #mainActionBtn, .wf-card, [onclick]').forEach(function(el){
    if(!el.hasAttribute('data-haptic')){
      el.setAttribute('data-haptic','1');
      el.addEventListener('click',function(e){hapticClick()});
    }
  });
},600);

// ====================== CUSTOM DIALOG ======================
function showCustomDialog(msg,onOk,onCancel){
  if (typeof DS !== 'undefined' && DS.showDialog) {
    return DS.showDialog({
      message: msg,
      onConfirm: onOk,
      onCancel: onCancel,
      confirmLabel: t('common.confirm'),
      cancelLabel: t('common.cancel')
    });
  }
  // Fallback
  var overlay=document.createElement('div');overlay.className='custom-dialog-overlay';
  var dlg=document.createElement('div');dlg.className='custom-dialog';
  dlg.innerHTML='<p>'+escapeHtml(msg)+'</p><div class="btn-row"><button class="btn-cancel">'+t('common.cancel')+'</button><button class="btn-ok">'+t('common.confirm')+'</button></div>';
  overlay.appendChild(dlg);document.body.appendChild(overlay);
  dlg.querySelector('.btn-ok').onclick=function(){overlay.remove();if(onOk)onOk()};
  dlg.querySelector('.btn-cancel').onclick=function(){overlay.remove();if(onCancel)onCancel()};
  overlay.onclick=function(e){if(e.target===overlay){overlay.remove();if(onCancel)onCancel()}};
}


// ====================== IMAGE PROXY ======================
// Image proxy cache with LRU limit (max 30 entries)
var _imgCache={};
var _imgCacheKeys=[];
var _IMG_CACHE_MAX=30;
function cacheImage(url, blobUrl){
  if(_imgCache[url])return;
  // Evict oldest if cache full
  while(_imgCacheKeys.length>=_IMG_CACHE_MAX){
    var oldest=_imgCacheKeys.shift();
    if(_imgCache[oldest]){URL.revokeObjectURL(_imgCache[oldest]);delete _imgCache[oldest]}
  }
  _imgCache[url]=blobUrl;
  _imgCacheKeys.push(url);
}
// Listen for system dark mode changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){if(getDarkMode()==='auto')applyDarkMode('auto')});
