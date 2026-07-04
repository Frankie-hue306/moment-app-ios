const express=require('express'),cors=require('cors'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const app=express();

// Trust reverse proxy (Nginx) for correct IP in rate limiting
app.set('trust proxy',1);

// ---- CORS: restrict to known origins ----
const ALLOWED_ORIGINS=[
  'https://cikemoment.cn','http://cikemoment.cn',
  'https://momentnow.xyz','http://momentnow.xyz',
  'http://124.156.163.213','http://124.156.163.213:3000',
  'http://81.70.102.36','http://81.70.102.36:3000',
  'capacitor://localhost','ionic://localhost',
  'http://localhost:3000','http://localhost:3001',
  'http://127.0.0.1:3000','http://127.0.0.1:3001'
];
app.use(cors({
  origin:function(origin,cb){
    if(!origin||ALLOWED_ORIGINS.includes(origin)||(typeof origin==='string'&&origin.startsWith('capacitor://'))){
      return cb(null,true);
    }
    cb(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json({limit:'50mb'}));

// ---- Static files ----
const PUBLIC_DIR=process.env.MOMENT_PUBLIC_DIR||path.join(__dirname,'public');
mkdir(PUBLIC_DIR);
app.use(express.static(PUBLIC_DIR));

// ---- Data directory ----
const DATA=process.env.MOMENT_DATA_DIR||'/opt/moment/data';
const DB_LOCK_FILE=DATA+'/.dblock';
const UPLOADS_DIR=DATA+'/uploads';

// ---- File-based mutex for DB write safety ----
function dbLock(){
  for(let i=0;i<50;i++){
    try{
      fs.writeFileSync(DB_LOCK_FILE,JSON.stringify({pid:process.pid,ts:Date.now()}),{flag:'wx'});
      return true;
    }catch(e){
      try{
        const data=JSON.parse(fs.readFileSync(DB_LOCK_FILE,'utf8'));
        if(Date.now()-data.ts>30000){
          try{process.kill(data.pid,0)}catch(ex){try{fs.unlinkSync(DB_LOCK_FILE)}catch(_){}}
        }
      }catch(_){}
    }
    require('child_process').spawnSync('sleep',['0.05']);
  }
  return false;
}
function dbUnlock(){try{fs.unlinkSync(DB_LOCK_FILE)}catch(e){}}

function withLock(fn){
  const ok=dbLock();
  if(!ok)throw new Error('DB_LOCK_FAILED');
  try{fn()}finally{dbUnlock()}
}

// ---- Database helpers ----
const DB=()=>{
  try{return JSON.parse(fs.readFileSync(DATA+'/db.json','utf8'))}
  catch(e){return {users:[],moments:[],likes:[],reports:[],nextId:1}}
};

// Atomic write: write to temp file then rename
const SAVE=(d)=>{
  try{
    mkdir(DATA);
    const tmp=DATA+'/db.json.tmp';
    fs.writeFileSync(tmp,JSON.stringify(d,null,2));
    fs.renameSync(tmp,DATA+'/db.json');
    return true;
  }catch(e){
    console.error('[ERROR] Failed to save db.json:',e.message);
    return false;
  }
};

mkdir(DATA);mkdir(UPLOADS_DIR);

function mkdir(d){try{fs.mkdirSync(d,{recursive:true})}catch(e){}}
function uid(){return crypto.randomBytes(6).toString('hex')}
function hashToken(t){return crypto.createHash('sha256').update(t).digest('hex')}
function mask(p){return p?p.slice(0,3)+'****'+p.slice(-3):'未知'}
function nextId(db){return db.nextId++}

// Token expiry: 90 days
const TOKEN_TTL_MS=90*24*60*60*1000;

// ======================== IMAGE STORAGE ========================
function saveImage(dataUrl){
  if(!dataUrl||!dataUrl.includes('base64,'))return null;
  const matches=dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if(!matches)return null;
  const ext=matches[1]==='png'?'png':'jpg';
  try{
    const buf=Buffer.from(matches[2],'base64');
    // Validate image magic bytes
    if(buf.length<4)return null;
    if(ext==='jpg'&&(buf[0]!==0xFF||buf[1]!==0xD8)){
      console.error('[ERROR] Invalid JPEG magic bytes');
      return null;
    }
    if(ext==='png'&&(buf[0]!==0x89||buf[1]!==0x50||buf[2]!==0x4E||buf[3]!==0x47)){
      console.error('[ERROR] Invalid PNG magic bytes');
      return null;
    }
    // Cap decoded image size at 20MB
    if(buf.length>20*1024*1024){
      console.error('[ERROR] Image too large:',buf.length);
      return null;
    }
    const name=uid()+'.'+ext;
    const filePath=UPLOADS_DIR+'/'+name;
    fs.writeFileSync(filePath,buf);
    return '/uploads/'+name;
  }catch(e){
    console.error('[ERROR] saveImage failed:',e.message);
    return null;
  }
}

function imgUrl(p){
  if(!p)return '';
  if(p.startsWith('http')||p.startsWith('data:'))return p;
  return '/api/image'+p;
}

// ======================== LOGIN & SMS ========================
const SMS_CODES={};
// Per-phone rate limiting
const SMS_PHONE_TIMESTAMPS={};
// Per-IP rate limiting
const SMS_IP_TIMESTAMPS={};
const SMS_PHONE_COOLDOWN_MS=60000;      // 60s between same phone
const SMS_IP_MAX_PER_HOUR=5;            // max 5 per IP per hour
const LOGIN_MAX_FAILS=5;                // max wrong-code attempts
const LOGIN_LOCK_MS=15*60*1000;         // 15min lock after too many fails
const LOGIN_FAIL_COUNTS={};             // phone -> {count, lockedUntil}

function genSMSCode(phone){
  const now=Date.now();
  // Clean up expired codes (memory leak prevention)
  for(const ph of Object.keys(SMS_CODES)){
    if(SMS_CODES[ph].expiresAt<now-600000)delete SMS_CODES[ph];
  }
  // Clean up stale IP timestamps
  for(const ip of Object.keys(SMS_IP_TIMESTAMPS)){
    SMS_IP_TIMESTAMPS[ip]=SMS_IP_TIMESTAMPS[ip].filter(function(t){return t>now-3600000});
    if(SMS_IP_TIMESTAMPS[ip].length===0)delete SMS_IP_TIMESTAMPS[ip];
  }

  const code=String(crypto.randomInt(100000,999999));
  SMS_CODES[phone]={code,expiresAt:now+5*60*1000};

  if(process.env.MOMENT_DEV_LOGIN==='1'){
    console.log('[DEV] SMS code for '+mask(phone)+': '+code);
  }
  return code;
}

// Health check
app.get('/health',(r,s)=>s.json({ok:true}));

// Public legal pages
app.get('/privacy',(r,s)=>s.sendFile(path.join(PUBLIC_DIR,'privacy.html')));
app.get('/terms',(r,s)=>s.sendFile(path.join(PUBLIC_DIR,'terms.html')));

// ---- SMS send ----
app.post('/api/sms/send',(r,s)=>{
  const ph=r.body.phone;
  if(!ph||!/^\d{11}$/.test(ph))return s.status(400).json({error:'手机号格式不对'});
  const now=Date.now();

  // Per-phone cooldown: 60s between sends
  if(SMS_PHONE_TIMESTAMPS[ph]&&now-SMS_PHONE_TIMESTAMPS[ph]<SMS_PHONE_COOLDOWN_MS){
    const wait=Math.ceil((SMS_PHONE_COOLDOWN_MS-(now-SMS_PHONE_TIMESTAMPS[ph]))/1000);
    return s.status(429).json({error:'请'+wait+'秒后再获取验证码'});
  }

  // Per-IP limit: max 5 per hour
  const ip=r.ip||r.connection.remoteAddress||'unknown';
  if(!SMS_IP_TIMESTAMPS[ip])SMS_IP_TIMESTAMPS[ip]=[];
  SMS_IP_TIMESTAMPS[ip].push(now);
  if(SMS_IP_TIMESTAMPS[ip].length>SMS_IP_MAX_PER_HOUR){
    return s.status(429).json({error:'请求过于频繁，请稍后再试'});
  }

  SMS_PHONE_TIMESTAMPS[ph]=now;
  const code=genSMSCode(ph);
  if(process.env.MOMENT_DEV_LOGIN==='1'){
    s.json({message:'验证码已发送',devCode:code});
  }else{
    s.json({message:'验证码已发送'});
  }
});

// ---- Login ----
app.post('/api/login',(r,s)=>{
  const ph=r.body.phone;
  const code=r.body.code;
  if(!ph||!/^\d{11}$/.test(ph))return s.status(400).json({error:'手机号格式不对'});
  if(!code)return s.status(400).json({error:'请输入验证码'});

  const now=Date.now();
  const cached=SMS_CODES[ph];

  // Brute-force lock check
  if(LOGIN_FAIL_COUNTS[ph]&&LOGIN_FAIL_COUNTS[ph].lockedUntil&&now<LOGIN_FAIL_COUNTS[ph].lockedUntil){
    return s.status(429).json({error:'尝试次数过多，请稍后再试'});
  }

  // Dev login bypass: ONLY when MOMENT_DEV_LOGIN=1
  const isDev=(process.env.MOMENT_DEV_LOGIN==='1');
  if(isDev&&code.length===6&&code!=='000000'){
    if(!cached){genSMSCode(ph);}
  }else{
    if(!cached)return s.status(400).json({error:'请先获取验证码'});
    if(Date.now()>cached.expiresAt)return s.status(400).json({error:'验证码已过期，请重新获取'});
    if(cached.code!==code){
      if(!LOGIN_FAIL_COUNTS[ph])LOGIN_FAIL_COUNTS[ph]={count:0,lockedUntil:0};
      LOGIN_FAIL_COUNTS[ph].count++;
      if(LOGIN_FAIL_COUNTS[ph].count>=LOGIN_MAX_FAILS){
        LOGIN_FAIL_COUNTS[ph].lockedUntil=now+LOGIN_LOCK_MS;
        LOGIN_FAIL_COUNTS[ph].count=0;
        return s.status(429).json({error:'尝试次数过多，请15分钟后再试'});
      }
      return s.status(400).json({error:'验证码错误'});
    }
  }

  // Success: clear code and fail counter
  delete SMS_CODES[ph];
  delete LOGIN_FAIL_COUNTS[ph];

  let ok=false,result=null;
  withLock(()=>{
    let db=DB();
    let u=db.users.find(u=>u.phone===ph);
    const rawToken='tok_'+uid();
    if(!u){
      u={
        id:nextId(db),phone:ph,
        tokenHash:hashToken(rawToken),tokenCreatedAt:Date.now(),
        nickname:'',avatar:'',
        preferences:{daily_pick_enabled:true},
        role:'user'  // 'user' or 'admin'
      };
      db.users.push(u);
    }else{
      u.tokenHash=hashToken(rawToken);
      u.tokenCreatedAt=Date.now();
      if(!u.preferences)u.preferences={daily_pick_enabled:true};
      if(!u.role)u.role='user';
    }
    if(SAVE(db)){
      ok=true;
      result={
        token:rawToken,tokenCreatedAt:u.tokenCreatedAt,userId:u.id,
        nickname:u.nickname,avatar:imgUrl(u.avatar),preferences:u.preferences
      };
    }
  });

  if(!ok||!result)return s.status(500).json({error:'服务器错误，请重试'});
  s.json(result);
});

// ======================== AUTH MIDDLEWARE ========================
function auth(r,s,next){
  const tok=r.headers['x-auth-token']||'';
  const db=DB();
  const tokHash=hashToken(tok);
  // Support both hashed and legacy plaintext tokens
  let u=db.users.find(u=>u.tokenHash===tokHash);
  if(!u)u=db.users.find(u=>u.token===tok); // fallback: old plaintext tokens
  if(!u)return s.status(401).json({error:'请先登录'});

  // Migrate old plaintext token to hashed
  if(u.token&&!u.tokenHash){
    withLock(()=>{
      let db2=DB();
      let u2=db2.users.find(x=>x.id===u.id);
      if(u2&&u2.token===tok){u2.tokenHash=hashToken(tok);delete u2.token;SAVE(db2)}
    });
  }

  // Check token expiry
  if(u.tokenCreatedAt&&Date.now()-u.tokenCreatedAt>TOKEN_TTL_MS){
    withLock(()=>{
      let db2=DB();
      let u2=db2.users.find(x=>x.id===u.id);
      if(u2&&(u2.tokenHash===tokHash||u2.token===tok)){
        delete u2.tokenHash;delete u2.token;
        SAVE(db2);
      }
    });
    return s.status(401).json({error:'登录已过期，请重新登录'});
  }

  r.user=u;r.db=db;
  next();
}

// Admin check — based on role field, not user ID
function isAdmin(u){return u&&u.role==='admin';}

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

// ======================== MOMENTS ========================
app.post('/api/moments',auth,(r,s)=>{
  const {dataUrl,thought}=r.body;
  if(!dataUrl)return s.status(400).json({error:'缺少照片'});

  const imagePath=saveImage(dataUrl);

  dbWrite(r,s,()=>{
    const m={
      id:r.db.nextId++,userId:r.user.id,
      imagePath:imagePath||'',
      dataUrl:imagePath?'':dataUrl,
      thought:(thought||'').slice(0,500),
      created_at:new Date().toISOString(),
      status:'approved',like_count:0
    };
    r.db.moments.unshift(m);

    // Update streak
    const now=new Date();
    const today=now.toISOString().slice(0,10);
    const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
    if(!r.user.last_upload_date){
      r.user.consecutive_days=1;r.user.last_upload_date=today;
    }else if(r.user.last_upload_date===yesterday){
      r.user.consecutive_days=(r.user.consecutive_days||0)+1;r.user.last_upload_date=today;
    }else if(r.user.last_upload_date!==today){
      r.user.consecutive_days=1;r.user.last_upload_date=today;
    }

    if(!SAVE(r.db))return s.status(500).json({error:'保存失败'});
    s.json({id:m.id,imageUrl:imgUrl(imagePath||m.dataUrl||dataUrl)});
  });
});

// ======================== PRIVACY HELPER ========================
function isPublicMoment(m,usersOrMap){
  if(m.status!=='approved')return false;
  let author;
  if(Array.isArray(usersOrMap)){
    author=usersOrMap.find(function(u){return u.id===m.userId});
  }else{
    author=usersOrMap[m.userId];
  }
  if(author&&author.preferences&&author.preferences.photo_public===false)return false;
  return true;
}

// ======================== GALLERY ========================
app.get('/api/gallery',auth,(r,s)=>{
  const moments=r.db.moments
    .filter(m=>m.userId===r.user.id)
    .slice(0,100)
    .map(m=>({
      id:m.id,
      imageUrl:imgUrl(m.imagePath),
      thought:m.thought||'',
      created_at:m.created_at,
      status:m.status||'approved',
      rejectedMessage:m.rejectedMessage||'',
      like_count:m.like_count||0
    }));
  s.json({moments,total:r.user.consecutive_days||0});
});

// ======================== EXPLORE ========================
app.get('/api/explore',(r,s)=>{
  const pg=parseInt(r.query.page)||1,lim=Math.min(parseInt(r.query.limit)||15,50);
  const db=DB();
  const userMap={};db.users.forEach(function(u){userMap[u.id]=u});

  const pub=db.moments.filter(function(m){return isPublicMoment(m,userMap)});
  const moments=pub.slice((pg-1)*lim,pg*lim).map(function(m){
    const u=userMap[m.userId];
    return {
      id:m.id,
      imageUrl:imgUrl(m.imagePath||m.dataUrl),
      thought:m.thought||'',
      created_at:m.created_at,
      like_count:m.like_count||0,
      author_phone_masked:mask(u?u.phone:'')
    };
  });

  s.json({moments,hasMore:(pg*lim)<pub.length,total:pub.length});
});

// ======================== STRANGER ========================
app.get('/api/stranger',(r,s)=>{
  const db=DB();
  const userMap={};db.users.forEach(function(u){userMap[u.id]=u});
  const pub=db.moments.filter(function(m){return isPublicMoment(m,userMap)});
  if(!pub.length)return s.json({moment:null});
  const m=pub[Math.floor(Math.random()*pub.length)];
  s.json({
    id:m.id,
    imageUrl:imgUrl(m.imagePath||m.dataUrl),
    thought:m.thought||'',
    created_at:m.created_at,
    like_count:m.like_count||0
  });
});

// ======================== LIKE ========================
app.post('/api/like',auth,(r,s)=>{
  dbWrite(r,s,()=>{
    const mid=parseInt(r.body.momentId);
    const m=r.db.moments.find(m=>m.id===mid);
    if(!m)return s.status(404).json({error:'不存在'});

    const lid=r.user.id+'_'+mid;
    // Check both formats for backward compat
    if(r.db.likes.find(l=>(l.id===lid)||(l.userId===r.user.id&&l.momentId===mid))){
      return s.json({liked:true,count:m.like_count});
    }

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

// ======================== REPORT ========================
app.post('/api/report',auth,(r,s)=>{
  dbWrite(r,s,()=>{
    if(!r.body.momentId||isNaN(parseInt(r.body.momentId))){
      return s.status(400).json({error:'缺少momentId'});
    }
    const mid=parseInt(r.body.momentId);
    const reason=r.body.reason||'其他';

    // Prevent duplicate reports
    if(r.db.reports.some(function(x){return x.momentId===mid&&x.userId===r.user.id})){
      return s.status(400).json({error:'已举报过'});
    }

    r.db.reports.push({
      id:uid(),momentId:mid,userId:r.user.id,
      reason,created_at:new Date().toISOString()
    });

    // Auto-hide at 3 reports
    const cnt=r.db.reports.filter(function(x){return x.momentId===mid}).length;
    if(cnt>=3){
      const m=r.db.moments.find(m=>m.id===mid);
      if(m)m.status='hidden';
    }

    SAVE(r.db);
    s.json({message:'举报成功'});
  });
});

// ======================== DELETE MOMENT ========================
app.delete('/api/moment/:id',auth,(r,s)=>{
  dbWrite(r,s,()=>{
    const mid=parseInt(r.params.id);
    const idx=r.db.moments.findIndex(m=>m.id===mid&&m.userId===r.user.id);
    if(idx<0)return s.status(404).json({error:'不存在'});

    // Clean up image file
    const delM=r.db.moments[idx];
    if(delM&&delM.imagePath&&delM.imagePath.startsWith('/uploads/')){
      try{fs.unlinkSync(path.join(UPLOADS_DIR,path.basename(delM.imagePath)))}catch(e){}
    }

    r.db.moments.splice(idx,1);
    r.db.likes=r.db.likes.filter(l=>l.momentId!==mid);
    r.db.reports=r.db.reports.filter(function(x){return x.momentId!==mid});
    SAVE(r.db);
    s.json({message:'已删除'});
  });
});

// ======================== IMAGE SERVING ========================
// From disk (with path traversal protection + privacy check)
app.get('/api/image/uploads/:name',(r,s)=>{
  const name=r.params.name;
  if(name!==path.basename(name))return s.status(400).json({error:'非法文件名'});

  // Privacy: check if this image belongs to a public moment
  const imgPath='/uploads/'+name;
  const db=DB();
  const moment=db.moments.find(function(m){return m.imagePath===imgPath});
  if(moment&&!isPublicMoment(moment,db.users)){
    return s.status(404).end();
  }

  const filePath=path.join(UPLOADS_DIR,name);
  if(!fs.existsSync(filePath))return s.status(404).end();

  const ext=path.extname(name).toLowerCase();
  const ct=ext==='.png'?'image/png':'image/jpeg';
  s.set({'Content-Type':ct,'Cache-Control':'public,max-age=86400'});
  s.sendFile(filePath);
});

// Legacy: serve image by moment ID
app.get('/api/image/:id',(r,s)=>{
  const db=DB();
  const m=db.moments.find(m=>m.id===parseInt(r.params.id));
  if(!m)return s.status(404).end();
  if(!isPublicMoment(m,db.users))return s.status(404).end();

  // New style: image on disk
  if(m.imagePath&&m.imagePath.startsWith('/uploads/')){
    const filePath=path.join(UPLOADS_DIR,path.basename(m.imagePath));
    if(fs.existsSync(filePath)){
      const ext=path.extname(m.imagePath).toLowerCase();
      s.set({'Content-Type':ext==='.png'?'image/png':'image/jpeg','Cache-Control':'public,max-age=86400'});
      return s.sendFile(filePath);
    }
  }
  // Old style: dataUrl in json
  if(m.dataUrl){
    const b=Buffer.from(m.dataUrl.split(',')[1]||'','base64');
    s.set({'Content-Type':m.dataUrl.startsWith('data:image/png')?'image/png':'image/jpeg','Cache-Control':'public,max-age=86400'});
    return s.send(b);
  }
  s.status(404).end();
});

// ======================== USER PROFILE ========================
// Stats
app.get('/api/stats',auth,(r,s)=>{
  s.json({
    streak:r.user.consecutive_days||0,
    total:r.db.moments.filter(m=>m.userId===r.user.id).length,
    badges:[]
  });
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

// Nickname
app.post('/api/user/nickname',auth,(r,s)=>{
  dbWrite(r,s,()=>{
    r.user.nickname=(r.body.nickname||'').slice(0,20);
    SAVE(r.db);
    s.json({nickname:r.user.nickname});
  });
});

// Avatar
app.post('/api/user/avatar',auth,(r,s)=>{
  dbWrite(r,s,()=>{
    const ap=saveImage(r.body.avatar);
    if(ap){
      r.user.avatar=ap;
    }else{
      r.user.avatar=(r.body.avatar||'').slice(0,200000);
    }
    SAVE(r.db);
    s.json({avatar:imgUrl(r.user.avatar)});
  });
});

// ======================== ACCOUNT ========================
app.post('/api/account/delete',auth,(r,s)=>{
  dbWrite(r,s,()=>{
    // Protect admin accounts from self-deletion
    if(isAdmin(r.user)){
      return s.status(400).json({error:'管理员账号不可通过此接口注销'});
    }

    const uid=r.user.id;

    // Clean up user's uploaded images
    r.db.moments.filter(function(m){return m.userId===uid}).forEach(function(m){
      if(m.imagePath&&m.imagePath.startsWith('/uploads/')){
        try{fs.unlinkSync(path.join(UPLOADS_DIR,path.basename(m.imagePath)))}catch(e){}
      }
    });

    r.db.moments=r.db.moments.filter(function(m){return m.userId!==uid});
    r.db.likes=r.db.likes.filter(function(l){return l.userId!==uid});
    r.db.reports=r.db.reports.filter(function(r){return r.userId!==uid});
    r.db.users=r.db.users.filter(function(u){return u.id!==uid});

    SAVE(r.db);
    s.json({message:'账号已注销'});
  });
});

// ======================== ADMIN ========================
// Clear all content (admin only)
app.post('/api/admin/clear',auth,(r,s)=>{
  if(!isAdmin(r.user))return s.status(403).json({error:'无权限'});

  withLock(()=>{
    let db=DB();
    SAVE({users:db.users,moments:[],likes:[],reports:[],nextId:1});
  });
  s.json({message:'已清空'});
});

// Promote a user to admin (admin only, for initial setup)
app.post('/api/admin/promote',auth,(r,s)=>{
  if(!isAdmin(r.user))return s.status(403).json({error:'无权限'});

  const targetPhone=r.body.phone;
  if(!targetPhone||!/^\d{11}$/.test(targetPhone)){
    return s.status(400).json({error:'手机号格式不对'});
  }

  withLock(()=>{
    let db=DB();
    const u=db.users.find(u=>u.phone===targetPhone);
    if(!u)return s.status(404).json({error:'用户不存在'});
    u.role='admin';
    SAVE(db);
    s.json({message:'已提升 '+mask(targetPhone)+' 为管理员'});
  });
});

// ======================== ERROR HANDLING ========================
// API 404 — return JSON instead of HTML
app.use('/api',(r,s)=>{
  s.status(404).json({error:'接口不存在'});
});

// SPA fallback for frontend routes
app.use((r,s)=>{
  s.status(404).sendFile(path.join(PUBLIC_DIR,'index.html'));
});

// Global error handler
app.use(function(err,req,res,next){
  console.error('[ERROR]',err.message);
  res.status(500).json({error:'服务器内部错误'});
});

// ======================== START ========================
const PORT=process.env.PORT||3000;
// ---- Startup ----
if(process.env.MOMENT_DEV_LOGIN==='1'){
  console.log('[WARN] MOMENT_DEV_LOGIN is enabled! Any 6-digit code will work. Disable in production.');
  console.log('[WARN] SMS codes are included in API responses for dev convenience.');
}
app.listen(PORT,()=>console.log('Moment Server v303 on port '+PORT+' — '+new Date().toISOString()));
