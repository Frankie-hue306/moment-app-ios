const express=require('express'),cors=require('cors'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const app=express();app.use(cors());app.use(express.json({limit:'50mb'}));

// Static files — serve frontend from public/
const PUBLIC_DIR=process.env.MOMENT_PUBLIC_DIR||path.join(__dirname,'public');
mkdir(PUBLIC_DIR);
app.use(express.static(PUBLIC_DIR));

const DATA=process.env.MOMENT_DATA_DIR||'/opt/moment/data';
const DB_LOCK_FILE=DATA+'/.dblock';

// File-based mutex for DB write safety
function dbLock(){for(let i=0;i<50;i++){try{fs.writeFileSync(DB_LOCK_FILE,JSON.stringify({pid:process.pid,ts:Date.now()}),{flag:'wx'});return true}catch(e){try{const data=JSON.parse(fs.readFileSync(DB_LOCK_FILE,'utf8'));if(Date.now()-data.ts>30000){try{fs.unlinkSync(DB_LOCK_FILE)}catch(_){}} }catch(_){}}const d=require('child_process');d.spawnSync('sleep',['0.05'])}return false}
function dbUnlock(){try{fs.unlinkSync(DB_LOCK_FILE)}catch(e){}}
function withLock(fn){const ok=dbLock();if(!ok)throw new Error('DB_LOCK_FAILED');try{fn()}finally{dbUnlock()}}

const DB=()=>{try{return JSON.parse(fs.readFileSync(DATA+'/db.json','utf8'))}catch(e){return {users:[],moments:[],likes:[],reports:[],nextId:1}}};
const SAVE=(d)=>{try{mkdir(DATA);fs.writeFileSync(DATA+'/db.json',JSON.stringify(d,null,2));return true}catch(e){console.error('[ERROR] Failed to save db.json:',e.message);return false}};
mkdir(DATA);mkdir(DATA+'/uploads');

function mkdir(d){try{fs.mkdirSync(d,{recursive:true})}catch(e){}}
function uid(){return crypto.randomBytes(6).toString('hex')}
function mask(p){return p?p.slice(0,3)+'****'+p.slice(-3):'未知'}
function nextId(db){return db.nextId++}

// Token expiry: 90 days
const TOKEN_TTL_MS=90*24*60*60*1000;

// Health
app.get('/health',(r,s)=>s.json({ok:true}));

// ======================== IMAGE STORAGE HELPER ========================
const UPLOADS_DIR=DATA+'/uploads';

// Save a dataUrl to disk, return the relative path
function saveImage(dataUrl){
  if(!dataUrl||!dataUrl.includes('base64,'))return null;
  const matches=dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if(!matches)return null;
  const ext=matches[1]==='png'?'png':'jpg';
  try{
    const buf=Buffer.from(matches[2],'base64');
    // Validate image magic bytes
    if(buf.length<4)return null;
    if(ext==='jpg'&&(buf[0]!==0xFF||buf[1]!==0xD8)){console.error('[ERROR] Invalid JPEG magic bytes');return null}
    if(ext==='png'&&(buf[0]!==0x89||buf[1]!==0x50||buf[2]!==0x4E||buf[3]!==0x47)){console.error('[ERROR] Invalid PNG magic bytes');return null}
    // Cap decoded image size at 20MB
    if(buf.length>20*1024*1024){console.error('[ERROR] Image too large:',buf.length);return null}
    const name=uid()+'.'+ext;
    const filePath=UPLOADS_DIR+'/'+name;
    fs.writeFileSync(filePath,buf);
    return '/uploads/'+name;
  }catch(e){console.error('[ERROR] saveImage failed:',e.message);return null}
}

// Build full image URL
function imgUrl(p){
  if(!p)return '';
  if(p.startsWith('http')||p.startsWith('data:'))return p;
  return '/api/image'+p;
}

// ======================== LOGIN ========================
// Simple SMS code generation (6 digits, valid 5 min)
const SMS_CODES={};
function genSMSCode(phone){
  // Clean up expired codes (memory leak prevention)
  const now=Date.now();
  for(const ph of Object.keys(SMS_CODES)){if(SMS_CODES[ph].expiresAt<now-600000)delete SMS_CODES[ph]}
  const code=String(100000+Math.floor(Math.random()*900000));
  SMS_CODES[phone]={code,expiresAt:now+5*60*1000};
  console.log('[DEV] SMS code for '+mask(phone)+': '+code);
  return code;
}

app.post('/api/sms/send',(r,s)=>{
  const ph=r.body.phone;
  if(!ph||!/^\d{11}$/.test(ph))return s.status(400).json({error:'手机号格式不对'});
  genSMSCode(ph);
  s.json({message:'验证码已发送（开发模式：查看服务器日志）'});
});

app.post('/api/login',(r,s)=>{
  const ph=r.body.phone;
  const code=r.body.code;
  if(!ph||!/^\d{11}$/.test(ph))return s.status(400).json({error:'手机号格式不对'});
  if(!code)return s.status(400).json({error:'请输入验证码'});
  // In dev mode, allow any 6-digit code
  const cached=SMS_CODES[ph];
  const isDev=(process.env.NODE_ENV!=='production');
  if(isDev&&code.length===6&&code!=='000000'){
    // Dev bypass: accept any code that was sent
    if(!cached){genSMSCode(ph);}
  }else{
    if(!cached)return s.status(400).json({error:'请先获取验证码'});
    if(Date.now()>cached.expiresAt)return s.status(400).json({error:'验证码已过期，请重新获取'});
    if(cached.code!==code)return s.status(400).json({error:'验证码错误'});
  }
  delete SMS_CODES[ph];
  let ok=false,result=null;
  withLock(()=>{
    let db=DB();
    let u=db.users.find(u=>u.phone===ph);
    if(!u){
      u={id:nextId(db),phone:ph,token:'tok_'+uid(),tokenCreatedAt:Date.now(),nickname:'',avatar:'',preferences:{daily_pick_enabled:true}};
      db.users.push(u);
    }else{
      u.token='tok_'+uid();
      u.tokenCreatedAt=Date.now();
      if(!u.preferences)u.preferences={daily_pick_enabled:true};
    }
    if(SAVE(db)){ok=true;result={token:u.token,tokenCreatedAt:u.tokenCreatedAt,userId:u.id,nickname:u.nickname,avatar:imgUrl(u.avatar),preferences:u.preferences}}
  });
  if(!ok||!result)return s.status(500).json({error:'服务器错误，请重试'});
  s.json(result);
});

// Auth middleware
function auth(r,s,next){
  const tok=r.headers['x-auth-token']||r.query.token||r.body.token||'';
  const db=DB();
  const u=db.users.find(u=>u.token===tok);
  if(!u)return s.status(401).json({error:'请先登录'});
  // Check token expiry
  if(u.tokenCreatedAt&&Date.now()-u.tokenCreatedAt>TOKEN_TTL_MS){
    withLock(()=>{let db2=DB();let u2=db2.users.find(x=>x.id===u.id);if(u2){u2.token='';SAVE(db2)}});
    return s.status(401).json({error:'登录已过期，请重新登录'});
  }
  r.user=u;r.db=db;
  next();
}

// Get db with lock for write operations
function dbWrite(r,s,cb){
  withLock(()=>{
    const db=DB();
    const u=db.users.find(x=>x.id===r.user.id);
    if(!u)return s.status(401).json({error:'用户不存在'});
    r.user=u;r.db=db;
    cb();
  });
}

// Post moment — save image to disk instead of db.json
app.post('/api/moments',auth,(r,s)=>{
  const {dataUrl,thought}=r.body;
  if(!dataUrl)return s.status(400).json({error:'缺少照片'});
  const imagePath=saveImage(dataUrl);
  const imageForDb=imagePath||dataUrl;
  dbWrite(r,s,()=>{
    const m={id:r.db.nextId++,userId:r.user.id,imagePath:imagePath||'',dataUrl:imagePath?'':dataUrl,thought:(thought||'').slice(0,500),created_at:new Date().toISOString(),status:'approved',like_count:0};
    r.db.moments.unshift(m);
    const now=new Date();const today=now.toISOString().slice(0,10);
    if(!r.user.last_upload_date||r.user.last_upload_date!==today){
      r.user.consecutive_days=(r.user.consecutive_days||0)+1;
      r.user.last_upload_date=today;
    }
    SAVE(r.db);
    s.json({id:m.id,imageUrl:imgUrl(imagePath||m.dataUrl||dataUrl)});
  });
});

// Helper: check photo_public preference
function isPublicMoment(m,dbOrMap){
  if(m.status!=='approved')return false;
  var author;
  if(Array.isArray(dbOrMap)){author=dbOrMap.find(function(u){return u.id===m.userId})}
  else{author=dbOrMap[m.userId]}
  if(author&&author.preferences&&author.preferences.photo_public===false)return false;
  return true;
}

// Gallery (user's own moments)
app.get('/api/gallery',auth,(r,s)=>{
  const moments=r.db.moments.filter(m=>m.userId===r.user.id).slice(0,100).map(m=>({
    id:m.id,dataUrl:imgUrl(m.imagePath),thought:m.thought||'',created_at:m.created_at,status:m.status||'approved',
    rejectedMessage:m.rejectedMessage||'',like_count:m.like_count||0
  }));
  s.json({moments,total:r.user.consecutive_days||0});
});

// Explore (public moments) — respect photo_public
app.get('/api/explore',(r,s)=>{
  const pg=parseInt(r.query.page)||1,lim=Math.min(parseInt(r.query.limit)||15,50);
  const db=DB();
  var userMap={};db.users.forEach(function(u){userMap[u.id]=u});
  var pub=db.moments.filter(function(m){return isPublicMoment(m,userMap)});
  var moments=pub.slice((pg-1)*lim,pg*lim).map(function(m){
    var u=userMap[m.userId];
    return {imageUrl:imgUrl(m.imagePath||m.dataUrl),like_count:m.like_count||0,author_phone_masked:mask(u?u.phone:'')};
  });
  s.json({moments,hasMore:moments.length===lim,total:pub.length});
});

// Stranger (random public moment) — respect photo_public
app.get('/api/stranger',(r,s)=>{
  const db=DB();
  var userMap={};db.users.forEach(function(u){userMap[u.id]=u});
  var pub=db.moments.filter(function(m){return isPublicMoment(m,userMap)});
  if(!pub.length)return s.json({moment:null});
  const m=pub[Math.floor(Math.random()*pub.length)];
  s.json({imageUrl:imgUrl(m.imagePath||m.dataUrl),thought:m.thought||"",created_at:m.created_at,like_count:m.like_count||0});
});

// Like
app.post('/api/like',auth,(r,s)=>{
  dbWrite(r,s,()=>{
    const mid=parseInt(r.body.momentId);
    const m=r.db.moments.find(m=>m.id===mid);
    if(!m)return s.status(404).json({error:'不存在'});
    const lid=r.user.id+'_'+mid;
    if(r.db.likes.find(l=>l.id===lid))return s.json({liked:true,count:m.like_count});
    r.db.likes.push({id:lid,userId:r.user.id,momentId:mid});
    m.like_count=(m.like_count||0)+1;
    SAVE(r.db);
    s.json({liked:true,count:m.like_count});
  });
});

app.get('/api/like',auth,(r,s)=>{
  const mid=parseInt(r.query.momentId);
  const liked=r.db.likes.some(l=>l.userId===r.user.id&&l.momentId===mid);
  const m=r.db.moments.find(m=>m.id===mid);
  s.json({liked,count:m?m.like_count:0});
});

// Report
app.post('/api/report',auth,(r,s)=>{
  dbWrite(r,s,()=>{
    const mid=parseInt(r.body.momentId);
    const reason=r.body.reason||'其他';
    r.db.reports.push({id:uid(),momentId:mid,userId:r.user.id,reason,created_at:new Date().toISOString()});
    const cnt=r.db.reports.filter(r=>r.momentId===mid).length;
    if(cnt>=3){const m=r.db.moments.find(m=>m.id===mid);if(m)m.status='hidden'}
    SAVE(r.db);
    s.json({message:'举报成功'});
  });
});

// Delete moment
app.delete('/api/moment/:id',auth,(r,s)=>{
  dbWrite(r,s,()=>{
    const mid=parseInt(r.params.id);
    const idx=r.db.moments.findIndex(m=>m.id===mid&&m.userId===r.user.id);
    if(idx<0)return s.status(404).json({error:'不存在'});
    var delM=r.db.moments[idx];
    if(delM&&delM.imagePath&&delM.imagePath.startsWith('/uploads/')){
      try{fs.unlinkSync(require('path').join(UPLOADS_DIR,require('path').basename(delM.imagePath)))}catch(e){}
    }
    r.db.moments.splice(idx,1);
    r.db.likes=r.db.likes.filter(l=>l.momentId!==mid);
    r.db.reports=r.db.reports.filter(r=>r.momentId!==mid);
    SAVE(r.db);
    s.json({message:'已删除'});
  });
});

// Image serving — from disk (with path traversal protection)
app.get('/api/image/uploads/:name',(r,s)=>{
  const name=r.params.name;
  if(name!==path.basename(name))return s.status(400).json({error:'非法文件名'});
  const filePath=path.join(UPLOADS_DIR,name);
  if(!fs.existsSync(filePath))return s.status(404).end();
  const ext=path.extname(name).toLowerCase();
  const ct=ext==='.png'?'image/png':'image/jpeg';
  s.set({'Content-Type':ct,'Cache-Control':'public,max-age=86400'});
  s.sendFile(filePath);
});

// Legacy fallback: still support old dataUrl-based images in db
app.get('/api/image/:id',(r,s)=>{
  const db=DB();
  const m=db.moments.find(m=>m.id===parseInt(r.params.id));
  if(!m)return s.status(404).end();
  if(m.imagePath&&m.imagePath.startsWith('/uploads/')){
    const filePath=path.join(UPLOADS_DIR,path.basename(m.imagePath));
    if(fs.existsSync(filePath)){
      const ext=path.extname(m.imagePath).toLowerCase();
      s.set({'Content-Type':ext==='.png'?'image/png':'image/jpeg','Cache-Control':'public,max-age=86400'});
      return s.sendFile(filePath);
    }
  }
  if(m.dataUrl){
    const b=Buffer.from(m.dataUrl.split(',')[1]||'','base64');
    s.set({'Content-Type':m.dataUrl.startsWith('data:image/png')?'image/png':'image/jpeg','Cache-Control':'public,max-age=86400'});
    return s.send(b);
  }
  s.status(404).end();
});

// Stats
app.get('/api/stats',auth,(r,s)=>{
  s.json({streak:r.user.consecutive_days||0,total:r.db.moments.filter(m=>m.userId===r.user.id).length,badges:[]});
});

// Preferences
app.post('/api/user/preferences',auth,(r,s)=>{
  dbWrite(r,s,()=>{
    if(r.body.daily_pick_enabled!==undefined)r.user.preferences.daily_pick_enabled=!!r.body.daily_pick_enabled;
    if(r.body.photo_public!==undefined)r.user.preferences.photo_public=!!r.body.photo_public;
    SAVE(r.db);
    s.json({preferences:r.user.preferences});
  });
});

app.get('/api/user/preferences',auth,(r,s)=>{
  s.json({preferences:r.user.preferences||{daily_pick_enabled:true}});
});

// Nickname update
app.post('/api/user/nickname',auth,(r,s)=>{
  dbWrite(r,s,()=>{
    r.user.nickname=(r.body.nickname||'').slice(0,20);
    SAVE(r.db);
    s.json({nickname:r.user.nickname});
  });
});

// Avatar update
app.post('/api/user/avatar',auth,(r,s)=>{
  dbWrite(r,s,()=>{
    const ap=saveImage(r.body.avatar);
    if(ap){r.user.avatar=ap}else{r.user.avatar=(r.body.avatar||"").slice(0,200000)}
    SAVE(r.db);
    s.json({avatar:imgUrl(r.user.avatar)});
  });
});

// Admin
app.post('/api/admin/clear',auth,(r,s)=>{
  if(r.user.id!==1)return s.status(403).json({error:'无权限'});
  withLock(()=>{
    let db=DB();
    SAVE({users:db.users,moments:[],likes:[],reports:[],nextId:1});
  });
  s.json({message:'已清空'});
});

// API 404 — return JSON instead of HTML
app.use('/api',(r,s)=>{
  s.status(404).json({error:'接口不存在'});
});

// SPA fallback for frontend routes
app.use((r,s)=>{
  s.status(404).sendFile(require("path").join(PUBLIC_DIR,"index.html"));
});

app.listen(3000,()=>console.log('Moment JSON Server on 3000'));
