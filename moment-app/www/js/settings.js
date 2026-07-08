/**
 * 此刻 Moment - 设置与偏好
 * 从 public/index.html 拆分而来
 */
// ======================== SIDE MENU & SETTINGS ========================
function openSideMenu(){
  document.getElementById('sideMenu').classList.add('open');
  document.getElementById('menuOverlay').style.display='block';
  updateSideMenuUser();
}
function openQuickSettings(){
  document.getElementById('quickSettings').classList.add('open');
  document.getElementById('menuOverlay').style.display='block';
  refreshSettingsI18n();
}
function closeAllPanels(){
  document.getElementById('sideMenu').classList.remove('open');
  document.getElementById('quickSettings').classList.remove('open');
  document.getElementById('menuOverlay').style.display='none';
  closeReportSheet();
  closeModeSheet();
  closeDarkModeSheet();
  closeLangSheet();
}
// ======================== QUICK SETTINGS ========================
function toggleDailyPick(){
  var el=document.getElementById('dailyPickState');
  var current=el.textContent===t('settings.on')||el.textContent==='已开启';
  var next=!current;
  el.textContent=next?t('settings.on'):t('settings.off');
  el.style.color=next?'var(--accent)':'var(--muted)';
  if(isLoggedIn()){
    api('/api/user/preferences',{method:'POST',body:{daily_pick_enabled:next}}).catch(function(){});
  }else{
    localStorage.setItem('daily_pick_enabled',next?'1':'0');
  }
}
function restoreBackup(){
  var bk=localStorage.getItem('mv21_backup');
  if(!bk){alert(t('settings.noBackup'));return}
  var data;try{data=JSON.parse(bk)}catch(e){alert(t('settings.backupCorrupted'));return}
  if(!data||!data.m||!data.m.length){alert(t('settings.backupEmpty'));return}
  var at=localStorage.getItem('mv21_backup_at');
  var when=at?new Date(parseInt(at)).toLocaleString(getLocaleForIntl()):t('settings.unknownTime');
  if(!confirm(t('settings.restoreConfirm',{count:data.m.length,time:when})))return;
  D={m:data.m,c:typeof data.c==='number'?data.c:data.m.length,i:typeof data.i==='number'?data.i:-1};
  save();
  showToast(t('settings.restored',{count:data.m.length}));
  updateAllUI();updateSideMenuUser();
}
function doClearCache(){
  if(confirm(t('settings.clearCacheConfirm'))){
    try{
      // Clear image blob cache
      for(var k in _imgCache){try{URL.revokeObjectURL(_imgCache[k])}catch(e){}}
      _imgCache={};_imgCacheKeys=[];
      // Clear waterfall cached data
      wfMoments=[];wfPage=1;wfHasMore=true;
      // Clear film pool cached data
      filmPool=[];
      // Clear collage cached data
      collageAvailable=[];collageCanvas=null;
    }catch(e){}
    showToast(t('settings.cacheCleared'));
  }
}
function openDarkModeSheet(){
  var mode=getDarkMode();
  document.getElementById('dm-check-auto').style.display=mode==='auto'?'inline':'none';
  document.getElementById('dm-check-light').style.display=mode==='light'?'inline':'none';
  document.getElementById('dm-check-dark').style.display=mode==='dark'?'inline':'none';
  document.getElementById('darkModeSheet').style.transform='translateY(0)';
}
function closeDarkModeSheet(){
  document.getElementById('darkModeSheet').style.transform='translateY(100%)';
}
function getDarkMode(){
  return localStorage.getItem('dark_mode')||(new Date().getHours()>=7&&new Date().getHours()<19?'light':'dark');
}
function effectiveDarkMode(){
  var dm=getDarkMode();
  if(dm==='auto'){return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
  return dm;
}
function setDarkMode(mode){
  localStorage.setItem('dark_mode',mode);
  var label=mode==='auto'?t('settings.darkModeAuto'):(mode==='light'?t('settings.darkModeLight'):t('settings.darkModeDark'));
  document.getElementById('darkModeState').textContent=label;
  applyDarkMode(mode);
  // 切换模式后重建星空：清空旧元素（深色星星/浅色云朵），按新模式重新生成
  if(starryWorldEnabled&&typeof initStarryWorld==='function'){initStarryWorld()}
  closeDarkModeSheet();
}
function applyDarkMode(mode){
  var r=document.documentElement.style;
  if(mode==='auto'){mode=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
  // Update starry world bg if enabled
  if(starryWorldEnabled){
    var sw=document.getElementById('starryWorld');
    if(sw){sw.setAttribute('data-mode',mode);sw.style.display='block'}
  }
  // Design System: apply data-theme for token-based light mode
  if(mode==='light'){
    document.documentElement.setAttribute('data-theme','light');
    r.setProperty('--bg','#E8F4FD');r.setProperty('--accent','#1E6FA8');
    r.setProperty('--card','#fff');
    r.setProperty('--text','#1c2b36');
    r.setProperty('--muted','#5a7384');
    r.setProperty('--overlay-bg','rgba(255,255,255,.95)');
    r.setProperty('--panel-bg','#EAF4FC');
    r.setProperty('--nav-bg','rgba(232,244,253,.85)');
    r.setProperty('--nav-border','rgba(0,40,80,.10)');
    r.setProperty('--menu-bg','#fff');
    r.setProperty('--menu-sep','rgba(0,40,80,.08)');
    r.setProperty('--tab-bg','#E8F4FD');
    r.setProperty('--sheet-bg','#fff');
    r.setProperty('--overlay-alpha','rgba(0,0,0,.3)');
    r.setProperty('--card-shadow','0 2px 8px rgba(60,158,220,.10)');
    var btn=document.getElementById('mainActionBtn');if(btn)btn.classList.add('light-glass')
    r.setProperty('--world-bg','#0B0E1A');
  }else{
    document.documentElement.removeAttribute('data-theme');
    r.setProperty('--bg','#000');r.setProperty('--accent','#D4A373');
    r.setProperty('--card','#1c1c1e');
    r.setProperty('--text','#f5f5f7');
    r.setProperty('--muted','#98989d');
    r.setProperty('--overlay-bg','rgba(0,0,0,.85)');
    r.setProperty('--panel-bg','#0d0d0f');
    r.setProperty('--nav-bg','rgba(0,0,0,.85)');
    r.setProperty('--nav-border','rgba(255,255,255,.06)');
    r.setProperty('--menu-bg','#0d0d0f');
    r.setProperty('--menu-sep','rgba(255,255,255,.06)');
    r.setProperty('--tab-bg','#000');
    r.setProperty('--sheet-bg','#1c1c1e');
    r.setProperty('--overlay-alpha','rgba(0,0,0,.55)');
    r.setProperty('--card-shadow','none');
    var btn=document.getElementById('mainActionBtn');if(btn)btn.classList.remove('light-glass')
    r.setProperty('--world-bg','#0B0E1A');
  }
}
function toggleImmersiveFX(){
  var current=localStorage.getItem('immersive_fx')!=='0';
  var next=!current;
  localStorage.setItem('immersive_fx',next?'1':'0');
  document.getElementById('immersiveFXState').textContent=next?t('settings.on'):t('settings.off');
  document.getElementById('immersiveFXState').style.color=next?'var(--accent)':'var(--muted)';
  showToast(next?t('settings.fxOnToast'):t('settings.fxOffToast'));
}
function toggleImageQuality(){
  var current=localStorage.getItem('img_quality')||'compressed';
  var next=current==='compressed'?'original':'compressed';
  localStorage.setItem('img_quality',next);
  document.getElementById('imgQualityState').textContent=next==='compressed'?t('settings.imageQualityCompressed'):t('settings.imageQualityOriginal');
}
function openLink(url){
  try{window.open(url,'_blank')}catch(e){}
}
function showAbout(){
  closeAllPanels();
  alert(t('about.text'));
}
var _legalTexts={
  terms:{
    'zh-Hans':"<h2>用户协议</h2><p>更新日期：2026年6月26日</p><h3>1. 服务说明</h3><p>此刻App是一款个人生活记录工具，每天为您提供一次记录当下瞬间的机会。</p><h3>2. 用户行为规范</h3><p>不得上传色情、暴力、骚扰、广告或侵犯他人隐私的内容。违反者内容将被移除，严重者账号注销。</p><h3>3. 内容审核</h3><p>您上传的内容可能经过审核。不符合规范的内容将标记为审核中或已被移除。</p><h3>4. 知识产权</h3><p>您拍摄的内容著作权归您所有。您可随时删除内容。</p><h3>5. 免责声明</h3><p>您对上传内容承担法律责任。因不可抗力导致服务中断我们不承担责任。</p><h3>6. 联系我们</h3><p>moment.app@163.com</p>",
    'zh-Hant':"<h2>使用者條款</h2><p>更新日期：2026年6月26日</p><h3>1. 服務說明</h3><p>此刻App是一款個人生活記錄工具，每天為您提供一次記錄當下瞬間的機會。</p><h3>2. 使用者行為規範</h3><p>不得上傳色情、暴力、騷擾、廣告或侵犯他人隱私的內容。違反者內容將被移除，嚴重者帳號註銷。</p><h3>3. 內容審核</h3><p>您上傳的內容可能經過審核。不符合規範的內容將標記為審核中或已被移除。</p><h3>4. 智慧財產權</h3><p>您拍攝的內容著作權歸您所有。您可隨時刪除內容。</p><h3>5. 免責聲明</h3><p>您對上傳內容承擔法律責任。因不可抗力導致服務中斷我們不承擔責任。</p><h3>6. 聯絡我們</h3><p>moment.app@163.com</p>",
    en:"<h2>Terms of Service</h2><p>Last updated: June 26, 2026</p><h3>1. Service Description</h3><p>Moment is a personal life recording tool that gives you one chance each day to capture the present moment.</p><h3>2. User Conduct</h3><p>Do not upload pornographic, violent, harassing, advertising, or privacy-infringing content. Violators will have content removed; serious cases will have accounts terminated.</p><h3>3. Content Review</h3><p>Your uploaded content may be reviewed. Content that does not comply will be marked as under review or removed.</p><h3>4. Intellectual Property</h3><p>You own the copyright to the content you capture. You may delete content at any time.</p><h3>5. Disclaimer</h3><p>You bear legal responsibility for uploaded content. We are not liable for service interruptions due to force majeure.</p><h3>6. Contact Us</h3><p>moment.app@163.com</p>",
    ja:"<h2>利用規約</h2><p>最終更新日：2026年6月26日</p><h3>1. サービス説明</h3><p>Momentは、毎日一度、今この瞬間を記録する機会を提供する個人の生活記録ツールです。</p><h3>2. ユーザー行動規範</h3><p>わいせつ、暴力、ハラスメント、広告、または他者のプライバシーを侵害するコンテンツをアップロードしないでください。違反者はコンテンツが削除され、重大な場合はアカウントが停止されます。</p><h3>3. コンテンツ審査</h3><p>アップロードされたコンテンツは審査される場合があります。基準を満たさないコンテンツは審査中または削除済みとしてマークされます。</p><h3>4. 知的財産権</h3><p>撮影したコンテンツの著作権はあなたに帰属します。いつでもコンテンツを削除できます。</p><h3>5. 免責事項</h3><p>アップロードされたコンテンツについて法的責任を負います。不可抗力によるサービス中断について、当社は責任を負いません。</p><h3>6. お問い合わせ</h3><p>moment.app@163.com</p>",
    ko:"<h2>이용약관</h2><p>최종 업데이트: 2026년 6월 26일</p><h3>1. 서비스 설명</h3><p>Moment는 매일 한 번, 지금 이 순간을 기록할 수 있는 기회를 제공하는 개인 생활 기록 도구입니다.</p><h3>2. 사용자 행동 규범</h3><p>음란물, 폭력, 괴롭힘, 광고 또는 타인의 개인정보를 침해하는 콘텐츠를 업로드하지 마십시오. 위반 시 콘텐츠가 삭제되며, 심각한 경우 계정이 정지됩니다.</p><h3>3. 콘텐츠 검토</h3><p>업로드된 콘텐츠는 검토될 수 있습니다. 기준에 부합하지 않는 콘텐츠는 검토 중 또는 삭제됨으로 표시됩니다.</p><h3>4. 지식재산권</h3><p>촬영한 콘텐츠의 저작권은 귀하에게 있습니다. 언제든지 콘텐츠를 삭제할 수 있습니다.</p><h3>5. 면책 조항</h3><p>업로드된 콘텐츠에 대한 법적 책임은 귀하에게 있습니다. 불가항력으로 인한 서비스 중단에 대해 당사는 책임을 지지 않습니다.</p><h3>6. 문의하기</h3><p>moment.app@163.com</p>"
  },
  privacy:{
    'zh-Hans':"<h2>隐私政策</h2><p>更新日期：2026年6月26日</p><h3>1. 信息收集</h3><p>仅收集您的手机号（用于登录）和您主动拍摄的照片及文字。不收集位置、通讯录等额外信息。</p><h3>2. 信息使用</h3><p>手机号仅用于账号识别。照片可设为公开（显示在探索）或私密。</p><h3>3. 信息存储</h3><p>数据存储于中国大陆云服务器，采取加密和访问控制保护。</p><h3>4. 信息共享</h3><p>我们不会出售或转让您的个人信息给第三方。</p><h3>5. 您的权利</h3><p>您可随时删除照片或注销账号，注销后数据永久删除。</p><h3>6. 联系我们</h3><p>moment.app@163.com</p>",
    'zh-Hant':"<h2>隱私政策</h2><p>更新日期：2026年6月26日</p><h3>1. 資訊收集</h3><p>僅收集您的手機號（用於登入）和您主動拍攝的照片及文字。不收集位置、通訊錄等額外資訊。</p><h3>2. 資訊使用</h3><p>手機號僅用於帳號識別。照片可設為公開（顯示在探索）或私密。</p><h3>3. 資訊儲存</h3><p>資料儲存於中國大陸雲伺服器，採取加密和存取控制保護。</p><h3>4. 資訊共享</h3><p>我們不會出售或轉讓您的個人資訊給第三方。</p><h3>5. 您的權利</h3><p>您可隨時刪除照片或註銷帳號，註銷後資料永久刪除。</p><h3>6. 聯絡我們</h3><p>moment.app@163.com</p>",
    en:"<h2>Privacy Policy</h2><p>Last updated: June 26, 2026</p><h3>1. Information Collection</h3><p>We only collect your phone number (for login) and the photos and text you actively capture. We do not collect location, contacts, or other additional information.</p><h3>2. Information Use</h3><p>Phone numbers are used solely for account identification. Photos can be set as public (visible in Explore) or private.</p><h3>3. Information Storage</h3><p>Data is stored on cloud servers with encryption and access control protection.</p><h3>4. Information Sharing</h3><p>We do not sell or transfer your personal information to third parties.</p><h3>5. Your Rights</h3><p>You may delete photos or terminate your account at any time. Data is permanently deleted upon account termination.</p><h3>6. Contact Us</h3><p>moment.app@163.com</p>",
    ja:"<h2>プライバシーポリシー</h2><p>最終更新日：2026年6月26日</p><h3>1. 情報収集</h3><p>ログイン用の電話番号と、お客様が自発的に撮影した写真およびテキストのみを収集します。位置情報や連絡先などの追加情報は収集しません。</p><h3>2. 情報の利用</h3><p>電話番号はアカウント識別のみに使用されます。写真は公開（探索に表示）または非公開に設定できます。</p><h3>3. 情報の保存</h3><p>データは暗号化とアクセス制御保護を施したクラウドサーバーに保存されます。</p><h3>4. 情報の共有</h3><p>お客様の個人情報を第三者に販売または譲渡することはありません。</p><h3>5. お客様の権利</h3><p>いつでも写真を削除したり、アカウントを解約したりできます。アカウント解約時にデータは完全に削除されます。</p><h3>6. お問い合わせ</h3><p>moment.app@163.com</p>",
    ko:"<h2>개인정보 처리방침</h2><p>최종 업데이트: 2026년 6월 26일</p><h3>1. 정보 수집</h3><p>로그인용 전화번호와 귀하가 직접 촬영한 사진 및 텍스트만 수집합니다. 위치, 연락처 등 추가 정보는 수집하지 않습니다.</p><h3>2. 정보 사용</h3><p>전화번호는 계정 식별 용도로만 사용됩니다. 사진은 공개(탐색에 표시) 또는 비공개로 설정할 수 있습니다.</p><h3>3. 정보 저장</h3><p>데이터는 암호화 및 접근 제어 보호가 적용된 클라우드 서버에 저장됩니다.</p><h3>4. 정보 공유</h3><p>당사는 귀하의 개인정보를 제3자에게 판매하거나 양도하지 않습니다.</p><h3>5. 귀하의 권리</h3><p>언제든지 사진을 삭제하거나 계정을 해지할 수 있습니다. 계정 해지 시 데이터는 영구적으로 삭제됩니다.</p><h3>6. 문의하기</h3><p>moment.app@163.com</p>"
  }
};
function openLegalPage(type){
  document.getElementById('legalTitle').textContent=type==='terms'?t('legal.termsTitle'):t('legal.privacyTitle');
  var lang=getLang();
  var texts=_legalTexts[type];
  var html=texts[lang]||texts['zh-Hans']||texts['en']||'';
  document.getElementById('legalContent').innerHTML=html;
  document.getElementById('legalOverlay').style.display='block';
}
function closeLegalPage(){
  document.getElementById('legalOverlay').style.display='none';
}
// Toast helper — delegates to Design System
function showToast(msg, duration){
  if (typeof DS !== 'undefined' && DS.showToast) {
    return DS.showToast(msg, duration);
  }
  // Fallback (should rarely be hit)
  var t=document.createElement('div');
  t.textContent=msg;
  t.style.cssText='position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;font-size:14px;padding:10px 24px;border-radius:20px;z-index:5000;opacity:0;transition:opacity .3s;pointer-events:none';
  document.body.appendChild(t);
  requestAnimationFrame(function(){t.style.opacity='1'});
  setTimeout(function(){t.style.opacity='0';setTimeout(function(){t.remove()},300)},duration||1500);
}
// ======================== REPORT ========================
var reportTargetMomentId=null;
function openReportSheet(momentId){
  reportTargetMomentId=momentId;
  document.getElementById('reportSheet').style.transform='translateY(0)';
  document.getElementById('menuOverlay').style.display='block';
}
function closeReportSheet(){
  document.getElementById('reportSheet').style.transform='translateY(100%)';
  reportTargetMomentId=null;
}
function submitReport(reason){
  if(!isLoggedIn()){alert(t('auth.needLoginToReport'));closeReportSheet();return}
  if(!reportTargetMomentId)return;
  api('/api/report',{method:'POST',body:{
    momentId:parseInt(reportTargetMomentId),reason:reason
  }}).then(function(r){
    if(r.error){alert(r.error)}
    else{alert(t('settings.reportSubmitted'))}
    closeReportSheet();
    document.getElementById('menuOverlay').style.display='none';
  }).catch(function(){alert(t('common.networkError'));closeReportSheet();document.getElementById('menuOverlay').style.display='none'})
}
// ======================== MODE SWITCH ========================
function getWatchMode(){
  var mode=localStorage.getItem('watch_world_mode');
  return mode==='waterfall'?'waterfall':'immersive';
}
function setWatchMode(mode){localStorage.setItem('watch_world_mode',mode)}
function openModeSwitcher(){
  var mode=getWatchMode();
  document.getElementById('check-waterfall').style.display=mode==='waterfall'?'inline':'none';
  document.getElementById('check-immersive').style.display=mode==='immersive'?'inline':'none';
  document.getElementById('modeSheet').style.transform='translateY(0)';
  document.getElementById('menuOverlay').style.display='block';
}
function closeModeSheet(){
  document.getElementById('modeSheet').style.transform='translateY(100%)';
}
function switchMode(mode,animate){
  var oldMode=getWatchMode();
  if(mode===oldMode)return;
  setWatchMode(mode);closeModeSheet();
  document.getElementById('menuOverlay').style.display='none';
  // Always hide the inactive tab
  var immersiveEl=document.getElementById('tab-strangers');
  var waterfallEl=document.getElementById('tab-strangers-waterfall');
  if(animate){
    slideSwitchMode(oldMode,mode);
  }else{
    immersiveEl.style.display='none';
    waterfallEl.style.display='none';
    if(mode==='waterfall'){refreshWaterfall(true)}
    else{immersiveEl.style.display='block';refreshStrangers()}
  }
  showModeToast(mode);
}
var slideAnimId=0;
function slideSwitchMode(from,to){
  var fromTab=from==='waterfall'?'tab-strangers-waterfall':'tab-strangers';
  var toTab=to==='waterfall'?'tab-strangers-waterfall':'tab-strangers';
  var fromEl=document.getElementById(fromTab);
  var toEl=document.getElementById(toTab);
  // Cancel any in-flight slide animation
  slideAnimId++;
  var animId=slideAnimId;
  // Clean up stale inline styles from previous interrupted animation
  fromEl.style.transition=''; fromEl.style.transform=''; fromEl.style.opacity='';
  toEl.style.transition=''; toEl.style.transform=''; toEl.style.opacity='';
  // Prepare target tab offscreen
  toEl.style.display=to==='home'?'flex':'block';
  toEl.style.transition='none';
  toEl.style.transform='translateX(100%)';
  toEl.style.opacity='1';
  if(to==='waterfall'){refreshWaterfall(true)}
  else{refreshStrangers()}
  // Animate: current slides out left, new slides in from right
  requestAnimationFrame(function(){
    if(animId!==slideAnimId)return;
    fromEl.style.transition='transform .25s ease, opacity .25s ease';
    fromEl.style.transform='translateX(-30%)';
    fromEl.style.opacity='0';
    toEl.style.transition='transform .25s ease';
    toEl.style.transform='translateX(0)';
    setTimeout(function(){
      if(animId!==slideAnimId)return; // cancelled by newer animation
      fromEl.style.display='none';
      fromEl.style.transform='';
      fromEl.style.opacity='';
      fromEl.style.transition='';
      toEl.style.transform='';
      toEl.style.opacity='';
      toEl.style.transition='';
    },260);
  });
}
var modeToastTimer=null;
function showModeToast(mode){
  var toast=document.getElementById('modeToast');
  if(!toast){
    toast=document.createElement('div');
    toast.id='modeToast';
    toast.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.85);color:#fff;font-size:16px;font-weight:600;padding:12px 28px;border-radius:20px;z-index:5000;opacity:0;transition:opacity .2s;pointer-events:none;letter-spacing:-.2px';
    document.body.appendChild(toast);
  }
  toast.textContent=mode==='waterfall'?t('settings.modeWaterfall'):t('settings.modeImmersive');
  toast.style.opacity='1';
  clearTimeout(modeToastTimer);
  modeToastTimer=setTimeout(function(){toast.style.opacity='0'},800);
}
// Swipe gesture for tab-strangers and tab-strangers-waterfall
function initSwipeGestures(){
  var touchStartX=0,touchStartY=0;
  function handleTouchStart(e){touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY}
  function handleTouchEnd(e){
    if(!e.changedTouches||!e.changedTouches.length)return;
    var dx=e.changedTouches[0].clientX-touchStartX;
    var dy=e.changedTouches[0].clientY-touchStartY;
    // Ignore if too close to edges (system back gesture zone)
    var sx=touchStartX;
    if(sx<30||sx>window.innerWidth-30)return;
    // Need horizontal swipe > 30px and horizontal > vertical
    if(Math.abs(dx)<30||Math.abs(dx)<Math.abs(dy))return;
    var mode=getWatchMode();
    if(dx>0&&mode==='immersive'){switchMode('waterfall',true)}       // right swipe -> waterfall
    else if(dx<0&&mode==='waterfall'){switchMode('immersive',true)}  // left swipe -> immersive
  }
  // Attach to both stranger tabs
  var tabs=[document.getElementById('tab-strangers'),document.getElementById('tab-strangers-waterfall')];
  tabs.forEach(function(tab){
    if(tab){
      tab.addEventListener('touchstart',handleTouchStart,{passive:true});
      tab.addEventListener('touchend',handleTouchEnd,{passive:true});
    }
  });
  // Show swipe hint every time entering 看世界
  var swipeHintTimer=null;
  window.showSwipeHint=function(){
    clearTimeout(swipeHintTimer);
    var old=document.getElementById('swipeHint');
    if(old)old.remove();
    var tip=document.createElement('div');
    tip.id='swipeHint';
    tip.style.cssText='position:fixed;bottom:25%;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.1);color:rgba(255,255,255,.6);font-size:13px;padding:8px 20px;border-radius:20px;z-index:5000;opacity:0;transition:opacity .4s;pointer-events:none;letter-spacing:0px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)';
    tip.textContent=t('settings.swipeHint');
    document.body.appendChild(tip);
    requestAnimationFrame(function(){tip.style.opacity='1'});
    swipeHintTimer=setTimeout(function(){tip.style.opacity='0';setTimeout(function(){tip.remove()},400)},2000);
  };
}

function updateSideMenuUser(){
  if(AUTH.token){
    document.getElementById('sideMenuLoginPrompt').style.display='none';
    document.getElementById('sideMenuLoggedIn').style.display='block';
    var phone=t('sideMenu.userPrefix')+AUTH.userId;
    var phInput=document.getElementById('loginPhone');
    if(phInput&&phInput.value.length===11){
      phone=phInput.value.substr(0,3)+'****'+phInput.value.substr(7);
    }
    // Show provider badge
    var providerLabel='';
    if(AUTH.loginProvider==='guest'){providerLabel=' 👤 Guest'}
    else if(AUTH.loginProvider==='email'){providerLabel=' ✉️'}
    else if(AUTH.loginProvider==='apple'){providerLabel=' '}
    else if(AUTH.loginProvider==='google'){providerLabel=' G'}
    var savedName=localStorage.getItem('user_nickname');
    document.getElementById('sideMenuNick').textContent=(savedName||(t('sideMenu.userPrefix')+AUTH.userId))+providerLabel;
    var savedAvatar=localStorage.getItem('user_avatar');
    if(savedAvatar)applyAvatar(savedAvatar);
    document.getElementById('sideMenuPhoneSmall').textContent=phone;
    // Stats — calc real consecutive days from local photos
    var streak=calcLocalStreak();
    var statsHtml=t('gallery.streakDays',{streak:streak})+' &nbsp; '+t('gallery.photoCount',{count:D.c});
    if(isGuest()){statsHtml+=' <span style="color:var(--color-warning);font-size:10px">Guest</span>'}
    document.getElementById('sideMenuStats').innerHTML=statsHtml;
    // Sync streak from server
    api('/api/stats').then(function(r){if(!r.error&&r.streak!==undefined){
      var syncedHtml=t('gallery.streakDays',{streak:r.streak})+' &nbsp; '+t('gallery.photoCount',{count:D.c});
      if(isGuest()){syncedHtml+=' <span style="color:var(--color-warning);font-size:10px">Guest</span>'}
      document.getElementById('sideMenuStats').innerHTML=syncedHtml;
    }}).catch(function(){});
    // Update guest UI
    updateGuestUI();
  }else{
    document.getElementById('sideMenuLoginPrompt').style.display='block';
    document.getElementById('sideMenuLoggedIn').style.display='none';
  }
}
function editNickname(){
  if(!isLoggedIn()){showLogin();return}
  var current=localStorage.getItem('user_nickname')||(t('sideMenu.userPrefix')+AUTH.userId);
  var name=prompt(t('sideMenu.editNicknamePrompt'),current);
  if(name&&name.trim()){
    name=name.trim().substring(0,12);
    localStorage.setItem('user_nickname',name);
    document.getElementById('sideMenuNick').textContent=name;
    api('/api/user/nickname',{method:'POST',body:{nickname:name}}).then(function(){updateSideMenuUser()}).catch(function(){});
  }
}
function pickAvatar(){
  if(!isLoggedIn()){showLogin();return}
  document.getElementById('avatarPicker').click();
}
function gotAvatar(e){
  var f=e.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      var size=Math.min(img.width,img.height,200);
      var c=document.createElement('canvas');c.width=size;c.height=size;
      var ctx=c.getContext('2d');
      var sx=(img.width-size)/2,sy=(img.height-size)/2;
      ctx.drawImage(img,sx,sy,size,size,0,0,size,size);
      var dataUrl=c.toDataURL('image/jpeg',0.8);
      localStorage.setItem('user_avatar',dataUrl);
      applyAvatar(dataUrl);
    };
    img.src=ev.target.result;
  };r.readAsDataURL(f);e.target.value='';
}
function applyAvatar(dataUrl){
  var el=document.getElementById('sideMenuAvatar');
  if(el&&dataUrl){
    el.style.backgroundImage='url('+dataUrl+')';
    el.textContent='';
  }
}
function doLogout(){
  if(confirm(t('auth.logoutConfirmShort'))){
    AUTH={token:'',userId:0};saveAuth();
    document.getElementById('sideMenuLoggedIn').style.display='none';
    document.getElementById('sideMenuLoginPrompt').style.display='block';
    closeAllPanels();
    updateAllUI();
    showLogin();
  }
}
function deleteAccount(){
  if(!isLoggedIn()){alert(t('auth.loginRequired'));return}
  if(!confirm(t('auth.deleteAccountConfirm')))return;
  if(!confirm(t('auth.deleteAccountConfirm2')))return;
  api('/api/account/delete',{method:'POST',body:{}}).then(function(r){
    if(r.error){alert(r.error);return}
    D={m:[],c:0,i:-1};localStorage.setItem('mv21','{"m":[],"c":0,"i":-1}');
    AUTH={token:'',userId:0};saveAuth();
    closeAllPanels();
    updateAllUI();
    alert(t('auth.deleteAccountSuccess'));
    location.reload();
  }).catch(function(){alert(t('common.networkError'))})
}
function togglePhotoPublic(){
  var current=localStorage.getItem('photo_public')!=='0';
  var next=!current;
  localStorage.setItem('photo_public',next?'1':'0');
  document.getElementById('photoPublicState').textContent=next?t('settings.on'):t('settings.off');
  document.getElementById('photoPublicState').style.color=next?'var(--accent)':'var(--muted)';
  if(isLoggedIn()){api('/api/user/preferences',{method:'POST',body:{photo_public:next}}).catch(function(){})}
}
function showClearConfirm(){
  if(confirm(t('settings.clearAllConfirm'))){
    D={m:[],c:0,i:-1};
    localStorage.setItem('mv21','{"m":[],"c":0,"i":-1}');
    alert(t('settings.clearedAll'));
    location.reload();
  }
}

// ======================== NOTIFY TOGGLE ========================
function toggleNotify(){
  var el=document.getElementById('notifyState');
  var stored=localStorage.getItem('mv_notify');
  var on=stored?stored==='1':false;
  var next=!on;
  localStorage.setItem('mv_notify',next?'1':'0');
  el.textContent=next?t('settings.on'):t('settings.off');
  el.style.color=next?'var(--accent)':'var(--muted)';
}

// ======================== HELP & ABOUT (i18n-aware) ========================
// Override the original alert-based help to use i18n
var _helpOverridden=false;
function ensureHelpI18n(){
  if(_helpOverridden)return;
  _helpOverridden=true;
  // The help text is triggered via onclick in HTML with alert()
  // We override by updating the onclick handlers after i18n loads
  var helpRow=document.querySelector('#quickSettings .menu-row[onclick*="help"]');
  // Keep the original but use refreshSheetI18n to rebuild sheets when opened
}

// ======================== SHEET I18N UPDATES ========================
function refreshDarkModeSheet(){
  var sheet=document.getElementById('darkModeSheet');
  if(!sheet||sheet.style.transform==='translateY(100%)')return;
  var title=sheet.querySelector('div:first-child');
  if(title)title.textContent=t('settings.darkMode');
  var rows=sheet.querySelectorAll('.menu-row');
  if(rows.length>=3){
    rows[0].childNodes[0].textContent=t('settings.darkModeAuto')+' ';
    rows[1].childNodes[0].textContent=t('settings.darkModeLight')+' ';
    rows[2].childNodes[0].textContent=t('settings.darkModeDark')+' ';
  }
  var cancelBtn=sheet.querySelector('.btn');
  if(cancelBtn)cancelBtn.textContent=t('common.cancel');
}

function refreshReportSheet(){
  var sheet=document.getElementById('reportSheet');
  if(!sheet||sheet.style.transform==='translateY(100%)')return;
  var title=sheet.querySelector('div:first-child');
  if(title)title.textContent=t('settings.reportSheetTitle');
  var rows=sheet.querySelectorAll('.menu-row');
  var labels=[t('settings.reportPorn'),t('settings.reportViolence'),t('settings.reportHarassment'),t('settings.reportSpam'),t('settings.reportPrivacy'),t('settings.reportOther')];
  for(var i=0;i<Math.min(rows.length,labels.length);i++){
    rows[i].childNodes[0].textContent=labels[i];
  }
  var cancelBtn=sheet.querySelector('.btn');
  if(cancelBtn)cancelBtn.textContent=t('common.cancel');
}

function refreshModeSheet(){
  var sheet=document.getElementById('modeSheet');
  if(!sheet||sheet.style.transform==='translateY(100%)')return;
  var title=sheet.querySelector('div:first-child');
  if(title)title.textContent=t('settings.displayMode');
  var rows=sheet.querySelectorAll('.menu-row');
  if(rows.length>=2){
    rows[0].childNodes[0].textContent=t('settings.modeWaterfall')+' ';
    rows[1].childNodes[0].textContent=t('settings.modeImmersive')+' ';
  }
  var cancelBtn=sheet.querySelector('.btn');
  if(cancelBtn)cancelBtn.textContent=t('common.cancel');
}

function refreshWorldRecordingText(){
  // Update "世界正在记录" text in explore tab
  var el=document.querySelector('#tab-strangers span[style]');
  // Find the world recording text span
  var spans=document.querySelectorAll('#tab-strangers span');
  for(var i=0;i<spans.length;i++){
    if(spans[i].textContent.indexOf('世界')!==-1||spans[i].textContent.indexOf('World')!==-1||spans[i].textContent.indexOf('世界')!==-1||spans[i].textContent.indexOf('세계')!==-1||spans[i].textContent.indexOf('世界')!==-1){
      spans[i].textContent=t('explore.worldRecording');
      break;
    }
  }
}

// ======================== LANGUAGE PICKER ========================
function openLangSheet(){
  var sheet=document.getElementById('langSheet');
  if(!sheet){
    sheet=document.createElement('div');
    sheet.id='langSheet';
    sheet.style.cssText='position:fixed;bottom:0;left:0;right:0;background:var(--sheet-bg);z-index:4100;border-radius:20px 20px 0 0;padding:0 0 calc(30px + env(safe-area-inset-bottom, 0px));transform:translateY(100%);transition:transform .3s ease';
    document.body.appendChild(sheet);
  }
  var langs=I18N.getSupportedLanguages();
  var current=getLang();
  var html='<div style="text-align:center;padding:14px;color:var(--muted);font-size:13px;border-bottom:1px solid var(--menu-sep)">'+t('settings.language')+'</div>';
  for(var i=0;i<langs.length;i++){
    var l=langs[i];
    html+='<div class="menu-row" onclick="selectLang(\''+l.code+'\')" style="padding-left:20px;padding-right:20px;'+(i===langs.length-1?'border-bottom:none':'')+'">'+l.label+' <span id="lang-check-'+l.code+'" style="color:var(--accent);'+(l.code===current?'':'display:none')+'">✓</span></div>';
  }
  html+='<button class="btn" onclick="closeLangSheet()" style="margin:12px 20px 0;text-align:center">'+t('common.cancel')+'</button>';
  sheet.innerHTML=html;
  sheet.style.transform='translateY(0)';
  document.getElementById('menuOverlay').style.display='block';
}

function closeLangSheet(){
  var sheet=document.getElementById('langSheet');
  if(sheet)sheet.style.transform='translateY(100%)';
}

function selectLang(code){
  setLang(code, function(){
    closeLangSheet();
    document.getElementById('menuOverlay').style.display='none';
    document.getElementById('langState').textContent=getLangDisplayName(code);
    refreshAllI18n();
  });
}

function getLangDisplayName(code){
  var map={'en':'English','zh-Hans':'简体中文','zh-Hant':'繁體中文','ja':'日本語','ko':'한국어'};
  return map[code]||code;
}

// ======================== REFRESH I18N (called after language change) ========================
function refreshAllI18n(){
  // Update document lang and title
  document.documentElement.lang=getLang();
  document.title=t('app.name');
  // Update home UI
  updateHomeUI();
  // Update nav labels
  updateNavLabels();
  // Update side menu
  updateSideMenuI18n();
  // Update settings if visible
  refreshSettingsI18n();
  // Update gallery if visible
  if(currentTab==='photos')refreshGallery();
  // Update explore if visible
  if(currentTab==='strangers'){
    var m=getWatchMode();
    if(m==='waterfall')refreshWaterfall(true);
    else refreshStrangers();
  }
  // Update captured screen if visible
  refreshCapturedI18n();
  // Update login screen if visible
  refreshLoginI18n();
  // Update time fragment if visible
  refreshTFI18n();
  // Update onboarding
  refreshOnboardingI18n();
  // Update explore world recording text
  refreshWorldRecordingText();
  // Update sheets if open
  refreshDarkModeSheet();
  refreshReportSheet();
  refreshModeSheet();
  // Update top bar title
  var topBarTitle=document.querySelector('.topbar span');
  if(topBarTitle&&topBarTitle.textContent.trim()==='此刻')topBarTitle.textContent=t('app.name');
  // Update settings panel section headers
  refreshSettingsHeaders();
  // Update waterfall/reached end text
  var endEl=document.getElementById('wf-end');
  if(endEl)endEl.textContent=t('explore.reachedEnd');
  var loadEl=document.getElementById('wf-loading');
  if(loadEl)loadEl.textContent=t('explore.loadingMore');
}

function refreshSettingsHeaders(){
  var sections=document.querySelectorAll('#quickSettings > div > div:first-child');
  var labels=[t('settings.notifications'),t('settings.privacy'),t('settings.general'),t('settings.support'),t('settings.danger')];
  // The headers have padding-left:4px style
  var headers=document.querySelectorAll('#quickSettings div[style*="padding-left:4px"]');
  if(headers.length>=5){
    headers[0].textContent=t('settings.notifications');
    headers[1].textContent=t('settings.privacy');
    headers[2].textContent=t('settings.general');
    headers[3].textContent=t('settings.support');
    headers[4].textContent=t('settings.danger');
  }
  // Settings title
  var title=document.querySelector('#quickSettings > div:first-child > span:first-child');
  if(title)title.textContent=t('settings.title');
}

function updateNavLabels(){
  var labels={'photos':t('nav.photos'),'home':t('nav.home'),'strangers':t('nav.explore')};
  for(var k in labels){
    var el=document.getElementById('nav-'+k);
    if(el){var span=el.querySelector('.nav-label');if(span)span.textContent=labels[k]}
  }
}

function updateSideMenuI18n(){
  // Update side menu labels by finding rows with specific onclick handlers
  var rows=document.querySelectorAll('#sideMenu .menu-row');
  for(var i=0;i<rows.length;i++){
    var row=rows[i];
    var onclick=row.getAttribute('onclick')||'';
    var span=row.querySelector('span:first-child');
    if(!span)continue;
    if(onclick.indexOf('navTo')!==-1)span.textContent=t('sideMenu.myDiary');
    else if(onclick.indexOf('openTimeFragment')!==-1)span.textContent=t('sideMenu.timeFragment');
    else if(onclick.indexOf('toggleDailyPick')!==-1)span.textContent=t('sideMenu.dailyPick');
  }
  // Update login prompt
  var prompt=document.getElementById('sideMenuLoginPrompt');
  if(prompt)prompt.textContent=t('auth.loginPrompt');
  // Update logout/delete links
  var logoutLink=document.querySelector('#sideMenu .danger');
  if(logoutLink)logoutLink.textContent=t('auth.logout');
  var deleteLink=document.querySelector('#sideMenu span[onclick="deleteAccount()"]');
  if(deleteLink)deleteLink.textContent=t('auth.deleteAccount');
}

function refreshSettingsI18n(){
  // Update static settings text via their IDs
  var settMap={
    'darkModeState':(function(){var dm=getDarkMode();return dm==='auto'?t('settings.darkModeAuto'):(dm==='light'?t('settings.darkModeLight'):t('settings.darkModeDark'))})(),
  };
  // Update settings state labels
  var iq=localStorage.getItem('img_quality')||'compressed';
  var el=document.getElementById('imgQualityState');if(el)el.textContent=iq==='compressed'?t('settings.imageQualityCompressed'):t('settings.imageQualityOriginal');
  var sw=localStorage.getItem('starry_world')!=='0';
  el=document.getElementById('starryWorldState');if(el){el.textContent=sw?t('settings.on'):t('settings.off');el.style.color=sw?'var(--accent)':'var(--muted)'}
  var ifx=localStorage.getItem('immersive_fx')!=='0';
  el=document.getElementById('immersiveFXState');if(el){el.textContent=ifx?t('settings.on'):t('settings.off');el.style.color=ifx?'var(--accent)':'var(--muted)'}
  var photoPublic=localStorage.getItem('photo_public')!=='0';
  el=document.getElementById('photoPublicState');if(el){el.textContent=photoPublic?t('settings.on'):t('settings.off');el.style.color=photoPublic?'var(--accent)':'var(--muted)'}
  // Language state
  el=document.getElementById('langState');if(el)el.textContent=getLangDisplayName(getLang());
  // Dark mode state
  el=document.getElementById('darkModeState');if(el){var dm=getDarkMode();el.textContent=dm==='auto'?t('settings.darkModeAuto'):(dm==='light'?t('settings.darkModeLight'):t('settings.darkModeDark'))}
  // Daily pick
  updateDailyPickLabel();
  // Notify
  updateNotifyLabel();
}

function updateDailyPickLabel(){
  var el=document.getElementById('dailyPickState');
  if(el){
    var dp;
    if(isLoggedIn()){
      // Check if we've already cached the state
    }else{
      dp=localStorage.getItem('daily_pick_enabled')!=='0';
      el.textContent=dp?t('settings.on'):t('settings.off');
      el.style.color=dp?'var(--accent)':'var(--muted)';
    }
  }
}

function updateNotifyLabel(){
  var el=document.getElementById('notifyState');
  if(!el)return;
  var stored=localStorage.getItem('mv_notify');
  var on=stored?stored==='1':false;
  el.textContent=on?t('settings.on'):t('settings.off');
  el.style.color=on?'var(--accent)':'var(--muted)';
}

function refreshCapturedI18n(){
  // Update publish button text
  var pubBtn=document.querySelector('#publishUI div[onclick]');
  if(pubBtn&&pubBtn.textContent.indexOf('📤')!==-1)pubBtn.textContent=t('capture.publish');
  // Update thought placeholder
  var th=document.getElementById('th');
  if(th)th.placeholder=t('capture.writeThought');
}

function refreshLoginI18n(){
  // Phone fields
  var ph=document.getElementById('loginPhone');
  if(ph)ph.placeholder=t('auth.phonePlaceholder');
  var pw=document.getElementById('loginPassword');
  if(pw)pw.placeholder=t('auth.passwordPlaceholder');
  var btn=document.getElementById('loginBtn');
  if(btn)btn.textContent=t('auth.loginBtn');
  // Email fields
  var em=document.getElementById('loginEmail');
  if(em)em.placeholder=t('auth.emailPlaceholder');
  var epw=document.getElementById('loginEmailPassword');
  if(epw)epw.placeholder=t('auth.emailPasswordPlaceholder');
  var ebtn=document.getElementById('loginEmailBtn');
  if(ebtn)ebtn.textContent=t('auth.loginBtn');
  // Tab labels
  var tabPhone=document.getElementById('tabPhone');
  if(tabPhone)tabPhone.textContent=t('auth.phoneLogin');
  var tabEmail=document.getElementById('tabEmail');
  if(tabEmail)tabEmail.textContent=t('auth.emailLogin');
  // Guest button
  var guestBtn=document.querySelector('#loginScreen button[onclick="doGuestLogin()"]');
  if(guestBtn)guestBtn.textContent=t('auth.guestLogin');
  // Divider label
  var divSpan=document.querySelector('#loginScreen span[style*="white-space:nowrap"]');
  if(divSpan)divSpan.textContent=t('auth.orContinueWith');
}

function updateGuestUI(){
  // Show guest indicator in side menu
  var stats=document.getElementById('sideMenuStats');
  if(isGuest()&&stats){
    var guestLabel=' 👤 <span style="color:var(--color-warning);font-size:11px">Guest</span>';
    if(stats.innerHTML.indexOf('Guest')===-1){
      stats.innerHTML+=guestLabel;
    }
  }
}

function refreshTFI18n(){
  // Update time fragment UI if visible
  var title=document.querySelector('#timeFragment > div:first-child');
  if(title)title.textContent=t('collage.timeFragmentTitle');
}

function refreshOnboardingI18n(){
  var pages=document.querySelectorAll('.onboard-page');
  if(pages.length>=3){
    var div1=pages[0].querySelector('div');if(div1)div1.textContent=t('onboarding.page1');
    var div2=pages[1].querySelector('div');if(div2)div2.textContent=t('onboarding.page2');
    var div3=pages[2].querySelector('div');if(div3)div3.textContent=t('onboarding.page3');
    var startBtn=pages[2].querySelector('button');if(startBtn)startBtn.textContent=t('onboarding.start');
  }
}

// Init: register i18n change listener
I18N.onChange(function(lang){
  // Re-render UI when language changes
  if(I18N.isLoaded()){
    refreshAllI18n();
  }
});

setTimeout(initSwipeGestures,800);
