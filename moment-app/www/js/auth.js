/**
 * 此刻 Moment - Login Auth (multi-method: Phone / Email / Guest / OAuth)
 */
try{var as=localStorage.getItem('mv_auth');if(as)AUTH=JSON.parse(as)}catch(e){}
function saveAuth(){localStorage.setItem('mv_auth',JSON.stringify(AUTH))}
function isLoggedIn(){return !!AUTH.token}
function isGuest(){return AUTH.loginProvider==='guest'}
var onboardPage=0;
function startApp(){document.getElementById('onboarding').style.display='none';localStorage.setItem('mv_welcome','1');showLogin()}
function onboardNext(){var t=document.getElementById('onboard-track');var d=document.querySelectorAll('.onboard-dot');onboardPage++;if(onboardPage>=3){startApp();return}t.style.transform='translateX(-'+(onboardPage*100/3)+'%)';d.forEach(function(dot,i){dot.style.opacity=i===onboardPage?'1':'.4'})}
function onboardPrev(){if(onboardPage<=0)return;var t=document.getElementById('onboard-track');var d=document.querySelectorAll('.onboard-dot');onboardPage--;t.style.transform='translateX(-'+(onboardPage*100/3)+'%)';d.forEach(function(dot,i){dot.style.opacity=i===onboardPage?'1':'.4'})}
function initOnboardSwipe(){var el=document.getElementById('onboarding');var sx=0,sy=0;el.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});el.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx;var dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){if(dx<0)onboardNext();else if(dx>0)onboardPrev()}},{passive:true})}

// Login tab switch
var _loginTab='phone';
function switchLoginTab(tab){
  _loginTab=tab;
  var tabPhone=document.getElementById('tabPhone');
  var tabEmail=document.getElementById('tabEmail');
  var phoneFields=document.getElementById('phoneFields');
  var emailFields=document.getElementById('emailFields');
  var msg=document.getElementById('loginMsg');if(msg)msg.textContent='';
  if(tab==='email'){
    tabPhone.style.background='transparent';tabPhone.style.color='var(--muted)';tabPhone.style.fontWeight='500';
    tabEmail.style.background='var(--accent)';tabEmail.style.color='#fff';tabEmail.style.fontWeight='600';
    phoneFields.style.display='none';emailFields.style.display='block';
  }else{
    tabEmail.style.background='transparent';tabEmail.style.color='var(--muted)';tabEmail.style.fontWeight='500';
    tabPhone.style.background='var(--accent)';tabPhone.style.color='#fff';tabPhone.style.fontWeight='600';
    phoneFields.style.display='block';emailFields.style.display='none';
  }
}

function showLogin(){document.getElementById('loginScreen').style.display='flex';switchLoginTab(_loginTab);refreshLoginI18n()}
function skipLogin(){document.getElementById('loginScreen').style.display='none';updateAllUI();if(starryWorldEnabled&&typeof initStarryWorld==='function')setTimeout(initStarryWorld,400)}

// Detect locale
function detectUserLocale(){
  return {
    language: getLang(),
    region: (navigator.language||'').split('-')[1] || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  };
}

// Apply auth response
function applyAuthResponse(d, cb){
  AUTH.token=d.token;AUTH.tokenCreatedAt=d.tokenCreatedAt||Date.now();AUTH.userId=d.userId;
  AUTH.loginProvider=d.loginProvider||'phone';AUTH.isGuest=!!d.isGuest;
  saveAuth();localStorage.setItem('mv_has_logged_in','1');
  if(d.nickname||d.displayName){var nn=d.displayName||d.nickname;localStorage.setItem('user_nickname',nn)}
  if(d.avatar){localStorage.setItem('user_avatar',d.avatar);applyAvatar(d.avatar)}
  if(d.isGuest)showToast(t('auth.guestWelcome'));
  if(cb)cb();
  updateSideMenuUser();updateAllUI();
  if(starryWorldEnabled&&typeof initStarryWorld==='function')setTimeout(initStarryWorld,400)
}

// ======================== PHONE LOGIN ========================
var _loggingIn=false;
function resetLoginBtn(tab){
  _loggingIn=false;
  if(tab==='email'){
    var b=document.getElementById('loginEmailBtn');if(b){b.disabled=false;b.textContent=t('auth.loginBtn')}
  }else{
    var b=document.getElementById('loginBtn');if(b){b.disabled=false;b.textContent=t('auth.loginBtn')}
  }
}

function doLogin(){
  if(_loggingIn)return;_loggingIn=true;
  var ph=document.getElementById('loginPhone').value.replace(/\s/g,'');
  var pw=document.getElementById('loginPassword').value;
  var msg=document.getElementById('loginMsg');
  if(ph.length<11){msg.textContent=t('auth.invalidPhone');_loggingIn=false;return}
  if(pw.length<6){msg.textContent=t('auth.passwordTooShort');_loggingIn=false;return}
  var loginBtn=document.getElementById('loginBtn');
  if(loginBtn){loginBtn.disabled=true;loginBtn.textContent=t('auth.loggingIn')}
  msg.textContent='';

  var body={phone:ph,password:pw};
  var isNewUser=!localStorage.getItem('mv_has_logged_in');

  // Try login; if PHONE_NOT_REGISTERED and is new user, auto-register
  (isNewUser ? API_CLIENT.post('/api/auth/register', body) : API_CLIENT.post('/api/auth/login', body))
  .then(function(d){
    // Auto-switch: register→login or login→register
    if(d.code==='PHONE_NOT_REGISTERED' && isNewUser){
      return API_CLIENT.post('/api/auth/register', body);
    }
    if(d.code==='PHONE_REGISTERED'){
      return API_CLIENT.post('/api/auth/login', body);
    }
    return d;
  }).then(function(d){
    if(d.error){msg.textContent=d.error;resetLoginBtn();return}
    finishPhoneLogin(d);
  }).catch(function(e){msg.textContent=t('common.networkError');resetLoginBtn()})
}

function finishPhoneLogin(d){
  if(D.m.length>0){if(!confirm(t('settings.loginSyncData',{count:D.m.length}))){resetLoginBtn();return}
    try{localStorage.setItem('mv21_backup',JSON.stringify(D));localStorage.setItem('mv21_backup_at',String(Date.now()))}catch(e){}}
  D={m:[],c:0,i:-1};localStorage.setItem('mv21','{"m":[],"c":0,"i":-1}');
  _loggingIn=false;document.getElementById('loginScreen').style.display='none';
  applyAuthResponse(d);
}

// ======================== EMAIL LOGIN ========================
function doEmailLogin(){
  if(_loggingIn)return;_loggingIn=true;
  var em=(document.getElementById('loginEmail').value||'').toLowerCase().trim();
  var pw=document.getElementById('loginEmailPassword').value;
  var msg=document.getElementById('loginMsg');
  if(!em||em.indexOf('@')<0){msg.textContent=t('auth.invalidEmail');_loggingIn=false;return}
  if(pw.length<6){msg.textContent=t('auth.passwordTooShort');_loggingIn=false;return}
  var loginBtn=document.getElementById('loginEmailBtn');
  if(loginBtn){loginBtn.disabled=true;loginBtn.textContent=t('auth.loggingIn')}
  msg.textContent='';

  var locale=detectUserLocale();
  var body={email:em,password:pw,region:locale.region,timezone:locale.timezone};
  var isNewUser=!localStorage.getItem('mv_has_logged_in');

  (isNewUser ? API_CLIENT.post('/api/auth/email/register', body) : API_CLIENT.post('/api/auth/email/login', body))
  .then(function(d){
    if(d.code==='EMAIL_NOT_REGISTERED' && isNewUser){
      return API_CLIENT.post('/api/auth/email/register', body);
    }
    if(d.code==='EMAIL_REGISTERED'){
      return API_CLIENT.post('/api/auth/email/login', body);
    }
    return d;
  }).then(function(d){
    if(d.error){msg.textContent=d.error;resetLoginBtn('email');return}
    if(D.m.length>0){if(!confirm(t('settings.loginSyncData',{count:D.m.length}))){resetLoginBtn('email');return}
      try{localStorage.setItem('mv21_backup',JSON.stringify(D));localStorage.setItem('mv21_backup_at',String(Date.now()))}catch(e){}}
    D={m:[],c:0,i:-1};localStorage.setItem('mv21','{"m":[],"c":0,"i":-1}');
    _loggingIn=false;document.getElementById('loginScreen').style.display='none';
    applyAuthResponse(d);
  }).catch(function(e){msg.textContent=t('common.networkError');resetLoginBtn('email')})
}

// ======================== GUEST LOGIN ========================
function doGuestLogin(){
  if(_loggingIn)return;_loggingIn=true;
  var msg=document.getElementById('loginMsg');
  msg.textContent='';
  var locale=detectUserLocale();
  API_CLIENT.post('/api/auth/guest', {region:locale.region,timezone:locale.timezone})
  .then(function(d){
    if(d.error){msg.textContent=d.error;_loggingIn=false;return}
    _loggingIn=false;document.getElementById('loginScreen').style.display='none';
    applyAuthResponse(d);
  }).catch(function(e){msg.textContent=t('common.networkError');_loggingIn=false})
}

// ======================== OAUTH ========================
function doOAuthLogin(provider){
  var msg=document.getElementById('loginMsg');
  msg.textContent='';
  if(provider==='apple'){
    if(window.AppleID&&window.AppleID.auth){
      try{
        window.AppleID.auth.init({clientId:'com.moment.app',scope:'name email',redirectURI:location.origin+'/oauth/apple/callback',state:Date.now().toString()});
        window.AppleID.auth.signIn().then(function(res){
          doOAuthCallback('apple',res.user,res.authorization.id_token,res.user?.email,res.user?.name?.firstName+' '+res.user?.name?.lastName);
        }).catch(function(e){msg.textContent='Apple Sign-In failed: '+e.message});
      }catch(e){msg.textContent='Apple Sign-In not available in this browser'}
      return;
    }
    msg.textContent='Apple Sign-In requires native app. Use Email login instead.';
    return;
  }
  if(provider==='google'){
    msg.textContent='Google Sign-In — use Email tab for now.';
    return;
  }
}

function doOAuthCallback(provider, oauthId, idToken, email, displayName){
  var locale=detectUserLocale();
  API_CLIENT.post('/api/auth/oauth', {provider:provider,oauthId:oauthId||'',email:email||'',displayName:displayName||'',idToken:idToken||'',language:locale.language,region:locale.region,timezone:locale.timezone})
  .then(function(d){
    if(d.error){document.getElementById('loginMsg').textContent=d.error;return}
    document.getElementById('loginScreen').style.display='none';
    applyAuthResponse(d);
  }).catch(function(e){document.getElementById('loginMsg').textContent=t('common.networkError')})
}

// ======================== Auth utilities ========================
function handleAuthExpired(){
  if(!AUTH.token)return;
  AUTH={token:'',tokenCreatedAt:0,userId:0};saveAuth();
  updateSideMenuUser();updateAllUI();
  showToast(t('auth.tokenExpired'));
  setTimeout(showLogin,1500);
}

function logout(){if(confirm(t('auth.logoutConfirm'))){AUTH={token:'',tokenCreatedAt:0,userId:0};saveAuth();updateSideMenuUser();updateAllUI()}}
