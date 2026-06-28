// ====================== STARRY WORLD ENGINE ======================
var starryWorldEnabled=localStorage.getItem('starry_world')!=='0';
var _stars=[],_nebulaEls=[],_meteorTimer=null,_sparkleTimer=null,_driftTimer=null;
// Apply starry-on class synchronously on first paint to avoid black bar flash before initStarryWorld runs
(function(){
  try{
    var dm=localStorage.getItem('dark_mode')||'dark';
    if(dm==='auto'){dm=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}
    if(starryWorldEnabled&&dm!=='light'){document.documentElement.classList.add('starry-on')}
  }catch(e){}
})();
function toggleStarryWorld(){
  starryWorldEnabled=!starryWorldEnabled;
  localStorage.setItem('starry_world',starryWorldEnabled?'1':'0');
  document.getElementById('starryWorldState').textContent=starryWorldEnabled?'已开启':'已关闭';
  document.getElementById('starryWorldState').style.color=starryWorldEnabled?'var(--accent)':'var(--muted)';
  if(starryWorldEnabled){initStarryWorld()}else{destroyStarryWorld()}
}
function initStarryWorld(){
  var c=document.getElementById('starryWorld');
  if(!c)return;
  c.style.display='block';c.innerHTML='';c.style.width='100vw';c.style.height='100vh';clearTimeout(_meteorTimer);clearTimeout(_sparkleTimer);
  var dm=effectiveDarkMode();
  if(dm==='light'){
    document.documentElement.classList.remove('starry-on');
    document.body.style.background='#F8F6F3';c.setAttribute('data-mode','light');c.style.display='none';
    var tb=document.querySelector('.topbar');if(tb){tb.style.background='';tb.style.backdropFilter='';tb.style.webkitBackdropFilter='';tb.style.borderBottom=''}
    var bn=document.querySelector('.bottom-nav');if(bn){bn.style.background='';bn.style.backdropFilter='';bn.style.webkitBackdropFilter='';bn.style.borderTop=''}
    return;
  }
  document.body.style.background='#0B0E1A';
  c.setAttribute('data-mode',dm);
  // Make bars transparent in dark mode so stars show through (CSS class handles it without flash)
  if(dm!=='light'){
    document.documentElement.classList.add('starry-on');
    var tb=document.querySelector('.topbar');if(tb){tb.style.background='';tb.style.backdropFilter='';tb.style.webkitBackdropFilter='';tb.style.borderBottom=''}
    var bn=document.querySelector('.bottom-nav');if(bn){bn.style.background='';bn.style.backdropFilter='';bn.style.webkitBackdropFilter='';bn.style.borderTop=''}
  }
  _stars=[];_nebulaEls=[];
  var W=screen.width||window.innerWidth,H=screen.height||window.innerHeight;
  // Create nebulae (1-2 bands)
  var nebulaColors=[['rgba(80,60,180,.06)','rgba(60,40,140,.04)'],['rgba(180,120,60,.05)','rgba(140,80,40,.03)']];
  var nebCount=1+Math.floor(Math.random()*2);
  for(var n=0;n<nebCount;n++){
    var neb=document.createElement('div');
    neb.className='nebula';
    var nSize=Math.min(W,H)*(.25+Math.random()*.15);
    neb.style.cssText='width:'+nSize+'px;height:'+nSize+'px;top:'+(Math.random()*H*.6)+'px;left:'+(Math.random()*W*.6)+'px;background:radial-gradient(ellipse at center,'+nebulaColors[n][0]+','+nebulaColors[n][1]+',transparent 70%);--nd:'+(60+Math.random()*30)+'s;--nx:'+(10+Math.random()*30)+'px;--ny:'+(10+Math.random()*30)+'px';
    c.appendChild(neb);_nebulaEls.push(neb);
  }
  // Create stars (80-100)
  var total=80+Math.floor(Math.random()*21);
  // Tier: 10-15 bright, 30-40 mid, rest dim
  var brightCount=10+Math.floor(Math.random()*6);
  var midCount=30+Math.floor(Math.random()*11);
  for(var i=0;i<total;i++){
    var tier=i<brightCount?'bright':(i<brightCount+midCount?'mid':'dim');
    var size=tier==='bright'?2+Math.random()*2:(tier==='mid'?1+Math.random()*1.5:.5+Math.random()*.7);
    var lo=tier==='bright'?.6+Math.random()*.2:(tier==='mid'?.3+Math.random()*.2:.05+Math.random()*.1);
    var hi=tier==='bright'?.85+Math.random()*.15:(tier==='mid'?.5+Math.random()*.2:.2+Math.random()*.15);
    var dur=1+Math.random()*4;
    var delay=Math.random()*5;
    var s=document.createElement('div');
    s.className='star tier-'+tier;
    s.style.cssText='width:'+size+'px;height:'+size+'px;top:'+(Math.random()*H)+'px;left:'+(Math.random()*W)+'px;--lo:'+lo+';--hi:'+hi+';--d:'+dur+'s;--delay:'+delay+'s';
    s.setAttribute('data-tier',tier);s.setAttribute('data-lo',lo);s.setAttribute('data-hi',hi);
    c.appendChild(s);_stars.push(s);
  }
  // Start meteor shower
  startMeteorShower();
  // Start sparkle effect
  startSparkles();
  // Start slow drift
  startStarDrift();
}
function startStarDrift(){
  clearInterval(_driftTimer);
  if(!starryWorldEnabled)return;
  var W=screen.width||window.innerWidth;
  var speed=.5+Math.random()*.5;
  _driftTimer=setInterval(function(){
    if(!starryWorldEnabled){clearInterval(_driftTimer);return}
    for(var i=0;i<_stars.length;i++){
      var s=_stars[i];
      var l=parseFloat(s.style.left)||0;
      l-=speed;
      if(l<-10)l=W+10+Math.random()*50;
      s.style.left=l+'px';
    }
  },500);
}
function destroyStarryWorld(){
  var c=document.getElementById('starryWorld');
  if(c){c.style.display='none';c.innerHTML='';c.removeAttribute('data-mode')}
  _stars=[];_nebulaEls=[];
  clearTimeout(_meteorTimer);clearTimeout(_sparkleTimer);clearInterval(_driftTimer);
  document.body.style.background='';
  document.documentElement.classList.remove('starry-on');
  // Restore bars
  var tb=document.querySelector('.topbar');if(tb){tb.style.background='';tb.style.backdropFilter='';tb.style.webkitBackdropFilter='';tb.style.borderBottom=''}
  var bn=document.querySelector('.bottom-nav');if(bn){bn.style.background='';bn.style.backdropFilter='';bn.style.webkitBackdropFilter='';bn.style.borderTop=''}
  // Re-apply dark mode to restore correct bg
  applyDarkMode(getDarkMode());
}
function createMeteor(){
  if(!starryWorldEnabled)return;
  var c=document.getElementById('starryWorld');
  if(!c||c.style.display==='none')return;
  var W=screen.width||window.innerWidth,H=screen.height||window.innerHeight;
  // Angle: 40-50 deg from horizontal, moving down-left (右上→左下)
  var angle=40+Math.random()*10;
  var rad=angle*Math.PI/180;
  var diag=Math.sqrt(W*W+H*H);
  var dist=diag*(.4+Math.random()*.25);
  var dx=-(dist*Math.cos(rad)),dy=dist*Math.sin(rad);
  // Always spawn from top-right area
  var sx=W*.7+Math.random()*W*.35;
  var sy=Math.random()*H*.2;
  var m=document.createElement('div');m.className='meteor';
  m.style.cssText='left:'+sx+'px;top:'+sy+'px;--ang:135deg;--dx:'+dx+'px;--dy:'+dy+'px;--mDur:'+(.6+Math.random()*.2)+'s';
  var trail=document.createElement('div');trail.className='meteor-trail';m.appendChild(trail);
  c.appendChild(m);
  setTimeout(function(){if(m.parentNode)m.parentNode.removeChild(m)},900);
}
function startMeteorShower(){
  clearTimeout(_meteorTimer);
  createMeteor();
  _meteorTimer=setTimeout(startMeteorShower,8000+Math.random()*22000);
}
function welcomeMeteorShower(){
  var count=3+Math.floor(Math.random()*3);
  for(var i=0;i<count;i++){setTimeout(createMeteor,i*200+Math.random()*200)}
}
function startSparkles(){
  clearTimeout(_sparkleTimer);
  if(!starryWorldEnabled)return;
  var brightStars=_stars.filter(function(s){return s.getAttribute('data-tier')==='bright'});
  if(brightStars.length>0){
    var target=brightStars[Math.floor(Math.random()*brightStars.length)];
    target.classList.add('star-sparkle');
    setTimeout(function(){target.classList.remove('star-sparkle')},350);
  }
  _sparkleTimer=setTimeout(startSparkles,10000+Math.random()*5000);
}
// Photo-star interaction: dim stars near photo overlay
function dimStarsForPhoto(dim){
  _stars.forEach(function(s){
    if(dim){s.classList.add('dimmed')}else{s.classList.remove('dimmed')}
  });
  _nebulaEls.forEach(function(n){
    if(dim){n.style.opacity='.02'}else{n.style.opacity=''}
  });
}
// Init starry world on load if enabled
if(starryWorldEnabled){setTimeout(initStarryWorld,300)}